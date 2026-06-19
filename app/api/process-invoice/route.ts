import { NextResponse } from "next/server"

const EXTERNAL_URL = "https://enbiocom.usermd.net/new_aireaderapp/api/process_invoice.php"
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/a/macros/enbio.com/s/AKfycbxHFzQRohJelISajW0RZQhDmCKbbVtvkZ7mz-p5Q2rmTRU8dgL3jN5lpXPQ-JosnFcX/exec"

export const runtime = "nodejs"

function isTruthyFormFlag(value: FormDataEntryValue | null): boolean {
  const v = (value ?? "").toString().trim().toLowerCase()
  return v === "1" || v === "true" || v === "yes"
}

async function uploadInvoiceToGoogleDrive(payload: {
  fileName: string
  mimeType: string
  base64Data: string
  invoiceNumber: string
  subfolder: string
}) {
  return fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        console.error("Google Apps Script upload error:", res.status, text)
        return null
      }
      try {
        return await res.json()
      } catch {
        return await res.text()
      }
    })
    .catch((err) => {
      console.error("Google Apps Script upload exception:", err)
      return null
    })
}

/**
 * Proxy dla uploadu faktury – omija CORS (żądanie z przeglądarki idzie na naszą domenę,
 * serwer Next.js przekazuje je do enbiocom.usermd.net) ORAZ równolegle wysyła plik
 * do Google Apps Script (Google Drive).
 * Parametr formData skipOcr=1 pomija OCR (tylko zapis pliku na Drive).
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ success: false, error: "Brak pliku" }, { status: 400 })
    }

    const skipOcr = isTruthyFormFlag(formData.get("skipOcr"))

    // Wspólne dane pliku
    const fileName = file instanceof File && file.name ? file.name : "invoice"
    const mimeType = file instanceof File && file.type ? file.type : "application/octet-stream"
    const arrayBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString("base64")

    const rawFormId = (formData.get("formId") ?? "").toString().trim()

    // Subfolder: jeśli front przekazał formId, użyj go.
    // W przeciwnym razie wygeneruj nowy ACC_SERVICE_YYYY_MM_DD_UUID (fallback).
    let subfolder = rawFormId
    if (!subfolder) {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, "0")
      const day = String(now.getDate()).padStart(2, "0")
      const uuid =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${now.getTime()}-${Math.random().toString(16).slice(2)}`
      subfolder = `ACC_SERVICE_${year}_${month}_${day}_${uuid}`
    }

    const invoiceNumber = (formData.get("invoiceNumber") ?? "").toString()

    const googlePayload = {
      fileName,
      mimeType,
      base64Data,
      invoiceNumber,
      subfolder,
    }

    if (skipOcr) {
      const googleResult = await uploadInvoiceToGoogleDrive(googlePayload)
      return NextResponse.json(
        {
          success: true,
          ocrSkipped: true,
          google: googleResult,
        },
        { status: 200 }
      )
    }

    // 1) Wywołanie istniejącego PHP (OCR)
    const proxyFormData = new FormData()
    proxyFormData.append("file", file, file instanceof File ? file.name : undefined)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; EnbioForms/1.0; +https://forms.enbio.com)",
      Referer: "https://forms.enbio.com/",
      Origin: "https://forms.enbio.com",
    }
    const apiKey = process.env.INVOICE_API_KEY
    if (apiKey) headers["X-API-Key"] = apiKey

    const phpPromise = fetch(EXTERNAL_URL, {
      method: "POST",
      body: proxyFormData,
      signal: controller.signal,
      headers,
    })

    const googlePromise = uploadInvoiceToGoogleDrive(googlePayload)

    const [phpResponse, googleResult] = await Promise.all([phpPromise, googlePromise])

    clearTimeout(timeoutId)

    const phpData = await phpResponse.json().catch(() => ({}))

    // Serwer zewnętrzny często zwraca 403 (blokada IP/Vercel, brak nagłówków). Zwracamy 502 z czytelnym komunikatem.
    if (!phpResponse.ok) {
      console.error("process_invoice external response:", phpResponse.status, phpData)
      return NextResponse.json(
        {
          success: false,
          error:
            phpData?.error ||
            "Serwis przetwarzania faktur jest tymczasowo niedostępny. Spróbuj ponownie za chwilę lub skontaktuj się z administratorem.",
        },
        { status: 502 }
      )
    }

    const normalizedPhpData =
      phpData && typeof phpData === "object" && !Array.isArray(phpData) ? phpData : {}

    // Zachowujemy kompatybilność:
    // - stare formularze czytały pola OCR bezpośrednio z root (np. result.nabywca),
    // - nowsze mogą korzystać z result.php.
    return NextResponse.json(
      {
        ...normalizedPhpData,
        success:
          typeof (normalizedPhpData as Record<string, unknown>).success === "boolean"
            ? (normalizedPhpData as Record<string, boolean>).success
            : true,
        php: phpData,
        google: googleResult,
      },
      { status: 200 }
    )
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError"
    console.error("Proxy process_invoice error:", error)
    return NextResponse.json(
      {
        success: false,
        error: isTimeout
          ? "Serwis przetwarzania faktur nie odpowiedział w czasie. Spróbuj ponownie."
          : "Błąd połączenia z serwerem przetwarzania faktur.",
      },
      { status: 502 }
    )
  }
}
