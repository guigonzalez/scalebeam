import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, MessageSquare } from "lucide-react"
import { notFound } from "next/navigation"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ProjectApprovalActions } from "@/components/project-approval-actions"
import { CreativeDownloadButton, DownloadAllButton } from "@/components/creative-download-button"
import { AddCommentForm } from "@/components/add-comment-form"

export const dynamic = 'force-dynamic'

const statusConfig = {
  DRAFT: { label: "Rascunho", variant: "secondary" as const },
  IN_PRODUCTION: { label: "Em Produção", variant: "default" as const },
  READY: { label: "Pronto para Aprovar", variant: "default" as const },
  APPROVED: { label: "Aprovado", variant: "default" as const },
  REVISION: { label: "Em Revisão", variant: "destructive" as const },
}

export default async function ClientProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      brand: {
        include: {
          organization: true,
        },
      },
      creatives: {
        orderBy: { createdAt: "desc" },
      },
      comments: {
        include: {
          user: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!project) {
    notFound()
  }

  const config = statusConfig[project.status]
  const canApprove = project.status === "READY"
  const needsReview = project.status === "READY" || project.status === "REVISION"
  const briefingData = project.briefingData ? JSON.parse(project.briefingData) : []

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {project.brand.name} · {project.brand.organization.name}
          </p>
        </div>
        {canApprove && (
          <ProjectApprovalActions
            projectId={project.id}
            projectName={project.name}
          />
        )}
      </div>

      {/* Alert for actions needed */}
      {needsReview && (
        <Card className="p-4 bg-primary/10 border-primary/20">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-primary">Ação necessária</p>
              <p className="text-sm text-muted-foreground mt-1">
                {project.status === "READY"
                  ? "Os criativos estão prontos para sua aprovação. Revise e aprove ou solicite ajustes."
                  : "Revise os ajustes solicitados e aprove ou solicite novos ajustes."}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Creatives */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Informações do Projeto</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <span className="text-sm text-muted-foreground">Criativos Solicitados</span>
                <p className="text-lg font-medium">{project.estimatedCreatives}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Criativos Entregues</span>
                <p className="text-lg font-medium">{project.creatives.length}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Última Atualização</span>
                <p className="text-sm">
                  {formatDistanceToNow(new Date(project.updatedAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          </Card>

          {/* Briefing */}
          {briefingData.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Briefing Enviado</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      {Object.keys(briefingData[0]).map((key) => (
                        <th
                          key={key}
                          className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {briefingData.map((row: Record<string, string>, idx: number) => (
                      <tr key={idx}>
                        {Object.values(row).map((value, vIdx) => (
                          <td key={vIdx} className="px-4 py-3">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Creatives Gallery */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Criativos Entregues ({project.creatives.length})
              </h2>
              {project.creatives.length > 0 && (
                <DownloadAllButton
                  projectName={project.name}
                  creativesCount={project.creatives.length}
                />
              )}
            </div>

            {project.creatives.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {project.creatives.map((creative) => (
                  <div
                    key={creative.id}
                    className="group relative overflow-hidden rounded-lg border border-border bg-muted"
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={creative.thumbnailUrl || creative.url}
                        alt={creative.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <CreativeDownloadButton
                          creativeId={creative.id}
                          creativeName={creative.name}
                          variant="secondary"
                          size="sm"
                        />
                      </div>
                    </div>
                    <div className="p-3 bg-card">
                      <p className="text-sm font-medium truncate">{creative.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {creative.width} × {creative.height} · {creative.format.toUpperCase()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-lg">
                <p className="text-muted-foreground">
                  {project.status === "DRAFT"
                    ? "Projeto em rascunho"
                    : "Criativos ainda não foram entregues"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {project.status === "IN_PRODUCTION"
                    ? "A equipe UXER está trabalhando nos criativos"
                    : "Aguardando início do projeto"}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Comments */}
        <div className="space-y-6">
          {/* Comments */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comentários ({project.comments.length})
            </h2>

            {canApprove && <AddCommentForm projectId={project.id} />}

            <div className="space-y-4">
              {project.comments.map((comment) => (
                <div key={comment.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary text-xs font-medium text-primary-foreground flex items-center justify-center">
                        {comment.user.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{comment.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              ))}

              {project.comments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum comentário ainda
                </p>
              )}
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}
