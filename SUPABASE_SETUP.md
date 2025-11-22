# Configuração do Supabase Storage

## Problema: RLS (Row-Level Security) bloqueando uploads

O erro "new row violates row-level security policy" acontece porque o Supabase Storage tem políticas de segurança que bloqueiam uploads não autorizados.

## Solução: Usar Service Role Key

### 1. Obter a Service Role Key

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie a **service_role key** (⚠️ **ATENÇÃO**: Esta chave bypassa RLS, mantenha segura!)

### 2. Adicionar ao `.env.local`

Adicione a linha:

```bash
SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key_aqui
```

### 3. Adicionar ao Vercel

No painel do Vercel:

1. Vá em **Settings** → **Environment Variables**
2. Adicione:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: (cole a chave)
   - **Environment**: Production, Preview, Development

### 4. Redeploy

Após adicionar a variável no Vercel, faça um redeploy:

```bash
vercel --prod
```

---

## Alternativa: Configurar Políticas RLS

Se preferir não usar a Service Role Key, você pode configurar políticas RLS no Supabase:

### Execute no SQL Editor do Supabase:

```sql
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

-- Repetir para bucket 'briefings'
CREATE POLICY "Allow authenticated uploads to briefings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'briefings');

CREATE POLICY "Allow authenticated read access to briefings"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'briefings');
```

**Nota**: Mesmo com as políticas RLS, é recomendado usar a Service Role Key para uploads do servidor, pois é mais seguro e confiável.

---

## Verificar Configuração

Depois de configurar, teste fazendo upload de um asset em:
- Admin: Criar template
- Cliente: Upload de logo ao criar marca
- Cliente: Upload de assets na página de assets da marca

O erro RLS não deve mais aparecer! ✅
