"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Upload } from "lucide-react"
import { toast } from "sonner"

interface UploadCreativesModalProps {
  projectId: string
  projectName: string
}

export function UploadCreativesModal({
  projectId,
  projectName,
}: UploadCreativesModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error("Por favor, selecione pelo menos um arquivo")
      return
    }

    setIsUploading(true)

    try {
      const uploadedCreatives: any[] = []

      // Upload each file to Supabase Storage
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]

        const formData = new FormData()
        formData.append("file", file)
        formData.append("bucket", "creatives")
        formData.append("folder", projectId)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json()
          throw new Error(error.error || `Falha ao fazer upload de ${file.name}`)
        }

        const uploadData = await uploadResponse.json()

        // Determine format based on MIME type
        let format = "IMAGE"
        if (file.type.startsWith("video/")) {
          format = "VIDEO"
        }

        uploadedCreatives.push({
          name: uploadData.originalName,
          url: uploadData.url,
          format,
          thumbnailUrl: file.type.startsWith("image/") ? uploadData.url : null,
        })
      }

      // Register all creatives in the database
      const creativesResponse = await fetch(`/api/projects/${projectId}/creatives`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creatives: uploadedCreatives,
        }),
      })

      if (!creativesResponse.ok) {
        const error = await creativesResponse.json()
        throw new Error(error.error || "Falha ao registrar criativos")
      }

      toast.success(`${uploadedCreatives.length} criativo(s) adicionado(s) com sucesso!`)

      setIsUploading(false)
      setIsOpen(false)
      setSelectedFiles(null)

      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error: any) {
      toast.error("Erro ao fazer upload", {
        description: error.message,
      })
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Fazer Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload de Criativos</DialogTitle>
          <DialogDescription>
            Faça upload dos criativos finalizados para o projeto &quot;{projectName}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Selecione os arquivos
            </label>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-secondary/20 transition-colors">
              <Upload className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium mb-1">
                Arraste arquivos aqui ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Formatos aceitos: JPG, PNG, MP4, GIF
              </p>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => setSelectedFiles(e.target.files)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" size="sm" asChild>
                  <span>Selecionar Arquivos</span>
                </Button>
              </label>
            </div>
          </div>

          {selectedFiles && selectedFiles.length > 0 && (
            <div className="rounded-lg border border-border p-4 bg-muted">
              <p className="text-sm font-medium mb-2">
                {selectedFiles.length} arquivo(s) selecionado(s):
              </p>
              <ul className="space-y-1">
                {Array.from(selectedFiles).slice(0, 5).map((file, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground">
                    • {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </li>
                ))}
                {selectedFiles.length > 5 && (
                  <li className="text-xs text-muted-foreground">
                    ... e mais {selectedFiles.length - 5} arquivo(s)
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false)
              setSelectedFiles(null)
            }}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || !selectedFiles || selectedFiles.length === 0}
          >
            {isUploading ? "Enviando..." : "Fazer Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
