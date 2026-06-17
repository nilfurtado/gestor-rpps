import type { LancamentoStatus } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";
import type { User } from "@prisma/client";
import type { FolhaPrevidenciaria } from "@prisma/client";

export type MotivosSuplemento =
  | "RESCISAO"
  | "COMPLEMENTACAO"
  | "FERIAS"
  | "OUTRO"

export interface FolhaSupplementar {
  id: number;
  folhaPrevidenciariaId: number;
  folhaPrevidenciaria?: FolhaPrevidenciaria;
  motivo: MotivosSuplemento;
  descricao?: string;
  folhaBase: Decimal;
  status: LancamentoStatus;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFolhaSuplementerInput {
  folhaPrevidenciariaId: number;
  motivo: MotivosSuplemento;
  descricao?: string;
  folhaBase: Decimal;
  observacoes?: string;
}

export interface UpdateFolhaSuplementerInput {
  motivo?: MotivosSuplemento;
  descricao?: string;
  folhaBase?: Decimal;
  observacoes?: string;
}

export const MOTIVOS_SUPLEMENTO: Record<MotivosSuplemento, string> = {
  RESCISAO: "Rescisão",
  COMPLEMENTACAO: "Complementação",
  FERIAS: "Férias",
  OUTRO: "Outro",
}
