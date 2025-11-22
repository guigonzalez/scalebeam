"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CheckCircle2, Play } from "lucide-react"
import { toast } from "sonner"

interface ProjectStatusChangeProps {
  projectId: string
  projectName: string
  currentStatus: string
}

export function ProjectStatusChange({
  projectId,
  projectName,
  currentStatus,
}: ProjectStatusChangeProps) {
  const [isChanging, setIsChanging] = useState(false)

  const handleMarkAsReady = async () => {
    setIsChanging(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "READY",
          comment: `Projeto marcado como pronto pelo admin`,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Falha ao atualizar status")
      }

      toast.success("Projeto marcado como pronto!", {
        description: `${projectName} está agora disponível para aprovação do cliente.`,
      })

      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error: any) {
      toast.error("Erro ao atualizar status", {
        description: error.message,
      })
      setIsChanging(false)
    }
  }

  const handleStartProduction = async () => {
    setIsChanging(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "IN_PRODUCTION",
          comment: `Projeto iniciado em produção pelo admin`,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Falha ao atualizar status")
      }

      toast.success("Projeto iniciado!", {
        description: `${projectName} está agora em produção.`,
      })

      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error: any) {
      toast.error("Erro ao atualizar status", {
        description: error.message,
      })
      setIsChanging(false)
    }
  }

  if (currentStatus === "APPROVED") {
    return null
  }

  if (currentStatus === "DRAFT" || currentStatus === "REVISION") {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="default">
            <Play className="h-4 w-4 mr-2" />
            Iniciar Produção
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Iniciar Produção</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a mover este projeto para produção.
              Isso sinalizará que a equipe UXER está trabalhando nos criativos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button onClick={handleStartProduction} disabled={isChanging}>
              {isChanging ? "Iniciando..." : "Confirmar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  if (currentStatus === "IN_PRODUCTION") {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="default">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Marcar como Pronto
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como Pronto</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a marcar este projeto como pronto para aprovação.
              O cliente será notificado e poderá revisar os criativos entregues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button onClick={handleMarkAsReady} disabled={isChanging}>
              {isChanging ? "Processando..." : "Confirmar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return null
}
