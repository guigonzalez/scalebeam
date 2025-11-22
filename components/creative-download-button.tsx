"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { toast } from "sonner"

interface CreativeDownloadButtonProps {
  creativeId: string
  creativeName: string
  creativeUrl: string
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  showText?: boolean
}

export function CreativeDownloadButton({
  creativeId,
  creativeName,
  creativeUrl,
  variant = "secondary",
  size = "sm",
  showText = false,
}: CreativeDownloadButtonProps) {
  const handleDownload = async () => {
    try {
      // Fetch the file as a blob
      const response = await fetch(creativeUrl)
      if (!response.ok) throw new Error("Falha ao baixar criativo")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      // Create temporary link and trigger download
      const link = document.createElement("a")
      link.href = url
      link.download = creativeName
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success("Download iniciado!", {
        description: `${creativeName} será baixado em instantes.`,
      })
    } catch (error: any) {
      toast.error("Erro ao baixar criativo", {
        description: error.message,
      })
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleDownload}>
      <Download className="h-4 w-4" />
      {showText && <span className="ml-2">Download</span>}
    </Button>
  )
}

interface DownloadAllButtonProps {
  projectId: string
  projectName: string
  creativesCount: number
}

export function DownloadAllButton({
  projectId,
  projectName,
  creativesCount,
}: DownloadAllButtonProps) {
  const handleDownloadAll = async () => {
    try {
      // Fetch all creatives for this project
      const response = await fetch(`/api/projects/${projectId}/creatives`)
      if (!response.ok) throw new Error("Falha ao buscar criativos")

      const data = await response.json()
      const creatives = data.creatives || []

      if (creatives.length === 0) {
        toast.error("Nenhum criativo para baixar")
        return
      }

      // Download each creative sequentially
      toast.loading(`Baixando ${creatives.length} criativo(s)...`, { id: "download-all" })

      for (let i = 0; i < creatives.length; i++) {
        const creative = creatives[i]

        try {
          const fileResponse = await fetch(creative.url)
          if (!fileResponse.ok) continue

          const blob = await fileResponse.blob()
          const url = window.URL.createObjectURL(blob)

          const link = document.createElement("a")
          link.href = url
          link.download = creative.name
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)

          // Small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          console.error(`Failed to download ${creative.name}:`, error)
        }
      }

      toast.success("Download concluído!", { id: "download-all" })
    } catch (error: any) {
      toast.error("Erro ao baixar criativos", {
        id: "download-all",
        description: error.message,
      })
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownloadAll}>
      <Download className="h-4 w-4 mr-2" />
      Baixar Todos
    </Button>
  )
}
