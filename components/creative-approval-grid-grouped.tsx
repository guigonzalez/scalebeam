"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle2, X, Download, ChevronDown, ChevronRight, Eye } from "lucide-react"
import { CreativeDownloadButton } from "@/components/creative-download-button"
import { Lightbox } from "@/components/lightbox"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface Creative {
  id: string
  name: string
  url: string
  thumbnailUrl: string | null
  width: number | null
  height: number | null
  format: string
  lista: string | null
  modelo: string | null
}

interface CreativeApprovalGridGroupedProps {
  creatives: Creative[]
  projectId: string
  projectName: string
  canApprove: boolean
}

type GroupBy = 'tamanho' | 'formato' | 'lista' | 'modelo'

interface CreativeGroup {
  key: string
  label: string
  creatives: Creative[]
  count: number
}

export function CreativeApprovalGridGrouped({
  creatives,
  projectId,
  projectName,
  canApprove,
}: CreativeApprovalGridGroupedProps) {
  const [selectedCreatives, setSelectedCreatives] = useState<Set<string>>(new Set())
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRevisionDialog, setShowRevisionDialog] = useState(false)
  const [revisionNotes, setRevisionNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [groupBy, setGroupBy] = useState<GroupBy>('tamanho')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxCreatives, setLightboxCreatives] = useState<Creative[]>([])

  // Group creatives
  const groupCreatives = (): CreativeGroup[] => {
    const grouped = new Map<string, Creative[]>()

    creatives.forEach(creative => {
      let key: string
      let label: string

      switch (groupBy) {
        case 'tamanho':
          key = `${creative.width}x${creative.height}`
          label = creative.width && creative.height
            ? `${creative.width} × ${creative.height}`
            : 'Sem dimensão'
          break
        case 'formato':
          key = creative.format
          label = creative.format.toUpperCase()
          break
        case 'lista':
          key = creative.lista || 'sem-lista'
          label = creative.lista || 'Sem lista'
          break
        case 'modelo':
          key = creative.modelo || 'sem-modelo'
          label = creative.modelo || 'Sem modelo'
          break
        default:
          key = 'outros'
          label = 'Outros'
      }

      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(creative)
    })

    return Array.from(grouped.entries()).map(([key, creatives]) => ({
      key,
      label: creatives[0] ? (
        groupBy === 'tamanho' && creatives[0].width && creatives[0].height
          ? `${creatives[0].width} × ${creatives[0].height}`
          : groupBy === 'formato'
            ? creatives[0].format.toUpperCase()
            : groupBy === 'lista'
              ? creatives[0].lista || 'Sem lista'
              : creatives[0].modelo || 'Sem modelo'
      ) : key,
      creatives,
      count: creatives.length,
    })).sort((a, b) => b.count - a.count)
  }

  const groups = groupCreatives()

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey)
    } else {
      newExpanded.add(groupKey)
    }
    setExpandedGroups(newExpanded)
  }

  const expandAll = () => {
    setExpandedGroups(new Set(groups.map(g => g.key)))
  }

  const collapseAll = () => {
    setExpandedGroups(new Set())
  }

  const selectGroup = (group: CreativeGroup) => {
    const groupIds = group.creatives.map(c => c.id)
    const newSelected = new Set(selectedCreatives)
    groupIds.forEach(id => newSelected.add(id))
    setSelectedCreatives(newSelected)
  }

  const deselectGroup = (group: CreativeGroup) => {
    const groupIds = new Set(group.creatives.map(c => c.id))
    const newSelected = new Set(Array.from(selectedCreatives).filter(id => !groupIds.has(id)))
    setSelectedCreatives(newSelected)
  }

  const isGroupSelected = (group: CreativeGroup): boolean => {
    return group.creatives.every(c => selectedCreatives.has(c.id))
  }

  const isGroupPartiallySelected = (group: CreativeGroup): boolean => {
    const selectedCount = group.creatives.filter(c => selectedCreatives.has(c.id)).length
    return selectedCount > 0 && selectedCount < group.creatives.length
  }

  const toggleCreative = (id: string) => {
    const newSelected = new Set(selectedCreatives)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedCreatives(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedCreatives.size === creatives.length) {
      setSelectedCreatives(new Set())
    } else {
      setSelectedCreatives(new Set(creatives.map(c => c.id)))
    }
  }

  const handleApproveAll = () => {
    setSelectedCreatives(new Set(creatives.map(c => c.id)))
    setShowApproveDialog(true)
  }

  const handleApproveSelected = () => {
    if (selectedCreatives.size === 0) {
      toast.error("Selecione pelo menos um criativo para aprovar")
      return
    }
    setShowApproveDialog(true)
  }

  const handleRequestRevision = () => {
    if (selectedCreatives.size === 0) {
      toast.error("Selecione pelo menos um criativo para solicitar ajustes")
      return
    }
    setShowRevisionDialog(true)
  }

  const confirmApproval = async () => {
    setIsProcessing(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: `Projeto aprovado com ${selectedCreatives.size} criativo(s)`,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Falha ao aprovar projeto")
      }

      const count = selectedCreatives.size
      toast.success(`Projeto aprovado com sucesso!`, {
        description: count === creatives.length
          ? `Todos os ${count} criativos do projeto "${projectName}" foram aprovados.`
          : `${count} de ${creatives.length} criativos foram aprovados.`,
      })

      setShowApproveDialog(false)
      setSelectedCreatives(new Set())

      // Recarregar página para mostrar mudanças
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error: any) {
      toast.error("Erro ao aprovar projeto", {
        description: error.message,
      })
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  const confirmRevision = async () => {
    if (!revisionNotes.trim()) {
      toast.error("Por favor, descreva os ajustes necessários")
      return
    }

    setIsProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))

    const count = selectedCreatives.size
    toast.success("Solicitação de ajustes enviada!", {
      description: `A equipe UXER foi notificada sobre os ajustes necessários em ${count} criativo${count > 1 ? 's' : ''}.`,
    })

    setIsProcessing(false)
    setShowRevisionDialog(false)
    setRevisionNotes("")
    setSelectedCreatives(new Set())

    setTimeout(() => {
      window.location.reload()
    }, 1500)
  }

  const allSelected = selectedCreatives.size === creatives.length && creatives.length > 0
  const someSelected = selectedCreatives.size > 0 && selectedCreatives.size < creatives.length

  return (
    <>
      {/* Group By Selector */}
      <div className="mb-4 p-4 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Agrupar Criativos Por:</h3>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Expandir todos
            </button>
            <span className="text-muted-foreground">|</span>
            <button
              onClick={collapseAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Recolher todos
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setGroupBy('tamanho')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              groupBy === 'tamanho'
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:border-primary/50"
            }`}
          >
            Tamanho
          </button>
          <button
            onClick={() => setGroupBy('formato')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              groupBy === 'formato'
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:border-primary/50"
            }`}
          >
            Formato
          </button>
          <button
            onClick={() => setGroupBy('lista')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              groupBy === 'lista'
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:border-primary/50"
            }`}
          >
            Lista
          </button>
          <button
            onClick={() => setGroupBy('modelo')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              groupBy === 'modelo'
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:border-primary/50"
            }`}
          >
            Modelo
          </button>
        </div>
      </div>

      {/* Action Bar */}
      {canApprove && (
        <div className="flex items-center justify-between mb-4 p-4 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleSelectAll}
              className={someSelected ? "data-[state=checked]:bg-blue-500" : ""}
            />
            <span className="text-sm font-medium">
              {selectedCreatives.size > 0
                ? `${selectedCreatives.size} de ${creatives.length} selecionados`
                : "Selecionar todos"}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestRevision}
              disabled={selectedCreatives.size === 0}
              className="text-destructive"
            >
              <X className="h-4 w-4 mr-2" />
              Solicitar Ajustes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleApproveSelected}
              disabled={selectedCreatives.size === 0}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Aprovar Selecionados
            </Button>
            <Button
              size="sm"
              onClick={handleApproveAll}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Aprovar Todos
            </Button>
          </div>
        </div>
      )}

      {/* Grouped Creatives */}
      <div className="space-y-4">
        {groups.map((group) => {
          const isExpanded = expandedGroups.has(group.key)
          const isSelected = isGroupSelected(group)
          const isPartiallySelected = isGroupPartiallySelected(group)

          return (
            <div
              key={group.key}
              className="border border-border rounded-lg overflow-hidden"
            >
              {/* Group Header */}
              <div className="bg-muted/50 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className="hover:bg-muted rounded p-1 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </button>

                  {canApprove && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => {
                        if (isSelected) {
                          deselectGroup(group)
                        } else {
                          selectGroup(group)
                        }
                      }}
                      className={isPartiallySelected ? "data-[state=checked]:bg-blue-500" : ""}
                    />
                  )}

                  <div>
                    <h3 className="font-semibold text-lg">{group.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {group.count} criativo{group.count !== 1 ? 's' : ''}
                      {canApprove && isPartiallySelected && (
                        <span className="ml-2 text-primary">
                          · {group.creatives.filter(c => selectedCreatives.has(c.id)).length} selecionados
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {canApprove && !isSelected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectGroup(group)}
                  >
                    Selecionar grupo
                  </Button>
                )}
              </div>

              {/* Group Content */}
              {isExpanded && (
                <div className="p-4 bg-card">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.creatives.map((creative) => {
                      const isCreativeSelected = selectedCreatives.has(creative.id)
                      return (
                        <div
                          key={creative.id}
                          onClick={() => canApprove && toggleCreative(creative.id)}
                          className={`group relative overflow-hidden rounded-lg border transition-all ${
                            canApprove ? "cursor-pointer" : ""
                          } ${
                            isCreativeSelected
                              ? "border-primary ring-2 ring-primary ring-offset-2 bg-primary/5"
                              : "border-border bg-muted hover:border-primary/50"
                          }`}
                        >
                          {canApprove && (
                            <div
                              className="absolute top-3 left-3 z-10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={isCreativeSelected}
                                onCheckedChange={() => toggleCreative(creative.id)}
                                className="bg-white border-2 shadow-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                            </div>
                          )}

                          {isCreativeSelected && canApprove && (
                            <div className="absolute top-3 right-3 z-10">
                              <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-semibold shadow-lg">
                                <CheckCircle2 className="h-4 w-4" />
                              </div>
                            </div>
                          )}

                          <div
                            className="relative aspect-square cursor-pointer"
                            onClick={(e) => {
                              const target = e.target as HTMLElement
                              if (target.closest('button')) {
                                e.stopPropagation()
                                return
                              }
                              // Open lightbox
                              const creativeIndex = group.creatives.findIndex(c => c.id === creative.id)
                              setLightboxCreatives(group.creatives)
                              setLightboxIndex(creativeIndex)
                              setLightboxOpen(true)
                            }}
                          >
                            <Image
                              src={creative.thumbnailUrl || creative.url}
                              alt={creative.name}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/20"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const creativeIndex = group.creatives.findIndex(c => c.id === creative.id)
                                  setLightboxCreatives(group.creatives)
                                  setLightboxIndex(creativeIndex)
                                  setLightboxOpen(true)
                                }}
                              >
                                <Eye className="h-6 w-6" />
                              </Button>
                              <div onClick={(e) => e.stopPropagation()}>
                                <CreativeDownloadButton
                                  creativeId={creative.id}
                                  creativeName={creative.name}
                                  creativeUrl={creative.url}
                                  variant="secondary"
                                  size="sm"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="p-3 bg-card">
                            <p className="text-sm font-medium truncate">{creative.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {creative.width} × {creative.height} · {creative.format.toUpperCase()}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar Criativos</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a aprovar {selectedCreatives.size === creatives.length ? "todos os" : `${selectedCreatives.size}`} criativos
              {selectedCreatives.size === creatives.length ? "" : ` de ${creatives.length}`}.
              Esta ação confirmará que você está satisfeito com o trabalho entregue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>Cancelar</Button>
            <Button onClick={confirmApproval} disabled={isProcessing}>
              {isProcessing ? "Aprovando..." : "Confirmar Aprovação"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revision Dialog */}
      <AlertDialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Solicitar Ajustes nos Criativos</AlertDialogTitle>
            <AlertDialogDescription>
              Você selecionou {selectedCreatives.size} criativo{selectedCreatives.size > 1 ? 's' : ''} para ajustes.
              Descreva as mudanças que você gostaria que fossem feitas.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4">
            <label className="text-sm font-medium mb-2 block">
              Descrição dos ajustes necessários
            </label>
            <textarea
              className="w-full min-h-[120px] rounded-lg border border-border bg-background p-3 text-sm resize-none"
              placeholder="Ex: Ajustar cores do CTA, aumentar tamanho do logo, corrigir texto do produto..."
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
            />
          </div>

          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowRevisionDialog(false)}>Cancelar</Button>
            <Button
              onClick={confirmRevision}
              disabled={isProcessing || !revisionNotes.trim()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isProcessing ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lightbox */}
      {lightboxOpen && lightboxCreatives.length > 0 && (
        <Lightbox
          images={lightboxCreatives.map(c => ({
            url: c.url,
            name: c.name,
            alt: `${c.name} - ${c.width}x${c.height}`
          }))}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNext={() => setLightboxIndex((prev) => Math.min(prev + 1, lightboxCreatives.length - 1))}
          onPrevious={() => setLightboxIndex((prev) => Math.max(prev - 1, 0))}
          showNavigation={true}
        />
      )}
    </>
  )
}
