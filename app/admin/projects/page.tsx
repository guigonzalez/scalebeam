import { prisma } from "@/lib/prisma"
import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut, FileText, Building2 } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { PROJECT_STATUS_CONFIG } from "@/lib/constants"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"

export const dynamic = "force-dynamic"

async function getAllProjects() {
  const projects = await prisma.project.findMany({
    include: {
      brand: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          organization: {
            select: {
              name: true,
            },
          },
        },
      },
      template: {
        select: {
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
    orderBy: {
      createdAt: "desc",
    },
    take: 50, // Limitar a 50 projetos (adicionar paginação depois)
  })

  return projects
}

export default async function AdminProjectsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/client")
  }

  const projects = await getAllProjects()

  // Agrupar por status
  const projectsByStatus = {
    DRAFT: projects.filter((p) => p.status === "DRAFT"),
    IN_PRODUCTION: projects.filter((p) => p.status === "IN_PRODUCTION"),
    READY: projects.filter((p) => p.status === "READY"),
    APPROVED: projects.filter((p) => p.status === "APPROVED"),
    REVISION: projects.filter((p) => p.status === "REVISION"),
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* User Header */}
      <div className="flex items-start justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Todos os Projetos
          </h1>
          <p className="text-muted-foreground mt-1">
            {projects.length} projetos totais
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-xs text-muted-foreground">{session.user.email}</p>
          </div>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}
          >
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </form>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        {Object.entries(projectsByStatus).map(([status, items]) => (
          <Card key={status} className="p-4">
            <div className="flex flex-col gap-2">
              <Badge className={PROJECT_STATUS_CONFIG[status as keyof typeof PROJECT_STATUS_CONFIG].color}>
                {PROJECT_STATUS_CONFIG[status as keyof typeof PROJECT_STATUS_CONFIG].label}
              </Badge>
              <span className="text-3xl font-bold">{items.length}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Projects List */}
      <div className="space-y-6">
        {Object.entries(projectsByStatus).map(([status, items]) => {
          if (items.length === 0) return null

          return (
            <div key={status}>
              <h2 className="text-lg font-semibold mb-4">
                {PROJECT_STATUS_CONFIG[status as keyof typeof PROJECT_STATUS_CONFIG].label} (
                {items.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((project) => (
                  <Card
                    key={project.id}
                    className="p-6 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {project.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {project.brand.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          <span>{project.brand.organization.name}</span>
                        </div>
                      </div>
                    </div>

                    {project.template && (
                      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{project.template.name}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border mb-4">
                      <div>
                        <span className="text-sm text-muted-foreground">
                          Criativos
                        </span>
                        <p className="text-lg font-semibold">
                          {project._count.creatives}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">
                          Comentários
                        </span>
                        <p className="text-lg font-semibold">
                          {project._count.comments}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground mb-4">
                      Criado{" "}
                      {formatDistanceToNow(new Date(project.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </div>

                    <div className="flex gap-2">
                      <Button asChild className="flex-1">
                        <Link href={`/admin/projects/${project.id}`}>
                          Ver Detalhes
                        </Link>
                      </Button>
                      <DeleteConfirmationDialog
                        resourceType="Projeto"
                        resourceName={project.name}
                        endpoint={`/api/admin/projects/${project.id}`}
                        variant="outline"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {projects.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum projeto criado ainda</p>
          </div>
        </Card>
      )}
    </div>
  )
}
