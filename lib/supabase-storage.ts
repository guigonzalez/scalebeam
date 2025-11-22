import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Cliente público (com RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente de serviço (bypassa RLS) - usar apenas server-side
// Se não houver service role key, usa o cliente público (fallback para desenvolvimento)
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : supabase

/**
 * Tipos de arquivos permitidos
 */
export const ALLOWED_FILE_TYPES = {
  images: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  videos: ["video/mp4", "video/quicktime"],
  documents: ["application/pdf"],
  spreadsheets: [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
} as const

/**
 * Tamanhos máximos por tipo (em bytes)
 */
export const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  document: 50 * 1024 * 1024, // 50MB (aumentado para brandbooks)
  spreadsheet: 2 * 1024 * 1024, // 2MB
} as const

/**
 * Upload de arquivo para bucket (client-side ou com RLS)
 */
export async function uploadFile({
  bucket,
  path,
  file,
  contentType,
}: {
  bucket: string
  path: string
  file: File | Buffer
  contentType?: string
}) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: false, // Não sobrescrever arquivos existentes
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  return data
}

/**
 * Upload de arquivo para bucket (server-side, bypassa RLS)
 * Usar esta função em rotas API do servidor
 */
export async function uploadFileAdmin({
  bucket,
  path,
  file,
  contentType,
}: {
  bucket: string
  path: string
  file: File | Buffer
  contentType?: string
}) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: false,
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  return data
}

/**
 * Gerar URL pública (para buckets públicos)
 */
export function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Gerar URL assinada (para buckets privados)
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600 // 1 hora por padrão
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`)
  }

  return data.signedUrl
}

/**
 * Deletar arquivo
 */
export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}

/**
 * Listar arquivos em um diretório
 */
export async function listFiles(bucket: string, path: string = "") {
  const { data, error } = await supabase.storage.from(bucket).list(path)

  if (error) {
    throw new Error(`List failed: ${error.message}`)
  }

  return data
}

/**
 * Validar tipo de arquivo
 */
export function validateFileType(
  file: File,
  allowedTypes: readonly string[]
): boolean {
  return allowedTypes.includes(file.type)
}

/**
 * Validar tamanho de arquivo
 */
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize
}

/**
 * Gerar nome único para arquivo
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 15)
  const extension = originalName.split(".").pop()
  return `${timestamp}-${randomStr}.${extension}`
}
