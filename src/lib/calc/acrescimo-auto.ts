export type TipoAcrescimo = 'ACRESCIMO' | 'DIFERENCA' | 'QUITADO';

export interface ResultadoAcrescimo {
  acrescimo: number;
  tipo: TipoAcrescimo;
  cor: string;
  mensagem: string;
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

  if (Math.abs(acrescimo) < 0.01) {
    tipo = 'QUITADO';
    cor = 'bg-green-50 border-green-200';
    mensagem = '✅ Valor exato';
  } else if (acrescimo > 0) {
    tipo = 'ACRESCIMO';
    cor = 'bg-blue-50 border-blue-200';
    mensagem = `⭐ Recolheu R$ ${acrescimo.toFixed(2)} a mais`;
  } else {
    tipo = 'DIFERENCA';
    cor = 'bg-red-50 border-red-200';
    mensagem = `❌ Faltam R$ ${Math.abs(acrescimo).toFixed(2)}`;
  }

  return {
    acrescimo: Number(acrescimo.toFixed(2)),
    tipo,
    cor,
    mensagem,
  };
}
