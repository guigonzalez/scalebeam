import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { updateProjectStatusSchema } from "@/lib/validations/project"
import { ZodError } from "zod"

/**
 * PATCH /api/projects/[id]/status
 * Atualiza o status de um projeto
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, session } = await requireAuth()
  if (authError) return authError

  try {
    const { id: projectId } = await params
    const body = await request.json()

    // Validar dados com Zod
    const validatedData = updateProjectStatusSchema.parse(body)

    // Buscar projeto e verificar permissões
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            organizationId: true,
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

    // Verificar permissões
    if (
      session!.user.role === "CLIENT" &&
      !session!.user.organizationIds.includes(project.brand.organizationId)
    ) {
      return NextResponse.json(
        { error: "Você não tem permissão para atualizar este projeto" },
        { status: 403 }
      )
    }

    // Validar transições de status
    const currentStatus = project.status
    const newStatus = validatedData.status

    // Regras de transição de status
    const validTransitions: Record<string, string[]> = {
      DRAFT: ["IN_PRODUCTION"],
      IN_PRODUCTION: ["READY", "DRAFT"],
      READY: ["APPROVED", "REVISION", "IN_PRODUCTION"],
      REVISION: ["IN_PRODUCTION"],
      APPROVED: [], // Status final - não pode ser alterado
    }

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Transição de status inválida: ${currentStatus} → ${newStatus}`,
        },
        { status: 400 }
      )
    }

    // Validações específicas por status
    if (newStatus === "IN_PRODUCTION" && project._count.creatives === 0) {
      return NextResponse.json(
        {
          error: "Não é possível mudar para IN_PRODUCTION sem criativos",
        },
        { status: 400 }
      )
    }

    if (newStatus === "READY" && project._count.creatives === 0) {
      return NextResponse.json(
        {
          error: "Não é possível marcar como READY sem criativos",
        },
        { status: 400 }
      )
    }

    // Atualizar status do projeto
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: newStatus,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            creatives: true,
            comments: true,
          },
        },
      },
    })

    // Adicionar comentário se fornecido
    if (validatedData.comment) {
      await prisma.comment.create({
        data: {
          content: validatedData.comment,
          projectId,
          userId: session!.user.id,
        },
      })
    }

    // Registrar atividade
    const statusLabels: Record<string, string> = {
      DRAFT: "Rascunho",
      IN_PRODUCTION: "Em Produção",
      READY: "Pronto",
      APPROVED: "Aprovado",
      REVISION: "Revisão",
    }

    await prisma.activityLog.create({
      data: {
        action: "updated_project_status",
        description: `Status do projeto "${project.name}" alterado de ${statusLabels[currentStatus]} para ${statusLabels[newStatus]}`,
        userId: session!.user.id,
        organizationId: project.brand.organizationId,
      },
    })

    return NextResponse.json({
      success: true,
      project: updatedProject,
      previousStatus: currentStatus,
      newStatus,
    })
  } catch (error: any) {
    console.error("Error updating project status:", error)

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
      { error: error.message || "Failed to update project status" },
      { status: 500 }
    )
  }
}
