# Sprint 1.1: Sistema de Upload (Supabase Storage)

**Data de implementação:** Janeiro 2025
**Status:** ✅ Concluído

## Objetivo

Implementar sistema completo de upload de arquivos usando Supabase Storage, com validação de tipos e tamanhos, suporte a buckets públicos e privados, e geração de URLs assinadas.

## Implementações Realizadas

### 1. Instalação de Dependências

```bash
npm install @supabase/supabase-js
```

### 2. Configuração de Buckets no Supabase

Foram criados 6 buckets no Supabase Dashboard:

**Buckets Públicos:**
- `brand-logos` - Logos das marcas
- `templates` - Templates de campanhas
- `creatives` - Criativos finais

**Buckets Privados:**
- `brand-books` - Manuais de marca (acesso restrito)
- `briefings` - Arquivos CSV de briefing
- `assets` - Assets diversos das marcas

### 3. Biblioteca de Storage (`lib/supabase-storage.ts`)

Arquivo criado com funções utilitárias para gerenciar arquivos no Supabase Storage.

#### Constantes de Validação

```typescript
export const ALLOWED_FILE_TYPES = {
  images: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  videos: ["video/mp4", "video/quicktime"],
  documents: ["application/pdf"],
  spreadsheets: [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
}

export const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024,      // 10MB
  video: 100 * 1024 * 1024,     // 100MB
  document: 5 * 1024 * 1024,    // 5MB
  spreadsheet: 2 * 1024 * 1024, // 2MB
}
```

#### Funções Principais

**uploadFile**
- Faz upload de arquivos para buckets
- Suporta File ou Buffer
- Opção de sobrescrever ou não (upsert)
- Retorna dados do arquivo enviado

**getPublicUrl**
- Gera URL pública para arquivos em buckets públicos
- Retorna URL que pode ser acessada diretamente

**getSignedUrl**
- Gera URL assinada temporária para buckets privados
- Tempo de expiração configurável (padrão: 1 hora)
- Ideal para compartilhamento seguro de arquivos privados

**deleteFile**
- Remove arquivos de buckets
- Suporta deleção por caminho

**listFiles**
- Lista arquivos em um diretório específico
- Útil para navegação em pastas

**Funções de Validação:**
- `validateFileType` - Valida tipo MIME do arquivo
- `validateFileSize` - Valida tamanho do arquivo
- `generateUniqueFileName` - Gera nome único com timestamp + random string

### 4. Endpoint de Upload (`app/api/upload/route.ts`)

**POST /api/upload**

Endpoint protegido por autenticação para upload de arquivos.

**Request:**
- Tipo: `multipart/form-data`
- Campos:
  - `file` (File) - Arquivo a ser enviado
  - `bucket` (string) - Nome do bucket de destino
  - `folder` (string, opcional) - Pasta dentro do bucket

**Validações:**
- Autenticação obrigatória
- Tipo de arquivo permitido
- Tamanho dentro do limite
- Bucket especificado

**Fluxo:**
1. Verifica autenticação
2. Extrai arquivo e parâmetros do FormData
3. Determina tipo e limites baseado no MIME type
4. Valida tipo e tamanho
5. Gera nome único
6. Converte para Buffer
7. Faz upload para Supabase
8. Retorna URL pública

**Response (Success 200):**
```json
{
  "success": true,
  "url": "https://...",
  "path": "folder/timestamp-random.ext",
  "bucket": "brand-logos",
  "fileName": "timestamp-random.ext",
  "originalName": "logo.png",
  "size": 123456,
  "type": "image/png"
}
```

**Response (Error 400):**
```json
{
  "error": "File type not allowed"
}
```

### 5. Endpoint de URL Assinada (`app/api/files/signed-url/route.ts`)

**POST /api/files/signed-url**

Gera URLs temporárias para acesso a arquivos privados.

**Request:**
```json
{
  "bucket": "brand-books",
  "path": "cliente1/manual-marca.pdf",
  "expiresIn": 3600
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "signedUrl": "https://...?token=...",
  "expiresIn": 3600
}
```

**Casos de Uso:**
- Compartilhar brand books temporariamente
- Permitir download de briefings
- Acesso temporário a assets privados

## Segurança

### Validações Implementadas

1. **Autenticação obrigatória** em todos os endpoints
2. **Validação de tipo de arquivo** - apenas tipos permitidos
3. **Validação de tamanho** - limites por tipo de arquivo
4. **Nomes únicos** - previne sobrescrita acidental
5. **Buckets separados** - públicos vs privados
6. **URLs assinadas** - acesso temporário e seguro

### Proteções

- Nenhum arquivo é aceito sem autenticação
- Tipos de arquivo restritos por categoria
- Tamanhos limitados para evitar sobrecarga
- URLs privadas expiram automaticamente

## Exemplos de Uso

### Upload de Logo de Marca

```typescript
const formData = new FormData()
formData.append('file', logoFile)
formData.append('bucket', 'brand-logos')
formData.append('folder', brandId)

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
})

const { url, fileName } = await response.json()
// url pode ser usado diretamente em <img>
```

### Upload de CSV de Briefing

```typescript
const formData = new FormData()
formData.append('file', csvFile)
formData.append('bucket', 'briefings')
formData.append('folder', projectId)

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
})

const { url } = await response.json()
// Salvar URL no projeto
```

### Gerar URL Assinada para Brand Book

```typescript
const response = await fetch('/api/files/signed-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bucket: 'brand-books',
    path: 'cliente1/manual-marca.pdf',
    expiresIn: 7200, // 2 horas
  }),
})

const { signedUrl } = await response.json()
// signedUrl expira em 2 horas
```

## Estrutura de Pastas Recomendada

```
brand-logos/
  └── {brandId}/
      └── timestamp-random.png

brand-books/
  └── {brandId}/
      └── timestamp-random.pdf

templates/
  └── {templateId}/
      └── timestamp-random.jpg

creatives/
  └── {projectId}/
      └── timestamp-random.mp4

briefings/
  └── {projectId}/
      └── timestamp-random.csv

assets/
  └── {brandId}/
      └── timestamp-random.png
```

## Testes Realizados

- ✅ Upload de imagens (JPG, PNG, WebP, GIF)
- ✅ Upload de vídeos (MP4)
- ✅ Upload de PDFs
- ✅ Upload de CSVs
- ✅ Validação de tipo de arquivo
- ✅ Validação de tamanho
- ✅ Geração de nomes únicos
- ✅ URLs públicas funcionando
- ✅ URLs assinadas com expiração

## Limitações e Considerações

1. **Tamanhos máximos:**
   - Imagens: 10MB
   - Vídeos: 100MB
   - PDFs: 5MB
   - CSVs: 2MB

2. **Performance:**
   - Arquivos grandes podem demorar para upload
   - Considerar implementar upload com progress bar no futuro

3. **Storage:**
   - Monitorar uso do Supabase Storage
   - Implementar limpeza de arquivos órfãos no futuro

## Próximos Passos

- [ ] Implementar progress bar para uploads grandes
- [ ] Adicionar compressão automática de imagens
- [ ] Implementar cleanup de arquivos não utilizados
- [ ] Adicionar thumbnails automáticos para vídeos
- [ ] Implementar cache de URLs assinadas

## Arquivos Criados/Modificados

### Novos Arquivos
- `lib/supabase-storage.ts` - Biblioteca de storage
- `app/api/upload/route.ts` - Endpoint de upload
- `app/api/files/signed-url/route.ts` - Endpoint de URLs assinadas

### Dependências Adicionadas
- `@supabase/supabase-js` - SDK do Supabase

## Conclusão

O sistema de upload está completo e funcional, com suporte para múltiplos tipos de arquivos, validações robustas, e integração com Supabase Storage. Os endpoints estão protegidos por autenticação e prontos para uso em produção.
