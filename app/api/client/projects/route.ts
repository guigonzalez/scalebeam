import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { createProjectSchema } from "@/lib/validations/project"
import { ZodError } from "zod"

/**
 * GET /api/client/projects
 * Lista projetos do cliente
 */
export async function GET(request: NextRequest) {
  const { error: authError, session } = await requireAuth()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const brandId = searchParams.get("brandId")

    // Filtrar projetos baseado no role e organizações do usuário
    const whereClause: any = {}

    // Clientes só veem projetos das suas organizações
    if (session!.user.role === "CLIENT") {
      whereClause.brand = {
        organizationId: { in: session!.user.organizationIds },
      }
    }

    // Filtros adicionais
    if (status) {
      whereClause.status = status
    }

    if (brandId) {
      whereClause.brandId = brandId
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            creatives: true,
            comments: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return NextResponse.json({
      success: true,
      projects,
    })
  } catch (error: any) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch projects" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/client/projects
 * Cria um novo projeto
 */
export async function POST(request: NextRequest) {
  const { error: authError, session } = await requireAuth()
  if (authError) return authError

  try {
    const body = await request.json()

    // Validar dados com Zod
    const validatedData = createProjectSchema.parse(body)

    // Verificar se a marca existe e pertence a uma organização do usuário
    const brand = await prisma.brand.findUnique({
      where: { id: validatedData.brandId },
      select: {
        id: true,
        name: true,
        organizationId: true,
        organization: {
          select: {
            maxCreatives: true,
          },
        },
      },
    })

    if (!brand) {
      return NextResponse.json(
        { error: "Marca não encontrada" },
        { status: 404 }
      )
    }

    // Clientes só podem criar projetos para marcas das suas organizações
    if (
      session!.user.role === "CLIENT" &&
      !session!.user.organizationIds.includes(brand.organizationId)
    ) {
      return NextResponse.json(
        { error: "Você não tem permissão para criar projetos para esta marca" },
        { status: 403 }
      )
    }

    // Verificar limite de criativos
    const totalCreatives = await prisma.creative.count({
      where: {
        project: {
          brand: {
            organizationId: brand.organizationId,
          },
        },
      },
    })

    const remainingCreatives =
      brand.organization.maxCreatives - totalCreatives

    if (validatedData.estimatedCreatives > remainingCreatives) {
      return NextResponse.json(
        {
          error: `Limite de criativos excedido. Disponível: ${remainingCreatives}, Solicitado: ${validatedData.estimatedCreatives}`,
        },
        { status: 400 }
      )
    }

    // Se templateId foi fornecido, verificar se existe
    if (validatedData.templateId) {
      const template = await prisma.template.findUnique({
        where: { id: validatedData.templateId },
      })

      if (!template) {
        return NextResponse.json(
          { error: "Template não encontrado" },
          { status: 404 }
        )
      }
    }

    // Criar projeto
    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        brandId: validatedData.brandId,
        templateId: validatedData.templateId || null,
        briefingCsvUrl: validatedData.briefingCsvUrl || null,
        briefingData: validatedData.briefingData || null,
        estimatedCreatives: validatedData.estimatedCreatives,
        status: "DRAFT",
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    })

    // Registrar atividade
    await prisma.activityLog.create({
      data: {
        action: "created_project",
        description: `Projeto "${project.name}" criado para a marca ${brand.name}`,
        userId: session!.user.id,
        organizationId: brand.organizationId,
      },
    })

    return NextResponse.json(
      {
        success: true,
        project,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creating project:", error)

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
      { error: error.message || "Failed to create project" },
      { status: 500 }
    )
  }
}
