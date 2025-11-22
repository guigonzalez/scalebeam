import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadFileAdmin, getPublicUrl, generateUniqueFileName } from "@/lib/supabase-storage"

// Configuração para aceitar arquivos grandes (até 50MB)
export const runtime = 'nodejs'
export const maxDuration = 60 // segundos

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: brandId } = await params
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Verificar se o usuário tem acesso a essa marca
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: { organization: true },
    })

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    // Verificar permissão
    if (
      session.user.role !== "ADMIN" &&
      !session.user.organizationIds.includes(brand.organizationId)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Upload para Supabase Storage usando helper
    const fileName = generateUniqueFileName(file.name)
    const filePath = `${brand.organizationId}/${brandId}/${fileName}`

    // Converter File para Buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    let uploadData
    try {
      uploadData = await uploadFileAdmin({
        bucket: "assets",
        path: filePath,
        file: buffer,
        contentType: file.type,
      })
    } catch (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      )
    }

    // Obter URL pública
    const publicUrl = getPublicUrl("assets", uploadData.path)

    // Salvar no banco de dados
    const asset = await prisma.asset.create({
      data: {
        name: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size,
        brandId: brandId,
      },
    })

    return NextResponse.json(asset, { status: 201 })
  } catch (error) {
    console.error("Error uploading asset:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
