import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Layers, Edit, Plus } from "lucide-react"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AdminTemplateModal } from "@/components/admin-template-modal"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"

export const dynamic = 'force-dynamic'

const statusConfig = {
  PENDING_APPROVAL: { label: "Pendente", variant: "secondary" as const },
  APPROVED: { label: "Aprovado", variant: "default" as const },
  REJECTED: { label: "Rejeitado", variant: "destructive" as const },
}

export default async function TemplatesPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  const [templates, brands] = await Promise.all([
    prisma.template.findMany({
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            organization: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.brand.findMany({
      select: {
        id: true,
        name: true,
        organization: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Layers className="h-8 w-8 text-muted-foreground" />
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Templates</h1>
              <p className="text-muted-foreground mt-1">
                Gerenciar templates de criativos
              </p>
            </div>
          </div>
        </div>
        <AdminTemplateModal mode="create" brands={brands}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Criar Template
          </Button>
        </AdminTemplateModal>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Preview</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Nome</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Marca</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Projetos</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Criado</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {templates.map((template) => {
                const statusCfg = statusConfig[template.templateStatus]

                return (
                  <tr key={template.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="relative h-16 w-16 rounded overflow-hidden bg-muted">
                        <Image
                          src={template.imageUrl}
                          alt={template.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{template.name}</p>
                        {template.description && (
                          <p className="text-xs text-muted-foreground">{template.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium">{template.brand.name}</p>
                        <p className="text-xs text-muted-foreground">{template.brand.organization.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={statusCfg.variant}>
                          {statusCfg.label}
                        </Badge>
                        {!template.isActive && (
                          <Badge variant="outline">Inativo</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{template._count.projects} uso(s)</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(template.createdAt, { addSuffix: true, locale: ptBR })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <AdminTemplateModal mode="edit" template={template} brands={brands}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </AdminTemplateModal>
                        <DeleteConfirmationDialog
                          resourceType="Template"
                          resourceName={template.name}
                          endpoint={`/api/admin/templates/${template.id}`}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {templates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Layers className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Nenhum template cadastrado</p>
          </div>
        )}
      </Card>
    </div>
  )
}
