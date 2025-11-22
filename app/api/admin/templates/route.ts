import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const { error: authError, session } = await requireAuth()
  if (authError) return authError

  // Verificar se é admin
  if (session!.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      name,
      description,
      imageUrl,
      brandId,
      category,
      platforms,
      formats,
      templateStatus,
      isActive,
    } = body

    if (!name || !imageUrl || !brandId) {
      return NextResponse.json(
        { error: "Nome, imagem e marca são obrigatórios" },
        { status: 400 }
      )
    }

    // Verificar se a marca existe
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    })

    if (!brand) {
      return NextResponse.json({ error: "Marca não encontrada" }, { status: 404 })
    }

    // Criar template
    const template = await prisma.template.create({
      data: {
        name,
        description: description || null,
        imageUrl,
        brandId,
        category: category || null,
        platforms: platforms || null,
        formats: formats || null,
        templateStatus: templateStatus || "APPROVED",
        isActive: isActive ?? true,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            organization: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    // Registrar atividade
    await prisma.activityLog.create({
      data: {
        action: "template_created",
        description: `Template "${name}" criado pelo admin`,
        userId: session!.user.id,
        organizationId: brand.organizationId,
      },
    })

    return NextResponse.json({ success: true, template }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating template:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create template" },
      { status: 500 }
    )
  }
}
