import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Folder, Image, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

async function getMetrics() {
  const [
    totalProjects,
    inProductionCount,
    readyCount,
    approvedCount,
    revisionCount,
    totalCreatives,
    totalBrands,
    recentProjects,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: "IN_PRODUCTION" } }),
    prisma.project.count({ where: { status: "READY" } }),
    prisma.project.count({ where: { status: "APPROVED" } }),
    prisma.project.count({ where: { status: "REVISION" } }),
    prisma.creative.count(),
    prisma.brand.count(),
    prisma.project.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        brand: true,
        _count: {
          select: { creatives: true },
        },
      },
    }),
  ])

  return {
    totalProjects,
    inProductionCount,
    readyCount,
    approvedCount,
    revisionCount,
    totalCreatives,
    totalBrands,
    recentProjects,
  }
}

const statusConfig = {
  DRAFT: { label: "Rascunho", variant: "secondary" as const, icon: Clock },
  IN_PRODUCTION: { label: "Em Produção", variant: "default" as const, icon: Clock },
  READY: { label: "Pronto", variant: "default" as const, icon: CheckCircle2 },
  APPROVED: { label: "Aprovado", variant: "default" as const, icon: CheckCircle2 },
  REVISION: { label: "Em Revisão", variant: "destructive" as const, icon: AlertCircle },
}

export default async function AdminDashboard() {
  const metrics = await getMetrics()

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral dos projetos e criativos
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Projetos</p>
              <p className="text-3xl font-semibold mt-2">{metrics.totalProjects}</p>
            </div>
            <Folder className="h-8 w-8 text-muted-foreground/50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Em Produção</p>
              <p className="text-3xl font-semibold mt-2">{metrics.inProductionCount}</p>
            </div>
            <Clock className="h-8 w-8 text-muted-foreground/50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Aguardando Aprovação</p>
              <p className="text-3xl font-semibold mt-2">{metrics.readyCount}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-muted-foreground/50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Criativos Gerados</p>
              <p className="text-3xl font-semibold mt-2">{metrics.totalCreatives}</p>
            </div>
            <Image className="h-8 w-8 text-muted-foreground/50" />
          </div>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Status dos Projetos</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Em Produção</span>
              <span className="text-sm font-medium">{metrics.inProductionCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Prontos</span>
              <span className="text-sm font-medium">{metrics.readyCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Aprovados</span>
              <span className="text-sm font-medium">{metrics.approvedCount}</span>
            </div>
            {metrics.revisionCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Em Revisão</span>
                <span className="text-sm font-medium text-destructive">{metrics.revisionCount}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Resumo</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total de Marcas</span>
              <span className="text-sm font-medium">{metrics.totalBrands}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total de Criativos</span>
              <span className="text-sm font-medium">{metrics.totalCreatives}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Média de Criativos/Projeto</span>
              <span className="text-sm font-medium">
                {metrics.totalProjects > 0
                  ? Math.round(metrics.totalCreatives / metrics.totalProjects)
                  : 0}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Projetos Recentes</h3>
          <Link
            href="/admin/projects"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver todos →
          </Link>
        </div>
        <div className="space-y-3">
          {metrics.recentProjects.map((project) => {
            const config = statusConfig[project.status]
            const StatusIcon = config.icon
            return (
              <Link
                key={project.id}
                href={`/admin/projects/${project.id}`}
                className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50"
              >
                <div className="flex items-center gap-4">
                  <StatusIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">{project.brand.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {project._count.creatives} criativos
                  </span>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>
              </Link>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
