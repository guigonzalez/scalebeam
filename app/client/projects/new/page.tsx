import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, ArrowLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

const CLIENT_ORG_ID = "Tech Startup Inc"

async function getClientBrands() {
  const organization = await prisma.organization.findFirst({
    where: { name: CLIENT_ORG_ID },
    include: {
      brands: true,
    },
  })

  return organization?.brands || []
}

export default async function NewProjectPage() {
  const brands = await getClientBrands()

  return (
    <div className="flex flex-col gap-6 p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/client">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Novo Projeto</h1>
          <p className="text-muted-foreground mt-1">Crie um novo projeto de criativos</p>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Nome do Projeto</label>
            <Input placeholder="Ex: Campanha Black Friday 2024" />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Marca</label>
            <select className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm">
              <option value="">Selecione uma marca</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Quantidade Estimada de Criativos
            </label>
            <Input type="number" placeholder="Ex: 25" defaultValue="25" />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Briefing (CSV) <span className="text-muted-foreground">(opcional)</span>
            </label>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-secondary/20 transition-colors cursor-pointer">
              <Upload className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium mb-1">Arraste um arquivo CSV aqui ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground">
                O CSV deve conter colunas como: produto, headline, cta, preço, etc.
              </p>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>Formato do CSV:</strong>
            </p>
            <pre className="text-xs bg-background p-3 rounded border border-border overflow-x-auto">
{`product,headline,cta,price
Produto A,Promoção Especial,Compre Agora,R$ 99
Produto B,Oferta Limitada,Saiba Mais,R$ 149`}
            </pre>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" asChild>
          <Link href="/client">Cancelar</Link>
        </Button>
        <Button>Criar Projeto</Button>
      </div>

      {/* Note */}
      <Card className="p-4 bg-primary/10 border-primary/20">
        <p className="text-sm text-muted-foreground">
          <strong>Nota:</strong> Esta é uma interface mockada. Em produção, o projeto seria criado no banco de dados e a equipe UXER seria notificada para começar o trabalho.
        </p>
      </Card>
    </div>
  )
}
