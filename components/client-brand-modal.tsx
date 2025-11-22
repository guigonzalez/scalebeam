"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Upload } from "lucide-react"

interface ClientBrandModalProps {
  children: React.ReactNode
  organizationId: string
}

export function ClientBrandModal({ children, organizationId }: ClientBrandModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    toneOfVoice: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let logoUrl = ""

      // Upload logo if selected
      if (logoFile) {
        const uploadFormData = new FormData()
        uploadFormData.append("file", logoFile)
        uploadFormData.append("bucket", "assets")
        uploadFormData.append("folder", `brands/${organizationId}`)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          throw new Error("Falha ao fazer upload do logo")
        }

        const uploadData = await uploadResponse.json()
        logoUrl = uploadData.url
      }

      // Create brand
      const response = await fetch("/api/client/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          organizationId,
          logoUrl: logoUrl || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Falha ao criar marca")
      }

      toast.success("Marca criada com sucesso!")
      setOpen(false)

      // Reset form
      setFormData({
        name: "",
        toneOfVoice: "",
      })
      setLogoFile(null)

      // Reload page to show new brand
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      toast.error("Erro ao criar marca", {
        description: error.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Marca</DialogTitle>
          <DialogDescription>
            Crie uma nova marca para organizar seus projetos e assets
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Marca *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Minha Empresa LTDA"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="logo">Logo</Label>
              <div className="flex items-center gap-2">
                <input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="logo" className="flex-1">
                  <div className="flex items-center justify-center border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:bg-secondary/20 transition-colors">
                    <Upload className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {logoFile ? logoFile.name : "Clique para fazer upload do logo"}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="toneOfVoice">Tom de Voz</Label>
              <Textarea
                id="toneOfVoice"
                value={formData.toneOfVoice}
                onChange={(e) => setFormData({ ...formData, toneOfVoice: e.target.value })}
                placeholder="Ex: Profissional, amigável, descontraído..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Descreva como sua marca se comunica com o público
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar Marca"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
