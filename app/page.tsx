import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Zap,
  Users,
  TrendingUp,
  CheckCircle,
  Sparkles,
  Eye,
  BarChart3,
  Layers,
  Workflow,
  Shield,
  Gauge,
  Target,
  LineChart,
  Clock,
  DollarSign
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-2xl font-[300] tracking-tight">ScaleBeam</Link>
            <Badge variant="secondary" className="text-xs">BETA</Badge>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground hidden md:block">Recursos</Link>
            <Link href="/roi-calculator" className="text-sm text-muted-foreground hover:text-foreground hidden md:block">ROI</Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground hidden md:block">Planos</Link>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Começar Agora</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-6">
            <Sparkles className="h-3 w-3 mr-1" />
            Recursos Exclusivos
          </Badge>

          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight mb-6 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Tecnologia que Vai Além
            <br />
            da Automação
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Não apenas economize tempo - transforme workflows, cultura e resultados
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-base" asChild>
              <Link href="/signup">Solicite uma Demo</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base" asChild>
              <Link href="#roi">Ver Planos</Link>
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-6 justify-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Tecnologia de ponta
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Suporte dedicado
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Resultados garantidos
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16 border-y border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold mb-2">83%</div>
            <div className="text-sm text-muted-foreground">Tempo Economizado</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold mb-2">2+</div>
            <div className="text-sm text-muted-foreground">Plataformas</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold mb-2">1</div>
            <div className="text-sm text-muted-foreground">Dashboard</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">Auto-Otimização</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-semibold mb-4">
            Recursos que Transformam
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tudo que você precisa para revolucionar sua produção criativa
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-8 hover:shadow-lg transition-shadow">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <Layers className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Orquestração Multi-IA</h3>
            <p className="text-muted-foreground leading-relaxed">
              Combine múltiplos modelos de IA em um novo fluxo otimizado para máxima qualidade e eficiência
            </p>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-shadow">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <Eye className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">QA Visual Automatizado</h3>
            <p className="text-muted-foreground leading-relaxed">
              Garanta de qualidade e conformidade em todas as peças criativas com validação automática
            </p>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-shadow">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <TrendingUp className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Aprendizado Contínuo</h3>
            <p className="text-muted-foreground leading-relaxed">
              IA que aprende com performance real e otimiza continuamente seus criativos
            </p>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-shadow">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <Gauge className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Produção em Escala</h3>
            <p className="text-muted-foreground leading-relaxed">
              Gere centenas de variações criativas em minutos, não em dias
            </p>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-shadow">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <Workflow className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Integração Nativa</h3>
            <p className="text-muted-foreground leading-relaxed">
              Conecte com Meta, Google, Figma, Adobe e outras ferramentas do seu fluxo
            </p>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-shadow">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Human in the Loop</h3>
            <p className="text-muted-foreground leading-relaxed">
              Controle criativo total com validação humana em cada etapa importante
            </p>
          </Card>
        </div>
      </section>

      {/* Evaluation Section */}
      <section className="container mx-auto px-4 py-24 bg-secondary/30">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge variant="outline" className="mb-4">
              <BarChart3 className="h-3 w-3 mr-1" />
              Avaliação Inteligente
            </Badge>
            <h2 className="text-4xl font-semibold mb-6">
              Avaliação Multi-Dimensional com IA
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Nossa plataforma analisa automaticamente seus criativos em múltiplas dimensões: competitividade, experiência do usuário e performance de conversão.
            </p>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Avaliação de Competitividade</h4>
                  <p className="text-sm text-muted-foreground">
                    Compare seus criativos com os melhores do mercado automaticamente
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Análise de Experiência</h4>
                  <p className="text-sm text-muted-foreground">
                    Preveja como seu público reagirá antes mesmo de publicar
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Score de Performance</h4>
                  <p className="text-sm text-muted-foreground">
                    Receba scores preditivos em +30 KPIs de lançamento
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Avaliação Geral</h3>
              <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                Excelente
              </Badge>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Competitividade</span>
                  <span className="text-sm text-muted-foreground">92%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '92%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Experiência do Usuário</span>
                  <span className="text-sm text-muted-foreground">88%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '88%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Performance Preditiva</span>
                  <span className="text-sm text-muted-foreground">95%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '95%' }} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ROI Section */}
      <section id="roi" className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <DollarSign className="h-3 w-3 mr-1" />
            Resultados Comprovados
          </Badge>
          <h2 className="text-4xl md:text-5xl font-semibold mb-4">
            ROI que Impressiona
          </h2>
        </div>

        <Card className="p-8 md:p-12 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground mb-2">Cenário Real de Cliente</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="text-center p-6 rounded-lg bg-secondary/50">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <div className="text-sm text-muted-foreground mb-1">Tempo Manual (mês)</div>
              <div className="text-3xl font-bold">160 horas</div>
            </div>

            <div className="text-center p-6 rounded-lg bg-primary/10">
              <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
              <div className="text-sm text-muted-foreground mb-1">Tempo com IA (mês)</div>
              <div className="text-3xl font-bold text-primary">24 horas</div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 border border-border rounded-lg">
              <div className="text-2xl font-bold mb-1">R$ 13.600</div>
              <div className="text-sm text-muted-foreground">Economia Mensal</div>
            </div>

            <div className="text-center p-4 border border-border rounded-lg">
              <div className="text-2xl font-bold mb-1">R$ 797</div>
              <div className="text-sm text-muted-foreground">Investimento Mensal</div>
            </div>

            <div className="text-center p-4 border border-primary/50 rounded-lg bg-primary/5">
              <div className="text-2xl font-bold text-primary mb-1">1.606%</div>
              <div className="text-sm text-muted-foreground">ROI no Primeiro Ano</div>
            </div>
          </div>

          <div className="text-center">
            <Badge className="mb-4">Payback em apenas 18 dias</Badge>
            <div className="mt-6">
              <Button size="lg" asChild>
                <Link href="/signup">Calcular Seu ROI</Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-24">
        <Card className="p-12 md:p-16 text-center bg-gradient-to-br from-primary/10 to-primary/5">
          <h2 className="text-4xl md:text-5xl font-semibold mb-6">
            Pronto para Transformar sua
            <br />
            Produção Criativa?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Junte-se às agências e empresas que já estão revolucionando seus workflows com IA
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Agendar Demo Personalizada</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">Ver Planos e Preços</Link>
            </Button>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-[300] tracking-tight">ScaleBeam</span>
              <Badge variant="secondary" className="text-xs">BETA</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 ScaleBeam. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
