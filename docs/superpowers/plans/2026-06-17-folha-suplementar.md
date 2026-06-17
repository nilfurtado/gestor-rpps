# Folha Suplementar - Implementation Plan

> **Para aprovação:** Revise este plano e confirme se está alinhado com os requisitos de negócio.

**Objetivo:** Criar funcionalidade para lançar valores complementares na folha de pagamento, para correções, pagamentos retroativos, diferenças salariais, rescisões e demais eventos não contemplados na folha principal.

**Arquitetura:**
1. Modelo de dados `FolhaSupplementar` (relacionado a `FolhaPrevidenciaria`)
2. APIs CRUD para gerenciar folhas suplementares
3. UI para listar, criar, editar, deletar e visualizar suplementares
4. Integração automática com cálculos (folha base + suplementar)
5. Dashboard com resumos

**Tech Stack:**
- Prisma (modelo `FolhaSupplementar`)
- Next.js API Routes
- React (componentes)
- TanStack React Table (listagem)

---

## Global Constraints

- Folha Suplementar é **OPCIONAL** (não quebra fluxo existente)
- Soma automática: `folhaTotal = folhaBase + folhaSupplementar`
- Cálculos previdenciários usam `folhaTotal`
- Relação: Uma `FolhaPrevidenciaria` pode ter múltiplas `FolhaSupplementar`
- Única constraint: `[orgaoId, exercicioId, competenciaId, motivo]` (pode haver múltiplas suplementares por competência)
- Usuário pode editar/deletar enquanto não aprovada
- Suplementar aprovada não pode ser deletada (apenas visualizada)

---

## Estrutura de Arquivos

```
prisma/
└── schema.prisma (adicionar FolhaSupplementar)

src/types/
└── folha-suplementar.ts (novos tipos)

src/lib/
├── folha-suplementar-service.ts (lógica de negócio)
└── folha-calculo-service.ts (atualizar cálculos)

src/app/api/admin/folha-suplementar/
├── route.ts (GET/POST)
├── [id]/
│   ├── route.ts (GET/PUT/DELETE)
│   └── aprovar/route.ts (POST aprovação)

src/app/(dashboard)/
└── lancamentos/
    └── suplementar/
        ├── page.tsx (listagem)
        ├── novo/page.tsx (criar)
        ├── [id]/editar/page.tsx (editar)
        ├── suplementar-table.tsx (componente)
        ├── suplementar-form.tsx (form)
        └── suplementar-preview-dialog.tsx (preview)
```

---

## Task 1: Schema Prisma - FolhaSupplementar

**Files:**
- Modify: `prisma/schema.prisma`

**Model:**
```prisma
model FolhaSupplementar {
  id                    Int                  @id @default(autoincrement())
  folhaPrevidenciariaId Int
  folhaPrevidenciaria   FolhaPrevidenciaria  @relation(fields: [folhaPrevidenciariaId], references: [id], onDelete: Cascade)
  
  motivo                String               // "Correção", "Retroativo", "Diferença Salarial", "Rescisão", etc
  descricao             String?              // Descrição detalhada (opcional)
  folhaBase             Decimal              // Valor a ser adicionado
  
  status                LancamentoStatus     @default(PENDENTE)
  responsavelId         Int?
  responsavel           User?                @relation(fields: [responsavelId], references: [id])
  
  dataAprovacao         DateTime?
  usuarioAprovadorId    Int?
  usuarioAprovador      User?                @relation("AprovadasPorSuplem", fields: [usuarioAprovadorId], references: [id])
  
  observacoes           String?
  
  createdAt             DateTime             @default(now())
  updatedAt             DateTime             @updatedAt
  
  @@unique([folhaPrevidenciariaId, motivo])
  @@index([folhaPrevidenciariaId])
  @@index([status])
  @@map("folhas_suplementares")
}
```

**Steps:**
1. Adicionar model `FolhaSupplementar` ao schema
2. Run: `npx prisma migrate dev --name add_folha_suplementar`
3. Commit: "prisma: adicionar tabela FolhaSupplementar"

---

## Task 2: Tipos TypeScript

**Files:**
- Create: `src/types/folha-suplementar.ts`

**Exports:**
```typescript
export type FolhaSupplementar = {
  id: number;
  folhaPrevidenciariaId: number;
  motivo: string;
  descricao?: string;
  folhaBase: Decimal;
  status: LancamentoStatus;
  responsavel?: User;
  dataAprovacao?: Date;
  usuarioAprovador?: User;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MotivosSuplemento = 
  | "CORRECAO"
  | "RETROATIVO"
  | "DIFERENCA_SALARIAL"
  | "RESCISAO"
  | "ADIANTAMENTO"
  | "COMPLEMENTACAO"
  | "OUTRO"

export interface CreateFolhaSuplementerInput {
  folhaPrevidenciariaId: number;
  motivo: MotivosSuplemento;
  descricao?: string;
  folhaBase: Decimal;
  observacoes?: string;
}
```

---

## Task 3: Serviço de Lógica - FolhaSuplementerService

**Files:**
- Create: `src/lib/folha-suplementar-service.ts`

**Exports:**
```typescript
// Listar suplementares
export async function listFolhaSuplementer(folhaId?: number): Promise<FolhaSuplementer[]>

// Criar suplementar
export async function createFolhaSuplementer(input: CreateFolhaSuplementerInput): Promise<FolhaSuplementer>

// Obter uma suplementar
export async function getFolhaSuplementer(id: number): Promise<FolhaSuplementer | null>

// Atualizar suplementar
export async function updateFolhaSuplementer(id: number, input: Partial<CreateFolhaSuplementerInput>): Promise<FolhaSuplementer>

// Deletar suplementar
export async function deleteFolhaSuplementer(id: number): Promise<void>

// Aprovar suplementar
export async function aprovarFolhaSuplementer(id: number, usuarioAprovadorId: number): Promise<FolhaSuplementer>

// Obter valor total suplementar de uma folha
export async function getTotalSuplementerFolha(folhaPrevidenciariaId: number): Promise<Decimal>
```

---

## Task 4: Atualizar Serviço de Cálculos

**Files:**
- Modify: `src/lib/folha-calculo-service.ts` (ou criar se não existir)

**Changes:**
```typescript
// Novo fluxo de cálculo
export async function calcularFolhaTotal(folhaId: number): Promise<{
  folhaBase: Decimal;
  folhaSuplementer: Decimal;
  folhaTotal: Decimal;
  valorRecolherCalculado: Decimal;
}> {
  const folha = await prisma.folhaPrevidenciaria.findUnique({ where: { id: folhaId } });
  const suplementar = await getTotalSuplementerFolha(folhaId);
  
  const folhaTotal = (folha.folhaBase || 0) + suplementar;
  const valorRecolherCalculado = (folhaTotal * folha.aliquota) / 100;
  
  return {
    folhaBase: folha.folhaBase || 0,
    folhaSuplementer: suplementar,
    folhaTotal,
    valorRecolherCalculado,
  };
}
```

**Update FolhaPrevidenciaria:**
- Adicionar campo opcional `folhaSuplementarTotal: Decimal @default(0)`
- Atualizar cálculos para usar `folhaTotal` ao invés de `folhaBase`

---

## Task 5: APIs

**Files:**
- Create: `src/app/api/admin/folha-suplementar/route.ts`
- Create: `src/app/api/admin/folha-suplementar/[id]/route.ts`
- Create: `src/app/api/admin/folha-suplementar/[id]/aprovar/route.ts`

**Endpoints:**
- `GET /api/admin/folha-suplementar?folhaId=123` → Lista suplementares
- `POST /api/admin/folha-suplementar` → Cria suplementar
- `GET /api/admin/folha-suplementar/[id]` → Obtém uma
- `PUT /api/admin/folha-suplementar/[id]` → Atualiza
- `DELETE /api/admin/folha-suplementar/[id]` → Deleta
- `POST /api/admin/folha-suplementar/[id]/aprovar` → Aprova

---

## Task 6: Componentes UI

**Files:**
- Create: `src/app/(dashboard)/lancamentos/suplementar/page.tsx`
- Create: `src/app/(dashboard)/lancamentos/suplementar/suplementar-table.tsx`
- Create: `src/app/(dashboard)/lancamentos/suplementar/suplementar-form.tsx`

**Features:**
- Listagem com filtros (status, motivo, período)
- Criar nova suplementar (modal/página)
- Editar suplementar (se não aprovada)
- Deletar suplementar (se não aprovada)
- Visualizar detalhes
- Botão de aprovação (para admin)

---

## Task 7: Integração com Lançamentos

**Files:**
- Modify: `src/app/(dashboard)/lancamentos/page.tsx`
- Modify: `src/app/(dashboard)/lancamentos/[id]/editar/page.tsx`

**Changes:**
- Adicionar link para "Folhas Suplementares" de uma folha
- Mostrar resumo de suplementares no detalhe da folha
- Atualizar cálculos para incluir suplementares
- Mostrar `folhaTotal = folhaBase + suplementar`

---

## Task 8: Dashboard/Stats

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`

**Adicionar:**
- Total de suplementares por status
- Suplementares pendentes de aprovação
- Valor total de suplementares por órgão
- Motivos mais comuns

---

## Task 9: Testes

**Verificações:**
1. Criar suplementar → Salva no BD
2. Listar suplementares → Filtra por folha
3. Editar suplementar → Atualiza antes de aprovação
4. Deletar suplementar → Remove se não aprovada
5. Aprovar suplementar → Marca como aprovada
6. Cálculos incluem suplementar → `folhaTotal = folhaBase + suplementar`
7. Múltiplas suplementares por folha → Soma todos os valores
8. Fluxo completo → Criar → Editar → Aprovar → Ver em cálculos

---

## Status

| Tarefa | Status | Complexidade |
|--------|--------|-------------|
| 1. Schema Prisma | ⏳ TODO | Baixa |
| 2. Tipos TypeScript | ⏳ TODO | Baixa |
| 3. Serviço de lógica | ⏳ TODO | Média |
| 4. Serviço de cálculos | ⏳ TODO | Média |
| 5. APIs | ⏳ TODO | Média |
| 6. Componentes UI | ⏳ TODO | Alta |
| 7. Integração com lançamentos | ⏳ TODO | Média |
| 8. Dashboard/Stats | ⏳ TODO | Baixa |
| 9. Testes | ⏳ TODO | Média |

**Total de tarefas:** 9
**Tempo estimado:** 8-10 horas
**Complexidade geral:** Média-Alta

---

## Pontos de Atenção

⚠️ **Cálculos Previdenciários:**
- Todos os cálculos (acrescimo, multas, juros, etc) devem usar `folhaTotal`
- Revisar função `calcularFolhaTotal()` em `folha-calculo-service.ts`

⚠️ **Aprovações:**
- Apenas admin/gestor pode aprovar
- Suplementar aprovada é imutável
- Log de quem aprovou e quando

⚠️ **Backward Compatibility:**
- Folhas existentes sem suplementar continuam funcionando
- Cálculos devem ter valor padrão 0 se sem suplementar

⚠️ **Integridade de Dados:**
- Uma suplementar só pode pertencer a UMA folha previdenciária
- Motivos devem estar pré-definidos (enum)

---

## Próximas Etapas Após Aprovação

1. ✅ Validar regras de negócio
2. ✅ Confirmar campos necessários
3. ✅ Definir permissões (quem pode criar/aprovar)
4. ✅ Revisar fluxo de aprovações
5. Então: Iniciar desenvolvimento com subagents

---

## Questões para Esclarecimento

1. **Permissões:** Quem pode criar suplementares? Apenas Gestor ou qualquer usuário?
2. **Aprovação:** É sempre obrigatória? Quem aprova?
3. **Auditoria:** Precisa manter histórico de todas as alterações?
4. **Relatórios:** Precisa de relatório de suplementares por período/órgão?
5. **Exportação:** Deve incluir suplementares em exportação de folha para PDF?
