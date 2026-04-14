import { NextResponse } from "next/server"

const EXTERNAL_URL = "https://enbiocom.usermd.net/new_aireaderapp/api/forms/process_submit.php"
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/a/macros/enbio.com/s/AKfycbxHFzQRohJelISajW0RZQhDmCKbbVtvkZ7mz-p5Q2rmTRU8dgL3jN5lpXPQ-JosnFcX/exec"

export const runtime = "nodejs"

/**
 * Proxy dla wysyłki formularza – omija CORS i dodatkowo zapisuje
 * zawartość formularza jako data-form.json na Google Drive (Apps Script).
 */
export async function POST(request: Request) {
  try {
    const body = await request.text()

    // Spróbuj zparsować JSON, żeby wyciągnąć formId (jeśli jest)
    let parsed: any = null
    try {
      parsed = JSON.parse(body)
    } catch {
      parsed = null
    }

    const rawFormId = (parsed?.formId ?? "").toString().trim()

    // Wspólne subfolder / identyfikator – jeśli front podał formId, używamy go.
    // W przeciwnym razie generujemy ACC_SERVICE_YYYY_MM_DD_UUID jako fallback.
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

    // 1) Wysłanie danych formularza do istniejącego PHP
    const phpPromise = fetch(EXTERNAL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    })

    // 2) Równoległe zapisanie danych formularza jako data-form.json w Google Drive
    const jsonContent = body || "{}"
    const base64Data = Buffer.from(jsonContent, "utf8").toString("base64")
    // Nazwa pliku zawsze taka sama – data-form.json.
    // Identyfikator formularza jest używany wyłącznie jako subfolder.
    const fileName = "data-form.json"

    const googlePayload = {
      fileName,
      mimeType: "application/json",
      base64Data,
      invoiceNumber: "", // nie dotyczy formularza, zostawiamy puste
      subfolder,
    }

    const googlePromise = fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(googlePayload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "")
          console.error("Google Apps Script (data-form.json) error:", res.status, text)
          return null
        }
        try {
          return await res.json()
        } catch {
          return await res.text()
        }
      })
      .catch((err) => {
        console.error("Google Apps Script (data-form.json) exception:", err)
        return null
      })

    const [phpResponse, googleResult] = await Promise.all([phpPromise, googlePromise])

    const data = await phpResponse.json().catch(() => ({}))
    return NextResponse.json(
      {
        ...data,
        google: googleResult,
      },
      { status: phpResponse.status }
    )
  } catch (error) {
    console.error("Proxy process_submit error:", error)
    return NextResponse.json(
      { success: false, message: "Błąd połączenia z serwerem." },
      { status: 502 }
    )
  }
}
