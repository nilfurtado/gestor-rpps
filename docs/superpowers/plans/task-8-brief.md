# Task 8: Integração das Rotas de Lançamento com Novo Service

## Objective
Wire the existing API routes (`POST /api/lancamentos` and `PATCH /api/lancamentos/[id]`) to use the new `lancamento-service.ts` with dynamic folhas support, so that the feature actually functions end-to-end in the production application.

## Critical Issue
Currently:
- Form sends `folhas` array from the UI
- Service layer has `createLancamento()` and `updateLancamento()` with all calculations
- Tests pass (19/19)
- **BUT:** The API routes ignore `folhas` and never call the service
- Result: No `LancamentoFolha` rows are persisted; feature is non-functional

## Files to Modify

1. `src/lib/schemas.ts` — Add `folhas` to `lancamentoSchema` (Zod)
2. `src/app/api/lancamentos/route.ts` — Update POST handler to use `createLancamento()`
3. `src/app/api/lancamentos/[id]/route.ts` — Update PATCH handler to use `updateLancamento()`
4. Create Prisma migration for the two new tables (`TipoFolha`, `LancamentoFolha`)

## Requirements

### 1. Update `lancamentoSchema` in `src/lib/schemas.ts`

Find the `z.object()` that defines `lancamentoSchema` and add this field:

```typescript
export const lancamentoSchema = z.object({
  // ... existing fields ...
  folhas: z.array(
    z.object({
      tipoFolhaId: z.number().int().positive("tipoFolhaId é obrigatório"),
      valor: z.number().positive("valor da folha deve ser > 0"),
      valorRecolhido: z.number().nonnegative("valor recolhido deve ser >= 0"),
    })
  ).optional(), // Allow empty or omitted folhas array (handled by service validation)
});
```

**Note:** The service will validate that Folha Base is present; the schema just passes it through.

### 2. Update POST Handler in `src/app/api/lancamentos/route.ts`

Replace the current direct `prisma.create` logic with a call to `createLancamento()`:

**Current pattern (legacy):**
```typescript
const lancamento = await prisma.folhaPrevidenciaria.create({
  data: { ...parsed, responsavelId: usuario.id },
  include: { /* ... */ }
});
```

**New pattern:**
```typescript
import { createLancamento } from "@/lib/lancamento-service";
import type { CreateLancamentoInput } from "@/types/lancamento";

// ... auth check and parse ...

const input: CreateLancamentoInput = {
  orgaoId: parsed.orgaoId,
  tipo: parsed.tipo,
  exercicioId: parsed.exercicioId,
  competenciaId: parsed.competenciaId,
  dataEmissao: parsed.dataEmissao,
  dataVencimento: parsed.dataVencimento,
  status: parsed.status,
  responsavelId: usuario.id,
  observacoes: parsed.observacoes,
  folhas: parsed.folhas || [], // Pass folhas array (may be empty, service validates)
};

const lancamento = await createLancamento(input, usuario.id);
```

**Response:** Return the created lancamento with all new fields:
```typescript
return NextResponse.json({
  data: {
    ...lancamento,
    folhas: lancamento.folhas, // Include folhas relation
    folhaTotal: lancamento.folhaTotal,
    totalARecolher: lancamento.totalARecolher,
    totalRecolhido: lancamento.totalRecolhido,
    deficitTotal: lancamento.deficitTotal,
  }
}, { status: 201 });
```

### 3. Update PATCH Handler in `src/app/api/lancamentos/[id]/route.ts`

Replace the legacy update logic with `updateLancamento()`:

**New pattern:**
```typescript
import { updateLancamento } from "@/lib/lancamento-service";

// ... auth and ID validation ...

const input = {
  // Only the fields being updated
  folhas: parsed.folhas,
  // ... other updatable fields if applicable ...
};

const lancamento = await updateLancamento(lancamentoId, input, usuario.id);

return NextResponse.json({
  data: {
    ...lancamento,
    folhas: lancamento.folhas,
    folhaTotal: lancamento.folhaTotal,
    totalARecolher: lancamento.totalARecolher,
    totalRecolhido: lancamento.totalRecolhido,
    deficitTotal: lancamento.deficitTotal,
  }
});
```

### 4. Create Prisma Migration

Generate a proper migration for the two new tables:

```bash
npx prisma migrate dev --name add_tipo_folha_and_lancamento_folha
```

This creates a timestamped migration file in `prisma/migrations/` that can be deployed to production via `prisma migrate deploy`.

**If migration fails due to schema drift:**
```bash
npx prisma migrate resolve --rolled-back add_tipo_folha_and_lancamento_folha
npx prisma db push
npx prisma migrate dev --name add_tipo_folha_and_lancamento_folha
```

## Global Constraints

- Folha Base is ALWAYS mandatory — service validates this, error response with 400 if missing
- All `folhas` calculations happen in service, not in route
- Response must include consolidated totals (folhaTotal, totalARecolher, totalRecolhido, deficitTotal)
- Error handling: return 400 for validation errors, 403 for auth, 500 for unexpected
- No changes to existing field behavior (backward compatible)
- AuditLog tracking already handled by service layer

## Test Plan

After implementation:

1. **Create lançamento with Base only:**
   - POST `/api/lancamentos` with `{ folhas: [{ tipoFolhaId: 1, valor: 10000, valorRecolhido: 9500 }] }`
   - Expect: 201 with folhaTotal=10000, totalARecolher=1500 (15% PATRONAL), deficitTotal=500

2. **Create lançamento with multiple folhas:**
   - POST with Base + Suplementar
   - Expect: 201 with correct totals summed across both

3. **Create without Folha Base:**
   - POST with only Suplementar (tipoFolhaId ≠ 1)
   - Expect: 400 "Folha Base é obrigatória"

4. **Update existing lançamento:**
   - PATCH with new folhas array
   - Expect: 200 with recalculated totals

5. **Legacy behavior preserved:**
   - Create with empty `folhas` array should work if backward-compat needed, or fail with "Base required" per new logic

## Success Criteria

✅ POST `/api/lancamentos` creates folhas and returns totals
✅ PATCH `/api/lancamentos/[id]` updates folhas and recalculates
✅ Folha Base mandatory enforcement works (400 error if missing)
✅ No `folhas` silently dropped — all fields persisted
✅ Prisma migration created and deployable
✅ All existing tests still pass (lancamento-folhas.test.ts)
✅ No new TypeScript errors
✅ Backward compatibility maintained (existing lançamentos still queryable)
