"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Upload, FileImage } from "lucide-react"
import Image from "next/image"

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
  organization: {
    name: string
  }
}

interface AdminTemplateModalProps {
  mode: "create" | "edit"
  template?: any
  brands?: Brand[]
  children: React.ReactNode
}

export function AdminTemplateModal({
  mode,
  template,
  brands = [],
  children,
}: AdminTemplateModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(template?.imageUrl || "")
  const [formData, setFormData] = useState({
    name: template?.name || "",
    description: template?.description || "",
    brandId: template?.brandId || "",
    category: template?.category || "",
    templateStatus: template?.templateStatus || "APPROVED",
    isActive: template?.isActive ?? true,
    platforms: template?.platforms ? JSON.parse(template.platforms) : [],
    formats: template?.formats ? JSON.parse(template.formats) : [],
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const togglePlatform = (platformId: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter((p: string) => p !== platformId)
        : [...prev.platforms, platformId],
    }))
  }

  const toggleFormat = (formatId: string) => {
    setFormData((prev) => ({
      ...prev,
      formats: prev.formats.includes(formatId)
        ? prev.formats.filter((f: string) => f !== formatId)
        : [...prev.formats, formatId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let imageUrl = template?.imageUrl || ""

      // Upload da imagem se houver
      if (imageFile) {
        const uploadFormData = new FormData()
        uploadFormData.append("file", imageFile)
        uploadFormData.append("bucket", "assets")
        uploadFormData.append("folder", `templates`)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          throw new Error("Falha ao fazer upload da imagem")
        }

        const uploadData = await uploadResponse.json()
        imageUrl = uploadData.url
      }

      const payload = {
        ...formData,
        imageUrl,
        platforms: JSON.stringify(formData.platforms),
        formats: JSON.stringify(formData.formats),
      }

      const url =
        mode === "create"
          ? "/api/admin/templates"
          : `/api/admin/templates/${template.id}`
      const method = mode === "create" ? "POST" : "PATCH"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Falha ao salvar")
      }

      toast.success(
        mode === "create" ? "Template criado!" : "Template atualizado!"
      )
      setOpen(false)
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Criar Template" : "Editar Template"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Adicione um novo template para os clientes"
              : `Atualizar template "${template?.name}"`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Imagem */}
            <div className="grid gap-2">
              <Label>Imagem do Template *</Label>
              <div
                className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:bg-secondary/20 transition-colors"
                onClick={() => document.getElementById("template-image")?.click()}
              >
                {imagePreview ? (
                  <div className="relative w-full h-48">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-contain rounded"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                    <FileImage className="h-12 w-12 mb-2" />
                    <p className="text-sm">Clique para selecionar imagem</p>
                    <p className="text-xs">PNG, JPG até 10MB</p>
                  </div>
                )}
                <input
                  id="template-image"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
            </div>

            {/* Nome */}
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Template *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Banner Verão 2024"
                required
              />
            </div>

            {/* Descrição */}
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descreva o estilo e propósito do template..."
                rows={3}
              />
            </div>

            {/* Marca */}
            {mode === "create" && (
              <div className="grid gap-2">
                <Label htmlFor="brandId">Marca *</Label>
                <select
                  id="brandId"
                  className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                  value={formData.brandId}
                  onChange={(e) =>
                    setFormData({ ...formData, brandId: e.target.value })
                  }
                  required
                >
                  <option value="">Selecione uma marca</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name} - {brand.organization.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Categoria */}
            <div className="grid gap-2">
              <Label htmlFor="category">Categoria</Label>
              <select
                id="category"
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                <option value="">Sem categoria</option>
                <option value="feed">Feed</option>
                <option value="stories">Stories</option>
                <option value="banner">Banner</option>
                <option value="carrossel">Carrossel</option>
                <option value="video">Vídeo</option>
                <option value="display">Display</option>
              </select>
            </div>

            {/* Plataformas */}
            <div className="grid gap-2">
              <Label>Plataformas</Label>
              <div className="grid grid-cols-3 gap-2">
                {PLATFORMS.map((platform) => (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => togglePlatform(platform.id)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.platforms.includes(platform.id)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {platform.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Formatos */}
            <div className="grid gap-2">
              <Label>Formatos</Label>
              <div className="grid grid-cols-2 gap-2">
                {FORMATS.map((format) => (
                  <button
                    key={format.id}
                    type="button"
                    onClick={() => toggleFormat(format.id)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.formats.includes(format.id)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {format.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="templateStatus">Status</Label>
              <select
                id="templateStatus"
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                value={formData.templateStatus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    templateStatus: e.target.value as any,
                  })
                }
              >
                <option value="PENDING_APPROVAL">Pendente</option>
                <option value="APPROVED">Aprovado</option>
                <option value="REJECTED">Rejeitado</option>
              </select>
            </div>

            {/* Ativo */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="isActive">Template ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Salvando..."
                : mode === "create"
                ? "Criar Template"
                : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
