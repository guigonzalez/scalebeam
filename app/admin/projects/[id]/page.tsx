import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { MessageSquare, Upload } from "lucide-react"
import { notFound } from "next/navigation"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { UploadCreativesModal } from "@/components/upload-creatives-modal"
import { ProjectStatusChange } from "@/components/project-status-change"
import { DownloadAllButton } from "@/components/creative-download-button"
import { DownloadAssetButton, DownloadBriefingButton } from "@/components/download-asset-button"

export const dynamic = 'force-dynamic'

const statusConfig = {
  DRAFT: { label: "Rascunho", variant: "secondary" as const },
  IN_PRODUCTION: { label: "Em Produção", variant: "default" as const },
  READY: { label: "Pronto", variant: "default" as const },
  APPROVED: { label: "Aprovado", variant: "default" as const },
  REVISION: { label: "Em Revisão", variant: "destructive" as const },
}

export default async function ProjectDetailPage({
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
          assets: true,
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
  const briefingData = project.briefingData
    ? JSON.parse(project.briefingData)
    : []

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
        <div className="flex gap-2">
          {project.creatives.length > 0 && (
            <DownloadAllButton
              projectName={project.name}
              creativesCount={project.creatives.length}
            />
          )}
          <UploadCreativesModal
            projectId={project.id}
            projectName={project.name}
          />
          <ProjectStatusChange
            projectId={project.id}
            projectName={project.name}
            currentStatus={project.status}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Informações do Projeto</h2>
            <div className="grid gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Criativos Estimados</span>
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

          {/* Briefing Data */}
          {briefingData.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Briefing</h2>
                {project.briefingUrl && (
                  <DownloadBriefingButton projectName={project.name} />
                )}
              </div>
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
            <h2 className="text-lg font-semibold mb-4">
              Criativos ({project.creatives.length})
            </h2>
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
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Upload className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhum criativo entregue ainda</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Faça upload dos criativos finalizados
                </p>
              </div>
            )}
          </Card>

          {/* Comments */}
          {project.comments.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comentários ({project.comments.length})
              </h2>
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
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Brand Assets */}
        <div className="space-y-6">
          {/* Brand Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Informações da Marca</h2>
            <div className="space-y-4">
              {project.brand.logoUrl && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-2">Logo</span>
                  <div className="relative h-24 w-24 rounded-lg border border-border overflow-hidden bg-muted">
                    <Image
                      src={project.brand.logoUrl}
                      alt={project.brand.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}

              {project.brand.toneOfVoice && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Tom de Voz</span>
                  <p className="text-sm">{project.brand.toneOfVoice}</p>
                </div>
              )}

              {project.brand.primaryColor && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground block mb-2">
                      Cor Primária
                    </span>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-8 w-8 rounded border border-border"
                        style={{ backgroundColor: project.brand.primaryColor }}
                      />
                      <span className="text-sm font-mono">
                        {project.brand.primaryColor}
                      </span>
                    </div>
                  </div>
                  {project.brand.secondaryColor && (
                    <div>
                      <span className="text-sm text-muted-foreground block mb-2">
                        Cor Secundária
                      </span>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-8 w-8 rounded border border-border"
                          style={{ backgroundColor: project.brand.secondaryColor }}
                        />
                        <span className="text-sm font-mono">
                          {project.brand.secondaryColor}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Brand Assets */}
          {project.brand.assets.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Assets da Marca</h2>
              </div>
              <div className="space-y-3">
                {project.brand.assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-secondary/50 transition-colors"
                  >
                    {asset.type === "image" && (
                      <div className="relative h-12 w-12 flex-shrink-0 rounded overflow-hidden bg-muted">
                        <Image
                          src={asset.url}
                          alt={asset.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{asset.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {asset.type.toUpperCase()}
                        {asset.size && ` · ${(asset.size / 1024).toFixed(0)} KB`}
                      </p>
                    </div>
                    <DownloadAssetButton assetName={asset.name} assetUrl={asset.url} />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
