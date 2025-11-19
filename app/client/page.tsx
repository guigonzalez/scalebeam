import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FolderOpen, Upload, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export const dynamic = 'force-dynamic'

// Mock: usando organização Tech Startup Inc (primeiro cliente)
const CLIENT_ORG_ID = "Tech Startup Inc"

async function getClientData() {
  const organization = await prisma.organization.findFirst({
    where: { name: CLIENT_ORG_ID },
    include: {
      brands: {
        include: {
          _count: {
            select: { projects: true, assets: true },
          },
        },
      },
    },
  })

  if (!organization) return null

  const projects = await prisma.project.findMany({
    where: {
      brand: {
        organizationId: organization.id,
      },
    },
    include: {
      brand: true,
      _count: {
        select: { creatives: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  })

  const stats = {
    totalBrands: organization.brands.length,
    totalProjects: await prisma.project.count({
      where: { brand: { organizationId: organization.id } },
    }),
    projectsReady: await prisma.project.count({
      where: {
        brand: { organizationId: organization.id },
        status: "READY",
      },
    }),
    projectsApproved: await prisma.project.count({
      where: {
        brand: { organizationId: organization.id },
        status: "APPROVED",
      },
    }),
  }

  return { organization, projects, stats }
}

const statusConfig = {
  DRAFT: { label: "Rascunho", variant: "secondary" as const, icon: Clock },
  IN_PRODUCTION: { label: "Em Produção", variant: "default" as const, icon: Clock },
  READY: { label: "Pronto para Aprovar", variant: "default" as const, icon: CheckCircle2 },
  APPROVED: { label: "Aprovado", variant: "default" as const, icon: CheckCircle2 },
  REVISION: { label: "Em Revisão", variant: "destructive" as const, icon: Clock },
}

export default async function ClientDashboard() {
  const data = await getClientData()

  if (!data) {
    return <div className="p-8">Organização não encontrada</div>
  }

  const { organization, projects, stats } = data

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Bem-vindo, {organization.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Plano {organization.plan} · {organization.maxCreatives} criativos/mês
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/client/projects/new">
            <Upload className="h-4 w-4 mr-2" />
            Novo Projeto
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/client/brands">
            <FolderOpen className="h-4 w-4 mr-2" />
            Minhas Marcas
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Minhas Marcas</p>
              <p className="text-3xl font-semibold mt-2">{stats.totalBrands}</p>
            </div>
            <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Projetos</p>
              <p className="text-3xl font-semibold mt-2">{stats.totalProjects}</p>
            </div>
            <Clock className="h-8 w-8 text-muted-foreground/50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Aguardando Aprovação</p>
              <p className="text-3xl font-semibold mt-2">{stats.projectsReady}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-muted-foreground/50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Aprovados</p>
              <p className="text-3xl font-semibold mt-2">{stats.projectsApproved}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500/50" />
          </div>
        </Card>
      </div>

      {/* Brands */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Minhas Marcas</h2>
          <Link
            href="/client/brands"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver todas →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {organization.brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/client/brands/${brand.id}`}
              className="flex items-start gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50"
            >
              {brand.logoUrl && (
                <div className="relative h-12 w-12 flex-shrink-0 rounded-lg border border-border overflow-hidden bg-muted">
                  <Image
                    src={brand.logoUrl}
                    alt={brand.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium">{brand.name}</p>
                <p className="text-sm text-muted-foreground">
                  {brand._count.projects} projetos · {brand._count.assets} assets
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* Recent Projects */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Projetos Recentes</h2>
          <Link
            href="/client/projects"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver todos →
          </Link>
        </div>
        <div className="space-y-3">
          {projects.map((project) => {
            const config = statusConfig[project.status]
            const StatusIcon = config.icon
            return (
              <Link
                key={project.id}
                href={`/client/projects/${project.id}`}
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
