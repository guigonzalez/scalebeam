import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export const dynamic = 'force-dynamic'

const CLIENT_ORG_ID = "Tech Startup Inc"

async function getClientBrands() {
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

  return organization
}

export default async function ClientBrandsPage() {
  const organization = await getClientBrands()

  if (!organization) {
    return <div className="p-8">Organização não encontrada</div>
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Minhas Marcas</h1>
        <p className="text-muted-foreground mt-1">
          {organization.brands.length} marca(s) cadastrada(s)
        </p>
      </div>

      {/* Brands Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {organization.brands.map((brand) => (
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

      {organization.brands.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground">Nenhuma marca cadastrada ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Entre em contato com o suporte para cadastrar sua primeira marca
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
