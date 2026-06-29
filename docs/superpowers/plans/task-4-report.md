# Task 4: Update Import Dialog Report

**Status:** DONE

**Commits:** 9667418

**Test Results:**
- TypeScript type-check run — no errors in modified files (import-dialog.tsx, preview/route.ts). Pre-existing project-wide TS errors exist in unrelated files (AUDITOR role, Decimal types, status enums) and are not introduced by this task.
- Full `npm run build` blocked by Prisma DLL permission error (Windows file lock on query_engine.dll) — pre-existing environment issue, not related to this task.
- File validation logic updated: `.csv` and `.xlsx` accepted; `.txt` and other types trigger "Formato não suportado. Use CSV ou XLSX." toast.
- UI text updated in dialog description, drop zone label, and file size hint.
- Input `accept` attribute updated to `.csv,.xlsx,.xls`.

**Changes beyond spec:**
- Also updated `src/app/api/lancamentos/import/preview/route.ts` to use `parseLancamentosFile` instead of `parseLancamentosCSV`. Without this change the server would still only parse CSV even when a valid XLSX is uploaded. This is required for the feature to work end-to-end.

**Concerns:** None. The `parseLancamentosFile` wrapper (Task 3) handles format detection by file extension, so both CSV and XLSX flow correctly through the same API pipeline.
