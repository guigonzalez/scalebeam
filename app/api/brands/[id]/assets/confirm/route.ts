import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPublicUrl } from "@/lib/supabase-storage"

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
    const { path, fileName, fileType, fileSize } = body

    if (!path || !fileName) {
      return NextResponse.json({ error: "Missing file info" }, { status: 400 })
    }

    // Verificar se o usuário tem acesso a essa marca
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
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

    // Obter URL pública
    const publicUrl = getPublicUrl("assets", path)

    // Salvar no banco de dados
    const asset = await prisma.asset.create({
      data: {
        name: fileName,
        url: publicUrl,
        type: fileType,
        size: fileSize,
        brandId: brandId,
      },
    })

    return NextResponse.json(asset, { status: 201 })
  } catch (error) {
    console.error("Error confirming asset upload:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
