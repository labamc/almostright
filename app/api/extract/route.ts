import { NextResponse } from "next/server"

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get("file")

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided." }, { status: 400 })
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "File is too large. Maximum size is 10 MB." }, { status: 400 })
    }

    const ext = file.name.split(".").pop()?.toLowerCase()
    const buffer = Buffer.from(await file.arrayBuffer())
    let text = ""

    if (ext === "pdf") {
      const pdfParse = (await import("pdf-parse")).default
      const result = await pdfParse(buffer)
      text = result.text
      if (!text.trim()) {
        return NextResponse.json(
          { error: "Could not extract text from this PDF. It may be a scanned image." },
          { status: 422 }
        )
      }
    } else if (ext === "docx") {
      const mammoth = await import("mammoth")
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a .txt, .md, .pdf, or .docx file." },
        { status: 400 }
      )
    }

    return NextResponse.json({ text: text.slice(0, 50_000) })
  } catch {
    return NextResponse.json({ error: "Failed to extract file contents." }, { status: 500 })
  }
}
