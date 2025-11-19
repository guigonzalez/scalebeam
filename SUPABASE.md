# 🚀 Configuração do Supabase - ScaleBeam

Este projeto usa **Supabase** (PostgreSQL) como banco de dados. Você tem **duas opções** de configuração:

## 📋 Opções Disponíveis

### Opção 1: 🐳 Supabase LOCAL (Recomendado para Desenvolvimento)
**Vantagens:**
- ✅ 100% grátis
- ✅ Roda offline
- ✅ Não precisa criar conta
- ✅ Dados locais (privacidade total)
- ✅ Reset rápido do banco
- ✅ Supabase Studio incluído

**Requisitos:**
- Docker Desktop instalado e rodando

**Como usar:**
```bash
./scripts/setup-local-supabase.sh
```

---

### Opção 2: ☁️ Supabase CLOUD (Recomendado para Produção)
**Vantagens:**
- ✅ Backups automáticos
- ✅ Escalabilidade automática
- ✅ Dashboard completo
- ✅ Fácil deploy em produção
- ✅ APIs de Storage, Auth, Realtime

**Requisitos:**
- Conta no Supabase.com (grátis)

**Como usar:**
```bash
./scripts/setup-supabase.sh
```

---

## 🐳 Opção 1: Configuração LOCAL (Docker)

### Passo a Passo

#### 1. Instalar Docker Desktop

**macOS:**
```bash
brew install --cask docker
```

Ou baixe em: https://www.docker.com/products/docker-desktop

**Após instalar:**
1. Abra Docker Desktop
2. Aguarde o Docker iniciar (ícone na barra superior)

#### 2. Executar Script de Setup

```bash
cd "/Users/guigonzalez/Documents/Projeto de Ads/scalebeam"
./scripts/setup-local-supabase.sh
```

O script vai:
1. ✅ Verificar se Docker está rodando
2. ✅ Instalar Supabase CLI (se necessário)
3. ✅ Inicializar Supabase localmente
4. ✅ Criar containers Docker
5. ✅ Configurar `.env.local` automaticamente
6. ✅ Aplicar migrations
7. ✅ Popular banco com dados de teste (opcional)

#### 3. Acessar Serviços Locais

Após o setup, você terá:

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **API** | http://localhost:54321 | API do Supabase |
| **Studio** | http://localhost:54323 | Interface visual do banco |
| **Database** | postgresql://postgres:postgres@localhost:54322/postgres | Connection string |

#### 4. Comandos Úteis

```bash
# Ver status dos serviços
supabase status

# Parar Supabase
supabase stop

# Iniciar Supabase
supabase start

# Resetar banco de dados
supabase db reset

# Ver logs
supabase logs
```

#### 5. Iniciar Aplicação

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## ☁️  Opção 2: Configuração CLOUD (Supabase.com)

### Passo a Passo

#### 1. Criar Projeto no Supabase

1. Acesse: https://supabase.com/dashboard
2. Clique em **"New Project"**
3. Preencha:
   - **Name:** scalebeam
   - **Database Password:** [crie uma senha forte]
   - **Region:** South America (São Paulo)
4. Clique em **"Create new project"**
5. Aguarde provisionamento (2-3 minutos)

#### 2. Executar Script de Setup

```bash
cd "/Users/guigonzalez/Documents/Projeto de Ads/scalebeam"
./scripts/setup-supabase.sh
```

O script vai pedir:
- Project Reference (ex: `abcdefghijklmnop`)
- Database Password
- Anon Key

**Onde encontrar:**
- Dashboard → Settings → Database
- Dashboard → Settings → API

#### 3. O Script Automatiza

- ✅ Gera connection strings
- ✅ Atualiza `.env.local`
- ✅ Aplica migrations
- ✅ Popula banco (opcional)

#### 4. Iniciar Aplicação

```bash
npm run dev
```

---

## 🔄 Migrando entre Local e Cloud

### De Local para Cloud

1. **Exportar dados locais:**
   ```bash
   supabase db dump -f backup-local.sql
   ```

2. **Configurar cloud:**
   ```bash
   ./scripts/setup-supabase.sh
   ```

3. **Importar dados:**
   ```bash
   psql $DATABASE_URL < backup-local.sql
   ```

### De Cloud para Local

1. **Exportar dados cloud:**
   ```bash
   pg_dump $DATABASE_URL > backup-cloud.sql
   ```

2. **Configurar local:**
   ```bash
   ./scripts/setup-local-supabase.sh
   ```

3. **Importar dados:**
   ```bash
   supabase db reset --db-url postgresql://postgres:postgres@localhost:54322/postgres
   psql postgresql://postgres:postgres@localhost:54322/postgres < backup-cloud.sql
   ```

---

## 📦 Deploy em Produção (Vercel)

### Preparar Variáveis de Ambiente

**Opção A - Via CLI:**
```bash
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

**Opção B - Via Dashboard:**
1. Vercel → Projeto → Settings → Environment Variables
2. Adicione as 4 variáveis
3. Marque: Production, Preview, Development

### Connection Pooling (IMPORTANTE para Produção)

Para produção na Vercel, use **Connection Pooling**:

**DATABASE_URL** (Pooler - porta 6543):
```
postgresql://postgres.[project-ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**DIRECT_URL** (Direct - porta 5432):
```
postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### Configurar Build Command

No Vercel → Settings → Build & Development Settings:

```bash
prisma generate && prisma migrate deploy && next build
```

### Deploy

```bash
git push origin main
```

Ou:

```bash
vercel --prod
```

---

## 🛠️ Troubleshooting

### Docker não inicia

**Erro:** `Cannot connect to Docker daemon`

**Solução:**
1. Abra Docker Desktop
2. Aguarde até ver "Docker is running"
3. Execute o script novamente

### Portas em uso

**Erro:** `Port 54322 already in use`

**Solução:**
```bash
supabase stop
lsof -ti:54322 | xargs kill -9  # Mata processo na porta
supabase start
```

### Migration falha

**Erro:** `Migration failed`

**Solução:**
```bash
# Verificar connection string
echo $DATABASE_URL

# Reset banco
supabase db reset  # Local
# ou
npx prisma migrate reset  # Cloud

# Aplicar novamente
npm run db:migrate:deploy
```

### Prisma não conecta

**Erro:** `Can't reach database server`

**Solução:**
1. Verifique se Supabase está rodando:
   ```bash
   supabase status
   ```

2. Verifique `.env.local`:
   ```bash
   cat .env.local
   ```

3. Teste conexão:
   ```bash
   psql $DATABASE_URL
   ```

---

## 📊 Comparação: Local vs Cloud

| Recurso | Local (Docker) | Cloud (Supabase.com) |
|---------|----------------|----------------------|
| **Custo** | Grátis | Grátis (até 500MB) |
| **Internet** | Não precisa | Precisa |
| **Velocidade** | Muito rápida | Depende da rede |
| **Backups** | Manual | Automático (Pro) |
| **Dados persistentes** | Sim (volumes Docker) | Sim |
| **Escalabilidade** | Limitada | Automática |
| **APIs extras** | Básicas | Storage, Auth, Realtime |
| **Dashboard** | Studio local | Studio + Dashboard web |

---

## 🎯 Recomendação

**Para Desenvolvimento:**
- Use **Supabase LOCAL** (Docker)
- Mais rápido, offline, grátis

**Para Produção:**
- Use **Supabase CLOUD**
- Backups, escalabilidade, confiabilidade

**Para Testes:**
- Use **Supabase LOCAL**
- Fácil de resetar e popular

---

## 📚 Recursos Adicionais

- **Documentação Supabase:** https://supabase.com/docs
- **Supabase CLI:** https://supabase.com/docs/guides/cli
- **Prisma + Supabase:** https://supabase.com/partners/integrations/prisma
- **Next.js + Supabase:** https://supabase.com/docs/guides/getting-started/quickstarts/nextjs

---

## 🆘 Suporte

Se tiver problemas:

1. **Verifique logs:**
   ```bash
   supabase logs  # Local
   # ou visite Supabase Dashboard → Logs  # Cloud
   ```

2. **Reset completo:**
   ```bash
   supabase stop
   supabase db reset
   supabase start
   npm run db:migrate:deploy
   npm run db:seed
   ```

3. **Documentação:**
   - Veja `.env.example` para referência de variáveis
   - Veja comentários nos scripts de setup

---

**Pronto! Escolha sua opção e bora codar! 🚀**
