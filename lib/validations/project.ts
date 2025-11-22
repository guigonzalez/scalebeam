import { z } from "zod"

/**
 * Schema para criação de projeto
 */
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  brandId: z.string().cuid("ID da marca inválido"),
  templateId: z.string().cuid("ID do template inválido").optional().nullable(),
  briefingUrl: z.string().url("URL do arquivo de briefing inválida").optional().nullable(),
  briefingData: z.string().optional().nullable(),
  estimatedCreatives: z
    .number()
    .int("Número de criativos deve ser inteiro")
    .min(0, "Número de criativos não pode ser negativo")
    .max(10000, "Número de criativos não pode exceder 10.000")
    .default(0),
  newTemplateRequest: z
    .object({
      name: z.string().min(3, "Nome do template deve ter no mínimo 3 caracteres"),
      keyVisualUrl: z.string().url("URL do Key Visual inválida"),
      platforms: z.array(z.string()).min(1, "Selecione pelo menos uma plataforma"),
      formats: z.array(z.string()).min(1, "Selecione pelo menos um formato"),
    })
    .optional()
    .nullable(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

/**
 * Schema para atualização de status do projeto
 */
export const updateProjectStatusSchema = z.object({
  status: z.enum(
    ["DRAFT", "IN_PRODUCTION", "READY", "APPROVED", "REVISION"],
    {
      message: "Status de projeto inválido",
    }
  ),
  comment: z
    .string()
    .min(1, "Comentário não pode estar vazio")
    .max(500, "Comentário deve ter no máximo 500 caracteres")
    .optional(),
})

export type UpdateProjectStatusInput = z.infer<
  typeof updateProjectStatusSchema
>

/**
 * Schema para criação de criativo
 */
export const createCreativeSchema = z.object({
  name: z
    .string()
    .min(1, "Nome do criativo é obrigatório")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  url: z.string().url("URL do arquivo inválida"),
  thumbnailUrl: z.string().url("URL da thumbnail inválida").optional().nullable(),
  format: z
    .string()
    .min(2, "Formato do arquivo inválido")
    .max(10, "Formato deve ter no máximo 10 caracteres"),
  width: z
    .number()
    .int("Largura deve ser um número inteiro")
    .positive("Largura deve ser positiva")
    .max(10000, "Largura não pode exceder 10.000 pixels")
    .optional()
    .nullable(),
  height: z
    .number()
    .int("Altura deve ser um número inteiro")
    .positive("Altura deve ser positiva")
    .max(10000, "Altura não pode exceder 10.000 pixels")
    .optional()
    .nullable(),
  lista: z
    .string()
    .max(100, "Lista deve ter no máximo 100 caracteres")
    .optional()
    .nullable(),
  modelo: z
    .string()
    .max(100, "Modelo deve ter no máximo 100 caracteres")
    .optional()
    .nullable(),
})

export type CreateCreativeInput = z.infer<typeof createCreativeSchema>

/**
 * Schema para upload de múltiplos criativos
 */
export const uploadCreativesSchema = z.object({
  projectId: z.string().cuid("ID do projeto inválido"),
  creatives: z
    .array(createCreativeSchema)
    .min(1, "Pelo menos um criativo deve ser enviado")
    .max(100, "Máximo de 100 criativos por upload"),
})

export type UploadCreativesInput = z.infer<typeof uploadCreativesSchema>

/**
 * Schema para aprovação de projeto
 */
export const approveProjectSchema = z.object({
  comment: z
    .string()
    .max(500, "Comentário deve ter no máximo 500 caracteres")
    .optional(),
})

export type ApproveProjectInput = z.infer<typeof approveProjectSchema>

/**
 * Schema para solicitação de revisão
 */
export const requestRevisionSchema = z.object({
  comment: z
    .string()
    .min(10, "Comentário deve ter no mínimo 10 caracteres")
    .max(500, "Comentário deve ter no máximo 500 caracteres"),
  creativeIds: z
    .array(z.string().cuid("ID de criativo inválido"))
    .optional()
    .default([]),
})

export type RequestRevisionInput = z.infer<typeof requestRevisionSchema>

/**
 * Schema para criação de comentário
 */
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comentário não pode estar vazio")
    .max(1000, "Comentário deve ter no máximo 1000 caracteres"),
  projectId: z.string().cuid("ID do projeto inválido"),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>

/**
 * Schema para upload de arquivo de briefing
 */
export const uploadBriefingSchema = z.object({
  projectId: z.string().cuid("ID do projeto inválido"),
  csvUrl: z.string().url("URL do CSV inválida"),
  briefingData: z.string().optional().nullable(),
})

export type UploadBriefingInput = z.infer<typeof uploadBriefingSchema>
