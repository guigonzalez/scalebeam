import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Download } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      organization: true,
      assets: {
        orderBy: { createdAt: "desc" },
      },
      projects: {
        include: {
          _count: {
            select: { creatives: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  })

  if (!brand) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {brand.logoUrl && (
            <div className="relative h-20 w-20 rounded-lg border border-border overflow-hidden bg-muted">
              <Image
                src={brand.logoUrl}
                alt={brand.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{brand.name}</h1>
            <p className="text-muted-foreground mt-1">{brand.organization.name}</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/client/brands/${brand.id}/assets`}>
            <Upload className="h-4 w-4 mr-2" />
            Fazer Upload de Assets
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Brand Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Informações da Marca</h2>
            <div className="space-y-4">
              {brand.toneOfVoice && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Tom de Voz</span>
                  <p className="text-sm">{brand.toneOfVoice}</p>
                </div>
              )}

              {(brand.primaryColor || brand.secondaryColor) && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-2">Cores</span>
                  <div className="flex gap-4">
                    {brand.primaryColor && (
                      <div className="flex items-center gap-2">
                        <div
                          className="h-10 w-10 rounded border border-border"
                          style={{ backgroundColor: brand.primaryColor }}
                        />
                        <div>
                          <p className="text-xs text-muted-foreground">Primária</p>
                          <span className="text-sm font-mono">{brand.primaryColor}</span>
                        </div>
                      </div>
                    )}
                    {brand.secondaryColor && (
                      <div className="flex items-center gap-2">
                        <div
                          className="h-10 w-10 rounded border border-border"
                          style={{ backgroundColor: brand.secondaryColor }}
                        />
                        <div>
                          <p className="text-xs text-muted-foreground">Secundária</p>
                          <span className="text-sm font-mono">{brand.secondaryColor}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Assets */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Assets ({brand.assets.length})</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/client/brands/${brand.id}/assets`}>
                  <Upload className="h-4 w-4 mr-2" />
                  Adicionar
                </Link>
              </Button>
            </div>
            {brand.assets.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {brand.assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-secondary/50 transition-colors"
                  >
                    {asset.type === "image" && (
                      <div className="relative h-12 w-12 flex-shrink-0 rounded overflow-hidden bg-muted">
                        <Image
                          src={asset.url}
                          alt={asset.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{asset.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {asset.type.toUpperCase()}
                        {asset.size && ` · ${(asset.size / 1024).toFixed(0)} KB`}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-lg">
                <Upload className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhum asset enviado ainda</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Faça upload de logos, imagens e brandbooks
                </p>
                <Button asChild className="mt-4" size="sm">
                  <Link href={`/client/brands/${brand.id}/assets`}>
                    Fazer Upload
                  </Link>
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Projects */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Projetos ({brand.projects.length})</h2>
            <div className="space-y-3">
              {brand.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/client/projects/${project.id}`}
                  className="block rounded-lg border border-border p-3 hover:bg-secondary/50 transition-colors"
                >
                  <p className="font-medium text-sm">{project.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {project._count.creatives} criativos
                  </p>
                </Link>
              ))}
              {brand.projects.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum projeto ainda
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
