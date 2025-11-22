-- ============================================
-- ÍNDICES PARA MELHORAR PERFORMANCE
-- Execute este arquivo no Supabase SQL Editor
-- ============================================

-- Ativar extensão trigram para busca full-text
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- ÍNDICES COMPOSTOS PARA QUERIES FREQUENTES
-- ============================================

-- User
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"(role);

-- Organization
CREATE INDEX IF NOT EXISTS idx_organization_payment
ON "Organization"("paymentStatus", "nextBillingDate");

CREATE INDEX IF NOT EXISTS idx_organization_plan
ON "Organization"(plan, "paymentStatus");

-- Brand
CREATE INDEX IF NOT EXISTS idx_brand_org_created
ON "Brand"("organizationId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_brand_org_name
ON "Brand"("organizationId", name);

-- Template
CREATE INDEX IF NOT EXISTS idx_template_brand_status
ON "Template"("brandId", "templateStatus", "isActive");

CREATE INDEX IF NOT EXISTS idx_template_status_active
ON "Template"("templateStatus", "isActive", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_template_brand_active
ON "Template"("brandId", "isActive") WHERE "isActive" = true;

-- Project
CREATE INDEX IF NOT EXISTS idx_project_brand_type
ON "Project"("brandId", "projectType", status);

CREATE INDEX IF NOT EXISTS idx_project_status_created
ON "Project"(status, "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_project_brand_created
ON "Project"("brandId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_project_template_status
ON "Project"("templateId", status) WHERE "templateId" IS NOT NULL;

-- Creative
CREATE INDEX IF NOT EXISTS idx_creative_project_created
ON "Creative"("projectId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_creative_format
ON "Creative"("projectId", format);

CREATE INDEX IF NOT EXISTS idx_creative_lista_modelo
ON "Creative"("projectId", lista, modelo);

-- Asset
CREATE INDEX IF NOT EXISTS idx_asset_brand_type
ON "Asset"("brandId", type, "createdAt" DESC);

-- ActivityLog
CREATE INDEX IF NOT EXISTS idx_activity_org_created
ON "ActivityLog"("organizationId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_activity_user_created
ON "ActivityLog"("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_activity_action
ON "ActivityLog"(action, "createdAt" DESC);

-- Comment
CREATE INDEX IF NOT EXISTS idx_comment_project_created
ON "Comment"("projectId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_comment_user
ON "Comment"("userId", "createdAt" DESC);

-- ============================================
-- ÍNDICES PARA BUSCA FULL-TEXT
-- ============================================

-- Template - busca por nome
CREATE INDEX IF NOT EXISTS idx_template_name_trgm
ON "Template" USING gin(name gin_trgm_ops);

-- Template - busca por descrição
CREATE INDEX IF NOT EXISTS idx_template_description_trgm
ON "Template" USING gin(description gin_trgm_ops);

-- Project - busca por nome
CREATE INDEX IF NOT EXISTS idx_project_name_trgm
ON "Project" USING gin(name gin_trgm_ops);

-- Brand - busca por nome
CREATE INDEX IF NOT EXISTS idx_brand_name_trgm
ON "Brand" USING gin(name gin_trgm_ops);

-- Organization - busca por nome
CREATE INDEX IF NOT EXISTS idx_organization_name_trgm
ON "Organization" USING gin(name gin_trgm_ops);

-- User - busca por nome
CREATE INDEX IF NOT EXISTS idx_user_name_trgm
ON "User" USING gin(name gin_trgm_ops);

-- ============================================
-- ÍNDICES PARCIAIS (para queries específicas)
-- ============================================

-- Templates aprovados e ativos (usado frequentemente)
CREATE INDEX IF NOT EXISTS idx_template_approved_active
ON "Template"("brandId", "createdAt" DESC)
WHERE "templateStatus" = 'APPROVED' AND "isActive" = true;

-- Projetos em produção
CREATE INDEX IF NOT EXISTS idx_project_in_production
ON "Project"("brandId", "createdAt" DESC)
WHERE status = 'IN_PRODUCTION';

-- Projetos pendentes de aprovação
CREATE INDEX IF NOT EXISTS idx_project_ready
ON "Project"("brandId", "createdAt" DESC)
WHERE status = 'READY';

-- Templates pendentes de aprovação
CREATE INDEX IF NOT EXISTS idx_template_pending
ON "Template"("createdAt" DESC)
WHERE "templateStatus" = 'PENDING_APPROVAL';

-- ============================================
-- ESTATÍSTICAS
-- ============================================

-- Atualizar estatísticas das tabelas
ANALYZE "User";
ANALYZE "Organization";
ANALYZE "Brand";
ANALYZE "Template";
ANALYZE "Project";
ANALYZE "Creative";
ANALYZE "Asset";
ANALYZE "ActivityLog";
ANALYZE "Comment";
ANALYZE "_OrganizationToUser";

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Ver todos os índices criados
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Ver tamanho dos índices
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size('"' || schemaname || '"."' || tablename || '"')) AS size,
    pg_size_pretty(pg_indexes_size('"' || schemaname || '"."' || tablename || '"')) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('"' || schemaname || '"."' || tablename || '"') DESC;
