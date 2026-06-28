"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TipoFolha } from "@prisma/client";

interface RequisitosProps {
  tiposObrigatorios: TipoFolha[];
}

const CAMPOS_OBRIGATORIOS = [
  { nome: "Órgão", descricao: "Selecione o órgão responsável" },
  { nome: "Período", descricao: "Mês/Ano da competência (ex: Junho/2025)" },
  { nome: "Exercício", descricao: "Ano do exercício financeiro" },
  { nome: "Tipo de Contribuição", descricao: "PATRONAL ou SEGURADO" },
  { nome: "Folha Base", descricao: "Valor base do lançamento (em R$)" },
  { nome: "Alíquota", descricao: "Percentual de desconto (%)" },
  { nome: "Valor Recolhido", descricao: "Quanto foi recolhido até agora (em R$)" },
];

export function RequisitosLancamento({ tiposObrigatorios }: RequisitosProps) {
  return (
    <div className="space-y-4">
      {/* Tipos de Folhas Obrigatórios */}
      <Card className="p-4 border-l-4 border-l-blue-500">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-sm">Tipos de Folhas Obrigatórios</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {tiposObrigatorios.map((tipo) => (
              <Badge
                key={tipo.id}
                variant="default"
                className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
              >
                ✓ {tipo.nome}
              </Badge>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Todo lançamento deve incluir no mínimo esses tipos de folhas.
          </p>
        </div>
      </Card>

      {/* Campos Obrigatórios do Formulário */}
      <Card className="p-4 border-l-4 border-l-amber-500">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-sm">Campos Obrigatórios do Lançamento</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CAMPOS_OBRIGATORIOS.map((campo, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                <div className="text-amber-600 font-bold text-xs mt-0.5">•</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs text-foreground">{campo.nome}</div>
                  <div className="text-xs text-muted-foreground">{campo.descricao}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Dica de Atalho */}
      <Card className="p-3 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
        <p className="text-xs text-green-800 dark:text-green-200">
          💡 <strong>Dica:</strong> Todos os campos obrigatórios estão marcados com * no formulário de novo lançamento. Configure os tipos de folhas corretos antes de criar lançamentos.
        </p>
      </Card>
    </div>
  );
}
