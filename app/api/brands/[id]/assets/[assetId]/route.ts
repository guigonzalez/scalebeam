import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabase } from "@/lib/supabase-storage"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: brandId, assetId } = await params

    // Buscar o asset
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        brand: {
          include: { organization: true },
        },
      },
    })

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    // Verificar se pertence à marca correta
    if (asset.brandId !== brandId) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    // Verificar permissão
    if (
      session.user.role !== "ADMIN" &&
      !session.user.organizationIds.includes(asset.brand.organizationId)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Extrair o path do Supabase da URL
    const url = new URL(asset.url)
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/assets\/(.+)/)

    if (pathMatch && pathMatch[1]) {
      const filePath = pathMatch[1]

      // Deletar do Supabase Storage
      const { error: deleteError } = await supabase.storage
        .from("assets")
        .remove([filePath])

      if (deleteError) {
        console.error("Error deleting from storage:", deleteError)
        // Continuar mesmo se falhar no storage, pelo menos remove do DB
      }
    }

    // Deletar do banco de dados
    await prisma.asset.delete({
      where: { id: assetId },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Error deleting asset:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
