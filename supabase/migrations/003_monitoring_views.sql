-- ============================================
-- VIEWS PARA MONITORAMENTO E ANALYTICS
-- Execute este arquivo no Supabase SQL Editor
-- ============================================

-- ============================================
-- STORAGE MONITORING
-- ============================================

-- View para monitorar uploads recentes
CREATE OR REPLACE VIEW storage_uploads_log AS
SELECT
  o.name,
  o.bucket_id,
  o.created_at,
  o.updated_at,
  (o.metadata->>'size')::bigint as size_bytes,
  ROUND((o.metadata->>'size')::bigint / 1024.0 / 1024.0, 2) as size_mb,
  o.metadata->>'mimetype' as mime_type,
  (storage.foldername(o.name))[1] as organization_id,
  o.owner as owner_id
FROM storage.objects o
WHERE o.created_at > NOW() - INTERVAL '30 days'
ORDER BY o.created_at DESC;

-- View para uso de storage por organização
CREATE OR REPLACE VIEW organization_storage_usage AS
SELECT
  (storage.foldername(o.name))[1] as organization_id,
  org.name as organization_name,
  o.bucket_id,
  COUNT(*) as file_count,
  SUM((o.metadata->>'size')::bigint) as total_bytes,
  ROUND(SUM((o.metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as total_mb,
  ROUND(SUM((o.metadata->>'size')::bigint) / 1024.0 / 1024.0 / 1024.0, 2) as total_gb
FROM storage.objects o
LEFT JOIN "Organization" org ON org.id = (storage.foldername(o.name))[1]
GROUP BY (storage.foldername(o.name))[1], org.name, o.bucket_id;

-- View para análise de tipos de arquivo
CREATE OR REPLACE VIEW storage_file_types AS
SELECT
  o.bucket_id,
  o.metadata->>'mimetype' as mime_type,
  COUNT(*) as file_count,
  ROUND(SUM((o.metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as total_mb,
  ROUND(AVG((o.metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as avg_mb
FROM storage.objects o
GROUP BY o.bucket_id, o.metadata->>'mimetype'
ORDER BY total_mb DESC;

-- ============================================
-- BUSINESS ANALYTICS
-- ============================================

-- View para dashboard de organizações
CREATE OR REPLACE VIEW organization_dashboard AS
SELECT
  o.id,
  o.name,
  o.plan,
  o."paymentStatus",
  o."maxCreatives",
  o."maxBrands",
  COUNT(DISTINCT b.id) as total_brands,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT p.id) as total_projects,
  COUNT(DISTINCT c.id) as total_creatives,
  COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'APPROVED') as approved_projects,
  COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'IN_PRODUCTION') as in_production_projects,
  COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'READY') as ready_projects,
  o."createdAt",
  o."updatedAt"
FROM "Organization" o
LEFT JOIN "Brand" b ON b."organizationId" = o.id
LEFT JOIN "_OrganizationToUser" otu ON otu."A" = o.id
LEFT JOIN "User" u ON u.id = otu."B"
LEFT JOIN "Project" p ON p."brandId" = b.id
LEFT JOIN "Creative" c ON c."projectId" = p.id
GROUP BY o.id, o.name, o.plan, o."paymentStatus", o."maxCreatives", o."maxBrands", o."createdAt", o."updatedAt";

-- View para análise de templates
CREATE OR REPLACE VIEW template_analytics AS
SELECT
  t.id,
  t.name,
  t."templateStatus",
  t."isActive",
  b.name as brand_name,
  o.name as organization_name,
  COUNT(DISTINCT p.id) as times_used,
  COUNT(DISTINCT c.id) as total_creatives_generated,
  t."createdAt",
  t."updatedAt"
FROM "Template" t
JOIN "Brand" b ON b.id = t."brandId"
JOIN "Organization" o ON o.id = b."organizationId"
LEFT JOIN "Project" p ON p."templateId" = t.id
LEFT JOIN "Creative" c ON c."projectId" = p.id
GROUP BY t.id, t.name, t."templateStatus", t."isActive", b.name, o.name, t."createdAt", t."updatedAt";

-- View para produtividade (criativos por período)
CREATE OR REPLACE VIEW creative_productivity AS
SELECT
  DATE_TRUNC('day', c."createdAt") as date,
  o.id as organization_id,
  o.name as organization_name,
  COUNT(c.id) as creatives_count,
  COUNT(DISTINCT p.id) as projects_count,
  COUNT(DISTINCT b.id) as brands_count
FROM "Creative" c
JOIN "Project" p ON p.id = c."projectId"
JOIN "Brand" b ON b.id = p."brandId"
JOIN "Organization" o ON o.id = b."organizationId"
WHERE c."createdAt" > NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', c."createdAt"), o.id, o.name
ORDER BY date DESC;

-- View para análise de projetos
CREATE OR REPLACE VIEW project_analytics AS
SELECT
  p.id,
  p.name,
  p.status,
  p."projectType",
  p."estimatedCreatives",
  COUNT(c.id) as actual_creatives,
  ROUND(COUNT(c.id)::numeric / NULLIF(p."estimatedCreatives", 0) * 100, 2) as completion_percentage,
  b.name as brand_name,
  o.name as organization_name,
  t.name as template_name,
  p."createdAt",
  p."updatedAt",
  EXTRACT(EPOCH FROM (p."updatedAt" - p."createdAt")) / 3600 as hours_in_production
FROM "Project" p
JOIN "Brand" b ON b.id = p."brandId"
JOIN "Organization" o ON o.id = b."organizationId"
LEFT JOIN "Template" t ON t.id = p."templateId"
LEFT JOIN "Creative" c ON c."projectId" = p.id
GROUP BY p.id, p.name, p.status, p."projectType", p."estimatedCreatives",
         b.name, o.name, t.name, p."createdAt", p."updatedAt";

-- View para atividade recente
CREATE OR REPLACE VIEW recent_activity AS
SELECT
  al.id,
  al.action,
  al.description,
  al."createdAt",
  u.name as user_name,
  u.email as user_email,
  o.name as organization_name,
  o.id as organization_id
FROM "ActivityLog" al
JOIN "Organization" o ON o.id = al."organizationId"
LEFT JOIN "User" u ON u.id = al."userId"
ORDER BY al."createdAt" DESC
LIMIT 100;

-- View para análise de formatos de criativos
CREATE OR REPLACE VIEW creative_formats_analysis AS
SELECT
  c.format,
  c.width,
  c.height,
  COUNT(*) as count,
  o.name as organization_name,
  p."projectType"
FROM "Creative" c
JOIN "Project" p ON p.id = c."projectId"
JOIN "Brand" b ON b.id = p."brandId"
JOIN "Organization" o ON o.id = b."organizationId"
WHERE c."createdAt" > NOW() - INTERVAL '90 days'
GROUP BY c.format, c.width, c.height, o.name, p."projectType"
ORDER BY count DESC;

-- View para análise de assets por marca
CREATE OR REPLACE VIEW brand_assets_summary AS
SELECT
  b.id as brand_id,
  b.name as brand_name,
  o.name as organization_name,
  COUNT(a.id) as total_assets,
  COUNT(a.id) FILTER (WHERE a.type = 'image') as images_count,
  COUNT(a.id) FILTER (WHERE a.type = 'pdf') as pdfs_count,
  COUNT(a.id) FILTER (WHERE a.type = 'video') as videos_count,
  SUM(a.size) as total_size_bytes,
  ROUND(SUM(a.size) / 1024.0 / 1024.0, 2) as total_size_mb
FROM "Brand" b
JOIN "Organization" o ON o.id = b."organizationId"
LEFT JOIN "Asset" a ON a."brandId" = b.id
GROUP BY b.id, b.name, o.name;

-- ============================================
-- QUERIES DE VERIFICAÇÃO DE SAÚDE
-- ============================================

-- View para verificar organizações próximas do limite
CREATE OR REPLACE VIEW organizations_near_limit AS
SELECT
  o.name,
  o."maxCreatives",
  COUNT(c.id) as current_creatives,
  ROUND((COUNT(c.id)::numeric / o."maxCreatives") * 100, 2) as usage_percentage,
  o."maxBrands",
  COUNT(DISTINCT b.id) as current_brands
FROM "Organization" o
LEFT JOIN "Brand" b ON b."organizationId" = o.id
LEFT JOIN "Project" p ON p."brandId" = b.id
LEFT JOIN "Creative" c ON c."projectId" = p.id
  AND c."createdAt" > DATE_TRUNC('month', NOW())
GROUP BY o.id, o.name, o."maxCreatives", o."maxBrands"
HAVING COUNT(c.id)::numeric / o."maxCreatives" > 0.8;

-- View para templates não utilizados
CREATE OR REPLACE VIEW unused_templates AS
SELECT
  t.id,
  t.name,
  t."templateStatus",
  t."isActive",
  b.name as brand_name,
  t."createdAt",
  t."updatedAt"
FROM "Template" t
JOIN "Brand" b ON b.id = t."brandId"
LEFT JOIN "Project" p ON p."templateId" = t.id
WHERE p.id IS NULL
  AND t."isActive" = true
  AND t."templateStatus" = 'APPROVED'
  AND t."createdAt" < NOW() - INTERVAL '30 days'
ORDER BY t."createdAt" DESC;

-- ============================================
-- PERMISSÕES
-- ============================================

-- Garantir que usuários autenticados possam ver as views
GRANT SELECT ON storage_uploads_log TO authenticated;
GRANT SELECT ON organization_storage_usage TO authenticated;
GRANT SELECT ON storage_file_types TO authenticated;
GRANT SELECT ON organization_dashboard TO authenticated;
GRANT SELECT ON template_analytics TO authenticated;
GRANT SELECT ON creative_productivity TO authenticated;
GRANT SELECT ON project_analytics TO authenticated;
GRANT SELECT ON recent_activity TO authenticated;
GRANT SELECT ON creative_formats_analysis TO authenticated;
GRANT SELECT ON brand_assets_summary TO authenticated;
GRANT SELECT ON organizations_near_limit TO authenticated;
GRANT SELECT ON unused_templates TO authenticated;

-- ============================================
-- QUERIES DE EXEMPLO
-- ============================================

-- Total de criativos por organização (últimos 30 dias)
-- SELECT * FROM organization_dashboard ORDER BY total_creatives DESC;

-- Uso de storage por organização
-- SELECT * FROM organization_storage_usage ORDER BY total_mb DESC;

-- Atividade recente
-- SELECT * FROM recent_activity LIMIT 50;

-- Templates mais utilizados
-- SELECT * FROM template_analytics ORDER BY times_used DESC LIMIT 10;

-- Produtividade diária
-- SELECT * FROM creative_productivity WHERE date > NOW() - INTERVAL '7 days';

-- Organizações próximas do limite
-- SELECT * FROM organizations_near_limit;

-- Templates não utilizados
-- SELECT * FROM unused_templates;
