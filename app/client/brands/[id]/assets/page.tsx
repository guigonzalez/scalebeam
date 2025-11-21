import { prisma } from "@/lib/prisma"
import { auth, signOut } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut, Download, Trash2, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { formatFileSize } from "@/lib/constants"
import { UploadAssetModal } from "@/components/upload-asset-modal"
import { DeleteAssetButton } from "@/components/delete-asset-button"

export const dynamic = "force-dynamic"

async function getBrandAssets(brandId: string, organizationIds: string[]) {
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
      assets: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })

  if (!brand) {
    return null
  }

  // Verificar acesso
  if (!organizationIds.includes(brand.organization.id)) {
    return null
  }

  return brand
}

export default async function BrandAssetsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "CLIENT") {
    redirect("/admin")
  }

  const { id } = await params
  const brand = await getBrandAssets(id, session.user.organizationIds)

  if (!brand) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* User Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">
            <Link href={`/client/brands/${brand.id}`} className="hover:underline">
              {brand.name}
            </Link>
            {" / Assets"}
          </h2>
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
          <h1 className="text-3xl font-semibold tracking-tight">Assets da Marca</h1>
          <p className="text-muted-foreground mt-1">
            {brand.assets.length} arquivo(s)
          </p>
        </div>
        <UploadAssetModal brandId={brand.id} brandName={brand.name} />
      </div>

      {/* Assets Grid */}
      {brand.assets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {brand.assets.map((asset) => (
            <Card key={asset.id} className="p-4">
              <div className="relative h-48 w-full mb-4 rounded-lg overflow-hidden bg-muted">
                {asset.type.startsWith("image/") && asset.url ? (
                  <Image
                    src={asset.url}
                    alt={asset.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              <h3 className="font-medium mb-1 truncate">{asset.name}</h3>
              <p className="text-xs text-muted-foreground mb-4">
                {asset.size ? formatFileSize(asset.size) : "Tamanho desconhecido"}
              </p>

              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <a href={asset.url} download target="_blank" rel="noopener">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                <DeleteAssetButton
                  brandId={brand.id}
                  assetId={asset.id}
                  assetName={asset.name}
                />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Nenhum asset ainda</p>
            <p className="text-sm text-muted-foreground mb-4">
              Faça upload de logos, fotos e outros arquivos da sua marca
            </p>
            <UploadAssetModal brandId={brand.id} brandName={brand.name} />
          </div>
        </Card>
      )}
    </div>
  )
}
