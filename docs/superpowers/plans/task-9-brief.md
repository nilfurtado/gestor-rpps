# Task 9: Carregar Folhas Salvas no Edit Flow

## Objective
When editing an existing Lançamento, load the saved folhas from the database and display them in the form, so users can see and modify multiple folhas (Base + optional types).

## Critical Issue
Currently, when editing a Lançamento that has multiple folhas (e.g., Base + Suplementar):
- Form only shows the Base folha (legacy folhaBase field)
- Optional folhas (Suplementar, etc.) are NOT loaded from the database
- User sees folhas field empty in form, even though they were saved
- Totalizadores don't update to show the saved folhas

## Files to Modify
- `src/app/(dashboard)/lancamentos/novo/lancamento-form.tsx`

## Requirements

### 1. Add Folhas Fetch to useEffect

In the component, there's already a `useEffect` that fetches tipos. Add another `useEffect` to fetch folhas when in edit mode:

```typescript
// Fetch folhas when editing
useEffect(() => {
  if (!initial?.id) return; // Only for edit mode

  async function fetchLancamento() {
    try {
      const res = await fetch(`/api/lancamentos/${initial.id}`);
      if (!res.ok) return;
      
      const data = await res.json();
      const lancamento = data.data;
      
      // If lancamento has folhas, populate the form state
      if (lancamento.folhas && lancamento.folhas.length > 0) {
        const folhasFromDb = lancamento.folhas.map((f) => ({
          tipoFolhaId: f.tipoFolhaId,
          nomeTipo: f.tipoFolha.nome,
          valor: formatCurrency(Number(f.valor)),
          valorRecolhido: formatCurrency(Number(f.valorRecolhido)),
        }));
        setFolhas(folhasFromDb);
      }
    } catch (error) {
      console.error("Erro ao buscar lançamento:", error);
    }
  }

  fetchLancamento();
}, [initial?.id]);
```

### 2. Import formatCurrency if not already imported

The form already imports this from `@/lib/format-currency`. Verify it's available.

### 3. Verify useMemo recalculates

The existing `useMemo` for `folhasComCalculos` should automatically recalculate when `setFolhas` updates. No changes needed there.

### 4. Test the Flow

1. Create a Lançamento with Base + Suplementar
2. Save it
3. Go back to list (/lancamentos)
4. Click "Editar" on that Lançamento
5. Form should now display:
   - ✅ Base folha with values
   - ✅ Suplementar folha with values
   - ✅ Totalizadores updated to show both folhas
6. User can now edit the Suplementar (change values, remove it, add more folhas)

## Global Constraints

- Only load folhas when `initial?.id` is present (edit mode)
- Don't fetch if creating new Lançamento (isEdit = false)
- Use the same format (formatCurrency) as the form inputs
- Don't overwrite folhas if fetch fails (keep current state)
- Console.error for debugging, but don't break the form

## Success Criteria

✅ Edit form loads folhas from database
✅ Folhas display in "FOLHAS DE SALÁRIOS" section
✅ Totalizadores update correctly
✅ User can edit folhas values and save again
✅ No TypeScript errors
✅ No breaking changes to create flow
