-- ============================================
-- HOTFIX: Corrigir triggers que causam erro "column new does not exist"
-- Execute este arquivo IMEDIATAMENTE no Supabase SQL Editor
-- ============================================

-- Problema 1: update_organization_timestamp estava usando c.id incorretamente
-- Problema 2: validate_organization_limits tentava acessar NEW."brandId" em Creative (não existe)
-- Solução: Buscar brandId através do projectId para Creative

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
    -- Corrigido: buscar diretamente usando NEW/OLD projectId
    SELECT b."organizationId" INTO v_organization_id
    FROM "Project" p
    JOIN "Brand" b ON b.id = p."brandId"
    WHERE p.id = COALESCE(NEW."projectId", OLD."projectId");
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

-- ============================================
-- CORREÇÃO 2: validate_organization_limits
-- ============================================

CREATE OR REPLACE FUNCTION validate_organization_limits()
RETURNS TRIGGER AS $$
DECLARE
  v_organization_id TEXT;
  v_max_brands INT;
  v_current_brands INT;
  v_max_creatives INT;
  v_current_creatives INT;
  v_brand_id TEXT;
BEGIN
  -- Pegar brandId dependendo da tabela
  IF TG_TABLE_NAME = 'Brand' THEN
    v_brand_id := NEW.id;
  ELSIF TG_TABLE_NAME = 'Creative' THEN
    SELECT p."brandId" INTO v_brand_id
    FROM "Project" p
    WHERE p.id = NEW."projectId";
  END IF;

  -- Pegar organizationId do brand
  SELECT b."organizationId", o."maxBrands", o."maxCreatives"
  INTO v_organization_id, v_max_brands, v_max_creatives
  FROM "Brand" b
  JOIN "Organization" o ON o.id = b."organizationId"
  WHERE b.id = v_brand_id;

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

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se as funções foram atualizadas
SELECT
  p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('update_organization_timestamp', 'validate_organization_limits')
ORDER BY p.proname;
