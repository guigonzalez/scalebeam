-- ============================================
-- MELHORIAS DE SEGURANÇA PARA STORAGE
-- Execute este arquivo no Supabase SQL Editor
-- ============================================

-- ============================================
-- BUCKET: assets
-- ============================================

-- Remover policies antigas (muito permissivas)
DROP POLICY IF EXISTS "Allow authenticated uploads to assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes to assets" ON storage.objects;

-- POLICY 1: Upload - Apenas admins e usuários da organização
CREATE POLICY "Organization members can upload assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assets' AND
  (
    -- Admin pode fazer upload de qualquer coisa
    (SELECT role::text FROM "User" WHERE email = auth.jwt() ->> 'email') = 'ADMIN' OR
    -- Cliente pode fazer upload apenas para sua própria organização
    (SELECT EXISTS (
      SELECT 1 FROM "Brand" b
      INNER JOIN "Organization" o ON o.id = b."organizationId"
      INNER JOIN "_OrganizationToUser" otu ON otu."A" = o.id
      INNER JOIN "User" u ON u.id = otu."B"
      WHERE u.email = auth.jwt() ->> 'email'
      AND (storage.foldername(storage.objects.name))[1] = o.id
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
    (SELECT role::text FROM "User" WHERE email = auth.jwt() ->> 'email') = 'ADMIN' OR
    (SELECT EXISTS (
      SELECT 1 FROM "Brand" b
      INNER JOIN "Organization" o ON o.id = b."organizationId"
      INNER JOIN "_OrganizationToUser" otu ON otu."A" = o.id
      INNER JOIN "User" u ON u.id = otu."B"
      WHERE u.email = auth.jwt() ->> 'email'
      AND (storage.foldername(storage.objects.name))[1] = o.id
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
  (SELECT role::text FROM "User" WHERE email = auth.jwt() ->> 'email') = 'ADMIN'
);

-- ============================================
-- BUCKET: briefings
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
    (SELECT role::text FROM "User" WHERE email = auth.jwt() ->> 'email') = 'ADMIN' OR
    (SELECT EXISTS (
      SELECT 1 FROM "Brand" b
      INNER JOIN "Organization" o ON o.id = b."organizationId"
      INNER JOIN "_OrganizationToUser" otu ON otu."A" = o.id
      INNER JOIN "User" u ON u.id = otu."B"
      WHERE u.email = auth.jwt() ->> 'email'
      AND (storage.foldername(storage.objects.name))[1] = o.id
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
    (SELECT role::text FROM "User" WHERE email = auth.jwt() ->> 'email') = 'ADMIN' OR
    (SELECT EXISTS (
      SELECT 1 FROM "Brand" b
      INNER JOIN "Organization" o ON o.id = b."organizationId"
      INNER JOIN "_OrganizationToUser" otu ON otu."A" = o.id
      INNER JOIN "User" u ON u.id = otu."B"
      WHERE u.email = auth.jwt() ->> 'email'
      AND (storage.foldername(storage.objects.name))[1] = o.id
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
    (SELECT role::text FROM "User" WHERE email = auth.jwt() ->> 'email') = 'ADMIN' OR
    (SELECT EXISTS (
      SELECT 1 FROM "Brand" b
      INNER JOIN "Organization" o ON o.id = b."organizationId"
      INNER JOIN "_OrganizationToUser" otu ON otu."A" = o.id
      INNER JOIN "User" u ON u.id = otu."B"
      WHERE u.email = auth.jwt() ->> 'email'
      AND (storage.foldername(storage.objects.name))[1] = o.id
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
  (SELECT role::text FROM "User" WHERE email = auth.jwt() ->> 'email') = 'ADMIN'
);

-- ============================================
-- CONFIGURAÇÃO DOS BUCKETS
-- ============================================

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

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Ver todas as policies do storage (RLS policies)
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%assets%' OR policyname LIKE '%briefings%'
ORDER BY policyname;

-- Ver configuração dos buckets
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('assets', 'briefings');
