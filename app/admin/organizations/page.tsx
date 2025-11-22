import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Plus, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { OrganizationModal } from "@/components/organization-modal"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"

export const dynamic = 'force-dynamic'

const planLabels = {
  STARTER: "Starter",
  PROFESSIONAL: "Professional",
  AGENCY: "Agency",
}

const paymentStatusConfig: Record<string, {
  label: string
  variant: "default" | "destructive" | "secondary"
}> = {
  active: { label: "Ativo", variant: "default" },
  overdue: { label: "Atrasado", variant: "destructive" },
  suspended: { label: "Suspenso", variant: "secondary" },
}

export default async function OrganizationsPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  const organizations = await prisma.organization.findMany({
    include: {
      brands: {
        select: {
          id: true,
        },
      },
      users: {
        select: {
          id: true,
        },
      },
      _count: {
        select: {
          brands: true,
          users: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Organizations</h1>
              <p className="text-muted-foreground mt-1">
                Gerenciar clientes e suas configurações
              </p>
            </div>
          </div>
        </div>
        <OrganizationModal mode="create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Organization
          </Button>
        </OrganizationModal>
      </div>

      {/* Organizations Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Nome
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Plano
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Limites
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Status Pagamento
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Usuários
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Criado
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {organizations.map((org) => {
                const paymentCfg = paymentStatusConfig[org.paymentStatus]

                return (
                  <tr key={org.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-xs text-muted-foreground">{org._count.brands} marcas</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{planLabels[org.plan]}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm space-y-1">
                        <p className="text-muted-foreground">
                          {org.maxCreatives} criativos/mês
                        </p>
                        <p className="text-muted-foreground">
                          {org.maxBrands} marca(s)
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={paymentCfg.variant}>
                        {paymentCfg.label}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{org._count.users}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(org.createdAt, { addSuffix: true, locale: ptBR })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <OrganizationModal mode="edit" organization={org}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </OrganizationModal>
                        <DeleteConfirmationDialog
                          resourceType="Organization"
                          resourceName={org.name}
                          endpoint={`/api/admin/organizations/${org.id}`}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {organizations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Nenhuma organization cadastrada</p>
          </div>
        )}
      </Card>
    </div>
  )
}
