#!/bin/bash

# ============================================
# SETUP SUPABASE - ScaleBeam
# ============================================
#
# Este script auxilia na configuração inicial do Supabase
# para o projeto ScaleBeam
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
echo "║   SUPABASE SETUP - ScaleBeam          ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ Erro: Arquivo .env.local não encontrado!${NC}"
    echo ""
    echo "Criando .env.local a partir do .env.example..."
    cp .env.example .env.local
    echo -e "${GREEN}✅ Arquivo .env.local criado!${NC}"
    echo ""
fi

# Instructions
echo -e "${YELLOW}📋 PASSO 1: Criar Projeto no Supabase${NC}"
echo ""
echo "1. Acesse: https://supabase.com/dashboard"
echo "2. Clique em 'New Project'"
echo "3. Preencha:"
echo "   - Name: scalebeam (ou outro nome)"
echo "   - Database Password: [senha forte]"
echo "   - Region: South America (São Paulo)"
echo "4. Clique em 'Create new project'"
echo "5. Aguarde o provisionamento (2-3 minutos)"
echo ""
read -p "Pressione ENTER quando o projeto estiver pronto..."

# Get database credentials
echo ""
echo -e "${YELLOW}📋 PASSO 2: Obter Credenciais${NC}"
echo ""
echo "No Dashboard do Supabase do seu projeto:"
echo "1. Vá em: Settings → Database"
echo "2. Role até 'Connection string'"
echo "3. Copie as informações conforme solicitado abaixo"
echo ""

# Get PROJECT_REF
echo -e "${BLUE}🔑 Project Reference:${NC}"
echo "Exemplo: abcdefghijklmnop"
read -p "Cole o Project Reference: " PROJECT_REF

# Get PASSWORD
echo ""
echo -e "${BLUE}🔒 Database Password:${NC}"
read -sp "Cole a senha do banco: " PASSWORD
echo ""

# Get ANON_KEY
echo ""
echo -e "${BLUE}🔑 Anon Key:${NC}"
echo "No Dashboard: Settings → API → Project API keys → anon public"
read -p "Cole a Anon Key: " ANON_KEY

# Generate connection strings
echo ""
echo -e "${GREEN}✨ Gerando connection strings...${NC}"
echo ""

DATABASE_URL="postgresql://postgres:${PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:${PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

# Update .env.local
echo -e "${YELLOW}📝 Atualizando .env.local...${NC}"

cat > .env.local << EOF
# ============================================
# SUPABASE DATABASE CONFIGURATION
# ============================================
# Gerado automaticamente em: $(date)
# ============================================

# Database Connection (Direct - para desenvolvimento local)
DATABASE_URL="${DATABASE_URL}"
DIRECT_URL="${DIRECT_URL}"

# Supabase Client (Opcional - para Storage, Auth, Realtime)
NEXT_PUBLIC_SUPABASE_URL="${SUPABASE_URL}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${ANON_KEY}"
EOF

echo -e "${GREEN}✅ Arquivo .env.local atualizado!${NC}"
echo ""

# Apply migrations
echo -e "${YELLOW}📋 PASSO 3: Aplicar Migrations${NC}"
echo ""
echo "Agora vamos aplicar as migrations do Prisma no Supabase..."
echo ""
read -p "Pressione ENTER para continuar..."

echo ""
echo -e "${BLUE}⏳ Aplicando migrations...${NC}"
npm run db:migrate:deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations aplicadas com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao aplicar migrations!${NC}"
    echo "Verifique se as credenciais estão corretas."
    exit 1
fi

# Seed database
echo ""
echo -e "${YELLOW}📋 PASSO 4: Popular Banco de Dados${NC}"
echo ""
read -p "Deseja popular o banco com dados de teste? (s/n): " SEED_DB

if [ "$SEED_DB" = "s" ] || [ "$SEED_DB" = "S" ]; then
    echo ""
    echo -e "${BLUE}⏳ Populando banco de dados...${NC}"
    npm run db:seed

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Banco populado com sucesso!${NC}"
    else
        echo -e "${RED}❌ Erro ao popular banco!${NC}"
    fi
fi

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          SETUP CONCLUÍDO! 🎉          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📝 Próximos passos:${NC}"
echo ""
echo "1. Iniciar aplicação local:"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo "2. Abrir Prisma Studio para ver dados:"
echo -e "   ${YELLOW}npm run db:studio${NC}"
echo ""
echo "3. Acessar Supabase Dashboard:"
echo -e "   ${YELLOW}${SUPABASE_URL}${NC}"
echo ""
echo -e "${BLUE}🚀 Para deploy na Vercel:${NC}"
echo ""
echo "Configure as variáveis de ambiente:"
echo -e "   ${YELLOW}vercel env add DATABASE_URL production${NC}"
echo -e "   ${YELLOW}vercel env add DIRECT_URL production${NC}"
echo -e "   ${YELLOW}vercel env add NEXT_PUBLIC_SUPABASE_URL production${NC}"
echo -e "   ${YELLOW}vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production${NC}"
echo ""
echo "IMPORTANTE: Para produção, use CONNECTION POOLING"
echo "DATABASE_URL deve usar o pooler (porta 6543)"
echo ""
echo -e "${GREEN}✨ Tudo pronto! Boa codificação!${NC}"
echo ""
