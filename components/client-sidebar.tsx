"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Folder, Upload, FolderOpen, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const navigation = [
  { name: "Dashboard", href: "/client", icon: LayoutDashboard, disabled: false },
  { name: "Minhas Marcas", href: "/client/brands", icon: FolderOpen, disabled: false },
  { name: "Projetos", href: "/client/projects", icon: Folder, disabled: false },
  { name: "Novo Projeto", href: "/client/projects/new", icon: Upload, disabled: false },
  { name: "Performance", href: "#", icon: TrendingUp, disabled: true },
]

export function ClientSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/client" className="flex items-center gap-2">
          <span className="text-2xl font-[300] tracking-tight">ScaleBeam</span>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            BETA
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/client" && pathname.startsWith(item.href))

          if (item.disabled) {
            return (
              <button
                key={item.name}
                onClick={() => {
                  toast.info("Funcionalidade Premium", {
                    description: "Entre em contato com seu Account Manager para ativar o módulo de Performance e ter acesso a análises avançadas de suas campanhas.",
                    duration: 5000,
                  })
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  "text-muted-foreground/50 cursor-not-allowed opacity-60"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
                <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  Em breve
                </span>
              </button>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
