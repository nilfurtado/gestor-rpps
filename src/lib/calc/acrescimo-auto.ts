export type TipoAcrescimo = 'ACRESCIMO' | 'DIFERENCA' | 'QUITADO';

export interface ResultadoAcrescimo {
  acrescimo: number; // Valor com sinal (para banco)
  tipo: TipoAcrescimo;
  cor: string;
  mensagem: string;
  rótulo: string; // "Acréscimo" ou "Diferença" ou "Quitado"
  valorExibicao: string; // Valor formatado com rótulo
}

export function calcularAcrescimoAuto(
  valorARecolher: number,
  valorRecolhido: number,
  multas: number = 0
): ResultadoAcrescimo {
  const total = valorARecolher + multas;
  const acrescimo = valorRecolhido - total;

  let tipo: TipoAcrescimo;
  let cor: string;
  let mensagem: string;
  let rótulo: string;
  let valorExibicao: string;

  if (Math.abs(acrescimo) < 0.01) {
    tipo = 'QUITADO';
    cor = 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
    mensagem = '';
    rótulo = 'Quitado';
    valorExibicao = '0,00';
  } else if (acrescimo > 0) {
    tipo = 'ACRESCIMO';
    cor = 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
    mensagem = '';
    rótulo = 'Acréscimo';
    valorExibicao = `+R$ ${acrescimo.toFixed(2).replace('.', ',')}`;
  } else {
    tipo = 'DIFERENCA';
    cor = 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
    const diferenca = Math.abs(acrescimo);
    mensagem = '';
    rótulo = 'Diferença';
    valorExibicao = `-R$ ${diferenca.toFixed(2).replace('.', ',')}`;
  }

  return {
    acrescimo: Number(acrescimo.toFixed(2)), // Valor com sinal (para banco)
    tipo,
    cor,
    mensagem,
    rótulo,
    valorExibicao,
  };
}
