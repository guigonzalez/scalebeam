"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle2, X, Download } from "lucide-react"
import { CreativeDownloadButton } from "@/components/creative-download-button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
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

interface CreativeApprovalGridProps {
  creatives: Creative[]
  projectId: string
  projectName: string
  canApprove: boolean
}

export function CreativeApprovalGrid({
  creatives,
  projectId,
  projectName,
  canApprove,
}: CreativeApprovalGridProps) {
  const [selectedCreatives, setSelectedCreatives] = useState<Set<string>>(new Set())
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRevisionDialog, setShowRevisionDialog] = useState(false)
  const [revisionNotes, setRevisionNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Filters
  const [selectedLista, setSelectedLista] = useState<string | null>(null)
  const [selectedFormato, setSelectedFormato] = useState<string | null>(null)
  const [selectedModelo, setSelectedModelo] = useState<string | null>(null)

  // Get unique values for filters
  const listas = Array.from(new Set(creatives.map(c => c.lista).filter(Boolean))) as string[]
  const formatos = Array.from(new Set(creatives.map(c => c.format).filter(Boolean))) as string[]
  const modelos = Array.from(new Set(creatives.map(c => c.modelo).filter(Boolean))) as string[]

  // Filter creatives based on selections
  const filteredCreatives = creatives.filter(creative => {
    if (selectedLista && creative.lista !== selectedLista) return false
    if (selectedFormato && creative.format !== selectedFormato) return false
    if (selectedModelo && creative.modelo !== selectedModelo) return false
    return true
  })

  const allSelected = selectedCreatives.size === filteredCreatives.length && filteredCreatives.length > 0
  const someSelected = selectedCreatives.size > 0 && selectedCreatives.size < filteredCreatives.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedCreatives(new Set())
    } else {
      setSelectedCreatives(new Set(filteredCreatives.map(c => c.id)))
    }
  }

  const selectByFilter = (filterType: 'lista' | 'formato' | 'modelo', value: string) => {
    const creativesToSelect = creatives.filter(c => {
      if (filterType === 'lista') return c.lista === value
      if (filterType === 'formato') return c.format === value
      if (filterType === 'modelo') return c.modelo === value
      return false
    })
    setSelectedCreatives(new Set(creativesToSelect.map(c => c.id)))
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

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    const count = selectedCreatives.size
    toast.success(`${count} criativo${count > 1 ? 's' : ''} aprovado${count > 1 ? 's' : ''} com sucesso!`, {
      description: count === creatives.length
        ? `Todos os criativos do projeto "${projectName}" foram aprovados.`
        : `${count} de ${creatives.length} criativos foram aprovados.`,
    })

    setIsProcessing(false)
    setShowApproveDialog(false)
    setSelectedCreatives(new Set())

    // Simulate page reload
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  }

  const confirmRevision = async () => {
    if (!revisionNotes.trim()) {
      toast.error("Por favor, descreva os ajustes necessários")
      return
    }

    setIsProcessing(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    const count = selectedCreatives.size
    toast.success("Solicitação de ajustes enviada!", {
      description: `A equipe UXER foi notificada sobre os ajustes necessários em ${count} criativo${count > 1 ? 's' : ''}.`,
    })

    setIsProcessing(false)
    setShowRevisionDialog(false)
    setRevisionNotes("")
    setSelectedCreatives(new Set())

    // Simulate page reload
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  }

  return (
    <>
      {/* Filters */}
      <div className="mb-4 p-4 bg-muted/30 rounded-lg border border-border">
        <h3 className="text-sm font-semibold mb-3">Filtrar Criativos</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Lista Filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Por Lista
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedLista(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selectedLista === null
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/50"
                }`}
              >
                Todas
              </button>
              {listas.map((lista) => (
                <button
                  key={lista}
                  onClick={() => setSelectedLista(lista)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedLista === lista
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50"
                  }`}
                >
                  {lista}
                </button>
              ))}
            </div>
          </div>

          {/* Formato Filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Por Formato
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedFormato(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selectedFormato === null
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/50"
                }`}
              >
                Todos
              </button>
              {formatos.map((formato) => (
                <button
                  key={formato}
                  onClick={() => setSelectedFormato(formato)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedFormato === formato
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50"
                  }`}
                >
                  {formato.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Modelo Filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Por Modelo
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedModelo(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selectedModelo === null
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/50"
                }`}
              >
                Todos
              </button>
              {modelos.map((modelo) => (
                <button
                  key={modelo}
                  onClick={() => setSelectedModelo(modelo)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedModelo === modelo
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50"
                  }`}
                >
                  {modelo}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Results */}
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Mostrando <span className="font-semibold text-foreground">{filteredCreatives.length}</span> de{" "}
            <span className="font-semibold text-foreground">{creatives.length}</span> criativos
          </p>
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

      {/* Creatives Grid */}
      {filteredCreatives.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCreatives.map((creative) => {
            const isSelected = selectedCreatives.has(creative.id)
            return (
              <div
                key={creative.id}
                onClick={() => canApprove && toggleCreative(creative.id)}
                className={`group relative overflow-hidden rounded-lg border transition-all ${
                  canApprove ? "cursor-pointer" : ""
                } ${
                  isSelected
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
                    checked={isSelected}
                    onCheckedChange={() => toggleCreative(creative.id)}
                    className="bg-white border-2 shadow-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </div>
              )}

              {isSelected && canApprove && (
                <div className="absolute top-3 right-3 z-10">
                  <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-semibold shadow-lg">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
              )}

              <div
                className="relative aspect-square"
                onClick={(e) => {
                  // Se clicar no botão de download, não seleciona
                  const target = e.target as HTMLElement
                  if (target.closest('button')) {
                    e.stopPropagation()
                  }
                }}
              >
                <Image
                  src={creative.thumbnailUrl || creative.url}
                  alt={creative.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <div onClick={(e) => e.stopPropagation()}>
                    <CreativeDownloadButton
                      creativeId={creative.id}
                      creativeName={creative.name}
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
      ) : (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">Nenhum criativo encontrado com os filtros selecionados</p>
          <button
            onClick={() => {
              setSelectedLista(null)
              setSelectedFormato(null)
              setSelectedModelo(null)
            }}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Limpar filtros
          </button>
        </div>
      )}

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
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
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
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
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
    </>
  )
}
