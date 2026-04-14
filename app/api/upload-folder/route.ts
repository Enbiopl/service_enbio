import { NextResponse } from "next/server"

// Nowy endpoint do zipowania folderów autoklawów
const EXTERNAL_URL = "https://enbiocom.usermd.net/new_zipapp/upload.php"

/**
 * Proxy dla uploadu folderu (logi autoklawu) – omija CORS.
 */
export async function POST(request: Request) {
  try {
    const incoming = await request.formData()
    const proxyFormData = new FormData()
    for (const [key, value] of incoming.entries()) {
      if (value instanceof File) {
        proxyFormData.append(key, value, value.name)
      } else {
        proxyFormData.append(key, value)
      }
    }
    const response = await fetch(EXTERNAL_URL, {
      method: "POST",
      body: proxyFormData,
    })

    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Proxy upload_folder error:", error)
    return NextResponse.json(
      { success: false, message: "Błąd połączenia z serwerem." },
      { status: 502 }
    )
  }
}
