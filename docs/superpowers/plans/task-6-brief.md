# Task 6: API para Criar Tipos de Folha Customizados

## Objective
Complete the `/api/tipos-folha` route by adding a POST endpoint that allows users with GESTOR role to create custom folha types dynamically.

## Files to Modify
- `src/app/api/tipos-folha/route.ts` — Add POST handler (GET already exists from Task 5)

## Requirements

### 1. POST Endpoint Implementation

Add to the existing route file:

```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "GESTOR") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // 2. Parse request body
    const body = await request.json();
    
    // 3. Validate nome is provided
    if (!body.nome || typeof body.nome !== "string" || !body.nome.trim()) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    // 4. Call service to create custom tipo
    const tipo = await createTipoFolhaCustomizado(body.nome, body.descricao);
    
    // 5. Return created tipo
    return NextResponse.json({ data: tipo }, { status: 201 });
  } catch (error) {
    // 6. Handle errors
    const errorMsg = error instanceof Error ? error.message : "Erro ao criar tipo";
    return NextResponse.json(
      { error: errorMsg },
      { status: 400 }
    );
  }
}
```

### 2. Import Requirements

Ensure these imports are at the top of the file:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTiposFolhaAtivos, createTipoFolhaCustomizado } from "@/lib/tipo-folha-service";
```

**Note:** `NextRequest` may not be imported yet (GET endpoint doesn't need it).

## Global Constraints

- Only users with role GESTOR can create custom tipos
- Nome is required and must be non-empty string
- Descricao is optional
- Service function `createTipoFolhaCustomizado` already handles:
  - Duplicate name validation (throws error)
  - Sequential order calculation
  - customizado=true flag
  - ativo=true by default
- Return status 201 (Created) on success
- Return status 400 on validation errors
- Return status 403 on auth failure
- Return status 500 for unexpected errors (already in GET)

## Test Plan

1. **Auth failure (no GESTOR role):**
   - Call POST without GESTOR role
   - Expect: 403 with "Acesso negado"

2. **Validation failure (missing nome):**
   - Call POST with empty body
   - Expect: 400 with "Nome é obrigatório"

3. **Success - create custom tipo:**
   - Call POST with `{ nome: "Adicional", descricao: "Folha adicional do mês" }`
   - Expect: 201 with `{ data: { id, nome, descricao, ordem, obrigatorio, customizado, ativo } }`

4. **Duplicate name error:**
   - Call POST twice with same nome
   - First: 201 (success)
   - Second: 400 (duplicate error from service)

## Success Criteria

✅ POST endpoint implemented
✅ Auth check works (403 for non-GESTOR)
✅ Validation check works (400 for missing nome)
✅ Service function called correctly
✅ Created tipo returned with 201
✅ Errors handled with appropriate status codes
✅ No new TypeScript errors
