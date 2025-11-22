"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, ArrowLeft, CheckCircle2, Eye, Sparkles, FileImage } from "lucide-react"
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
  templateStatus: string
}

interface Brand {
  id: string
  name: string
}

export default function NewCampaignPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState("")
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState("")
  const [totalCreatives, setTotalCreatives] = useState("")
  const [briefingFile, setBriefingFile] = useState<File | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingBriefing, setIsUploadingBriefing] = useState(false)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Fetch brands
    fetch('/api/client/brands')
      .then(res => res.json())
      .then(data => setBrands(data))
      .catch(console.error)
  }, [])

  useEffect(() => {
    // Fetch ONLY APPROVED templates when brand is selected
    if (selectedBrandId) {
      fetch(`/api/templates?brandId=${selectedBrandId}&status=APPROVED`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            // Filtrar apenas templates aprovados no client-side também
            setTemplates(data.filter((t: Template) => t.templateStatus === 'APPROVED'))
          } else {
            setTemplates([])
          }
        })
        .catch(console.error)
    } else {
      setTemplates([])
    }
  }, [selectedBrandId])

  const handleSubmit = async () => {
    // Validações
    if (!projectName.trim()) {
      toast.error("Por favor, insira o nome da campanha")
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
    if (!selectedTemplateId) {
      toast.error("Por favor, selecione um template aprovado")
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Upload de briefing (se houver)
      let briefingUrl = null
      if (briefingFile) {
        setIsUploadingBriefing(true)
        const formData = new FormData()
        formData.append("file", briefingFile)
        formData.append("bucket", "briefings")
        formData.append("folder", selectedBrandId)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error("Falha ao fazer upload do briefing")
        }

        const uploadData = await uploadResponse.json()
        briefingUrl = uploadData.url
        setIsUploadingBriefing(false)
      }

      // 2. Criar campanha
      const projectData = {
        name: projectName,
        brandId: selectedBrandId,
        templateId: selectedTemplateId,
        briefingUrl,
        estimatedCreatives: parseInt(totalCreatives),
      }

      const projectResponse = await fetch("/api/client/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      })

      if (!projectResponse.ok) {
        const errorData = await projectResponse.json()
        throw new Error(errorData.error || "Falha ao criar campanha")
      }

      const { project } = await projectResponse.json()

      toast.success("Campanha criada com sucesso!", {
        description: "Nossa IA ScaleBeam está processando sua solicitação e criará os criativos em breve.",
      })

      // Redirecionar para a página do projeto
      setTimeout(() => {
        window.location.href = `/client/projects/${project.id}`
      }, 1500)
    } catch (error: any) {
      console.error("Error creating campaign:", error)
      toast.error(error.message || "Erro ao criar campanha")
      setIsSubmitting(false)
      setIsUploadingBriefing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/client/projects">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold tracking-tight">Nova Campanha</h1>
          <p className="text-muted-foreground mt-1">Crie criativos a partir de um template aprovado</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/client/projects/new-template">
            <Sparkles className="h-4 w-4 mr-2" />
            Solicitar Novo Template
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Informações Básicas</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Nome da Campanha *</label>
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
                  Total de Criativos *
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 50"
                  value={totalCreatives}
                  onChange={(e) => setTotalCreatives(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Informe o número total de criativos que serão gerados nesta campanha
                </p>
              </div>
            </div>
          </Card>

          {/* Template Selection */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Template Aprovado *</h2>
            </div>

            {templates.length === 0 && selectedBrandId && (
              <div className="p-8 text-center border-2 border-dashed border-border rounded-lg">
                <p className="text-muted-foreground">
                  Nenhum template aprovado encontrado para esta marca.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Você precisa de um template aprovado para criar uma campanha.
                </p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/client/projects/new-template">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Solicitar Novo Template
                  </Link>
                </Button>
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
                    <div className="relative h-32 bg-muted">
                      {!imageErrors.has(template.id) && template.imageUrl ? (
                        <>
                          <Image
                            src={template.imageUrl}
                            alt={template.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            onError={() => {
                              setImageErrors(prev => new Set(prev).add(template.id))
                            }}
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
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                          <FileImage className="h-12 w-12 mb-2" />
                          <p className="text-xs">Preview indisponível</p>
                        </div>
                      )}
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
          </Card>

          {/* Briefing Upload */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Material de Briefing <span className="text-muted-foreground text-sm font-normal">(opcional)</span>
            </h2>
            <div
              className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-secondary/20 transition-colors cursor-pointer"
              onClick={() => document.getElementById('briefing-upload')?.click()}
            >
              <Upload className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium mb-1">
                {briefingFile ? briefingFile.name : "Arraste arquivos de briefing aqui ou clique para selecionar"}
              </p>
              <p className="text-xs text-muted-foreground">
                CSV, DOC, DOCX, PDF, imagens ou outros materiais de referência
              </p>
              <input
                id="briefing-upload"
                type="file"
                className="hidden"
                accept=".csv,.doc,.docx,.pdf,image/*"
                onChange={(e) => setBriefingFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>💡 Dica:</strong> Você pode enviar planilhas com dados de produtos, documentos de estratégia,
                imagens de referência ou qualquer material que ajude a IA a entender melhor a campanha.
              </p>
            </div>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          <Card className="p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Resumo</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Campanha:</span>
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
                  {selectedTemplateId
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
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    {isUploadingBriefing ? "Uploading briefing..." : "Criando campanha..."}
                  </>
                ) : (
                  "Criar Campanha"
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                asChild
                disabled={isSubmitting}
              >
                <Link href="/client/projects">Cancelar</Link>
              </Button>
            </div>
          </Card>

          <Card className="p-4 bg-primary/10 border-primary/20">
            <p className="text-xs text-muted-foreground">
              <strong>Nota:</strong> Após criar a campanha, nossa IA começará a gerar os criativos automaticamente baseados no template selecionado. Você será notificado quando estiverem prontos para aprovação.
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
