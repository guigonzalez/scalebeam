"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, ArrowLeft, Plus, CheckCircle2, Eye } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { Lightbox } from "@/components/lightbox"

interface Template {
  id: string
  name: string
  description: string | null
  imageUrl: string
  category: string | null
}

interface Brand {
  id: string
  name: string
}

export default function NewProjectPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState("")
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [requestNewTemplate, setRequestNewTemplate] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [totalCreatives, setTotalCreatives] = useState("")
  const [briefingFile, setBriefingFile] = useState<File | null>(null)
  const [keyVisualFile, setKeyVisualFile] = useState<File | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    // Fetch brands
    fetch('/api/client/brands')
      .then(res => res.json())
      .then(data => setBrands(data))
      .catch(console.error)
  }, [])

  useEffect(() => {
    // Fetch templates when brand is selected
    if (selectedBrandId) {
      fetch(`/api/templates?brandId=${selectedBrandId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setTemplates(data)
          } else {
            setTemplates([])
          }
        })
        .catch(console.error)
    } else {
      setTemplates([])
    }
  }, [selectedBrandId])

  const handleSubmit = () => {
    if (!projectName.trim()) {
      toast.error("Por favor, insira o nome do projeto")
      return
    }
    if (!selectedBrandId) {
      toast.error("Por favor, selecione uma marca")
      return
    }
    if (!totalCreatives || parseInt(totalCreatives) <= 0) {
      toast.error("Por favor, insira o total de criativos")
      return
    }
    if (!requestNewTemplate && !selectedTemplateId) {
      toast.error("Por favor, selecione um template ou solicite um novo")
      return
    }
    if (requestNewTemplate && !keyVisualFile) {
      toast.error("Por favor, faça upload do Key Visual para o novo template")
      return
    }

    toast.success("Projeto criado com sucesso!", {
      description: requestNewTemplate
        ? "O projeto foi criado e a equipe UXER está desenvolvendo o novo template."
        : "A equipe UXER foi notificada e começará o trabalho em breve.",
    })

    setTimeout(() => {
      window.location.href = "/client"
    }, 2000)
  }

  return (
    <div className="flex flex-col gap-6 p-8 max-w-6xl">
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Informações Básicas</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Nome do Projeto *</label>
                <Input
                  placeholder="Ex: Campanha Black Friday 2024"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Marca *</label>
                <select
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
                  value={selectedBrandId}
                  onChange={(e) => setSelectedBrandId(e.target.value)}
                >
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
                  Total de Criativos do Projeto *
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 50"
                  value={totalCreatives}
                  onChange={(e) => setTotalCreatives(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Informe o número total de criativos que serão gerados neste projeto
                </p>
              </div>
            </div>
          </Card>

          {/* Template Selection */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Template *</h2>
              <Button
                variant={requestNewTemplate ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setRequestNewTemplate(!requestNewTemplate)
                  if (!requestNewTemplate) {
                    setSelectedTemplateId(null)
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                {requestNewTemplate ? "Cancelar Novo Template" : "Solicitar Novo Template"}
              </Button>
            </div>

            {!requestNewTemplate ? (
              <>
                {templates.length === 0 && selectedBrandId && (
                  <div className="p-8 text-center border-2 border-dashed border-border rounded-lg">
                    <p className="text-muted-foreground">
                      Nenhum template encontrado para esta marca.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Você pode solicitar um novo template clicando no botão acima.
                    </p>
                  </div>
                )}
                {templates.length === 0 && !selectedBrandId && (
                  <div className="p-8 text-center border-2 border-dashed border-border rounded-lg">
                    <p className="text-muted-foreground">
                      Selecione uma marca para ver os templates disponíveis.
                    </p>
                  </div>
                )}
                {templates.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {templates.map((template, index) => (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplateId(template.id)}
                        className={`group relative overflow-hidden rounded-lg border-2 transition-all cursor-pointer ${
                          selectedTemplateId === template.id
                            ? "border-primary ring-2 ring-primary ring-offset-2"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="relative h-32">
                          <Image
                            src={template.imageUrl}
                            alt={template.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                setLightboxIndex(index)
                                setLightboxOpen(true)
                              }}
                            >
                              <Eye className="h-6 w-6" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-3 bg-card">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">{template.name}</p>
                              {template.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {template.description}
                                </p>
                              )}
                            </div>
                            {selectedTemplateId === template.id && (
                              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    Ao solicitar um novo template, um projeto separado será criado para a equipe UXER desenvolver o template baseado no seu Key Visual. Após aprovação, você poderá usar esse template em projetos futuros.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Nome do Novo Template
                  </label>
                  <Input placeholder="Ex: Banner Verão 2024" />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Key Visual (KV) * - Referência visual da campanha
                  </label>
                  <div
                    className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-secondary/20 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('kv-upload')?.click()}
                  >
                    <Upload className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium mb-1">
                      {keyVisualFile ? keyVisualFile.name : "Arraste o Key Visual aqui ou clique para selecionar"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG ou PDF até 10MB
                    </p>
                    <input
                      id="kv-upload"
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => setKeyVisualFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Briefing Upload */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Briefing (CSV) <span className="text-muted-foreground text-sm font-normal">(opcional)</span>
            </h2>
            <div
              className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-secondary/20 transition-colors cursor-pointer"
              onClick={() => document.getElementById('csv-upload')?.click()}
            >
              <Upload className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium mb-1">
                {briefingFile ? briefingFile.name : "Arraste um arquivo CSV aqui ou clique para selecionar"}
              </p>
              <p className="text-xs text-muted-foreground">
                O CSV deve conter colunas como: produto, headline, cta, preço, etc.
              </p>
              <input
                id="csv-upload"
                type="file"
                className="hidden"
                accept=".csv"
                onChange={(e) => setBriefingFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Formato do CSV:</strong>
              </p>
              <pre className="text-xs bg-background p-3 rounded border border-border overflow-x-auto">
{`product,headline,cta,price
Produto A,Promoção Especial,Compre Agora,R$ 99
Produto B,Oferta Limitada,Saiba Mais,R$ 149`}
              </pre>
            </div>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          <Card className="p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Resumo</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Projeto:</span>
                <span className="font-medium">{projectName || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Marca:</span>
                <span className="font-medium">
                  {brands.find(b => b.id === selectedBrandId)?.name || "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Criativos:</span>
                <span className="font-medium">{totalCreatives || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Template:</span>
                <span className="font-medium">
                  {requestNewTemplate
                    ? "Novo Template (aguardando KV)"
                    : selectedTemplateId
                      ? templates.find(t => t.id === selectedTemplateId)?.name
                      : "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Briefing:</span>
                <span className="font-medium">{briefingFile ? "Anexado" : "Sem anexo"}</span>
              </div>
            </div>

            <div className="border-t border-border my-4"></div>

            <div className="space-y-2">
              <Button className="w-full" onClick={handleSubmit}>
                Criar Projeto
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/client">Cancelar</Link>
              </Button>
            </div>
          </Card>

          <Card className="p-4 bg-primary/10 border-primary/20">
            <p className="text-xs text-muted-foreground">
              <strong>Nota:</strong> Após criar o projeto, a equipe UXER será notificada e começará a trabalhar nos criativos. Você receberá uma notificação quando estiverem prontos para aprovação.
            </p>
          </Card>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && templates.length > 0 && (
        <Lightbox
          images={templates.map(t => ({
            url: t.imageUrl,
            name: t.name,
            alt: t.description || t.name
          }))}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNext={() => setLightboxIndex((prev) => Math.min(prev + 1, templates.length - 1))}
          onPrevious={() => setLightboxIndex((prev) => Math.max(prev - 1, 0))}
          showNavigation={true}
        />
      )}
    </div>
  )
}
