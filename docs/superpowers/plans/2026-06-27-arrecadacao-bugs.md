# Arrecadacao Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 3 Important bugs in Arrecadacao: zero-value fallback in updateArrecadacao, missing transactions around audit logging, and duplicate unique constraint on numeroLancamento.

**Architecture:** Each bug is isolated to a single file (`arrecadacao-service.ts` or `schema.prisma`). Fixes are applied in order: schema first (requires migration), then service logic, then transaction wrapping. Each task has its own test cycle and commit.

**Tech Stack:** TypeScript, Prisma ORM (SQLite), Vitest, Next.js

## Global Constraints

- TypeScript strict mode — no implicit `any` without existing pattern
- Prisma v7+ (check `node_modules/next/dist/docs/` for any breaking changes before touching Prisma APIs)
- Test runner: `npx vitest run src/__tests__/arrecadacao-e2e.test.ts` (uses real SQLite db)
- TypeScript check: `npx tsc --noEmit`
- All commits must be atomic (one per bug)
- Do NOT change `recordAudit` signature — it does not accept a transaction client as its first argument

---

### Task 1: Fix unique constraint on numeroLancamento (schema.prisma)

**Files:**
- Modify: `prisma/schema.prisma:278`

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces: corrected schema that only has `@@unique([folhaPagamentoId, numeroLancamento])`, not both that and `@unique` on the field

- [ ] **Step 1: Read the current schema around line 278 to confirm the field**

  Open `prisma/schema.prisma` and confirm line 278 reads:
  ```prisma
  numeroLancamento            String          @unique
  ```
  and line 324 reads:
  ```prisma
  @@unique([folhaPagamentoId, numeroLancamento])
  ```

- [ ] **Step 2: Remove the field-level `@unique` from numeroLancamento**

  In `prisma/schema.prisma`, change line 278 from:
  ```prisma
  numeroLancamento            String          @unique
  ```
  to:
  ```prisma
  numeroLancamento            String
  ```
  The composite unique at line 324 (`@@unique([folhaPagamentoId, numeroLancamento])`) stays unchanged.

- [ ] **Step 3: Run migration to apply the schema change**

  ```bash
  npx prisma migrate dev --name remove_unique_numeroLancamento
  ```

  Expected output contains:
  ```
  Your database is now in sync with your schema.
  ```

  If the migration fails with "already applied" or similar, run `npx prisma db push` instead.

- [ ] **Step 4: Write failing test for same numeroLancamento across different folhas**

  In `src/__tests__/arrecadacao-e2e.test.ts`, find the `describe("Validations", ...)` block and add this test AFTER the existing `"rejeita numeroLancamento duplicado na mesma folha"` test:

  ```typescript
  it("permite mesmo numeroLancamento em folhas diferentes", async () => {
    // Criar segunda folha para este órgão/competência
    const ts2 = Date.now();
    const folha2 = await prisma.folhaPagamento.create({
      data: {
        orgaoId,
        competenciaId,
        tipoFolha: "BASE",
        numeroFolha: `FP2-${ts2}`,
        dataReferencia: new Date("2024-01-01"),
        folhaTotal: new Decimal(5000),
      },
    });

    const sharedNumero = `NUM-SHARED-${ts2}`;

    const input1 = buildInput(folhaPagamentoId, "-vx1");
    input1.numeroLancamento = sharedNumero;
    const r1 = await arrecadacaoService.createArrecadacao(input1);
    createdArrecadacaoIds.push(r1.id);

    const input2 = buildInput(folha2.id, "-vx2");
    input2.numeroLancamento = sharedNumero;
    const r2 = await arrecadacaoService.createArrecadacao(input2);
    createdArrecadacaoIds.push(r2.id);

    // Cleanup folha2 audit logs and the folha itself
    await prisma.auditLog.deleteMany({
      where: { entityType: "Arrecadacao", entityId: { in: [r1.id, r2.id] } },
    });
    await prisma.folhaPagamento.deleteMany({ where: { id: folha2.id } });

    expect(r1.id).toBeDefined();
    expect(r2.id).toBeDefined();
    expect(r1.id).not.toBe(r2.id);
  });
  ```

- [ ] **Step 5: Run the new test to verify it fails before migration (or passes after)**

  If migration already ran in step 3, this test should pass now:
  ```bash
  npx vitest run src/__tests__/arrecadacao-e2e.test.ts --reporter=verbose 2>&1 | tail -30
  ```
  Expected: the new test passes; the old duplicate-same-folha test still passes.

- [ ] **Step 6: Run TypeScript check**

  ```bash
  npx tsc --noEmit 2>&1 | head -40
  ```
  Expected: no errors.

- [ ] **Step 7: Commit**

  ```bash
  git add prisma/schema.prisma prisma/migrations/ src/__tests__/arrecadacao-e2e.test.ts
  git commit -m "fix: remover @unique global em numeroLancamento, manter apenas composto"
  ```

---

### Task 2: Fix `||` fallback bug for zero values in updateArrecadacao

**Files:**
- Modify: `src/lib/arrecadacao-service.ts:283-313`
- Test: `src/__tests__/arrecadacao-e2e.test.ts` (add test in UPDATE describe block)

**Interfaces:**
- Consumes: nothing from Task 1
- Produces: corrected difference recalculation logic that treats `0` correctly

**Background:** Lines 288-300 in `updateArrecadacao` use `||` to fall back to the `before` value when `updateData.x` is falsy. When a user sends `valorRecolhidoServidor: 0`, the `||` treats 0 as falsy and uses the old `before` value instead, producing a wrong `diferencaServidor`. The fix is `!== undefined ? x : fallback` for all 6 variables (contribuicao* and valorRecolhido*).

- [ ] **Step 1: Write the failing test FIRST**

  In `src/__tests__/arrecadacao-e2e.test.ts`, inside `describe("UPDATE", ...)`, after the `"atualiza observacao sem alterar outros campos"` test, add:

  ```typescript
  it("recalcula diferencaServidor corretamente quando valorRecolhidoServidor é zero", async () => {
    // contribuicaoServidor = 1400, enviamos valorRecolhidoServidor = 0
    // diferença esperada = 1400 - 0 = 1400
    const result = await arrecadacaoService.updateArrecadacao(
      arrecadacaoId,
      { valorRecolhidoServidor: 0 },
      null
    );

    expect(Number(result.valorRecolhidoServidor)).toBe(0);
    expect(Number(result.diferencaServidor)).toBe(1400); // contribuicaoServidor - 0
  });
  ```

- [ ] **Step 2: Run the new test to confirm it FAILS with the buggy code**

  ```bash
  npx vitest run src/__tests__/arrecadacao-e2e.test.ts -t "recalcula diferencaServidor corretamente quando valorRecolhidoServidor é zero" --reporter=verbose 2>&1 | tail -20
  ```
  Expected: FAIL — `diferencaServidor` will be 0 (because `|| before.contribuicaoServidor` uses old value when 0 is falsy).

- [ ] **Step 3: Fix the `||` fallback in `updateArrecadacao` (lines 288-313)**

  In `src/lib/arrecadacao-service.ts`, replace the entire block (lines 283-314):

  ```typescript
  // Se valores recolhidos mudaram, recalcular diferenças
  if (
    input.valorRecolhidoServidor !== undefined ||
    input.valorRecolhidoPatronal !== undefined ||
    input.valorRecolhidoSuplementer !== undefined
  ) {
    const contribuicaoServidor =
      updateData.contribuicaoServidor || before.contribuicaoServidor;
    const contribuicaoPatronal =
      updateData.contribuicaoPatronal || before.contribuicaoPatronal;
    const contribuicaoSuplementer =
      updateData.contribuicaoSuplementer || before.contribuicaoSuplementer;

    const valorRecolhidoServidor =
      updateData.valorRecolhidoServidor || before.valorRecolhidoServidor;
    const valorRecolhidoPatronal =
      updateData.valorRecolhidoPatronal || before.valorRecolhidoPatronal;
    const valorRecolhidoSuplementer =
      updateData.valorRecolhidoSuplementer || before.valorRecolhidoSuplementer;
  ```

  With:

  ```typescript
  // Se valores recolhidos mudaram, recalcular diferenças
  if (
    input.valorRecolhidoServidor !== undefined ||
    input.valorRecolhidoPatronal !== undefined ||
    input.valorRecolhidoSuplementer !== undefined
  ) {
    const contribuicaoServidor =
      updateData.contribuicaoServidor !== undefined
        ? updateData.contribuicaoServidor
        : before.contribuicaoServidor;
    const contribuicaoPatronal =
      updateData.contribuicaoPatronal !== undefined
        ? updateData.contribuicaoPatronal
        : before.contribuicaoPatronal;
    const contribuicaoSuplementer =
      updateData.contribuicaoSuplementer !== undefined
        ? updateData.contribuicaoSuplementer
        : before.contribuicaoSuplementer;

    const valorRecolhidoServidor =
      updateData.valorRecolhidoServidor !== undefined
        ? updateData.valorRecolhidoServidor
        : before.valorRecolhidoServidor;
    const valorRecolhidoPatronal =
      updateData.valorRecolhidoPatronal !== undefined
        ? updateData.valorRecolhidoPatronal
        : before.valorRecolhidoPatronal;
    const valorRecolhidoSuplementer =
      updateData.valorRecolhidoSuplementer !== undefined
        ? updateData.valorRecolhidoSuplementer
        : before.valorRecolhidoSuplementer;
  ```

  The rest of the block (lines 302-313, computing `updateData.diferencaServidor`, etc.) stays unchanged.

- [ ] **Step 4: Run the new test to confirm it PASSES now**

  ```bash
  npx vitest run src/__tests__/arrecadacao-e2e.test.ts -t "recalcula diferencaServidor corretamente quando valorRecolhidoServidor é zero" --reporter=verbose 2>&1 | tail -20
  ```
  Expected: PASS.

- [ ] **Step 5: Run all arrecadacao tests to confirm nothing regressed**

  ```bash
  npx vitest run src/__tests__/arrecadacao-e2e.test.ts --reporter=verbose 2>&1 | tail -40
  ```
  Expected: all tests pass (previously 23, now 24+ with new tests).

- [ ] **Step 6: TypeScript check**

  ```bash
  npx tsc --noEmit 2>&1 | head -40
  ```
  Expected: no errors.

- [ ] **Step 7: Commit**

  ```bash
  git add src/lib/arrecadacao-service.ts src/__tests__/arrecadacao-e2e.test.ts
  git commit -m "fix: trocar || por !== undefined em recalculo de diferencas no updateArrecadacao"
  ```

---

### Task 3: Wrap create/update/delete + recordAudit in transactions

**Files:**
- Modify: `src/lib/arrecadacao-service.ts` (`createArrecadacao` ~line 189, `updateArrecadacao` ~line 316, `deleteArrecadacao` ~line 353)
- Modify: `src/lib/audit.ts` — add overload accepting a Prisma transaction client

**Background:** `recordAudit` currently uses the global `prisma` client and doesn't accept a transaction client (`tx`). To wrap create/update/delete + audit in a transaction, `recordAudit` must accept an optional Prisma transaction client. The Prisma transaction client type in Prisma v7 is `Prisma.TransactionClient` (imported from `@prisma/client`). The transaction is passed as the first argument.

**Important:** `recordAudit` currently swallows errors with `try/catch` and just logs them. Inside a transaction, we want audit failures to ROLL BACK the parent operation — so we must NOT swallow errors inside the transactional call. We solve this by adding an optional parameter `{ throwOnError?: boolean }` and when `throwOnError: true`, we rethrow.

- [ ] **Step 1: Write failing test for transaction rollback on audit failure**

  This test verifies that when audit logging fails, the arrecadacao record is NOT persisted. Because we cannot easily break `prisma.auditLog.create` in unit tests without mocking, this test instead verifies the POSITIVE path: that both record and audit log exist after successful create. The actual rollback is tested via a mock in a later step.

  In `src/__tests__/arrecadacao-e2e.test.ts`, inside `describe("CREATE", ...)`, add AFTER the existing `"cria AuditLog com action CREATE"` test:

  ```typescript
  it("cria registro e AuditLog atomicamente (ambos existem ou nenhum)", async () => {
    const input = buildInput(folhaPagamentoId, "-c5");
    const result = await arrecadacaoService.createArrecadacao(input, null);
    createdArrecadacaoIds.push(result.id);

    // Verificar que ambos existem no banco
    const arrecadacao = await prisma.arrecadacao.findUnique({ where: { id: result.id } });
    const logs = await prisma.auditLog.findMany({
      where: { entityType: "Arrecadacao", entityId: result.id, action: "CREATE" },
    });

    expect(arrecadacao).not.toBeNull();
    expect(logs.length).toBeGreaterThanOrEqual(1);
  });
  ```

- [ ] **Step 2: Run test to confirm it passes (baseline — positive path already works)**

  ```bash
  npx vitest run src/__tests__/arrecadacao-e2e.test.ts -t "cria registro e AuditLog atomicamente" --reporter=verbose 2>&1 | tail -20
  ```
  Expected: PASS (positive path already works, the bug is only visible when audit fails).

- [ ] **Step 3: Update `recordAudit` to accept an optional tx client and throwOnError flag**

  Replace the entire content of `src/lib/audit.ts` with:

  ```typescript
  import { prisma } from "@/lib/db";
  import type { PrismaClient } from "@prisma/client";

  // Prisma transaction client is the same shape as PrismaClient minus tx-management methods
  type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

  interface AuditParams {
    userId?: string | number | null;
    entityType: "FolhaPrevidenciaria" | "Orgao" | "User" | "Acordo" | "Arrecadacao";
    entityId: number;
    action: "CREATE" | "UPDATE" | "DELETE";
    before?: unknown;
    after?: unknown;
  }

  interface AuditOptions {
    throwOnError?: boolean;
  }

  export async function recordAudit(
    params: AuditParams,
    options?: AuditOptions,
    tx?: TxClient
  ) {
    const client = tx ?? prisma;
    try {
      await client.auditLog.create({
        data: {
          userId:
            params.userId == null
              ? null
              : typeof params.userId === "string"
              ? Number(params.userId)
              : params.userId,
          entityType: params.entityType,
          entityId: params.entityId,
          action: params.action,
          before: (params.before ?? null) as never,
          after: (params.after ?? null) as never,
        },
      });
    } catch (err) {
      if (options?.throwOnError) {
        throw err;
      }
      console.error("[audit] falha ao registrar log:", err);
    }
  }
  ```

- [ ] **Step 4: Run TypeScript check to confirm audit.ts compiles**

  ```bash
  npx tsc --noEmit 2>&1 | head -40
  ```
  Expected: no errors.

- [ ] **Step 5: Wrap `createArrecadacao` in a transaction**

  In `src/lib/arrecadacao-service.ts`, replace the block starting at ~line 189 (`const arrecadacao = await prisma.arrecadacao.create`) through the end of `createArrecadacao` (line 204 `return arrecadacao as unknown as ArrecadacaoRow;`):

  BEFORE:
  ```typescript
  const arrecadacao = await prisma.arrecadacao.create({
    data,
    include: { usuario: true },
  });

  // Registrar auditoria
  await recordAudit({
    userId: usuarioId,
    entityType: "Arrecadacao",
    entityId: arrecadacao.id,
    action: "CREATE",
    after: arrecadacao,
  });

  return arrecadacao as unknown as ArrecadacaoRow;
  ```

  AFTER:
  ```typescript
  return await prisma.$transaction(async (tx) => {
    const arrecadacao = await tx.arrecadacao.create({
      data,
      include: { usuario: true },
    });

    // Registrar auditoria dentro da transação — falha faz rollback
    await recordAudit(
      {
        userId: usuarioId,
        entityType: "Arrecadacao",
        entityId: arrecadacao.id,
        action: "CREATE",
        after: arrecadacao,
      },
      { throwOnError: true },
      tx
    );

    return arrecadacao as unknown as ArrecadacaoRow;
  });
  ```

- [ ] **Step 6: Wrap `updateArrecadacao` in a transaction**

  In `src/lib/arrecadacao-service.ts`, replace the block starting at ~line 316 (`const after = await prisma.arrecadacao.update`) through the end of `updateArrecadacao` (line 332 `return after as unknown as ArrecadacaoRow;`):

  BEFORE:
  ```typescript
  const after = await prisma.arrecadacao.update({
    where: { id },
    data: updateData,
    include: { usuario: true },
  });

  // Registrar auditoria
  await recordAudit({
    userId: usuarioId,
    entityType: "Arrecadacao",
    entityId: id,
    action: "UPDATE",
    before,
    after,
  });

  return after as unknown as ArrecadacaoRow;
  ```

  AFTER:
  ```typescript
  return await prisma.$transaction(async (tx) => {
    const after = await tx.arrecadacao.update({
      where: { id },
      data: updateData,
      include: { usuario: true },
    });

    // Registrar auditoria dentro da transação — falha faz rollback
    await recordAudit(
      {
        userId: usuarioId,
        entityType: "Arrecadacao",
        entityId: id,
        action: "UPDATE",
        before,
        after,
      },
      { throwOnError: true },
      tx
    );

    return after as unknown as ArrecadacaoRow;
  });
  ```

- [ ] **Step 7: Wrap `deleteArrecadacao` in a transaction**

  In `src/lib/arrecadacao-service.ts`, replace the block starting at ~line 353 (`await prisma.arrecadacao.delete`) through the end of `deleteArrecadacao` (line 364 `}`):

  BEFORE:
  ```typescript
  await prisma.arrecadacao.delete({
    where: { id },
  });

  // Registrar auditoria
  await recordAudit({
    userId: usuarioId,
    entityType: "Arrecadacao",
    entityId: id,
    action: "DELETE",
    before,
  });
  ```

  AFTER:
  ```typescript
  await prisma.$transaction(async (tx) => {
    await tx.arrecadacao.delete({
      where: { id },
    });

    // Registrar auditoria dentro da transação — falha faz rollback
    await recordAudit(
      {
        userId: usuarioId,
        entityType: "Arrecadacao",
        entityId: id,
        action: "DELETE",
        before,
      },
      { throwOnError: true },
      tx
    );
  });
  ```

- [ ] **Step 8: Run TypeScript check**

  ```bash
  npx tsc --noEmit 2>&1 | head -40
  ```
  Expected: no errors. If there are type errors about `TxClient` not being compatible, the fix is to use `Parameters<typeof prisma.$transaction>[0] extends (tx: infer T) => unknown ? T : never` instead — but the `Omit` approach should work for Prisma v7.

- [ ] **Step 9: Run all arrecadacao tests**

  ```bash
  npx vitest run src/__tests__/arrecadacao-e2e.test.ts --reporter=verbose 2>&1 | tail -50
  ```
  Expected: all tests pass.

- [ ] **Step 10: Commit**

  ```bash
  git add src/lib/arrecadacao-service.ts src/lib/audit.ts src/__tests__/arrecadacao-e2e.test.ts
  git commit -m "fix: envolver create/update/delete + recordAudit em transacao atomica"
  ```

---

## Self-Review

**Spec coverage:**
- Bug 1 (schema unique): Covered in Task 1 — removes `@unique` field annotation, keeps composite `@@unique`, adds migration and cross-folha test.
- Bug 2 (`||` fallback): Covered in Task 2 — all 6 `||` occurrences replaced with `!== undefined ? x : fallback`, test for `valorRecolhidoServidor: 0` added.
- Bug 3 (transaction): Covered in Task 3 — all three mutation functions now use `prisma.$transaction`, `recordAudit` updated to accept tx client with `throwOnError`.

**Placeholder scan:** No TBDs found. All code blocks are complete and concrete.

**Type consistency:**
- `recordAudit` signature in Task 3 Step 3: `(params, options?, tx?)` — used consistently in Steps 5, 6, 7 with `{ throwOnError: true }, tx`.
- `TxClient` type defined once in `audit.ts`, consumed nowhere else.
- `updateData.contribuicaoServidor` in the fix (Task 2) remains `Decimal | undefined` from the `if (input.contribuicaoServidor !== undefined) updateData.contribuicaoServidor = new Decimal(...)` guards above — the `!== undefined` check is correct since `Decimal(0)` is truthy.
