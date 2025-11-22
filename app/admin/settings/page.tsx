"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  })

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/admin/settings")
        if (!response.ok) throw new Error("Falha ao carregar dados")

        const data = await response.json()
        setFormData({
          name: data.user.name,
          email: data.user.email,
        })
      } catch (error: any) {
        toast.error("Erro ao carregar configurações", {
          description: error.message,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Falha ao salvar")
      }

      toast.success("Perfil atualizado com sucesso!")
    } catch (error: any) {
      toast.error("Erro ao salvar", {
        description: error.message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-8 max-w-4xl">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground mt-1">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie as configurações da plataforma</p>
      </div>

      {/* Profile Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Perfil</h2>
        <form onSubmit={handleSaveProfile}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nome</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </Card>

      {/* System Settings */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Sistema</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium">Notificações por Email</p>
              <p className="text-sm text-muted-foreground">
                Receber notificações quando novos projetos forem criados
              </p>
            </div>
            <p className="text-sm text-muted-foreground">Em breve</p>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium">Modo Escuro</p>
              <p className="text-sm text-muted-foreground">
                Aparência do sistema
              </p>
            </div>
            <p className="text-sm text-muted-foreground">Em breve</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
