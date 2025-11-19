import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Folder, Image, CheckCircle2, Clock, AlertCircle, Users, DollarSign, Activity } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

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
    totalOrganizations,
    organizationsWithPaymentIssues,
    recentProjects,
    recentActivityLogs,
    organizationsPaymentStatus,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: "IN_PRODUCTION" } }),
    prisma.project.count({ where: { status: "READY" } }),
    prisma.project.count({ where: { status: "APPROVED" } }),
    prisma.project.count({ where: { status: "REVISION" } }),
    prisma.creative.count(),
    prisma.brand.count(),
    prisma.organization.count(),
    prisma.organization.count({ where: { paymentStatus: { in: ["overdue", "suspended"] } } }),
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
    prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        plan: true,
        paymentStatus: true,
        lastPaymentDate: true,
        nextBillingDate: true,
      },
      orderBy: { name: "asc" },
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
    totalOrganizations,
    organizationsWithPaymentIssues,
    recentProjects,
    recentActivityLogs,
    organizationsPaymentStatus,
  }
}

const statusConfig = {
  DRAFT: {
    label: "Rascunho",
    variant: "secondary" as const,
    icon: Clock,
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
    dotClass: "bg-slate-500",
    bgClass: "bg-slate-50 border-slate-200"
  },
  IN_PRODUCTION: {
    label: "Em Produção",
    variant: "default" as const,
    icon: Clock,
    badgeClass: "bg-blue-100 text-blue-700 border-blue-300",
    dotClass: "bg-blue-500",
    bgClass: "bg-blue-50 border-blue-200"
  },
  READY: {
    label: "Pronto",
    variant: "default" as const,
    icon: CheckCircle2,
    badgeClass: "bg-amber-100 text-amber-700 border-amber-300",
    dotClass: "bg-amber-500",
    bgClass: "bg-amber-50 border-amber-200"
  },
  APPROVED: {
    label: "Aprovado",
    variant: "default" as const,
    icon: CheckCircle2,
    badgeClass: "bg-green-100 text-green-700 border-green-300",
    dotClass: "bg-green-500",
    bgClass: "bg-green-50 border-green-200"
  },
  REVISION: {
    label: "Em Revisão",
    variant: "destructive" as const,
    icon: AlertCircle,
    badgeClass: "bg-red-100 text-red-700 border-red-300",
    dotClass: "bg-red-500",
    bgClass: "bg-red-50 border-red-200"
  },
}

const paymentStatusConfig: Record<string, {
  label: string;
  variant: "default" | "destructive" | "secondary" | "outline";
  badgeClass: string;
}> = {
  active: {
    label: "Ativo",
    variant: "default",
    badgeClass: "bg-green-100 text-green-700 border-green-300"
  },
  overdue: {
    label: "Atrasado",
    variant: "destructive",
    badgeClass: "bg-red-100 text-red-700 border-red-300"
  },
  suspended: {
    label: "Suspenso",
    variant: "secondary",
    badgeClass: "bg-orange-100 text-orange-700 border-orange-300"
  },
}

export default async function AdminDashboard() {
  const metrics = await getMetrics()

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral dos projetos, clientes e atividades
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Clientes</p>
              <p className="text-3xl font-semibold mt-2">{metrics.totalOrganizations}</p>
              <p className="text-xs text-muted-foreground mt-1">{metrics.totalBrands} marcas ativas</p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground/50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Projetos</p>
              <p className="text-3xl font-semibold mt-2">{metrics.totalProjects}</p>
              <p className="text-xs text-muted-foreground mt-1">{metrics.inProductionCount} em produção</p>
            </div>
            <Folder className="h-8 w-8 text-muted-foreground/50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Aguardando Aprovação</p>
              <p className="text-3xl font-semibold mt-2">{metrics.readyCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Prontos para revisão</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-muted-foreground/50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Criativos Gerados</p>
              <p className="text-3xl font-semibold mt-2">{metrics.totalCreatives}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.totalProjects > 0
                  ? Math.round(metrics.totalCreatives / metrics.totalProjects)
                  : 0}{" "}
                por projeto
              </p>
            </div>
            <Image className="h-8 w-8 text-muted-foreground/50" />
          </div>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Status dos Projetos */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Status dos Projetos</h3>
            <div className="space-y-3">
              <div className={`flex items-center justify-between p-3 rounded-lg border ${statusConfig.IN_PRODUCTION.bgClass}`}>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${statusConfig.IN_PRODUCTION.dotClass}`}></div>
                  <span className={`text-sm font-medium ${statusConfig.IN_PRODUCTION.badgeClass.split(' ')[1]}`}>Em Produção</span>
                </div>
                <span className={`text-sm font-semibold ${statusConfig.IN_PRODUCTION.badgeClass.split(' ')[1]}`}>{metrics.inProductionCount}</span>
              </div>
              <div className={`flex items-center justify-between p-3 rounded-lg border ${statusConfig.READY.bgClass}`}>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${statusConfig.READY.dotClass}`}></div>
                  <span className={`text-sm font-medium ${statusConfig.READY.badgeClass.split(' ')[1]}`}>Prontos</span>
                </div>
                <span className={`text-sm font-semibold ${statusConfig.READY.badgeClass.split(' ')[1]}`}>{metrics.readyCount}</span>
              </div>
              <div className={`flex items-center justify-between p-3 rounded-lg border ${statusConfig.APPROVED.bgClass}`}>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${statusConfig.APPROVED.dotClass}`}></div>
                  <span className={`text-sm font-medium ${statusConfig.APPROVED.badgeClass.split(' ')[1]}`}>Aprovados</span>
                </div>
                <span className={`text-sm font-semibold ${statusConfig.APPROVED.badgeClass.split(' ')[1]}`}>{metrics.approvedCount}</span>
              </div>
              {metrics.revisionCount > 0 && (
                <div className={`flex items-center justify-between p-3 rounded-lg border ${statusConfig.REVISION.bgClass}`}>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${statusConfig.REVISION.dotClass}`}></div>
                    <span className={`text-sm font-medium ${statusConfig.REVISION.badgeClass.split(' ')[1]}`}>Em Revisão</span>
                  </div>
                  <span className={`text-sm font-semibold ${statusConfig.REVISION.badgeClass.split(' ')[1]}`}>{metrics.revisionCount}</span>
                </div>
              )}
            </div>
          </Card>

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
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.badgeClass}`}>
                        {config.label}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Resumo */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Resumo</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de Clientes</span>
                <span className="text-sm font-medium">{metrics.totalOrganizations}</span>
              </div>
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

          {/* Payment Status Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Status de Pagamento</h3>
              </div>
              {metrics.organizationsWithPaymentIssues > 0 && (
                <Badge variant="destructive">
                  {metrics.organizationsWithPaymentIssues} com problemas
                </Badge>
              )}
            </div>
            <div className="space-y-3">
              {metrics.organizationsPaymentStatus.map((org) => {
                const statusCfg = paymentStatusConfig[org.paymentStatus]
                const isOverdue = org.paymentStatus === "overdue" || org.paymentStatus === "suspended"

                return (
                  <div
                    key={org.id}
                    className={`flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-secondary/50 ${
                      isOverdue ? "border-destructive/50 bg-destructive/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isOverdue ? "bg-destructive/10" : "bg-primary/10"
                        }`}
                      >
                        {isOverdue ? (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        ) : (
                          <DollarSign className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold truncate">{org.name}</h4>
                          <Badge variant="outline" className="flex-shrink-0">
                            {org.plan}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {org.lastPaymentDate && (
                            <span>
                              Último pagamento:{" "}
                              {formatDistanceToNow(org.lastPaymentDate, { addSuffix: true, locale: ptBR })}
                            </span>
                          )}
                          {org.nextBillingDate && (
                            <span>
                              Próximo vencimento:{" "}
                              {formatDistanceToNow(org.nextBillingDate, { addSuffix: true, locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ml-4 flex-shrink-0 ${statusCfg.badgeClass}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Activity Logs - Full Width at Bottom */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Atividade Recente dos Clientes</h3>
          </div>
        </div>
        <div className="space-y-3">
          {metrics.recentActivityLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start justify-between rounded-lg border border-border p-3 transition-colors hover:bg-secondary/50"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{log.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{log.organization.name}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                {formatDistanceToNow(log.createdAt, { addSuffix: true, locale: ptBR })}
              </span>
            </div>
          ))}
          {metrics.recentActivityLogs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente</p>
          )}
        </div>
      </Card>
    </div>
  )
}
