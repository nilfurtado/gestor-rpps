# Auto-Descrição de Backups - Implementation Plan

> **Para execução:** Use `superpowers:subagent-driven-development` (recomendado).

**Objetivo:** Gerar descrição automática de backups baseada no estado atual do sistema (erros, avisos, eventos).

**Arquitetura:** 
1. Analisar stats do sistema (erros, avisos, backups)
2. Gerar sugestão inteligente
3. Mostrar no modal de backup
4. Usuário pode aceitar ou editar

**Exemplos de Descrições Geradas:**
```
SISTEMA-OK                    (sem erros)
BACKUP-CRITICO               (10+ erros)
ANTES-FIX-ACORDOS            (erro detectado em acordos)
BACKUP-DIARIO-17JUN          (backup rotineiro)
POS-DEPLOY-1.3.0             (após deploy detectado)
SINCRONIZACAO-COMPLETA       (dados sincronizados)
```

---

## Task 1: Serviço de Análise de Sistema

**Files:**
- Create: `src/lib/system-analysis-service.ts`

**Exports:**
```typescript
export async function analyzeSystemState(): Promise<{
  errorCount: number;
  warningCount: number;
  backupCount: number;
  lastBackupAge: string; // "1h", "30m", "2d"
  hasRecentErrors: boolean;
  suggestions: string[];
}>

export function generateAutoDescription(state: SystemState): string
```

### Lógica de Análise:

```
Se 0 backups:
  → "PRIMEIRO-BACKUP" ou "SETUP-INICIAL"

Se 10+ erros:
  → "CRITICO" ou "ERRO-" + tipoErro

Se 5-9 erros:
  → "ANTES-FIX-" + componente

Se 0 erros e 0 avisos:
  → "SISTEMA-OK" ou "HEALTHY-CHECK"

Se backup antigo (>7 dias):
  → "BACKUP-ATRASADO"

Se múltiplos componentes:
  → "SINCRONIZACAO-" + data
```

---

## Task 2: Atualizar Página para Mostrar Sugestão

**Files:**
- Modify: `src/app/(dashboard)/admin/backup/page.tsx`

**Changes:**
```typescript
const [suggestedDescription, setSuggestedDescription] = useState("");

const handleCreateBackup = async () => {
  const state = await analyzeSystemState();
  const suggested = generateAutoDescription(state);
  setSuggestedDescription(suggested);
  setShowDescriptionDialog(true);
};
```

---

## Task 3: Atualizar Modal para Mostrar Sugestão

**Files:**
- Modify: `src/app/(dashboard)/admin/backup/backup-description-dialog.tsx`

**Changes:**
- Props: `suggestedDescription?: string`
- Se `suggestedDescription` existir, mostrar como placeholder ou botão "Usar sugestão"
- Exemplo UI:
  ```
  Descrição (opcional)
  [input com placeholder: "Ex: SISTEMA-OK"]
  📋 Sugestão: SISTEMA-OK [Usar]
  ```

---

## Task 4: Testes

**Verificações:**
1. Sem erros: gera "SISTEMA-OK"
2. Com erros: gera "CRITICO" ou "ERRO-X"
3. Sugestão aparece no modal
4. Usuário pode aceitar ou editar
5. Descrição é salva corretamente

---

## Status

| Tarefa | Status |
|--------|--------|
| 1. Serviço de análise | ⏳ TODO |
| 2. Integrar em página | ⏳ TODO |
| 3. Atualizar modal | ⏳ TODO |
| 4. Testes | ⏳ TODO |

**Total de tarefas:** 4
**Tempo estimado:** 2 horas
