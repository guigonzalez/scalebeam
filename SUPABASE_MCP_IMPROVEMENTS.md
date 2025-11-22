# Análise e Melhorias do MCP do Supabase

## 📊 Configuração Atual

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=toyzsriuzltehsrnshsp"
    }
  }
}
```

## ✅ Pontos Positivos da Configuração Atual

1. **MCP HTTP Conectado**: A conexão com o MCP do Supabase está ativa
2. **Project Ref Correto**: Usando o projeto `toyzsriuzltehsrnshsp`
3. **Service Role Key Configurada**: Permite bypass de RLS quando necessário

---

## 🚀 Melhorias Recomendadas

### 1. **Adicionar Autenticação ao MCP**

A configuração atual não inclui autenticação. Para maior segurança:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=toyzsriuzltehsrnshsp",
      "headers": {
        "Authorization": "Bearer ${SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": "${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
      }
    }
  }
}
```

### 2. **Implementar RLS Policies Robustas**

Atualmente as policies são muito permissivas. Recomendo:

#### Para Storage (Buckets: assets, briefings):

```sql
-- ============================================
-- MELHORIAS PARA BUCKET: assets
-- ============================================

-- Remover policies antigas (muito permissivas)
DROP POLICY IF EXISTS "Allow authenticated uploads to assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes to assets" ON storage.objects;

-- POLICY 1: Upload - Apenas admins e usuários da organização podem fazer upload
CREATE POLICY "Organization members can upload assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assets' AND
  (
    -- Admin pode fazer upload de qualquer coisa
    auth.jwt() ->> 'role' = 'ADMIN' OR
    -- Cliente pode fazer upload apenas para sua própria organização
    (SELECT EXISTS (
      SELECT 1 FROM "Organization" o
      INNER JOIN "User" u ON u.id = ANY(o."users")
      WHERE u.id = auth.uid()::text
      AND (storage.foldername(name))[1] = o.id
    ))
  )
);

-- POLICY 2: Read - Assets são públicos (para exibição em campanhas)
CREATE POLICY "Public read access to assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'assets');

-- POLICY 3: Update - Apenas admins e owner da organização
CREATE POLICY "Organization admins can update assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assets' AND
  (
    auth.jwt() ->> 'role' = 'ADMIN' OR
    (SELECT EXISTS (
      SELECT 1 FROM "Organization" o
      INNER JOIN "User" u ON u.id = ANY(o."users")
      WHERE u.id = auth.uid()::text
      AND (storage.foldername(name))[1] = o.id
    ))
  )
)
WITH CHECK (bucket_id = 'assets');

-- POLICY 4: Delete - Apenas admins
CREATE POLICY "Only admins can delete assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'assets' AND
  auth.jwt() ->> 'role' = 'ADMIN'
);

-- ============================================
-- MELHORIAS PARA BUCKET: briefings
-- ============================================

-- Remover policies antigas
DROP POLICY IF EXISTS "Allow authenticated uploads to briefings" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read access to briefings" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to briefings" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes to briefings" ON storage.objects;

-- POLICY 1: Upload - Apenas usuários autenticados da organização
CREATE POLICY "Organization members can upload briefings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'briefings' AND
  (
    auth.jwt() ->> 'role' = 'ADMIN' OR
    (SELECT EXISTS (
      SELECT 1 FROM "Organization" o
      INNER JOIN "User" u ON u.id = ANY(o."users")
      WHERE u.id = auth.uid()::text
      AND (storage.foldername(name))[1] = o.id
    ))
  )
);

-- POLICY 2: Read - Apenas membros da organização e admins
CREATE POLICY "Organization members can read briefings"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'briefings' AND
  (
    auth.jwt() ->> 'role' = 'ADMIN' OR
    (SELECT EXISTS (
      SELECT 1 FROM "Organization" o
      INNER JOIN "User" u ON u.id = ANY(o."users")
      WHERE u.id = auth.uid()::text
      AND (storage.foldername(name))[1] = o.id
    ))
  )
);

-- POLICY 3: Update - Apenas admins e owner
CREATE POLICY "Organization admins can update briefings"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'briefings' AND
  (
    auth.jwt() ->> 'role' = 'ADMIN' OR
    (SELECT EXISTS (
      SELECT 1 FROM "Organization" o
      INNER JOIN "User" u ON u.id = ANY(o."users")
      WHERE u.id = auth.uid()::text
      AND (storage.foldername(name))[1] = o.id
    ))
  )
)
WITH CHECK (bucket_id = 'briefings');

-- POLICY 4: Delete - Apenas admins
CREATE POLICY "Only admins can delete briefings"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'briefings' AND
  auth.jwt() ->> 'role' = 'ADMIN'
);
```

### 3. **Adicionar Índices para Performance**

```sql
-- Índices para melhorar performance de queries do Prisma
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_organization_payment ON "Organization"("paymentStatus", "nextBillingDate");
CREATE INDEX IF NOT EXISTS idx_brand_org_created ON "Brand"("organizationId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_template_brand_status ON "Template"("brandId", "templateStatus", "isActive");
CREATE INDEX IF NOT EXISTS idx_project_brand_type ON "Project"("brandId", "projectType", "status");
CREATE INDEX IF NOT EXISTS idx_creative_project_created ON "Creative"("projectId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_activity_org_created ON "ActivityLog"("organizationId", "createdAt" DESC);

-- Índice para busca full-text em templates
CREATE INDEX IF NOT EXISTS idx_template_name_trgm ON "Template" USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_project_name_trgm ON "Project" USING gin(name gin_trgm_ops);

-- Ativar extensão trigram se ainda não estiver ativa
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 4. **Configurar Row Level Security (RLS) nas Tabelas**

Atualmente o Prisma não usa RLS nas tabelas principais. Recomendo ativar:

```sql
-- Ativar RLS em todas as tabelas principais
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Brand" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Template" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Creative" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Asset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActivityLog" ENABLE ROW LEVEL SECURITY;

-- Policy para Users: Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile"
ON "User"
FOR SELECT
TO authenticated
USING (id = auth.uid()::text OR auth.jwt() ->> 'role' = 'ADMIN');

-- Policy para Organizations: Membros podem ver apenas suas organizações
CREATE POLICY "Users can view own organizations"
ON "Organization"
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'ADMIN' OR
  id = ANY(
    SELECT o.id FROM "Organization" o
    INNER JOIN "User" u ON u.id = ANY(o."users")
    WHERE u.id = auth.uid()::text
  )
);

-- Policy para Brands: Membros da organização podem ver brands
CREATE POLICY "Organization members can view brands"
ON "Brand"
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'ADMIN' OR
  "organizationId" IN (
    SELECT o.id FROM "Organization" o
    INNER JOIN "User" u ON u.id = ANY(o."users")
    WHERE u.id = auth.uid()::text
  )
);

-- Policies similares para Template, Project, Creative, Asset, ActivityLog
-- (Omitidas para brevidade, mas devem seguir o mesmo padrão)
```

### 5. **Implementar Bucket Policies (Storage)**

```sql
-- Definir tamanho máximo de upload por bucket
UPDATE storage.buckets
SET file_size_limit = 10485760 -- 10MB
WHERE id = 'assets';

UPDATE storage.buckets
SET file_size_limit = 52428800 -- 50MB
WHERE id = 'briefings';

-- Definir tipos de arquivo permitidos
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf'
]
WHERE id = 'assets';

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png'
]
WHERE id = 'briefings';
```

### 6. **Adicionar Monitoring e Logging**

Criar uma view para monitorar uploads:

```sql
-- View para monitorar uploads recentes
CREATE OR REPLACE VIEW storage_uploads_log AS
SELECT
  o.name,
  o.bucket_id,
  o.created_at,
  (o.metadata->>'size')::bigint as size_bytes,
  o.metadata->>'mimetype' as mime_type,
  (storage.foldername(o.name))[1] as organization_id
FROM storage.objects o
WHERE o.created_at > NOW() - INTERVAL '30 days'
ORDER BY o.created_at DESC;

-- View para uso de storage por organização
CREATE OR REPLACE VIEW organization_storage_usage AS
SELECT
  (storage.foldername(o.name))[1] as organization_id,
  o.bucket_id,
  COUNT(*) as file_count,
  SUM((o.metadata->>'size')::bigint) as total_bytes,
  ROUND(SUM((o.metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as total_mb
FROM storage.objects o
GROUP BY (storage.foldername(o.name))[1], o.bucket_id;
```

### 7. **Configurar Realtime (Opcional)**

Se você quiser usar Realtime para notificações em tempo real:

```sql
-- Ativar Realtime para tabelas específicas
ALTER PUBLICATION supabase_realtime ADD TABLE "Project";
ALTER PUBLICATION supabase_realtime ADD TABLE "Creative";
ALTER PUBLICATION supabase_realtime ADD TABLE "Comment";
ALTER PUBLICATION supabase_realtime ADD TABLE "ActivityLog";
```

### 8. **Adicionar Triggers para Auditoria**

```sql
-- Trigger para registrar mudanças de status em projetos
CREATE OR REPLACE FUNCTION log_project_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO "ActivityLog" (action, description, "userId", "organizationId")
    SELECT
      'project_status_changed',
      'Status do projeto "' || NEW.name || '" alterado de ' || OLD.status || ' para ' || NEW.status,
      (SELECT id FROM "User" WHERE role = 'ADMIN' LIMIT 1), -- Placeholder, idealmente pegar do contexto
      (SELECT "organizationId" FROM "Brand" WHERE id = NEW."brandId")
    WHERE NEW.status <> OLD.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_status_change_trigger
AFTER UPDATE ON "Project"
FOR EACH ROW
EXECUTE FUNCTION log_project_status_change();
```

---

## 🔒 Segurança Adicional

### 1. **Validação de JWT Customizada**

Adicione claims customizados ao JWT do NextAuth:

```typescript
// lib/auth.ts
import { JWT } from "next-auth/jwt"

export async function jwt({ token, user }: { token: JWT; user?: any }) {
  if (user) {
    token.role = user.role
    token.organizationId = user.organizationId
  }
  return token
}
```

### 2. **Rate Limiting**

Configure rate limiting no Supabase:

```sql
-- Limitar requisições por IP (configurar no dashboard do Supabase)
-- Settings > API > Rate Limiting
-- Recomendado: 100 requisições por minuto por IP
```

### 3. **Backup Automático**

Configure backups automáticos no Supabase:
- Dashboard > Settings > Backups
- Ativar **Point-in-Time Recovery (PITR)**
- Frequência: Diária
- Retenção: 30 dias

---

## 📈 Monitoramento

### Dashboard de Métricas

Crie queries para monitorar:

```sql
-- Total de criativos por organização (últimos 30 dias)
SELECT
  o.name as organization,
  COUNT(c.id) as creatives_count,
  COUNT(DISTINCT p.id) as projects_count
FROM "Organization" o
LEFT JOIN "Brand" b ON b."organizationId" = o.id
LEFT JOIN "Project" p ON p."brandId" = b.id AND p."createdAt" > NOW() - INTERVAL '30 days'
LEFT JOIN "Creative" c ON c."projectId" = p.id
GROUP BY o.id, o.name
ORDER BY creatives_count DESC;

-- Uso de storage por bucket
SELECT * FROM organization_storage_usage
ORDER BY total_mb DESC;

-- Atividade recente
SELECT
  al.action,
  al.description,
  al."createdAt",
  u.name as user_name,
  o.name as organization_name
FROM "ActivityLog" al
JOIN "Organization" o ON o.id = al."organizationId"
LEFT JOIN "User" u ON u.id = al."userId"
ORDER BY al."createdAt" DESC
LIMIT 50;
```

---

## 🚀 Próximos Passos

1. ✅ **Atualizar `.mcp.json`** com headers de autenticação
2. ✅ **Executar SQL de melhorias** no Supabase SQL Editor
3. ✅ **Testar RLS policies** com diferentes usuários
4. ✅ **Configurar backups automáticos**
5. ✅ **Implementar monitoring dashboard** (opcional)
6. ✅ **Adicionar Realtime** se necessário (opcional)

---

## 📝 Notas Importantes

- **Service Role Key**: Continue usando para operações server-side, mas combine com RLS para dupla proteção
- **RLS no Prisma**: As policies RLS funcionarão em conjunto com as validações do Prisma
- **Performance**: Os índices sugeridos melhorarão significativamente queries complexas
- **Custo**: Monitore o uso de storage para evitar custos inesperados

---

## 🔗 Recursos Úteis

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [MCP Server Protocol](https://modelcontextprotocol.io/)
