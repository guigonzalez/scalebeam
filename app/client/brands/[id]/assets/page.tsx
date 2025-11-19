import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileImage, FileText, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function UploadAssetsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const brand = await prisma.brand.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
    },
  })

  if (!brand) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6 p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/client/brands/${brand.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Upload de Assets</h1>
          <p className="text-muted-foreground mt-1">{brand.name}</p>
        </div>
      </div>

      {/* Upload Instructions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-3">Tipos de Assets Recomendados</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
            <FileImage className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Logos</p>
              <p className="text-xs text-muted-foreground">PNG, SVG (transparente)</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
            <FileImage className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Imagens</p>
              <p className="text-xs text-muted-foreground">JPG, PNG (produtos, team)</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Brandbook</p>
              <p className="text-xs text-muted-foreground">PDF (manual da marca)</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Upload Area - MOCKADO */}
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-12 text-center hover:bg-secondary/20 transition-colors cursor-pointer">
          <Upload className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Arraste arquivos aqui ou clique para selecionar</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Suporta: PNG, JPG, SVG, PDF (máximo 10MB por arquivo)
          </p>
          <Button>
            Selecionar Arquivos
          </Button>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Nota:</strong> Esta é uma interface mockada. Em produção, o upload seria processado e armazenado no servidor.
          </p>
        </div>
      </Card>

      {/* Guidelines */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-3">Diretrizes de Upload</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Logos devem ser em alta resolução e com fundo transparente quando possível</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Imagens de produtos devem ter boa iluminação e fundo limpo</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Brandbook deve incluir paleta de cores, tipografia e tom de voz</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Nomeie os arquivos de forma descritiva (ex: logo-principal.png)</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
