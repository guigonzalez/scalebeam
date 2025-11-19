import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export const dynamic = 'force-dynamic'

const statusConfig = {
  DRAFT: { label: "Rascunho", variant: "secondary" as const },
  IN_PRODUCTION: { label: "Em Produção", variant: "default" as const },
  READY: { label: "Pronto", variant: "default" as const },
  APPROVED: { label: "Aprovado", variant: "default" as const },
  REVISION: { label: "Em Revisão", variant: "destructive" as const },
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const statusFilter = status as keyof typeof statusConfig | undefined

  const projects = await prisma.project.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    include: {
      brand: {
        include: {
          organization: true,
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

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Projetos</h1>
          <p className="text-muted-foreground mt-1">{projects.length} projetos encontrados</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Link
            href="/admin/projects"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              !statusFilter
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/50"
            }`}
          >
            Todos
          </Link>
          {Object.entries(statusConfig).map(([status, config]) => (
            <Link
              key={status}
              href={`/admin/projects?status=${status}`}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                statusFilter === status
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              {config.label}
            </Link>
          ))}
        </div>
      </Card>

      {/* Projects Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Projeto
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Marca / Organização
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Criativos
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Última Atualização
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects.map((project) => {
                const config = statusConfig[project.status]
                return (
                  <tr
                    key={project.id}
                    className="group hover:bg-secondary/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="font-medium hover:underline"
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{project.brand.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {project.brand.organization.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {project._count.creatives} / {project.estimatedCreatives}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(project.updatedAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Nenhum projeto encontrado</p>
          </div>
        )}
      </Card>
    </div>
  )
}
