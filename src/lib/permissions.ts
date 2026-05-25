import type { Role } from "@prisma/client";

export const ROLE_LABEL: Record<Role, string> = {
  GESTOR: "Gestor",
  OPERADOR: "Operador",
  AUDITOR: "Auditor",
};

export const ROLE_DESCRIPTION: Record<Role, string> = {
  GESTOR:
    "Acesso total: gerencia usuários, órgãos, exercícios, dados do RPPS e todos os lançamentos.",
  OPERADOR:
    "Operação diária: cria e edita lançamentos, visualiza dashboards e gera relatórios.",
  AUDITOR:
    "Somente leitura: visualiza todos os dados e gera relatórios, sem permissão para editar.",
};

export const ALL_ROLES: Role[] = ["GESTOR", "OPERADOR", "AUDITOR"];

// ───────────────────────────────────────────────────────────────
// Capacidades — função pura por funcionalidade
// ───────────────────────────────────────────────────────────────

/** Pode visualizar qualquer conteúdo do sistema (autenticado). */
export function canRead(_role: Role | undefined | null): boolean {
  return true;
}

/** Pode criar, editar e excluir lançamentos (folhas). */
export function canManageLancamentos(role: Role | undefined | null): boolean {
  return role === "GESTOR" || role === "OPERADOR";
}

/** Pode criar, editar e excluir acordos / parcelamentos. */
export function canManageAcordos(role: Role | undefined | null): boolean {
  return role === "GESTOR" || role === "OPERADOR";
}

/** Pode criar, editar e excluir órgãos. */
export function canManageOrgaos(role: Role | undefined | null): boolean {
  return role === "GESTOR";
}

/** Pode abrir, encerrar e remover exercícios fiscais. */
export function canManageExercicios(role: Role | undefined | null): boolean {
  return role === "GESTOR";
}

/** Pode criar, editar, excluir usuários e alterar senhas. */
export function canManageUsuarios(role: Role | undefined | null): boolean {
  return role === "GESTOR";
}

/** Pode editar dados institucionais do RPPS e fazer upload da logomarca. */
export function canManageRpps(role: Role | undefined | null): boolean {
  return role === "GESTOR";
}

/** Pode gerar relatórios em PDF/XLSX. */
export function canGenerateReports(_role: Role | undefined | null): boolean {
  return true;
}

// ───────────────────────────────────────────────────────────────
// Helpers de resposta para Route Handlers
// ───────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";

/**
 * Retorna uma resposta 403 padronizada quando o usuário autenticado
 * não tem permissão para a ação solicitada.
 */
export function forbidden(message?: string) {
  return NextResponse.json(
    {
      error:
        message ??
        "Acesso negado. Seu nível de permissão não permite esta operação.",
    },
    { status: 403 }
  );
}
