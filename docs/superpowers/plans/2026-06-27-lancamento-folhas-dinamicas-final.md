# Lançamento com Folha Base Obrigatória + Tipos de Folha Customizáveis (FINAL)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar Lançamento com Folha Base obrigatória, permitindo usuários cadastrarem dinamicamente outros tipos de folha conforme necessário, com cálculo automático de folha_total e valores a recolher.

**Architecture:** 
- Tabela `TipoFolha` com tipos pré-definidos (Base, Suplementar, Complementar, 13º, Rescisão, Retroativa)
- Folha Base é sempre criada automaticamente e obrigatória
- Usuário pode adicionar tipos adicionais durante o cadastro de Lançamento
- Para CADA tipo de folha: cálculos de **Valor a Recolher** = valor × alíquota / 100
- **Diferença** = Valor a Recolher - Valor Recolhido (automático)
- `folha_total` calculada automaticamente como SUM de todos os tipos

**Tech Stack:** Prisma ORM, Next.js 16.2.6, React, TypeScript, shadcn/ui, TanStack Table

## Global Constraints

- Folha Base é SEMPRE obrigatória em todo Lançamento
- Tipos de folha pré-definidos: Base, Suplementar, Complementar, 13º, Rescisão, Retroativa
- Usuário pode cadastrar novos tipos customizados dinamicamente
- **Alíquota:** herda do tipo Lançamento (PATRONAL 15%, SEGURADO 10%)
- **Valor a Recolher** = Valor da Folha × Alíquota / 100 (CÁLCULO AUTOMÁTICO)
- **Diferença** = Valor a Recolher - Valor Recolhido (CÁLCULO AUTOMÁTICO)
- Todos os valores monetários usam `Decimal` no Prisma, `number` na UI (2 casas decimais)
- `folha_total = SUM(valores de todos os tipos de folha)`
- `totalARecolher = SUM(valores a recolher de todos os tipos)`
- Role GESTOR obrigatório para criar/editar lançamentos
- AuditLog tracking para todas as operações

---

## File Structure

**Files to Create:**
- `src/lib/tipo-folha-service.ts` — Service para gerenciar tipos de folha
- `src/app/api/tipos-folha/route.ts` — API para tipos

**Files to Modify:**
- `prisma/schema.prisma` — Adicionar tabelas `TipoFolha` e `LancamentoFolha`
- `src/types/lancamento.ts` — Atualizar interfaces
- `src/lib/lancamento-service.ts` — Cálculos com Valor a Recolher
- `src/app/(dashboard)/lancamentos/lancamento-form.tsx` — Formulário dinâmico
- `src/app/api/lancamentos/route.ts` — POST com folhas dinâmicas
- `src/app/api/lancamentos/[id]/route.ts` — PUT com folhas dinâmicas

---

### Task 1: Criar Tabela de Tipos de Folha e Lançamento Folha

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `TipoFolha` model e `LancamentoFolha` model

- [ ] **Step 1: Adicionar modelos ao schema**

```prisma
model TipoFolha {
  id              Int             @id @default(autoincrement())
  nome            String          @unique
  descricao       String?
  ordem           Int             @default(0)
  obrigatorio     Boolean         @default(false) // Base = true
  customizado     Boolean         @default(false)
  ativo           Boolean         @default(true)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  lancamentoFolhas LancamentoFolha[]
  
  @@index([nome])
  @@map("tipos_folha")
}

model LancamentoFolha {
  id                  Int             @id @default(autoincrement())
  lancamentoId        Int
  lancamento          FolhaPrevidenciaria @relation("folhas", fields: [lancamentoId], references: [id], onDelete: Cascade)
  tipoFolhaId         Int
  tipoFolha           TipoFolha       @relation(fields: [tipoFolhaId], references: [id])
  
  valor               Decimal         // Valor da folha (entrada)
  aliquota            Decimal         // Herda do Lançamento
  valorARecolher      Decimal         // valor × aliquota / 100 (AUTO)
  valorRecolhido      Decimal         // (entrada)
  diferenca           Decimal         // valorARecolher - valorRecolhido (AUTO)
  
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  
  @@unique([lancamentoId, tipoFolhaId])
  @@index([lancamentoId])
  @@map("lancamento_folhas")
}

// Atualizar FolhaPrevidenciaria:
model FolhaPrevidenciaria {
  // ... campos existentes ...
  
  folhas              LancamentoFolha[] @relation("folhas")
  folhaTotal          Decimal?        @default(0)      // SUM(folhas.valor)
  totalARecolher      Decimal?        @default(0)      // SUM(folhas.valorARecolher)
  totalRecolhido      Decimal?        @default(0)      // SUM(folhas.valorRecolhido)
  deficitTotal        Decimal?        @default(0)      // SUM(folhas.diferenca)
  
  // ✅ REMOVER: folhaBase, folhaSuplementer, folhaComplementar, folha13, folhaRescisao, folhaRetroativa
}
```

- [ ] **Step 2: Criar migration**

```bash
cd /c/Users/SUPORTE\ INFOR/Documents/claude/PROJETOS/gestor
npx prisma migrate dev --name add_tipo_folha_and_lancamento_folha
```

- [ ] **Step 3: Seed de tipos**

Criar `scripts/seed-tipos-folha.ts`:

```typescript
import { prisma } from "@/lib/db";

async function seedTiposFolha() {
  const tipos = [
    { nome: "Base", descricao: "Folha Base", ordem: 1, obrigatorio: true, customizado: false },
    { nome: "Suplementar", descricao: "Folha Suplementar", ordem: 2, obrigatorio: false, customizado: false },
    { nome: "Complementar", descricao: "Folha Complementar", ordem: 3, obrigatorio: false, customizado: false },
    { nome: "13º", descricao: "13º Salário", ordem: 4, obrigatorio: false, customizado: false },
    { nome: "Rescisão", descricao: "Rescisão", ordem: 5, obrigatorio: false, customizado: false },
    { nome: "Retroativa", descricao: "Retroativa", ordem: 6, obrigatorio: false, customizado: false },
  ];

  for (const tipo of tipos) {
    await prisma.tipoFolha.upsert({
      where: { nome: tipo.nome },
      update: {},
      create: tipo,
    });
  }

  console.log("✅ Tipos de folha seedados");
}

seedTiposFolha().catch(console.error).finally(() => prisma.$disconnect());
```

Executar:
```bash
npx ts-node scripts/seed-tipos-folha.ts
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ scripts/seed-tipos-folha.ts
git commit -m "feat: adicionar TipoFolha e LancamentoFolha com Valor a Recolher"
```

---

### Task 2: Criar Service de Tipos de Folha

**Files:**
- Create: `src/lib/tipo-folha-service.ts`

**Interfaces:**
- Produces: Funções para gerenciar tipos e cálculos

- [ ] **Step 1: Criar arquivo**

```typescript
import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

export async function getTiposFolhaAtivos() {
  return await prisma.tipoFolha.findMany({
    where: { ativo: true },
    orderBy: { ordem: "asc" },
  });
}

export async function getTipoFolhaByNome(nome: string) {
  return await prisma.tipoFolha.findUnique({
    where: { nome },
  });
}

export async function createTipoFolhaCustomizado(nome: string, descricao?: string) {
  const existente = await prisma.tipoFolha.findUnique({ where: { nome } });
  if (existente) throw new Error(`Tipo '${nome}' já existe`);

  return await prisma.tipoFolha.create({
    data: {
      nome,
      descricao,
      customizado: true,
      obrigatorio: false,
      ordem: (await prisma.tipoFolha.findMany()).length + 1,
    },
  });
}

export function calcularValorARecolher(valor: number, aliquota: number): number {
  return Number(((valor * aliquota) / 100).toFixed(2));
}

export function calcularDiferenca(valorARecolher: number, valorRecolhido: number): number {
  return Number((valorARecolher - valorRecolhido).toFixed(2));
}

export function calcularFolhaTotal(folhas: Array<{ valor: number }>): number {
  return Number(folhas.reduce((sum, f) => sum + Number(f.valor || 0), 0).toFixed(2));
}

export function calcularTotalARecolher(folhas: Array<{ valorARecolher: number }>): number {
  return Number(folhas.reduce((sum, f) => sum + Number(f.valorARecolher || 0), 0).toFixed(2));
}

export function calcularTotalRecolhido(folhas: Array<{ valorRecolhido: number }>): number {
  return Number(folhas.reduce((sum, f) => sum + Number(f.valorRecolhido || 0), 0).toFixed(2));
}

export function calcularDeficitTotal(folhas: Array<{ diferenca: number }>): number {
  return Number(folhas.reduce((sum, f) => sum + Number(f.diferenca || 0), 0).toFixed(2));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/tipo-folha-service.ts
git commit -m "feat: criar service com cálculos de Valor a Recolher"
```

---

### Task 3: Atualizar Types de Lançamento

**Files:**
- Modify: `src/types/lancamento.ts`

**Interfaces:**
- Produces: `TipoFolhaRow`, `LancamentoFolhaRow`, `LancamentoRow` com Valor a Recolher

- [ ] **Step 1: Adicionar tipos**

```typescript
export interface TipoFolhaRow {
  id: number;
  nome: string;
  descricao: string | null;
  ordem: number;
  obrigatorio: boolean;
  customizado: boolean;
  ativo: boolean;
}

export interface LancamentoFolhaRow {
  id: number;
  lancamentoId: number;
  tipoFolhaId: number;
  tipoFolha: TipoFolhaRow;
  valor: number;              // Entrada: valor da folha
  aliquota: number;           // Herdada
  valorARecolher: number;     // AUTO: valor × aliquota / 100
  valorRecolhido: number;     // Entrada: valor recebido
  diferenca: number;          // AUTO: valorARecolher - valorRecolhido
}

export interface LancamentoRow {
  // ... campos existentes ...
  folhas: LancamentoFolhaRow[];
  folhaTotal: number;         // SUM(folhas.valor)
  totalARecolher: number;     // SUM(folhas.valorARecolher)
  totalRecolhido: number;     // SUM(folhas.valorRecolhido)
  deficitTotal: number;       // SUM(folhas.diferenca)
}

export interface CreateLancamentoInput {
  // ... campos existentes ...
  folhas: Array<{
    tipoFolhaId: number;
    valor: number;
    valorRecolhido: number;
  }>;
}
```

- [ ] **Step 2: Compile**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/types/lancamento.ts
git commit -m "feat: atualizar tipos com Valor a Recolher"
```

---

### Task 4: Atualizar Service de Lançamento

**Files:**
- Modify: `src/lib/lancamento-service.ts`

**Interfaces:**
- Consumes: `calcularValorARecolher`, `calcularDiferenca` (Task 2)
- Produces: CRUD com cálculos automáticos

- [ ] **Step 1: Atualizar createLancamento**

```typescript
export async function createLancamento(
  input: CreateLancamentoInput,
  usuarioId: number
) {
  // Validar Base
  const temBase = input.folhas.some(f => {
    const tipo = await prisma.tipoFolha.findUnique({ where: { id: f.tipoFolhaId } });
    return tipo?.obrigatorio;
  });

  if (!temBase) {
    throw new Error("Folha Base é obrigatória");
  }

  // Buscar alíquota do lançamento (PATRONAL 15%, SEGURADO 10%)
  const aliquota = input.tipo === "PATRONAL" ? 15 : 10;

  // Calcular folhas com Valor a Recolher
  const folhasComCalculos = input.folhas.map(f => {
    const valorARecolher = calcularValorARecolher(f.valor, aliquota);
    const diferenca = calcularDiferenca(valorARecolher, f.valorRecolhido);
    return {
      tipoFolhaId: f.tipoFolhaId,
      valor: f.valor,
      aliquota,
      valorARecolher,
      valorRecolhido: f.valorRecolhido,
      diferenca,
    };
  });

  // Calcular totalizadores
  const folhaTotal = calcularFolhaTotal(folhasComCalculos);
  const totalARecolher = calcularTotalARecolher(folhasComCalculos);
  const totalRecolhido = calcularTotalRecolhido(folhasComCalculos);
  const deficitTotal = calcularDeficitTotal(folhasComCalculos);

  const lancamento = await prisma.folhaPrevidenciaria.create({
    data: {
      // ... campos obrigatórios ...
      folhaTotal,
      totalARecolher,
      totalRecolhido,
      deficitTotal,
      folhas: {
        create: folhasComCalculos,
      },
    },
    include: {
      folhas: { include: { tipoFolha: true } },
    },
  });

  await recordAudit("FolhaPrevidenciaria", lancamento.id, "CREATE", null, lancamento, usuarioId);
  return lancamento;
}
```

- [ ] **Step 2: Atualizar updateLancamento**

Similar, recalcular todos os valores.

- [ ] **Step 3: Commit**

```bash
git add src/lib/lancamento-service.ts
git commit -m "feat: calcular Valor a Recolher e Diferença automaticamente"
```

---

### Task 5: Atualizar Formulário

**Files:**
- Modify: `src/app/(dashboard)/lancamentos/lancamento-form.tsx`

**Interfaces:**
- Consumes: `calcularValorARecolher`, `calcularDiferenca`, `getTiposFolhaAtivos`
- Produces: Formulário com cálculos em tempo real

- [ ] **Step 1: Adicionar estado e useMemo**

```typescript
const [tiposFolha, setTiposFolha] = useState<TipoFolhaRow[]>([]);
const [folhas, setFolhas] = useState<Array<{
  tipoFolhaId: number;
  valor: string;
  valorRecolhido: string;
  valorARecolher?: number;
  diferenca?: number;
}>>([]);

const aliquota = initial?.tipo === "PATRONAL" ? 15 : 10;

// Recalcular valores a recolher quando valor muda
const folhasComCalculos = useMemo(() => {
  return folhas.map(f => {
    const valor = currencyToNumber(f.valor);
    const recolhido = currencyToNumber(f.valorRecolhido);
    const aRecolher = calcularValorARecolher(valor, aliquota);
    const diferenca = calcularDiferenca(aRecolher, recolhido);
    return { ...f, valorARecolher: aRecolher, diferenca };
  });
}, [folhas, aliquota]);
```

- [ ] **Step 2: Adicionar seção de tipos com cálculos visíveis**

```typescript
{/* Folha Base (obrigatória) */}
<div className="bg-blue-50 p-4 rounded">
  <div className="flex justify-between items-center mb-2">
    <Label>Folha Base *</Label>
    <span className="text-xs text-blue-600">OBRIGATÓRIA</span>
  </div>
  <div className="grid grid-cols-3 gap-4">
    <div>
      <p className="text-sm text-gray-600">Valor Folha</p>
      <CurrencyInput
        value={folhas[0]?.valor || ""}
        onChange={(e) => {
          const novas = [...folhas];
          novas[0].valor = e.target.value;
          setFolhas(novas);
        }}
        placeholder="0,00"
      />
    </div>
    <div>
      <p className="text-sm text-gray-600">Valor a Recolher (AUTO)</p>
      <div className="p-2 bg-white rounded border">
        {formatBRL(folhasComCalculos[0]?.valorARecolher || 0)}
      </div>
    </div>
    <div>
      <p className="text-sm text-gray-600">Valor Recolhido</p>
      <CurrencyInput
        value={folhas[0]?.valorRecolhido || ""}
        onChange={(e) => {
          const novas = [...folhas];
          novas[0].valorRecolhido = e.target.value;
          setFolhas(novas);
        }}
        placeholder="0,00"
      />
    </div>
  </div>
  <div className="mt-2 p-2 bg-blue-100 rounded">
    <p className="text-sm">
      Diferença: <span className={folhasComCalculos[0]?.diferenca >= 0 ? "text-red-600" : "text-green-600"}>
        {formatBRL(folhasComCalculos[0]?.diferenca || 0)}
      </span>
    </p>
  </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/lancamentos/lancamento-form.tsx
git commit -m "feat: adicionar cálculos de Valor a Recolher no formulário"
```

---

### Task 6: Criar API para Tipos

**Files:**
- Create: `src/app/api/tipos-folha/route.ts`

- [ ] **Step 1: Criar rota**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTiposFolhaAtivos, createTipoFolhaCustomizado } from "@/lib/tipo-folha-service";

export async function GET(request: NextRequest) {
  try {
    const tipos = await getTiposFolhaAtivos();
    return NextResponse.json({ data: tipos });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao listar tipos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "GESTOR") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const tipo = await createTipoFolhaCustomizado(body.nome, body.descricao);
    return NextResponse.json({ data: tipo }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro" },
      { status: 400 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/tipos-folha/route.ts
git commit -m "feat: criar API de tipos de folha"
```

---

### Task 7: E2E Testing

**Files:**
- Modify: `src/__tests__/lancamento.test.ts`

- [ ] **Step 1: Escrever testes**

```typescript
describe("Lançamento - Valor a Recolher", () => {
  it("calcula valorARecolher como valor × aliquota / 100", () => {
    const resultado = calcularValorARecolher(10000, 15);
    expect(resultado).toBe(1500); // 10000 × 15 / 100
  });

  it("calcula diferença como valorARecolher - valorRecolhido", () => {
    const resultado = calcularDiferenca(1500, 1200);
    expect(resultado).toBe(300); // 1500 - 1200
  });

  it("cria lançamento com cálculos automáticos", async () => {
    const lancamento = await createLancamento({
      // ... campos obrigatórios ...
      tipo: "PATRONAL",
      folhas: [
        { tipoFolhaId: 1, valor: 10000, valorRecolhido: 9500 },
        { tipoFolhaId: 2, valor: 5000, valorRecolhido: 5000 },
      ],
    }, 1);

    expect(lancamento.folhaTotal).toBe(15000);
    expect(lancamento.totalARecolher).toBe(2250); // (10000 + 5000) × 15 / 100
    expect(lancamento.deficitTotal).toBe(250);   // (1500 - 9500) + (750 - 5000) = 250
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add src/__tests__/lancamento.test.ts
git commit -m "test: adicionar testes de Valor a Recolher"
```

---

## Summary

**7 tasks, ~800 linhas de código:**

1. ✅ Tabelas `TipoFolha` + `LancamentoFolha` com cálculos
2. ✅ Service com funções de Valor a Recolher e Diferença
3. ✅ Types atualizados
4. ✅ Service de Lançamento com cálculos automáticos
5. ✅ Formulário com preview em tempo real
6. ✅ API de tipos de folha
7. ✅ Testes E2E

**Resultado:** Lançamento completo com **Valor a Recolher** calculado automaticamente para cada tipo de folha, diferença automática, totalizadores consolidados.

---

Plan complete and saved to `docs/superpowers/plans/2026-06-27-lancamento-folhas-dinamicas-final.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
