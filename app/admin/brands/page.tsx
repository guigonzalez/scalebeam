import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"

export const dynamic = 'force-dynamic'

const planConfig = {
  STARTER: { label: "Starter", color: "bg-blue-500" },
  PROFESSIONAL: { label: "Professional", color: "bg-purple-500" },
  AGENCY: { label: "Agency", color: "bg-amber-500" },
}

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({
    include: {
      organization: true,
      _count: {
        select: {
          projects: true,
          assets: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Marcas</h1>
        <p className="text-muted-foreground mt-1">{brands.length} marcas cadastradas</p>
      </div>

      {/* Brands Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => {
          const planCfg = planConfig[brand.organization.plan]
          return (
            <Card key={brand.id} className="p-6 hover:bg-secondary/50 transition-colors">
              <div className="flex items-start gap-4">
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
                  <p className="text-sm text-muted-foreground truncate">
                    {brand.organization.name}
                  </p>
                  <div className="mt-2">
                    <Badge variant="outline">{planCfg.label}</Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Projetos</span>
                  <p className="text-lg font-semibold">{brand._count.projects}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Assets</span>
                  <p className="text-lg font-semibold">{brand._count.assets}</p>
                </div>
              </div>

              {brand.primaryColor && (
                <div className="mt-4 flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded border border-border"
                    style={{ backgroundColor: brand.primaryColor }}
                  />
                  {brand.secondaryColor && (
                    <div
                      className="h-6 w-6 rounded border border-border"
                      style={{ backgroundColor: brand.secondaryColor }}
                    />
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {brand._count.assets} assets
                  </span>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
