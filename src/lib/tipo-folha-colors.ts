/**
 * Mapeamento de cores para tipos de folha
 * Retorna a cor tailwind para cada tipo
 */

export const TIPO_FOLHA_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  Base: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-300",
    badge: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100",
  },
  Suplementar: {
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    text: "text-indigo-700 dark:text-indigo-300",
    badge: "bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100",
  },
  Complementar: {
    bg: "bg-sky-50 dark:bg-sky-950/30",
    text: "text-sky-700 dark:text-sky-300",
    badge: "bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-100",
  },
  "13º": {
    bg: "bg-green-50 dark:bg-green-950/30",
    text: "text-green-700 dark:text-green-300",
    badge: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100",
  },
  Rescisão: {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    text: "text-orange-700 dark:text-orange-300",
    badge: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100",
  },
  Retroativa: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    text: "text-purple-700 dark:text-purple-300",
    badge: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100",
  },
};

export function getTipoFolhaColor(
  tipoNome: string
): { bg: string; text: string; badge: string } {
  return TIPO_FOLHA_COLORS[tipoNome] || TIPO_FOLHA_COLORS.Base;
}
