import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin, generateUniqueFileName } from "@/lib/supabase-storage"

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
    const body = await request.json()
    const { fileName, fileType, fileSize } = body

    if (!fileName || !fileType) {
      return NextResponse.json({ error: "Missing file info" }, { status: 400 })
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

    // Gerar nome único e path
    const uniqueFileName = generateUniqueFileName(fileName)
    const filePath = `${brand.organizationId}/${brandId}/${uniqueFileName}`

    // Criar signed URL para upload direto (usando cliente admin)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from("assets")
      .createSignedUploadUrl(filePath)

    if (signedUrlError || !signedUrlData) {
      console.error("Error creating signed URL:", signedUrlError)
      return NextResponse.json(
        { error: "Failed to create upload URL" },
        { status: 500 }
      )
    }

    // Retornar info para o cliente
    return NextResponse.json({
      uploadUrl: signedUrlData.signedUrl,
      token: signedUrlData.token,
      path: filePath,
      fileName: uniqueFileName,
    })
  } catch (error) {
    console.error("Error creating signed upload URL:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
