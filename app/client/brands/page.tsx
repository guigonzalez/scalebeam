import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, LogOut, Plus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ClientBrandModal } from "@/components/client-brand-modal"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'

async function getClientBrands(organizationIds: string[]) {
  const brands = await prisma.brand.findMany({
    where: {
      organizationId: { in: organizationIds },
    },
    include: {
      organization: {
        select: {
          name: true,
          maxBrands: true,
        },
      },
      _count: {
        select: { projects: true, assets: true },
      },
    },
    orderBy: { name: "asc" },
  })

  return brands
}

async function getOrganizationLimits(organizationIds: string[]) {
  const organizations = await prisma.organization.findMany({
    where: {
      id: { in: organizationIds },
    },
    select: {
      id: true,
      name: true,
      maxBrands: true,
      _count: {
        select: { brands: true },
      },
    },
  })

  return organizations
}

export default async function ClientBrandsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "CLIENT") {
    redirect("/admin")
  }

  const brands = await getClientBrands(session.user.organizationIds)
  const organizations = await getOrganizationLimits(session.user.organizationIds)

  // Get the first organization (assuming user belongs to one org for now)
  const primaryOrg = organizations[0]
  const canCreateBrand = primaryOrg && primaryOrg._count.brands < primaryOrg.maxBrands

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* User Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">Área do Cliente</h2>
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Minhas Marcas</h1>
          <p className="text-muted-foreground mt-1">
            {brands.length} de {primaryOrg?.maxBrands || 0} marca(s) cadastrada(s)
          </p>
        </div>
        {canCreateBrand ? (
          <ClientBrandModal organizationId={primaryOrg.id}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Marca
            </Button>
          </ClientBrandModal>
        ) : (
          <div className="text-right">
            <Badge variant="secondary">Limite atingido</Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {primaryOrg?._count.brands}/{primaryOrg?.maxBrands} marcas
            </p>
          </div>
        )}
      </div>

      {/* Brands Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <Card key={brand.id} className="p-6 hover:bg-secondary/50 transition-colors">
            <div className="flex items-start gap-4 mb-4">
              {brand.logoUrl && (
                <div className="relative h-16 w-16 flex-shrink-0 rounded-lg border border-border overflow-hidden bg-muted">
                  <Image
                    src={brand.logoUrl}
                    alt={brand.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg">{brand.name}</h3>
                {brand.toneOfVoice && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {brand.toneOfVoice}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border mb-4">
              <div>
                <span className="text-sm text-muted-foreground">Projetos</span>
                <p className="text-lg font-semibold">{brand._count.projects}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Assets</span>
                <p className="text-lg font-semibold">{brand._count.assets}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button asChild size="sm" className="flex-1">
                <Link href={`/client/brands/${brand.id}`}>
                  Ver Detalhes
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/client/brands/${brand.id}/assets`}>
                  <Upload className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {brands.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground mb-4">Nenhuma marca cadastrada ainda</p>
            {canCreateBrand ? (
              <ClientBrandModal organizationId={primaryOrg.id}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Marca
                </Button>
              </ClientBrandModal>
            ) : (
              <p className="text-sm text-muted-foreground">
                Você atingiu o limite de marcas do seu plano
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
