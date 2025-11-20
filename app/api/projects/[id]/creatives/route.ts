import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { uploadCreativesSchema } from "@/lib/validations/project"
import { ZodError } from "zod"

/**
 * GET /api/projects/[id]/creatives
 * Lista todos os criativos de um projeto
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error: authError, session } = await requireAuth()
  if (authError) return authError

  try {
    const projectId = params.id

    // Buscar projeto e verificar permissões
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        brand: {
          select: {
            organizationId: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 }
      )
    }

    // Clientes só podem ver criativos de projetos das suas organizações
    if (
      session!.user.role === "CLIENT" &&
      !session!.user.organizationIds.includes(project.brand.organizationId)
    ) {
      return NextResponse.json(
        { error: "Você não tem permissão para acessar este projeto" },
        { status: 403 }
      )
    }

    // Buscar criativos
    const creatives = await prisma.creative.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      success: true,
      creatives,
      total: creatives.length,
    })
  } catch (error: any) {
    console.error("Error fetching creatives:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch creatives" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects/[id]/creatives
 * Adiciona criativos a um projeto (upload em lote)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error: authError, session } = await requireAuth()
  if (authError) return authError

  try {
    const projectId = params.id
    const body = await request.json()

    // Adicionar projectId ao body para validação
    const dataToValidate = {
      projectId,
      creatives: body.creatives || [],
    }

    // Validar dados com Zod
    const validatedData = uploadCreativesSchema.parse(dataToValidate)

    // Buscar projeto e verificar permissões
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        brand: {
          select: {
            organizationId: true,
            organization: {
              select: {
                maxCreatives: true,
              },
            },
          },
        },
        _count: {
          select: {
            creatives: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 }
      )
    }

    // Clientes só podem adicionar criativos a projetos das suas organizações
    if (
      session!.user.role === "CLIENT" &&
      !session!.user.organizationIds.includes(project.brand.organizationId)
    ) {
      return NextResponse.json(
        { error: "Você não tem permissão para adicionar criativos a este projeto" },
        { status: 403 }
      )
    }

    // Verificar se o projeto está em status adequado para receber criativos
    if (project.status === "APPROVED") {
      return NextResponse.json(
        { error: "Não é possível adicionar criativos a um projeto já aprovado" },
        { status: 400 }
      )
    }

    // Verificar limite de criativos da organização
    const totalCreativesInOrg = await prisma.creative.count({
      where: {
        project: {
          brand: {
            organizationId: project.brand.organizationId,
          },
        },
      },
    })

    const remainingCreatives =
      project.brand.organization.maxCreatives - totalCreativesInOrg

    if (validatedData.creatives.length > remainingCreatives) {
      return NextResponse.json(
        {
          error: `Limite de criativos excedido. Disponível: ${remainingCreatives}, Solicitado: ${validatedData.creatives.length}`,
        },
        { status: 400 }
      )
    }

    // Criar criativos em transação
    const createdCreatives = await prisma.$transaction(
      validatedData.creatives.map((creative) =>
        prisma.creative.create({
          data: {
            projectId,
            name: creative.name,
            url: creative.url,
            thumbnailUrl: creative.thumbnailUrl || null,
            format: creative.format,
            width: creative.width || null,
            height: creative.height || null,
            lista: creative.lista || null,
            modelo: creative.modelo || null,
          },
        })
      )
    )

    // Atualizar totalCreatives do projeto
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        totalCreatives: project._count.creatives + createdCreatives.length,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Registrar atividade
    await prisma.activityLog.create({
      data: {
        action: "uploaded_creatives",
        description: `${createdCreatives.length} criativos adicionados ao projeto "${updatedProject.name}"`,
        userId: session!.user.id,
        organizationId: project.brand.organizationId,
      },
    })

    return NextResponse.json(
      {
        success: true,
        creatives: createdCreatives,
        total: createdCreatives.length,
        project: {
          id: updatedProject.id,
          name: updatedProject.name,
          totalCreatives: updatedProject.totalCreatives,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creating creatives:", error)

    // Erros de validação Zod
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || "Failed to create creatives" },
      { status: 500 }
    )
  }
}
