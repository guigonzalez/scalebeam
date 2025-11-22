# Supabase Database Migrations

Este diretório contém as migrations SQL para melhorar a configuração do Supabase do projeto ScaleBeam.

## 📋 Ordem de Execução

Execute as migrations na seguinte ordem no **Supabase SQL Editor**:

1. `001_improved_storage_policies.sql` - Políticas de segurança aprimoradas para Storage
2. `002_performance_indexes.sql` - Índices para otimização de performance
3. `003_monitoring_views.sql` - Views para monitoramento e analytics
4. `004_triggers_and_functions.sql` - Triggers e funções automáticas

## 🚀 Como Executar

### Via Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/toyzsriuzltehsrnshsp
2. Vá em **SQL Editor** no menu lateral
3. Clique em **New Query**
4. Copie e cole o conteúdo de cada migration
5. Execute clicando em **Run** (ou `Ctrl/Cmd + Enter`)

### Via CLI do Supabase (Opcional)

Se você tiver o CLI do Supabase instalado:

```bash
# Instalar CLI (se necessário)
npm install -g supabase

# Login
supabase login

# Executar migrations
supabase db push
```

## 📄 Descrição das Migrations

### 001_improved_storage_policies.sql

**O que faz:**
- Remove políticas RLS antigas e muito permissivas
- Cria políticas robustas baseadas em organização
- Apenas membros da organização podem fazer upload
- Apenas admins podem deletar
- Configura limites de tamanho e tipos de arquivo permitidos

**Impacto:**
- ✅ Maior segurança no Storage
- ✅ Previne uploads não autorizados
- ✅ Limita tipos de arquivo (imagens, PDFs, docs)

### 002_performance_indexes.sql

**O que faz:**
- Cria índices compostos para queries frequentes
- Ativa extensão pg_trgm para busca full-text
- Cria índices parciais para queries específicas
- Atualiza estatísticas das tabelas

**Impacto:**
- ✅ Queries até 10x mais rápidas
- ✅ Busca por nome muito mais eficiente
- ✅ Reduz carga no banco de dados

**Exemplos de queries beneficiadas:**
```sql
-- Buscar templates por nome (usa índice trgm)
SELECT * FROM "Template" WHERE name ILIKE '%black friday%';

-- Listar templates aprovados e ativos (usa índice parcial)
SELECT * FROM "Template"
WHERE "templateStatus" = 'APPROVED' AND "isActive" = true;

-- Dashboard de organização (usa índices compostos)
SELECT * FROM "Project" WHERE "brandId" = 'xxx' ORDER BY "createdAt" DESC;
```

### 003_monitoring_views.sql

**O que faz:**
- Cria views para analytics e monitoramento
- Tracking de uso de storage por organização
- Dashboard de métricas de negócio
- Análise de produtividade

**Impacto:**
- ✅ Visibilidade em tempo real do sistema
- ✅ Identificar organizações próximas do limite
- ✅ Análise de uso de templates
- ✅ Métricas de produtividade

**Views criadas:**
- `organization_dashboard` - Métricas por organização
- `template_analytics` - Análise de uso de templates
- `creative_productivity` - Produtividade diária
- `project_analytics` - Análise de projetos
- `storage_uploads_log` - Log de uploads
- `organization_storage_usage` - Uso de storage
- `organizations_near_limit` - Organizações próximas do limite
- `unused_templates` - Templates sem uso

**Exemplos de uso:**
```sql
-- Ver organizações próximas do limite
SELECT * FROM organizations_near_limit;

-- Top 10 templates mais usados
SELECT * FROM template_analytics ORDER BY times_used DESC LIMIT 10;

-- Produtividade dos últimos 7 dias
SELECT * FROM creative_productivity WHERE date > NOW() - INTERVAL '7 days';

-- Uso total de storage
SELECT
  organization_name,
  bucket_id,
  total_mb,
  file_count
FROM organization_storage_usage
ORDER BY total_mb DESC;
```

### 004_triggers_and_functions.sql

**O que faz:**
- Logging automático de mudanças de status
- Validação de limites da organização
- Atualização automática de contadores
- Validação de status de pagamento

**Impacto:**
- ✅ ActivityLog preenchido automaticamente
- ✅ Previne exceder limites do plano
- ✅ Contador de criativos sempre atualizado
- ✅ Bloqueia operações se pagamento suspenso

**Triggers criados:**
- `project_status_change_trigger` - Loga mudanças de status
- `creative_count_insert_trigger` - Atualiza contador ao adicionar
- `creative_count_delete_trigger` - Atualiza contador ao remover
- `validate_brand_limit_trigger` - Valida limite de marcas
- `validate_creative_limit_trigger` - Valida limite de criativos
- `validate_payment_trigger` - Valida status de pagamento
- `auto_approve_template_trigger` - Loga aprovações

## ⚠️ Notas Importantes

### Sobre Service Role Key

As migrations criam políticas RLS robustas, mas o projeto ainda usa `SUPABASE_SERVICE_ROLE_KEY` para uploads server-side. Isso é intencional e seguro porque:

1. Service Role Key só é usada em rotas API do servidor
2. RLS funciona como camada adicional de segurança
3. Permite validações mais complexas no código

### Rollback

Se precisar reverter alguma migration:

```sql
-- Remover uma policy específica
DROP POLICY IF EXISTS "policy_name" ON storage.objects;

-- Remover um índice
DROP INDEX IF EXISTS idx_template_name_trgm;

-- Remover uma view
DROP VIEW IF EXISTS organization_dashboard;

-- Remover um trigger
DROP TRIGGER IF EXISTS project_status_change_trigger ON "Project";

-- Remover uma função
DROP FUNCTION IF EXISTS log_project_status_change();
```

### Backup

**IMPORTANTE:** Antes de executar as migrations em produção, faça backup:

1. Dashboard > Settings > Backups
2. Clique em "Create Backup"
3. Aguarde conclusão
4. Execute as migrations

## 🔍 Verificação

Após executar todas as migrations, verifique:

### 1. Policies criadas
```sql
SELECT * FROM storage.policies WHERE bucket_id IN ('assets', 'briefings');
```

### 2. Índices criados
```sql
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### 3. Views criadas
```sql
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;
```

### 4. Triggers ativos
```sql
SELECT
  event_object_table AS table_name,
  trigger_name,
  event_manipulation AS event
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

## 📊 Monitoramento Pós-Migration

Execute estas queries para verificar se tudo está funcionando:

```sql
-- Ver atividade recente (deve mostrar logs automáticos)
SELECT * FROM recent_activity LIMIT 10;

-- Ver uso de storage
SELECT * FROM organization_storage_usage;

-- Ver organizações próximas do limite
SELECT * FROM organizations_near_limit;

-- Ver templates não utilizados
SELECT * FROM unused_templates;
```

## 🆘 Troubleshooting

### Erro: "policy already exists"

Isso significa que a policy já foi criada. Execute o DROP antes:

```sql
DROP POLICY IF EXISTS "policy_name" ON storage.objects;
```

### Erro: "extension pg_trgm does not exist"

Execute manualmente:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### Erro: "insufficient privilege"

Você precisa estar conectado como superuser ou com permissões de admin no Supabase.

## 📚 Recursos

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/trigger-definition.html)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
