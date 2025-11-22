"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eye, Download, FileText } from "lucide-react"
import Image from "next/image"

interface AssetPreviewModalProps {
  asset: {
    id: string
    name: string
    url: string
    type: string
  }
}

export function AssetPreviewModal({ asset }: AssetPreviewModalProps) {
  const [open, setOpen] = useState(false)

  const handleDownload = async () => {
    try {
      const response = await fetch(asset.url)
      if (!response.ok) throw new Error("Falha ao baixar arquivo")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = asset.name
      document.body.appendChild(link)
      link.click()

      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading:", error)
    }
  }

  const isImage = asset.type.startsWith("image/")
  const isPDF = asset.type === "application/pdf"
  const isVideo = asset.type.startsWith("video/")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Visualizar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{asset.name}</DialogTitle>
          <DialogDescription>
            {isImage && "Imagem"}
            {isPDF && "Documento PDF"}
            {isVideo && "Vídeo"}
            {!isImage && !isPDF && !isVideo && "Arquivo"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {/* Preview de Imagem */}
          {isImage && (
            <div className="relative w-full h-[500px] bg-muted rounded-lg">
              <Image
                src={asset.url}
                alt={asset.name}
                fill
                className="object-contain"
              />
            </div>
          )}

          {/* Preview de PDF */}
          {isPDF && (
            <div className="w-full h-[600px] rounded-lg overflow-hidden border border-border">
              <iframe
                src={`${asset.url}#view=FitH`}
                className="w-full h-full"
                title={asset.name}
              />
            </div>
          )}

          {/* Preview de Vídeo */}
          {isVideo && (
            <div className="w-full rounded-lg overflow-hidden bg-black">
              <video
                src={asset.url}
                controls
                className="w-full h-auto max-h-[600px]"
              >
                Seu navegador não suporta o elemento de vídeo.
              </video>
            </div>
          )}

          {/* Fallback para outros tipos */}
          {!isImage && !isPDF && !isVideo && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Preview não disponível</p>
              <p className="text-sm text-muted-foreground mb-6">
                Faça o download do arquivo para visualizá-lo
              </p>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </div>

        {/* Footer com botão de download */}
        {(isImage || isPDF || isVideo) && (
          <div className="flex justify-end pt-4 border-t border-border">
            <Button onClick={handleDownload} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Baixar Arquivo
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
