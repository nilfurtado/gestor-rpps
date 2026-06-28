# Task 5: Atualizar Formulário com Cálculos de Valor a Recolher

## Objective
Update the lançamento form component to display folhas dynamically with real-time calculations of Valor a Recolher (amount to collect) and Diferença (difference).

## Files to Modify
- `src/app/(dashboard)/lancamentos/lancamento-form.tsx`

## Requirements

### 1. Import Required Functions
```typescript
import { calcularValorARecolher, calcularDiferenca } from "@/lib/tipo-folha-service";
import { getTiposFolhaAtivos } from "@/lib/tipo-folha-service";
import type { TipoFolhaRow } from "@/types/lancamento";
```

### 2. Add State Management

Add these states to the component:

```typescript
const [tiposFolha, setTiposFolha] = useState<TipoFolhaRow[]>([]);
const [folhas, setFolhas] = useState<Array<{
  tipoFolhaId: number;
  valor: string;
  valorRecolhido: string;
  valorARecolher?: number;
  diferenca?: number;
}>>([]);

// Get aliquota from tipo (PATRONAL 15%, SEGURADO 10%)
const aliquota = initial?.tipo === "PATRONAL" ? 15 : 10;
```

### 3. Add useMemo for Real-Time Calculations

```typescript
// Recalculate valores when folhas or aliquota changes
const folhasComCalculos = useMemo(() => {
  return folhas.map(f => {
    const valor = currencyToNumber(f.valor);
    const recolhido = currencyToNumber(f.valorRecolhido);
    const aRecolher = calcularValorARecolher(valor, aliquota);
    const diferenca = calcularDiferenca(aRecolher, recolhido);
    return { ...f, valorARecolher: aRecolher, diferenca };
  });
}, [folhas, aliquota]);

// Summary totals (readonly)
const resumo = useMemo(() => {
  return {
    folhaTotal: calcularFolhaTotal(folhasComCalculos),
    totalARecolher: calcularTotalARecolher(folhasComCalculos),
    totalRecolhido: calcularTotalRecolhido(folhasComCalculos),
    deficitTotal: calcularDeficitTotal(folhasComCalculos),
  };
}, [folhasComCalculos]);
```

### 4. Fetch Tipos on Mount

In useEffect, fetch active folha types:

```typescript
useEffect(() => {
  async function fetchTipos() {
    try {
      const response = await fetch("/api/tipos-folha");
      const data = await response.json();
      setTiposFolha(data.data || []);
    } catch (error) {
      console.error("Erro ao buscar tipos de folha:", error);
    }
  }
  fetchTipos();
}, []);
```

### 5. Initialize Folhas from Initial Data

If `initial?.folhas` exists, populate folhas state. Otherwise, start with empty array (Base will be added by form or DB).

### 6. Add Folha Base Section (Required)

Create a visually distinct section for Folha Base marked as OBRIGATÓRIA:

```typescript
<div className="bg-blue-50 p-4 rounded border-2 border-blue-200 mb-4">
  <div className="flex justify-between items-center mb-3">
    <Label className="font-bold">Folha Base *</Label>
    <Badge variant="outline" className="bg-blue-100 text-blue-800">OBRIGATÓRIA</Badge>
  </div>
  
  <div className="grid grid-cols-4 gap-3">
    {/* Col 1: Valor Folha */}
    <div>
      <p className="text-xs font-medium text-gray-600 mb-1">Valor Folha</p>
      <CurrencyInput
        value={folhasComCalculos[0]?.valor || ""}
        onChange={(e) => {
          const novas = [...folhas];
          if (!novas[0]) novas[0] = { tipoFolhaId: 1, valor: "", valorRecolhido: "" };
          novas[0].valor = e.target.value;
          setFolhas(novas);
        }}
        placeholder="R$ 0,00"
      />
    </div>
    
    {/* Col 2: Alíquota (readonly) */}
    <div>
      <p className="text-xs font-medium text-gray-600 mb-1">Alíquota</p>
      <div className="p-2 bg-gray-100 rounded border text-center font-semibold">
        {aliquota}%
      </div>
    </div>
    
    {/* Col 3: Valor a Recolher (readonly, auto-calculated) */}
    <div>
      <p className="text-xs font-medium text-gray-600 mb-1">Valor a Recolher</p>
      <div className="p-2 bg-green-50 rounded border border-green-300 text-green-700 font-semibold">
        {formatBRL(folhasComCalculos[0]?.valorARecolher || 0)}
      </div>
    </div>
    
    {/* Col 4: Valor Recolhido */}
    <div>
      <p className="text-xs font-medium text-gray-600 mb-1">Valor Recolhido</p>
      <CurrencyInput
        value={folhasComCalculos[0]?.valorRecolhido || ""}
        onChange={(e) => {
          const novas = [...folhas];
          if (!novas[0]) novas[0] = { tipoFolhaId: 1, valor: "", valorRecolhido: "" };
          novas[0].valorRecolhido = e.target.value;
          setFolhas(novas);
        }}
        placeholder="R$ 0,00"
      />
    </div>
  </div>
  
  {/* Diferença indicator */}
  <div className="mt-3 p-2 bg-blue-100 rounded">
    <p className="text-sm text-gray-700">
      Diferença: 
      <span className={folhasComCalculos[0]?.diferenca > 0 ? "text-red-600 font-bold ml-2" : "text-green-600 font-bold ml-2"}>
        {formatBRL(folhasComCalculos[0]?.diferenca || 0)}
      </span>
    </p>
  </div>
</div>
```

### 7. Add Optional Folhas Section (if applicable)

For Suplementar, Complementar, 13º, etc. (optional), create similar sections but with "remove" button:

```typescript
{folhasComCalculos.map((f, idx) => {
  if (idx === 0) return null; // Base already rendered
  return (
    <div key={idx} className="bg-gray-50 p-3 rounded mb-2">
      {/* Similar 4-column layout as Base */}
      {/* Plus a [Remove] button */}
    </div>
  );
})}

<Button 
  type="button"
  variant="outline"
  className="mt-2"
  onClick={() => {
    // Fetch tipos and show dialog to add new folha type
    setShowAddFolha(true);
  }}
>
  + Adicionar Folha Suplementar
</Button>
```

### 8. Add Summary (ReadOnly)

Display summary totals at bottom:

```typescript
<Card className="bg-gray-50 p-4 mt-4">
  <h3 className="font-bold text-gray-800 mb-3">Resumo</h3>
  <div className="grid grid-cols-4 gap-2 text-sm">
    <div>
      <p className="text-gray-600">Folha Total</p>
      <p className="font-bold text-lg">{formatBRL(resumo.folhaTotal)}</p>
    </div>
    <div>
      <p className="text-gray-600">Total a Recolher</p>
      <p className="font-bold text-lg text-green-600">{formatBRL(resumo.totalARecolher)}</p>
    </div>
    <div>
      <p className="text-gray-600">Total Recolhido</p>
      <p className="font-bold text-lg text-blue-600">{formatBRL(resumo.totalRecolhido)}</p>
    </div>
    <div>
      <p className="text-gray-600">Déficit Total</p>
      <p className={`font-bold text-lg ${resumo.deficitTotal > 0 ? "text-red-600" : "text-green-600"}`}>
        {formatBRL(resumo.deficitTotal)}
      </p>
    </div>
  </div>
</Card>
```

## Global Constraints

- Folha Base is ALWAYS required and displayed first
- Aliquota is inherited from Lançamento type: PATRONAL 15%, SEGURADO 10%
- All currency values use BRL formatting with 2 decimal places
- Valor a Recolher is calculated as: valor × aliquota / 100 (AUTOMATIC)
- Diferença is calculated as: valorARecolher - valorRecolhido (AUTOMATIC)
- All calculations happen in real-time via useMemo
- Form must visually distinguish Base (blue) from optional types (gray)
- Role GESTOR is required to edit (inherited from parent page)

## Test Plan

1. **Load form with initial data:**
   - Verify tiposFolha fetched from API
   - Verify folhas initialized from initial?.folhas if present
   - Verify Base shown as required

2. **Edit Valor Folha:**
   - Change Base valor to 10000
   - Verify Valor a Recolher auto-calculates (10000 × 15% = 1500 for PATRONAL)
   - Verify Diferença updates (1500 - valorRecolhido)

3. **Edit Valor Recolhido:**
   - Set valorRecolhido = 1200
   - Verify Diferença = 1500 - 1200 = 300

4. **Summary calculations:**
   - Add multiple folhas (Base + Suplementar)
   - Verify Folha Total = SUM of all valor
   - Verify Total a Recolher = SUM of all valorARecolher
   - Verify Déficit Total = SUM of all diferenca

5. **Remove optional folha:**
   - Add Suplementar, then remove it
   - Verify summary recalculates

## Success Criteria

✅ Form displays dynamically with Folha Base marked as required
✅ Real-time calculations work for Valor a Recolher and Diferença
✅ Summary totals update as user edits folhas
✅ No TypeScript errors
✅ All CurrencyInput and formatting helpers work correctly
✅ Form submission includes folhas array with tipoFolhaId, valor, valorRecolhido
