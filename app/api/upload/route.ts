import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import {
  uploadFileAdmin,
  getPublicUrl,
  generateUniqueFileName,
  validateFileType,
  validateFileSize,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZES,
} from "@/lib/supabase-storage"

export async function POST(request: NextRequest) {
  // Verificar autenticação
  const { error: authError, session } = await requireAuth()
  if (authError) return authError

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const bucket = formData.get("bucket") as string
    const folder = formData.get("folder") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!bucket) {
      return NextResponse.json({ error: "Bucket not specified" }, { status: 400 })
    }

    // Determinar tipo de arquivo
    let allowedTypes: readonly string[]
    let maxSize: number

    if (file.type.startsWith("image/")) {
      allowedTypes = ALLOWED_FILE_TYPES.images
      maxSize = MAX_FILE_SIZES.image
    } else if (file.type.startsWith("video/")) {
      allowedTypes = ALLOWED_FILE_TYPES.videos
      maxSize = MAX_FILE_SIZES.video
    } else if (file.type === "application/pdf") {
      allowedTypes = ALLOWED_FILE_TYPES.documents
      maxSize = MAX_FILE_SIZES.document
    } else if (ALLOWED_FILE_TYPES.spreadsheets.includes(file.type as any)) {
      allowedTypes = ALLOWED_FILE_TYPES.spreadsheets
      maxSize = MAX_FILE_SIZES.spreadsheet
    } else {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      )
    }

    // Validar tipo
    if (!validateFileType(file, allowedTypes)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${allowedTypes.join(", ")}` },
        { status: 400 }
      )
    }

    // Validar tamanho
    if (!validateFileSize(file, maxSize)) {
      return NextResponse.json(
        {
          error: `File too large. Max size: ${(maxSize / 1024 / 1024).toFixed(
            0
          )}MB`,
        },
        { status: 400 }
      )
    }

    // Gerar nome único
    const uniqueFileName = generateUniqueFileName(file.name)
    const path = folder ? `${folder}/${uniqueFileName}` : uniqueFileName

    // Converter File para Buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload usando cliente admin (bypassa RLS)
    await uploadFileAdmin({
      bucket,
      path,
      file: buffer,
      contentType: file.type,
    })

    // Retornar URL
    const publicUrl = getPublicUrl(bucket, path)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path,
      bucket,
      fileName: uniqueFileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    )
  }
}
