import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { approveProjectSchema } from "@/lib/validations/project"
import { z } from "zod"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, session } = await requireAuth()
  if (authError) return authError

  try {
    const { id: projectId } = await params
    const body = await request.json()

    // Validar input
    const validatedData = approveProjectSchema.parse(body)

    // Buscar projeto
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        brand: {
          select: {
            organizationId: true,
            name: true,
            id: true,
          },
        },
        creatives: {
          orderBy: { createdAt: "asc" },
          take: 1, // Pega o primeiro criativo como referência visual
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Verificar acesso (apenas clientes da mesma organização ou admins)
    if (session!.user.role === "CLIENT") {
      if (!session!.user.organizationIds.includes(project.brand.organizationId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    // Verificar se projeto está em READY
    if (project.status !== "READY") {
      return NextResponse.json(
        { error: "Only projects with READY status can be approved" },
        { status: 400 }
      )
    }

    // Atualizar status
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "APPROVED",
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

    // Criar log de atividade
    await prisma.activityLog.create({
      data: {
        organizationId: project.brand.organizationId,
        userId: session!.user.id,
        action: "project_approved",
        description: `Projeto "${project.name}" aprovado por ${session!.user.name}`,
      },
    })

    // Criar comentário se fornecido
    if (validatedData.comment) {
      await prisma.comment.create({
        data: {
          projectId,
          userId: session!.user.id,
          content: validatedData.comment,
        },
      })
    }

    // Se é um projeto de TEMPLATE_CREATION, criar automaticamente um Template
    if (project.projectType === "TEMPLATE_CREATION") {
      // Usar o primeiro criativo como imagem de referência do template
      const referenceImage = project.creatives[0]?.url || "/placeholder-template.jpg"

      await prisma.template.create({
        data: {
          name: project.name,
          description: `Template criado a partir do projeto: ${project.name}`,
          imageUrl: referenceImage,
          brandId: project.brand.id,
          projectId: project.id,
          templateStatus: "APPROVED",
          isActive: true,
        },
      })

      // Registrar log de criação do template
      await prisma.activityLog.create({
        data: {
          organizationId: project.brand.organizationId,
          userId: session!.user.id,
          action: "template_created",
          description: `Template "${project.name}" criado automaticamente a partir do projeto aprovado`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      project: updatedProject,
      message: "Project approved successfully",
    })
  } catch (error: any) {
    console.error("Approve project error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || "Failed to approve project" },
      { status: 500 }
    )
  }
}
