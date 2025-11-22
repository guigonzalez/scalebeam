"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Upload, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const PLATFORMS = [
  { id: "facebook", name: "Facebook" },
  { id: "instagram", name: "Instagram" },
  { id: "google", name: "Google Ads" },
  { id: "tiktok", name: "TikTok" },
  { id: "linkedin", name: "LinkedIn" },
  { id: "youtube", name: "YouTube" },
]

const FORMATS = [
  { id: "feed", name: "Feed (1080x1080)" },
  { id: "stories", name: "Stories (1080x1920)" },
  { id: "banner", name: "Banner (1200x628)" },
  { id: "carrossel", name: "Carrossel" },
  { id: "video", name: "Vídeo" },
  { id: "display", name: "Display Ads" },
]

interface Brand {
  id: string
  name: string
}

export default function NewTemplatePage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState("")
  const [projectName, setProjectName] = useState("")
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [keyVisualFile, setKeyVisualFile] = useState<File | null>(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedFormats, setSelectedFormats] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Fetch brands
    fetch('/api/client/brands')
      .then(res => res.json())
      .then(data => setBrands(data))
      .catch(console.error)
  }, [])

  const handleSubmit = async () => {
    // Validações
    if (!projectName.trim()) {
      toast.error("Por favor, insira o nome do projeto")
      return
    }
    if (!selectedBrandId) {
      toast.error("Por favor, selecione uma marca")
      return
    }
    if (!templateName.trim()) {
      toast.error("Por favor, insira o nome do template")
      return
    }
    if (!keyVisualFile) {
      toast.error("Por favor, faça upload do Key Visual")
      return
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Por favor, selecione pelo menos uma plataforma")
      return
    }
    if (selectedFormats.length === 0) {
      toast.error("Por favor, selecione pelo menos um formato")
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Upload do Key Visual
      let keyVisualUrl = null
      const FILE_SIZE_LIMIT = 4 * 1024 * 1024 // 4MB

      if (keyVisualFile.size > FILE_SIZE_LIMIT) {
        // Upload direto para arquivos grandes
        const signedUrlResponse = await fetch(
          `/api/brands/${selectedBrandId}/assets/signed-upload`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: keyVisualFile.name,
              fileType: keyVisualFile.type,
              fileSize: keyVisualFile.size,
            }),
          }
        )

        if (!signedUrlResponse.ok) {
          throw new Error("Erro ao preparar upload do Key Visual")
        }

        const { uploadUrl, path } = await signedUrlResponse.json()

        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: keyVisualFile,
          headers: {
            "Content-Type": keyVisualFile.type,
            "x-upsert": "true",
          },
        })

        if (!uploadResponse.ok) {
          throw new Error("Erro ao fazer upload do Key Visual")
        }

        const confirmResponse = await fetch(
          `/api/brands/${selectedBrandId}/assets/confirm`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              path,
              fileName: keyVisualFile.name,
              fileType: keyVisualFile.type,
              fileSize: keyVisualFile.size,
            }),
          }
        )

        if (!confirmResponse.ok) {
          throw new Error("Erro ao registrar Key Visual")
        }

        const confirmData = await confirmResponse.json()
        keyVisualUrl = confirmData.url
      } else {
        // Upload tradicional para arquivos pequenos
        const kvFormData = new FormData()
        kvFormData.append("file", keyVisualFile)
        kvFormData.append("bucket", "assets")
        kvFormData.append("folder", `${selectedBrandId}/key-visuals`)

        const kvUploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: kvFormData,
        })

        if (!kvUploadResponse.ok) {
          throw new Error("Falha ao fazer upload do Key Visual")
        }

        const kvUploadData = await kvUploadResponse.json()
        keyVisualUrl = kvUploadData.url
      }

      // 2. Criar projeto de criação de template
      const projectData = {
        name: projectName,
        brandId: selectedBrandId,
        templateId: null, // Não tem template ainda - vai criar um novo
        estimatedCreatives: 0, // Templates não têm criativos estimados
        newTemplateRequest: {
          name: templateName,
          description: templateDescription || null,
          keyVisualUrl,
          platforms: selectedPlatforms,
          formats: selectedFormats,
        },
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
        throw new Error(errorData.error || "Falha ao criar solicitação de template")
      }

      const { project } = await projectResponse.json()

      toast.success("Solicitação de template criada com sucesso!", {
        description: "Nossa equipe analisará o Key Visual e criará o template para aprovação.",
      })

      // Redirecionar para a página do projeto
      setTimeout(() => {
        window.location.href = `/client/projects/${project.id}`
      }, 1500)
    } catch (error: any) {
      console.error("Error creating template request:", error)
      toast.error(error.message || "Erro ao criar solicitação de template")
      setIsSubmitting(false)
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
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Solicitar Novo Template</h1>
          <p className="text-muted-foreground mt-1">
            Envie um Key Visual para criar um novo template personalizado
          </p>
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
                  placeholder="Ex: Solicitação Template Black Friday 2024"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nome interno para identificar esta solicitação
                </p>
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
            </div>
          </Card>

          {/* Template Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Detalhes do Template</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Nome do Template *
                </label>
                <Input
                  placeholder="Ex: Banner Verão 2024"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Descrição (opcional)
                </label>
                <Textarea
                  placeholder="Descreva o estilo, propósito ou características deste template..."
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  rows={3}
                />
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
                    PNG, JPG ou PDF até 50MB
                  </p>
                  {keyVisualFile && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Tamanho: {(keyVisualFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
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
          </Card>

          {/* Platforms & Formats */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Especificações do Template</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Plataformas * - Onde os criativos serão veiculados
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PLATFORMS.map((platform) => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => {
                        setSelectedPlatforms(prev =>
                          prev.includes(platform.id)
                            ? prev.filter(p => p !== platform.id)
                            : [...prev, platform.id]
                        )
                      }}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        selectedPlatforms.includes(platform.id)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {platform.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Formatos * - Dimensões e tipos de criativos
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FORMATS.map((format) => (
                    <button
                      key={format.id}
                      type="button"
                      onClick={() => {
                        setSelectedFormats(prev =>
                          prev.includes(format.id)
                            ? prev.filter(f => f !== format.id)
                            : [...prev, format.id]
                        )
                      }}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        selectedFormats.includes(format.id)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {format.name}
                    </button>
                  ))}
                </div>
              </div>
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
                <span className="text-muted-foreground">Template:</span>
                <span className="font-medium">{templateName || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Key Visual:</span>
                <span className="font-medium">{keyVisualFile ? "Anexado" : "Pendente"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plataformas:</span>
                <span className="font-medium">{selectedPlatforms.length || "0"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Formatos:</span>
                <span className="font-medium">{selectedFormats.length || "0"}</span>
              </div>
            </div>

            <div className="border-t border-border my-4"></div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>ℹ️ Processo:</strong> Após o envio, nossa equipe analisará o Key Visual e criará
                o template personalizado. Você receberá uma notificação quando estiver pronto para aprovação.
              </p>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enviando solicitação..." : "Solicitar Template"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                asChild
              >
                <Link href="/client/projects">Cancelar</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
