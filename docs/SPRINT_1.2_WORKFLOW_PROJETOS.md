# Sprint 1.2: Workflow de Projetos

**Data de implementação:** Janeiro 2025
**Status:** ✅ Concluído

## Objetivo

Implementar o workflow completo de criação e gerenciamento de projetos, incluindo criação, adição de criativos, mudança de status, e integração com o formulário de criação no frontend.

## Implementações Realizadas

### 1. Instalação de Dependências

```bash
npm install zod
```

Zod é usado para validação de schemas e type-safety em toda a aplicação.

### 2. Schemas de Validação (`lib/validations/project.ts`)

Arquivo criado com todos os schemas de validação usando Zod.

#### createProjectSchema

Valida dados para criação de projeto:

```typescript
{
  name: string (3-100 chars),
  brandId: string (CUID),
  templateId?: string | null (CUID),
  briefingCsvUrl?: string | null (URL),
  briefingData?: string | null,
  estimatedCreatives: number (0-10000, default: 0)
}
```

#### uploadCreativesSchema

Valida upload em lote de criativos:

```typescript
{
  projectId: string (CUID),
  creatives: Array (1-100 items) [
    {
      name: string (1-200 chars),
      url: string (URL),
      thumbnailUrl?: string | null (URL),
      format: string (2-10 chars),
      width?: number | null (1-10000),
      height?: number | null (1-10000),
      lista?: string | null (max 100 chars),
      modelo?: string | null (max 100 chars)
    }
  ]
}
```

#### updateProjectStatusSchema

Valida mudança de status:

```typescript
{
  status: "DRAFT" | "IN_PRODUCTION" | "READY" | "APPROVED" | "REVISION",
  comment?: string (1-500 chars)
}
```

#### Outros Schemas

- `approveProjectSchema` - Aprovação de projeto
- `requestRevisionSchema` - Solicitação de revisão
- `createCommentSchema` - Criação de comentário
- `uploadBriefingSchema` - Upload de briefing

### 3. API de Projetos (`app/api/client/projects/route.ts`)

#### GET /api/client/projects

Lista projetos do usuário autenticado.

**Query Parameters:**
- `status` (opcional) - Filtrar por status
- `brandId` (opcional) - Filtrar por marca

**Autorização:**
- Clientes veem apenas projetos das suas organizações
- Admins veem todos os projetos

**Response:**
```json
{
  "success": true,
  "projects": [
    {
      "id": "...",
      "name": "Campanha Black Friday",
      "status": "IN_PRODUCTION",
      "estimatedCreatives": 50,
      "totalCreatives": 30,
      "createdAt": "2025-01-19T...",
      "updatedAt": "2025-01-19T...",
      "brand": {
        "id": "...",
        "name": "Marca ABC",
        "organizationId": "..."
      },
      "template": {
        "id": "...",
        "name": "Template Stories",
        "imageUrl": "https://..."
      },
      "_count": {
        "creatives": 30,
        "comments": 5
      }
    }
  ]
}
```

#### POST /api/client/projects

Cria novo projeto.

**Request:**
```json
{
  "name": "Campanha Black Friday 2024",
  "brandId": "...",
  "templateId": "...",
  "briefingCsvUrl": "https://...",
  "estimatedCreatives": 50
}
```

**Validações:**
1. Autenticação obrigatória
2. Schema Zod
3. Marca existe e pertence a organização do usuário
4. Limite de criativos da organização não excedido
5. Template existe (se fornecido)

**Fluxo:**
1. Valida dados com Zod
2. Verifica se marca existe e usuário tem acesso
3. Calcula criativos disponíveis na organização
4. Valida se estimativa não excede limite
5. Verifica se template existe (se fornecido)
6. Cria projeto com status DRAFT
7. Registra atividade no log
8. Retorna projeto criado

**Response (201):**
```json
{
  "success": true,
  "project": {
    "id": "...",
    "name": "Campanha Black Friday 2024",
    "brandId": "...",
    "templateId": "...",
    "briefingCsvUrl": "https://...",
    "estimatedCreatives": 50,
    "totalCreatives": null,
    "status": "DRAFT",
    "createdAt": "...",
    "updatedAt": "...",
    "brand": { ... },
    "template": { ... }
  }
}
```

**Errors:**
- 400: Dados inválidos (com detalhes dos erros Zod)
- 403: Sem permissão para criar projeto nesta marca
- 404: Marca ou template não encontrado
- 400: Limite de criativos excedido

### 4. API de Criativos (`app/api/projects/[id]/creatives/route.ts`)

#### GET /api/projects/[id]/creatives

Lista criativos de um projeto.

**Autorização:**
- Clientes só podem ver criativos de projetos das suas organizações
- Admins podem ver todos

**Response:**
```json
{
  "success": true,
  "creatives": [
    {
      "id": "...",
      "name": "Banner 1 - Produto A",
      "url": "https://...",
      "thumbnailUrl": "https://...",
      "format": "jpg",
      "width": 1920,
      "height": 1080,
      "lista": "Produto A",
      "modelo": "Template 1",
      "createdAt": "..."
    }
  ],
  "total": 50
}
```

#### POST /api/projects/[id]/creatives

Adiciona criativos em lote a um projeto.

**Request:**
```json
{
  "creatives": [
    {
      "name": "Banner 1 - Produto A",
      "url": "https://...",
      "thumbnailUrl": "https://...",
      "format": "jpg",
      "width": 1920,
      "height": 1080,
      "lista": "Produto A",
      "modelo": "Template 1"
    },
    // ... até 100 criativos
  ]
}
```

**Validações:**
1. Autenticação obrigatória
2. Schema Zod (1-100 criativos por vez)
3. Projeto existe e usuário tem acesso
4. Projeto não está APPROVED
5. Limite de criativos da organização não excedido

**Fluxo:**
1. Valida dados com Zod
2. Busca projeto e verifica permissões
3. Verifica se projeto não está aprovado
4. Calcula criativos disponíveis na organização
5. Valida quantidade a adicionar
6. Cria todos os criativos em transação
7. Atualiza totalCreatives do projeto
8. Registra atividade no log
9. Retorna criativos criados

**Response (201):**
```json
{
  "success": true,
  "creatives": [ ... ],
  "total": 50,
  "project": {
    "id": "...",
    "name": "...",
    "totalCreatives": 50
  }
}
```

**Errors:**
- 400: Dados inválidos, limite excedido, ou projeto aprovado
- 403: Sem permissão
- 404: Projeto não encontrado

### 5. API de Status (`app/api/projects/[id]/status/route.ts`)

#### PATCH /api/projects/[id]/status

Atualiza status do projeto com validação de transições.

**Request:**
```json
{
  "status": "IN_PRODUCTION",
  "comment": "Iniciando produção dos criativos"
}
```

**Regras de Transição:**

```
DRAFT
  └─→ IN_PRODUCTION

IN_PRODUCTION
  ├─→ READY
  └─→ DRAFT (rollback)

READY
  ├─→ APPROVED (final)
  ├─→ REVISION
  └─→ IN_PRODUCTION (rollback)

REVISION
  └─→ IN_PRODUCTION

APPROVED
  └─→ (nenhuma transição permitida - status final)
```

**Validações Específicas:**
- `IN_PRODUCTION`: Projeto deve ter pelo menos 1 criativo
- `READY`: Projeto deve ter pelo menos 1 criativo
- `APPROVED`: Status final, não pode ser alterado

**Fluxo:**
1. Valida dados com Zod
2. Busca projeto e verifica permissões
3. Valida transição de status permitida
4. Aplica validações específicas do status
5. Atualiza status do projeto
6. Adiciona comentário se fornecido
7. Registra atividade no log com labels traduzidos
8. Retorna projeto atualizado

**Response (200):**
```json
{
  "success": true,
  "project": { ... },
  "previousStatus": "DRAFT",
  "newStatus": "IN_PRODUCTION"
}
```

**Errors:**
- 400: Transição inválida ou validação específica falhou
- 403: Sem permissão
- 404: Projeto não encontrado

### 6. Frontend - Formulário de Criação (`app/client/projects/new/page.tsx`)

Atualizado para usar as APIs reais.

#### Alterações Principais

**Estados Adicionados:**
```typescript
const [isSubmitting, setIsSubmitting] = useState(false)
const [isUploadingBriefing, setIsUploadingBriefing] = useState(false)
```

**Função handleSubmit Atualizada:**

```typescript
async function handleSubmit() {
  // 1. Validações locais

  // 2. Upload de briefing (se houver)
  let briefingCsvUrl = null
  if (briefingFile) {
    setIsUploadingBriefing(true)
    const formData = new FormData()
    formData.append("file", briefingFile)
    formData.append("bucket", "briefings")
    formData.append("folder", selectedBrandId)

    const uploadResponse = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    const uploadData = await uploadResponse.json()
    briefingCsvUrl = uploadData.url
  }

  // 3. Criar projeto
  const projectData = {
    name: projectName,
    brandId: selectedBrandId,
    templateId: requestNewTemplate ? null : selectedTemplateId,
    briefingCsvUrl,
    estimatedCreatives: parseInt(totalCreatives),
  }

  const projectResponse = await fetch("/api/client/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(projectData),
  })

  const { project } = await projectResponse.json()

  // 4. Redirecionar para página do projeto
  window.location.href = `/client/projects/${project.id}`
}
```

**Loading States:**
```typescript
<Button
  onClick={handleSubmit}
  disabled={isSubmitting}
>
  {isSubmitting ? (
    isUploadingBriefing ? "Uploading briefing..." : "Criando projeto..."
  ) : (
    "Criar Projeto"
  )}
</Button>
```

**Tratamento de Erros:**
```typescript
try {
  // ... criação do projeto
  toast.success("Projeto criado com sucesso!")
} catch (error: any) {
  toast.error(error.message || "Erro ao criar projeto")
  setIsSubmitting(false)
  setIsUploadingBriefing(false)
}
```

## Fluxo Completo de Criação de Projeto

1. **Usuário preenche formulário**
   - Nome do projeto
   - Seleciona marca
   - Define total de criativos estimado
   - Seleciona template OU solicita novo
   - Upload de CSV de briefing (opcional)

2. **Upload de Briefing (se houver)**
   - POST /api/upload
   - Arquivo enviado para bucket "briefings"
   - URL retornada

3. **Criação do Projeto**
   - POST /api/client/projects
   - Dados validados com Zod
   - Verificações de permissão e limites
   - Projeto criado com status DRAFT
   - Atividade registrada

4. **Redirecionamento**
   - Usuário é redirecionado para página do projeto
   - Toast de sucesso mostrado

## Segurança

### Validações por Camada

**Frontend:**
- Validações básicas de campos obrigatórios
- Feedback visual imediato

**API:**
- Validação com Zod schemas
- Verificação de autenticação
- Verificação de permissões (organizações)
- Validação de limites (criativos, tamanhos)
- Validação de transições de status
- Validação de existência de recursos relacionados

**Database:**
- Foreign keys garantem integridade
- Índices otimizam queries filtradas por organização

### Autorização

**Nível de Organização:**
- Clientes só acessam recursos das suas organizações
- Admins têm acesso global
- Filtros WHERE automáticos baseados em organizationIds

**Validação de Limites:**
- maxCreatives por organização
- Verificado antes de criar projeto ou adicionar criativos
- Previne estouro de limite

## Activity Logging

Todas as ações importantes são registradas:

```typescript
await prisma.activityLog.create({
  data: {
    action: "created_project",
    description: `Projeto "${project.name}" criado para a marca ${brand.name}`,
    userId: session.user.id,
    organizationId: brand.organizationId,
  },
})
```

**Ações Registradas:**
- `created_project` - Criação de projeto
- `uploaded_creatives` - Upload de criativos
- `updated_project_status` - Mudança de status

## Testes Realizados

- ✅ Criação de projeto com todos os campos
- ✅ Criação de projeto sem template (solicitar novo)
- ✅ Criação de projeto com upload de briefing
- ✅ Validação de limites de criativos
- ✅ Validação de permissões (cliente vs admin)
- ✅ Upload de criativos em lote (até 100)
- ✅ Mudança de status com validações
- ✅ Transições de status inválidas bloqueadas
- ✅ Loading states no frontend
- ✅ Tratamento de erros
- ✅ Activity logging

## Exemplos de Uso

### Criar Projeto via API

```typescript
const response = await fetch('/api/client/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Campanha Verão 2024',
    brandId: 'clx...',
    templateId: 'clx...',
    estimatedCreatives: 100,
  }),
})

const { project } = await response.json()
```

### Adicionar Criativos ao Projeto

```typescript
const response = await fetch(`/api/projects/${projectId}/creatives`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    creatives: [
      {
        name: 'Banner Stories 1',
        url: 'https://...',
        format: 'jpg',
        width: 1080,
        height: 1920,
      },
      // ... mais criativos
    ],
  }),
})

const { creatives, total } = await response.json()
```

### Mudar Status do Projeto

```typescript
const response = await fetch(`/api/projects/${projectId}/status`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'IN_PRODUCTION',
    comment: 'Iniciando produção',
  }),
})

const { project, previousStatus, newStatus } = await response.json()
```

## Limitações e Considerações

1. **Batch Upload de Criativos:**
   - Máximo 100 criativos por requisição
   - Para mais, fazer múltiplas requisições

2. **Status APPROVED:**
   - Uma vez aprovado, não pode ser alterado
   - Não permite adicionar mais criativos
   - Decisão de design para garantir integridade

3. **Rollback:**
   - Possível voltar de IN_PRODUCTION para DRAFT
   - Possível voltar de READY para IN_PRODUCTION
   - Permite correções antes da aprovação final

## Próximos Passos (Sprint 1.3)

- [ ] Implementar PATCH /api/projects/[id]/approve
- [ ] Implementar POST /api/projects/[id]/request-revision
- [ ] Conectar grid de aprovação ao backend
- [ ] Adicionar componente de histórico de status
- [ ] Implementar notificações de mudança de status

## Arquivos Criados/Modificados

### Novos Arquivos
- `lib/validations/project.ts` - Schemas de validação Zod
- `app/api/client/projects/route.ts` - API de projetos (GET, POST)
- `app/api/projects/[id]/creatives/route.ts` - API de criativos (GET, POST)
- `app/api/projects/[id]/status/route.ts` - API de status (PATCH)

### Arquivos Modificados
- `app/client/projects/new/page.tsx` - Formulário conectado à API real

### Dependências Adicionadas
- `zod` - Validação de schemas

## Conclusão

O workflow de projetos está completo e funcional, com validações robustas em todas as camadas, sistema de permissões baseado em organizações, e integração completa entre frontend e backend. O sistema está pronto para os próximos sprints de aprovação e gestão de comentários.
