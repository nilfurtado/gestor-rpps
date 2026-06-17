# Versionamento de Backups com Descrição - Implementation Plan

> **Para execução:** Use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para implementar este plano.

**Objetivo:** Permitir que usuários deem nomes/descrições aos backups para facilitar identificação em cenários de disaster recovery.

**Arquitetura:** Sistema de 2 campos:
1. **Descrição** (opcional) - texto livre do usuário (ex: "ANTES-DEPLOY-1.3.0", "BUG-CRITICO-ACORDOS")
2. **Data** (automática) - timestamp ISO para ordenação

Resultado: `backup-2026-06-15-ANTES-DEPLOY-1.3.0.db` ao invés de `backup-2026-06-15T14-30-00.db`

**Tech Stack:**
- TypeScript
- Prisma (para persistir metadados)
- React (UI modal para descrição)
- SQLite/PostgreSQL (armazenar nome do backup)

## Global Constraints

- Descrição é **opcional** (backward-compatible com backups antigos)
- Máximo 50 caracteres
- Caracteres permitidos: alphanuméricas, hífens, underscores
- Banco de dados armazena metadados (`BackupMetadata` table)
- API retorna backup com descrição

---

## Estrutura de Arquivos

```
src/
├── types/
│   └── backup.ts (atualizar com novo campo)
├── lib/
│   ├── backup-service.ts (atualizar)
│   └── backup-metadata-service.ts (novo)
├── app/api/admin/backup/
│   └── route.ts (atualizar POST para aceitar description)
└── app/(dashboard)/admin/backup/
    ├── backup-table.tsx (atualizar)
    ├── backup-description-dialog.tsx (novo - modal)
    └── page.tsx (atualizar)

prisma/
└── schema.prisma (adicionar tabela BackupMetadata)
```

---

## Task 1: Atualizar Tipos

**Files:**
- Modify: `src/types/backup.ts`

**Changes:**
```typescript
export interface Backup {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  status: BackupStatus;
  downloadUrl?: string;
  description?: string;  // NOVO
}
```

---

## Task 2: Schema Prisma - BackupMetadata

**Files:**
- Modify: `prisma/schema.prisma`

**Add table:**
```prisma
model BackupMetadata {
  id        String   @id @default(cuid())
  backupId  String   @unique
  filename  String
  description String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Steps:**
1. Adicionar model BackupMetadata ao schema
2. Run: `npx prisma migrate dev --name add_backup_metadata`
3. Commit

---

## Task 3: Serviço de Metadados

**Files:**
- Create: `src/lib/backup-metadata-service.ts`

**Exports:**
- `saveBackupMetadata(backupId, filename, description?): Promise<void>`
- `getBackupMetadata(backupId): Promise<BackupMetadata | null>`
- `updateBackupDescription(backupId, description): Promise<void>`

---

## Task 4: Atualizar Backup Service

**Files:**
- Modify: `src/lib/backup-service.ts`

**Changes:**
```typescript
export async function createBackup(description?: string): Promise<Backup> {
  // ... código existente ...
  
  // NOVO: Salvar metadados
  if (description) {
    await saveBackupMetadata(backup.id, backup.filename, description);
  }
  
  return backup;
}
```

---

## Task 5: Modal de Descrição

**Files:**
- Create: `src/app/(dashboard)/admin/backup/backup-description-dialog.tsx`

**Componente:**
- Dialog com Input (máximo 50 caracteres)
- Validação: apenas alphanuméricas, hífens, underscores
- Botões: Cancelar, Criar Backup

---

## Task 6: Atualizar API POST

**Files:**
- Modify: `src/app/api/admin/backup/route.ts`

**Changes:**
```typescript
export async function POST(request: NextRequest) {
  const { description } = await request.json();
  
  const backup = await createBackup(description);
  
  // Log com descrição
  logsService.addLog("info", "Backup criado", {
    backupId: backup.id,
    description
  });
  
  return NextResponse.json({ backup });
}
```

---

## Task 7: Atualizar BackupTable

**Files:**
- Modify: `src/app/(dashboard)/admin/backup/backup-table.tsx`

**Changes:**
- Adicionar coluna "Descrição" na tabela
- Mostrar descrição se existir
- Exemplo: "ANTES-DEPLOY-1.3.0" ou "—" se vazio

---

## Task 8: Atualizar Página Principal

**Files:**
- Modify: `src/app/(dashboard)/admin/backup/page.tsx`

**Changes:**
```typescript
const handleCreateBackup = async () => {
  // Abrir modal de descrição
  const description = await showDescriptionDialog();
  
  if (description === null) return; // Cancelado
  
  const res = await fetch("/api/admin/backup", {
    method: "POST",
    body: JSON.stringify({ description })
  });
  // ...
}
```

---

## Task 9: Testes

**Verificações:**
1. Criar backup SEM descrição → funciona (backward-compatible)
2. Criar backup COM descrição → salva e exibe
3. Descrição com 50+ caracteres → rejeita
4. Caracteres inválidos → rejeita
5. Restaurar backup com descrição → log mostra descrição
6. Descrição aparece na tabela

---

## Status

| Tarefa | Status |
|--------|--------|
| 1. Atualizar tipos | ⏳ TODO |
| 2. Schema Prisma | ⏳ TODO |
| 3. Serviço metadados | ⏳ TODO |
| 4. Atualizar backup service | ⏳ TODO |
| 5. Modal de descrição | ⏳ TODO |
| 6. Atualizar API | ⏳ TODO |
| 7. Atualizar tabela | ⏳ TODO |
| 8. Atualizar página | ⏳ TODO |
| 9. Testes | ⏳ TODO |

**Total de tarefas:** 9
**Tempo estimado:** 3-4 horas
