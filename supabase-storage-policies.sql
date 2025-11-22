-- Políticas RLS para Supabase Storage
-- Execute este SQL no painel do Supabase (SQL Editor)

-- ============================================
-- BUCKET: assets
-- ============================================

-- Permitir upload para usuários autenticados (admin e client)
CREATE POLICY "Allow authenticated uploads to assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'assets');

-- Permitir leitura pública dos assets
CREATE POLICY "Allow public read access to assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'assets');

-- Permitir update para usuários autenticados
CREATE POLICY "Allow authenticated updates to assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'assets')
WITH CHECK (bucket_id = 'assets');

-- Permitir delete para usuários autenticados
CREATE POLICY "Allow authenticated deletes to assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'assets');

-- ============================================
-- BUCKET: briefings
-- ============================================

-- Permitir upload para usuários autenticados
CREATE POLICY "Allow authenticated uploads to briefings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'briefings');

-- Permitir leitura para usuários autenticados
CREATE POLICY "Allow authenticated read access to briefings"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'briefings');

-- Permitir update para usuários autenticados
CREATE POLICY "Allow authenticated updates to briefings"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'briefings')
WITH CHECK (bucket_id = 'briefings');

-- Permitir delete para usuários autenticados
CREATE POLICY "Allow authenticated deletes to briefings"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'briefings');

-- ============================================
-- Verificar políticas existentes
-- ============================================

-- Para ver todas as políticas do storage:
-- SELECT * FROM storage.policies;

-- Para remover uma política (se necessário):
-- DROP POLICY IF EXISTS "policy_name" ON storage.objects;
