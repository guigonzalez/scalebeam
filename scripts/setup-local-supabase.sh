#!/bin/bash

# ============================================
# SETUP SUPABASE LOCAL - ScaleBeam
# ============================================
#
# Este script configura Supabase LOCALMENTE usando Docker
# Não precisa criar projeto no Supabase.com
#
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║  SUPABASE LOCAL SETUP - ScaleBeam     ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Docker is running
echo -e "${YELLOW}🐳 Verificando Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker não está rodando!${NC}"
    echo ""
    echo "Por favor:"
    echo "1. Instale Docker Desktop: https://www.docker.com/products/docker-desktop"
    echo "2. Inicie o Docker Desktop"
    echo "3. Execute este script novamente"
    exit 1
fi
echo -e "${GREEN}✅ Docker está rodando!${NC}"
echo ""

# Check if Supabase CLI is installed
echo -e "${YELLOW}📦 Verificando Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI não encontrado. Instalando...${NC}"

    # Detect OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install supabase/tap/supabase
        else
            echo -e "${RED}❌ Homebrew não encontrado!${NC}"
            echo "Instale Homebrew: https://brew.sh"
            echo "Depois execute: brew install supabase/tap/supabase"
            exit 1
        fi
    else
        # Linux/WSL
        echo "Instalando via npm..."
        npm install -g supabase
    fi
fi
echo -e "${GREEN}✅ Supabase CLI instalado!${NC}"
echo ""

# Initialize Supabase (if not already initialized)
if [ ! -d "supabase" ]; then
    echo -e "${YELLOW}🚀 Inicializando Supabase...${NC}"
    supabase init
    echo -e "${GREEN}✅ Supabase inicializado!${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Supabase já está inicializado!${NC}"
    echo ""
fi

# Start Supabase
echo -e "${YELLOW}▶️  Iniciando Supabase local...${NC}"
echo ""
echo "Isso pode demorar alguns minutos na primeira vez..."
echo "(Docker vai baixar as imagens necessárias)"
echo ""

supabase start

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Supabase local está rodando!${NC}"
    echo ""

    # Get connection info
    echo -e "${YELLOW}📋 Obtendo informações de conexão...${NC}"

    # Get DB URL
    DB_URL=$(supabase status | grep "DB URL" | awk '{print $3}')
    ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')
    SERVICE_ROLE_KEY=$(supabase status | grep "service_role key" | awk '{print $3}')
    API_URL=$(supabase status | grep "API URL" | awk '{print $3}')
    STUDIO_URL=$(supabase status | grep "Studio URL" | awk '{print $3}')

    # Update .env.local
    echo ""
    echo -e "${BLUE}📝 Atualizando .env.local...${NC}"

    cat > .env.local << EOF
# ============================================
# SUPABASE LOCAL CONFIGURATION
# ============================================
# Gerado automaticamente em: $(date)
# Configuração para desenvolvimento LOCAL com Docker
# ============================================

# Database Connection (Local)
DATABASE_URL="${DB_URL}"
DIRECT_URL="${DB_URL}"

# Supabase Client (Local)
NEXT_PUBLIC_SUPABASE_URL="${API_URL}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${ANON_KEY}"

# Service Role Key (apenas para scripts admin/seed)
SUPABASE_SERVICE_ROLE_KEY="${SERVICE_ROLE_KEY}"
EOF

    echo -e "${GREEN}✅ Arquivo .env.local atualizado!${NC}"
    echo ""

    # Apply migrations
    echo -e "${YELLOW}📋 Aplicando Migrations...${NC}"
    echo ""

    npm run db:migrate:deploy

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Migrations aplicadas!${NC}"
    else
        echo -e "${RED}❌ Erro ao aplicar migrations!${NC}"
    fi

    # Seed database
    echo ""
    read -p "Deseja popular o banco com dados de teste? (s/n): " SEED_DB

    if [ "$SEED_DB" = "s" ] || [ "$SEED_DB" = "S" ]; then
        echo ""
        echo -e "${BLUE}⏳ Populando banco de dados...${NC}"
        npm run db:seed

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Banco populado!${NC}"
        else
            echo -e "${RED}❌ Erro ao popular banco!${NC}"
        fi
    fi

    # Summary
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║    SUPABASE LOCAL CONFIGURADO! 🎉    ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}📊 Informações de Acesso:${NC}"
    echo ""
    echo -e "  ${YELLOW}API URL:${NC}         ${API_URL}"
    echo -e "  ${YELLOW}Studio URL:${NC}      ${STUDIO_URL}"
    echo -e "  ${YELLOW}Database URL:${NC}    ${DB_URL}"
    echo ""
    echo -e "${BLUE}📝 Próximos passos:${NC}"
    echo ""
    echo "1. Iniciar aplicação:"
    echo -e "   ${YELLOW}npm run dev${NC}"
    echo ""
    echo "2. Abrir Prisma Studio:"
    echo -e "   ${YELLOW}npm run db:studio${NC}"
    echo ""
    echo "3. Abrir Supabase Studio:"
    echo -e "   ${YELLOW}${STUDIO_URL}${NC}"
    echo ""
    echo -e "${BLUE}🛠️  Comandos Úteis:${NC}"
    echo ""
    echo -e "  ${YELLOW}supabase status${NC}      Ver status dos serviços"
    echo -e "  ${YELLOW}supabase stop${NC}        Parar Supabase local"
    echo -e "  ${YELLOW}supabase start${NC}       Iniciar Supabase local"
    echo -e "  ${YELLOW}supabase db reset${NC}    Resetar banco de dados"
    echo ""
    echo -e "${GREEN}✨ Desenvolvimento 100% local configurado!${NC}"
    echo ""

else
    echo -e "${RED}❌ Erro ao iniciar Supabase!${NC}"
    echo ""
    echo "Verifique se:"
    echo "- Docker está rodando"
    echo "- Portas 54322, 54323, 54324 estão livres"
    echo "- Há espaço em disco suficiente"
    exit 1
fi
