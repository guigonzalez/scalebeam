-- ============================================
-- TRIGGERS E FUNÇÕES PARA AUTOMAÇÃO
-- Execute este arquivo no Supabase SQL Editor
-- ============================================

-- ============================================
-- FUNÇÃO: Logging automático de mudanças de status
-- ============================================

CREATE OR REPLACE FUNCTION log_project_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO "ActivityLog" (id, action, description, "userId", "organizationId", "createdAt")
    SELECT
      gen_random_uuid()::text,
      'project_status_changed',
      'Status do projeto "' || NEW.name || '" alterado de ' || OLD.status || ' para ' || NEW.status,
      (SELECT u.id FROM "User" u WHERE u.role = 'ADMIN' LIMIT 1),
      (SELECT b."organizationId" FROM "Brand" b WHERE b.id = NEW."brandId"),
      NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para mudança de status em projetos
DROP TRIGGER IF EXISTS project_status_change_trigger ON "Project";
CREATE TRIGGER project_status_change_trigger
AFTER UPDATE ON "Project"
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION log_project_status_change();

-- ============================================
-- FUNÇÃO: Atualizar contador de criativos
-- ============================================

CREATE OR REPLACE FUNCTION update_project_creative_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "Project"
  SET "totalCreatives" = (
    SELECT COUNT(*)
    FROM "Creative"
    WHERE "projectId" = COALESCE(NEW."projectId", OLD."projectId")
  )
  WHERE id = COALESCE(NEW."projectId", OLD."projectId");

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador ao adicionar/remover creative
DROP TRIGGER IF EXISTS creative_count_insert_trigger ON "Creative";
CREATE TRIGGER creative_count_insert_trigger
AFTER INSERT ON "Creative"
FOR EACH ROW
EXECUTE FUNCTION update_project_creative_count();

DROP TRIGGER IF EXISTS creative_count_delete_trigger ON "Creative";
CREATE TRIGGER creative_count_delete_trigger
AFTER DELETE ON "Creative"
FOR EACH ROW
EXECUTE FUNCTION update_project_creative_count();

-- ============================================
-- FUNÇÃO: Validar limites da organização
-- ============================================

CREATE OR REPLACE FUNCTION validate_organization_limits()
RETURNS TRIGGER AS $$
DECLARE
  v_organization_id TEXT;
  v_max_brands INT;
  v_current_brands INT;
  v_max_creatives INT;
  v_current_creatives INT;
BEGIN
  -- Pegar organizationId do brand
  SELECT b."organizationId", o."maxBrands", o."maxCreatives"
  INTO v_organization_id, v_max_brands, v_max_creatives
  FROM "Brand" b
  JOIN "Organization" o ON o.id = b."organizationId"
  WHERE b.id = NEW."brandId";

  -- Verificar limite de brands
  IF TG_TABLE_NAME = 'Brand' AND TG_OP = 'INSERT' THEN
    SELECT COUNT(*) INTO v_current_brands
    FROM "Brand"
    WHERE "organizationId" = v_organization_id;

    IF v_current_brands >= v_max_brands THEN
      RAISE EXCEPTION 'Organization has reached maximum brand limit (%)!', v_max_brands;
    END IF;
  END IF;

  -- Verificar limite de creatives (mensal)
  IF TG_TABLE_NAME = 'Creative' AND TG_OP = 'INSERT' THEN
    SELECT COUNT(*) INTO v_current_creatives
    FROM "Creative" c
    JOIN "Project" p ON p.id = c."projectId"
    JOIN "Brand" b ON b.id = p."brandId"
    WHERE b."organizationId" = v_organization_id
      AND c."createdAt" >= DATE_TRUNC('month', NOW());

    IF v_current_creatives >= v_max_creatives THEN
      RAISE EXCEPTION 'Organization has reached monthly creative limit (%)!', v_max_creatives;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para validar limites
DROP TRIGGER IF EXISTS validate_brand_limit_trigger ON "Brand";
CREATE TRIGGER validate_brand_limit_trigger
BEFORE INSERT ON "Brand"
FOR EACH ROW
EXECUTE FUNCTION validate_organization_limits();

DROP TRIGGER IF EXISTS validate_creative_limit_trigger ON "Creative";
CREATE TRIGGER validate_creative_limit_trigger
BEFORE INSERT ON "Creative"
FOR EACH ROW
EXECUTE FUNCTION validate_organization_limits();

-- ============================================
-- FUNÇÃO: Atualizar timestamp de organização
-- ============================================

CREATE OR REPLACE FUNCTION update_organization_timestamp()
RETURNS TRIGGER AS $$
DECLARE
  v_organization_id TEXT;
BEGIN
  -- Pegar organizationId dependendo da tabela
  IF TG_TABLE_NAME = 'Brand' THEN
    v_organization_id := COALESCE(NEW."organizationId", OLD."organizationId");
  ELSIF TG_TABLE_NAME = 'Project' THEN
    SELECT b."organizationId" INTO v_organization_id
    FROM "Brand" b
    WHERE b.id = COALESCE(NEW."brandId", OLD."brandId");
  ELSIF TG_TABLE_NAME = 'Creative' THEN
    SELECT b."organizationId" INTO v_organization_id
    FROM "Creative" c
    JOIN "Project" p ON p.id = c."projectId"
    JOIN "Brand" b ON b.id = p."brandId"
    WHERE c.id = COALESCE(NEW.id, OLD.id);
  END IF;

  -- Atualizar updatedAt da organização
  IF v_organization_id IS NOT NULL THEN
    UPDATE "Organization"
    SET "updatedAt" = NOW()
    WHERE id = v_organization_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar timestamp
DROP TRIGGER IF EXISTS brand_update_org_timestamp ON "Brand";
CREATE TRIGGER brand_update_org_timestamp
AFTER INSERT OR UPDATE OR DELETE ON "Brand"
FOR EACH ROW
EXECUTE FUNCTION update_organization_timestamp();

DROP TRIGGER IF EXISTS project_update_org_timestamp ON "Project";
CREATE TRIGGER project_update_org_timestamp
AFTER INSERT OR UPDATE OR DELETE ON "Project"
FOR EACH ROW
EXECUTE FUNCTION update_organization_timestamp();

-- ============================================
-- FUNÇÃO: Logging automático de criação
-- ============================================

CREATE OR REPLACE FUNCTION log_resource_creation()
RETURNS TRIGGER AS $$
DECLARE
  v_organization_id TEXT;
  v_description TEXT;
  v_action TEXT;
BEGIN
  -- Determinar descrição e action baseado na tabela
  IF TG_TABLE_NAME = 'Brand' THEN
    v_action := 'brand_created';
    v_description := 'Marca "' || NEW.name || '" criada';
    v_organization_id := NEW."organizationId";
  ELSIF TG_TABLE_NAME = 'Template' THEN
    v_action := 'template_created';
    v_description := 'Template "' || NEW.name || '" criado';
    SELECT b."organizationId" INTO v_organization_id
    FROM "Brand" b WHERE b.id = NEW."brandId";
  ELSIF TG_TABLE_NAME = 'Project' THEN
    v_action := 'project_created';
    v_description := 'Projeto "' || NEW.name || '" criado';
    SELECT b."organizationId" INTO v_organization_id
    FROM "Brand" b WHERE b.id = NEW."brandId";
  ELSE
    RETURN NEW;
  END IF;

  -- Inserir log
  INSERT INTO "ActivityLog" (id, action, description, "userId", "organizationId", "createdAt")
  VALUES (
    gen_random_uuid()::text,
    v_action,
    v_description,
    (SELECT u.id FROM "User" u WHERE u.role = 'ADMIN' LIMIT 1),
    v_organization_id,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para logging de criação
DROP TRIGGER IF EXISTS brand_creation_log_trigger ON "Brand";
CREATE TRIGGER brand_creation_log_trigger
AFTER INSERT ON "Brand"
FOR EACH ROW
EXECUTE FUNCTION log_resource_creation();

DROP TRIGGER IF EXISTS template_creation_log_trigger ON "Template";
CREATE TRIGGER template_creation_log_trigger
AFTER INSERT ON "Template"
FOR EACH ROW
EXECUTE FUNCTION log_resource_creation();

DROP TRIGGER IF EXISTS project_creation_log_trigger ON "Project";
CREATE TRIGGER project_creation_log_trigger
AFTER INSERT ON "Project"
FOR EACH ROW
EXECUTE FUNCTION log_resource_creation();

-- ============================================
-- FUNÇÃO: Validar status de pagamento
-- ============================================

CREATE OR REPLACE FUNCTION validate_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_organization_id TEXT;
  v_payment_status TEXT;
BEGIN
  -- Pegar organizationId e status de pagamento
  IF TG_TABLE_NAME = 'Project' THEN
    SELECT b."organizationId", o."paymentStatus"
    INTO v_organization_id, v_payment_status
    FROM "Brand" b
    JOIN "Organization" o ON o.id = b."organizationId"
    WHERE b.id = NEW."brandId";
  END IF;

  -- Bloquear criação se pagamento suspenso
  IF v_payment_status = 'suspended' THEN
    RAISE EXCEPTION 'Cannot create project: Organization payment is suspended';
  END IF;

  -- Avisar se pagamento atrasado
  IF v_payment_status = 'overdue' THEN
    RAISE WARNING 'Organization payment is overdue';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar pagamento
DROP TRIGGER IF EXISTS validate_payment_trigger ON "Project";
CREATE TRIGGER validate_payment_trigger
BEFORE INSERT ON "Project"
FOR EACH ROW
EXECUTE FUNCTION validate_payment_status();

-- ============================================
-- FUNÇÃO: Auto-aprovar templates de admin
-- ============================================

CREATE OR REPLACE FUNCTION auto_approve_admin_templates()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o template está sendo criado como APPROVED, logar a aprovação
  IF NEW."templateStatus" = 'APPROVED' AND (OLD IS NULL OR OLD."templateStatus" != 'APPROVED') THEN
    INSERT INTO "ActivityLog" (id, action, description, "userId", "organizationId", "createdAt")
    SELECT
      gen_random_uuid()::text,
      'template_approved',
      'Template "' || NEW.name || '" aprovado',
      (SELECT u.id FROM "User" u WHERE u.role = 'ADMIN' LIMIT 1),
      (SELECT b."organizationId" FROM "Brand" b WHERE b.id = NEW."brandId"),
      NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-aprovação
DROP TRIGGER IF EXISTS auto_approve_template_trigger ON "Template";
CREATE TRIGGER auto_approve_template_trigger
AFTER INSERT OR UPDATE ON "Template"
FOR EACH ROW
EXECUTE FUNCTION auto_approve_admin_templates();

-- ============================================
-- FUNÇÃO: Cleanup de templates órfãos
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_orphan_templates()
RETURNS void AS $$
BEGIN
  -- Desativar templates que não foram usados em 90 dias e não têm projetos
  UPDATE "Template"
  SET "isActive" = false
  WHERE "isActive" = true
    AND "createdAt" < NOW() - INTERVAL '90 days'
    AND NOT EXISTS (
      SELECT 1 FROM "Project" p WHERE p."templateId" = "Template".id
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Ver todas as funções criadas
SELECT
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  t.typname as return_type
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_type t ON p.prorettype = t.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%log%' OR p.proname LIKE '%validate%' OR p.proname LIKE '%update%'
ORDER BY p.proname;

-- Ver todos os triggers
SELECT
  event_object_table AS table_name,
  trigger_name,
  event_manipulation AS event,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
