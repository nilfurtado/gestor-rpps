/**
 * Gera um slug único para lançamento baseado em: órgão + competência + exercício
 * Exemplo: "semad-fevereiro-2026"
 */

export function gerarSlugLancamento(
  orgaoSigla: string,
  mesCurtado: string,
  ano: number
): string {
  const orgaoSlug = orgaoSigla.toLowerCase().replace(/[^\w-]/g, "");
  const mesSlug = traduzirMes(mesCurtado).toLowerCase().replace(/[^\w-]/g, "");
  return `${orgaoSlug}-${mesSlug}-${ano}`;
}

function traduzirMes(mes: string): string {
  const meses: Record<string, string> = {
    Janeiro: "janeiro",
    Fevereiro: "fevereiro",
    Março: "marco",
    Abril: "abril",
    Maio: "maio",
    Junho: "junho",
    Julho: "julho",
    Agosto: "agosto",
    Setembro: "setembro",
    Outubro: "outubro",
    Novembro: "novembro",
    Dezembro: "dezembro",
  };
  return meses[mes] || mes.toLowerCase();
}

/**
 * Cria URL de edição usando slug
 * Exemplo: /lancamentos/semad-fevereiro-2026/editar
 */
export function criarUrlEditar(
  orgaoSigla: string,
  mesCurtado: string,
  ano: number
): string {
  const slug = gerarSlugLancamento(orgaoSigla, mesCurtado, ano);
  return `/lancamentos/${slug}/editar`;
}
