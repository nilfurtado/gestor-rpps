import { z } from "zod";

export const orgaoSchema = z.object({
  sigla: z
    .string()
    .min(2, "Sigla deve ter pelo menos 2 caracteres")
    .max(20, "Sigla muito longa")
    .transform((v) => v.trim().toUpperCase()),
  nome: z
    .string()
    .min(3, "Informe o nome do órgão")
    .max(150, "Nome muito longo")
    .transform((v) => v.trim()),
  razaoSocial: z
    .string()
    .max(200, "Razão Social muito longa")
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  cnpj: z
    .string()
    .max(20, "CNPJ muito longo")
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  cep: z
    .string()
    .max(20, "CEP muito longo")
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  endereco: z
    .string()
    .max(200, "Endereço muito longo")
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  numero: z
    .string()
    .max(50, "Número muito longo")
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  complemento: z
    .string()
    .max(100, "Complemento muito longo")
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  bairro: z
    .string()
    .max(100, "Bairro muito longo")
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  cidade: z
    .string()
    .max(100, "Cidade muito longa")
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  estado: z
    .string()
    .max(2, "Estado deve ter 2 caracteres")
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim().toUpperCase() : null)),
  cor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar em formato HEX (ex: #2563EB)")
    .optional()
    .nullable()
    .transform((v) => (v ? v.toUpperCase() : null)),
  status: z.enum(["ATIVO", "INATIVO"]).default("ATIVO"),
});

export type OrgaoInput = z.infer<typeof orgaoSchema>;

export const lancamentoSchema = z.object({
  orgaoId: z.coerce.number().int().positive(),
  tipo: z.enum(["PATRONAL", "SEGURADO"]),
  exercicioId: z.coerce.number().int().positive(),
  competenciaId: z.coerce.number().int().positive(),
  aliquota: z.coerce.number().min(0).max(100),
  valorRecolher: z.coerce.number().min(0),
  valorRecolhido: z.coerce.number().min(0).optional().nullable().default(0),
  quantidadeServidores: z.coerce.number().int().min(0).optional().nullable(),
  folhaBase: z.coerce.number().min(0).optional().nullable(),
  folhaSuplementar: z.coerce.number().min(0).optional().nullable().default(0),
  multas: z.coerce.number().min(0).optional().nullable(),
  juros: z.coerce.number().min(0).optional().nullable(),
  acrescimo: z.coerce.number().min(0).optional().nullable().default(0),
  parcelado: z.coerce.boolean().optional().default(false),
  dataVencimento: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? new Date(v) : null)),
  observacoes: z
    .string()
    .max(2000)
    .optional()
    .nullable()
    .transform((v) => (v ? v.trim() : null)),
  justificativaDiferenca: z
    .string()
    .max(500)
    .optional()
    .nullable(),
  diferenca_aprovada: z.coerce.boolean().optional().default(false),
  dataAprovacao: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? new Date(v) : null)),
});

export type LancamentoInput = z.infer<typeof lancamentoSchema>;

export const acordoSchema = z.object({
  numero: z.string().trim().min(1, "Informe o número do termo").max(40),
  dataAcordo: z.string().min(1, "Informe a data do acordo").transform((v) => new Date(v)),
  orgaoId: z.coerce.number().int().positive(),
  tipoDebito: z.enum(["PATRONAL", "SEGURADO", "AMBOS"]),
  valorOriginal: z.coerce.number().min(0).optional(),
  atualizacaoMonetaria: z.coerce.number().min(0).default(0),
  jurosAcordo: z.coerce.number().min(0).default(0),
  multaAcordo: z.coerce.number().min(0).default(0),
  numeroParcelas: z.coerce.number().int().min(1).max(240),
  valorParcela: z.coerce.number().positive("Valor da parcela deve ser maior que zero"),
  diaVencimento: z.coerce.number().int().min(1).max(31),
  primeiroVencimento: z
    .string()
    .min(1, "Informe a data do primeiro vencimento")
    .transform((v) => new Date(v)),
  formaGarantia: z
    .enum(["FPM", "CAUC", "RECEITAS_PROPRIAS", "OUTRA"])
    .optional()
    .nullable(),
  garantiaDetalhes: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v ? v.trim() : null)),
  leiAutorizativa: z
    .string()
    .max(120)
    .optional()
    .nullable()
    .transform((v) => (v ? v.trim() : null)),
  observacoes: z
    .string()
    .max(2000)
    .optional()
    .nullable()
    .transform((v) => (v ? v.trim() : null)),
  lancamentoIds: z.array(z.coerce.number().int().positive()).min(1, "Vincule ao menos um lançamento"),
});

export type AcordoInput = z.infer<typeof acordoSchema>;

export const acordoUpdateSchema = acordoSchema
  .partial()
  .extend({
    status: z.enum(["VIGENTE", "QUITADO", "RESCINDIDO", "SUSPENSO"]).optional(),
    parcelasPagas: z.coerce.number().int().min(0).optional(),
    valorPago: z.coerce.number().min(0).optional(),
  });

export type AcordoUpdateInput = z.infer<typeof acordoUpdateSchema>;
