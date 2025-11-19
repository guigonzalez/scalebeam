import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export const dynamic = 'force-dynamic'

const CLIENT_ORG_ID = "Tech Startup Inc"

const statusConfig = {
  DRAFT: { label: "Rascunho", variant: "secondary" as const },
  IN_PRODUCTION: { label: "Em Produção", variant: "default" as const },
  READY: { label: "Pronto para Aprovar", variant: "default" as const },
  APPROVED: { label: "Aprovado", variant: "default" as const },
  REVISION: { label: "Em Revisão", variant: "destructive" as const },
}

async function getClientProjects() {
  const organization = await prisma.organization.findFirst({
    where: { name: CLIENT_ORG_ID },
  })

  if (!organization) return []

  const projects = await prisma.project.findMany({
    where: {
      brand: {
        organizationId: organization.id,
      },
    },
    include: {
      brand: true,
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

  return projects
}

export default async function ClientProjectsPage() {
  const projects = await getClientProjects()

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Meus Projetos</h1>
        <p className="text-muted-foreground mt-1">{projects.length} projeto(s)</p>
      </div>

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
                  Marca
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Criativos
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Atualizado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects.map((project) => {
                const config = statusConfig[project.status]
                const needsAttention = project.status === "READY" || project.status === "REVISION"

                return (
                  <tr
                    key={project.id}
                    className={`group hover:bg-secondary/50 transition-colors ${
                      needsAttention ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/client/projects/${project.id}`}
                        className="font-medium hover:underline"
                      >
                        {project.name}
                      </Link>
                      {needsAttention && (
                        <span className="ml-2 text-xs text-primary">• Requer ação</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{project.brand.name}</span>
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
            <p className="text-muted-foreground">Nenhum projeto criado ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crie seu primeiro projeto para começar
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
