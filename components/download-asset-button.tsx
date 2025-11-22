"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { toast } from "sonner"

interface DownloadAssetButtonProps {
  assetName: string
  assetUrl: string
}

export function DownloadAssetButton({
  assetName,
  assetUrl,
}: DownloadAssetButtonProps) {
  const handleDownload = async () => {
    try {
      // Fetch the file as a blob
      const response = await fetch(assetUrl)
      if (!response.ok) throw new Error("Falha ao baixar arquivo")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      // Create temporary link and trigger download
      const link = document.createElement("a")
      link.href = url
      link.download = assetName
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success("Download iniciado!", {
        description: `${assetName} será baixado em instantes.`,
      })
    } catch (error: any) {
      toast.error("Erro ao baixar arquivo", {
        description: error.message,
      })
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload}>
      <Download className="h-4 w-4" />
    </Button>
  )
}

interface DownloadBriefingButtonProps {
  projectName: string
  briefingUrl: string
}

export function DownloadBriefingButton({ projectName, briefingUrl }: DownloadBriefingButtonProps) {
  const handleDownload = async () => {
    try {
      // Fetch the file as a blob
      const response = await fetch(briefingUrl)
      if (!response.ok) throw new Error("Falha ao baixar briefing")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      // Extract filename from URL or use default
      const urlParts = briefingUrl.split("/")
      const filename = urlParts[urlParts.length - 1] || `briefing-${projectName}`

      // Create temporary link and trigger download
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success("Download do briefing iniciado!", {
        description: `O briefing de ${projectName} será baixado em instantes.`,
      })
    } catch (error: any) {
      toast.error("Erro ao baixar briefing", {
        description: error.message,
      })
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload}>
      <Download className="h-4 w-4 mr-2" />
      Download Briefing
    </Button>
  )
}
