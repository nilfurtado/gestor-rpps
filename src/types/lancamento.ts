import type { LancamentoStatus, TipoContribuicao } from "@prisma/client";

// ─── Tipos de Folha ──────────────────────────────────────────────────────────

export interface TipoFolhaRow {
  id: number;
  nome: string;
  descricao: string | null;
  ordem: number;
  obrigatorio: boolean;
  customizado: boolean;
  ativo: boolean;
}

export interface LancamentoFolhaRow {
  id: number;
  lancamentoId: number;
  tipoFolhaId: number;
  tipoFolha: TipoFolhaRow;
  valor: number;           // Entrada: valor da folha
  aliquota: number;        // Herdada do lançamento
  valorARecolher: number;  // AUTO: valor × aliquota / 100
  valorRecolhido: number;  // Entrada: valor recebido
  diferenca: number;       // AUTO: valorARecolher - valorRecolhido
}

// ─── Lançamento ──────────────────────────────────────────────────────────────

export interface LancamentoRow {
  id: number;
  orgao: { id: number; sigla: string; nome: string };
  tipo: TipoContribuicao;
  exercicio: { id: number; ano: number; status: string };
  competencia: { id: number; ordem: number; mes: string };
  aliquota: number;
  valorRecolher: number;
  valorRecolhido: number;
  deficit: number;
  inadimplencia: number;
  status: LancamentoStatus;
  parcelado: boolean;
  dataVencimento: string | null;
  acordo: { id: number; numero: string } | null;
  multas?: number;
  juros?: number;
  folhaBase?: number;
  folhaSuplementar?: number;
  // Folhas dinâmicas
  folhas: LancamentoFolhaRow[];
  folhaTotal: number;       // SUM(folhas.valor)
  totalARecolher: number;   // SUM(folhas.valorARecolher)
  totalRecolhido: number;   // SUM(folhas.valorRecolhido)
  deficitTotal: number;     // SUM(folhas.diferenca)
}

// ─── Input ───────────────────────────────────────────────────────────────────

export interface CreateLancamentoInput {
  orgaoId: number;
  tipo: "PATRONAL" | "SEGURADO";
  exercicioId: number;
  competenciaId: number;
  aliquota: number;
  valorRecolher: number;
  valorRecolhido?: number | null;
  quantidadeServidores?: number | null;
  folhaBase?: number | null;
  folhaSuplementar?: number | null;
  multas?: number | null;
  juros?: number | null;
  acrescimo?: number | null;
  parcelado?: boolean;
  dataVencimento?: string | null;
  observacoes?: string | null;
  justificativaDiferenca?: string | null;
  diferenca_aprovada?: boolean;
  dataAprovacao?: string | null;
  // Folhas dinâmicas
  folhas: Array<{
    tipoFolhaId: number;
    valor: number;
    valorRecolhido: number;
  }>;
}

export interface UpdateLancamentoInput {
  orgaoId?: number;
  tipo?: "PATRONAL" | "SEGURADO";
  exercicioId?: number;
  competenciaId?: number;
  aliquota?: number;
  valorRecolher?: number;
  valorRecolhido?: number | null;
  quantidadeServidores?: number | null;
  folhaBase?: number | null;
  folhaSuplementar?: number | null;
  multas?: number | null;
  juros?: number | null;
  acrescimo?: number | null;
  parcelado?: boolean;
  dataVencimento?: string | null;
  observacoes?: string | null;
  justificativaDiferenca?: string | null;
  diferenca_aprovada?: boolean;
  dataAprovacao?: string | null;
  // Folhas dinâmicas
  folhas?: Array<{
    tipoFolhaId: number;
    valor: number;
    valorRecolhido: number;
  }>;
}
