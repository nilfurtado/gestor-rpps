import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface JustificativaDiferencaProps {
  acrescimo?: number;
  justificativa?: string;
  aprovada?: boolean;
  dataAprovacao?: string;
  onAprovar?: (motivo: string, detalhe: string) => Promise<void>;
  disabled?: boolean;
}

export function JustificativaDiferenca({
  acrescimo = 0,
  justificativa,
  aprovada = false,
  dataAprovacao,
  onAprovar,
  disabled = false,
}: JustificativaDiferencaProps) {
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);

  // Só mostra se há diferença (acrescimo < 0)
  if (acrescimo >= 0) return null;

  const temDiferenca = Math.abs(acrescimo) > 0;

  const handleAprovar = async () => {
    if (!motivo) return;

    setLoading(true);
    try {
      console.log("Aprovando diferença:", { motivo, acrescimo });
      await onAprovar?.(motivo, "");
    } catch (err) {
      console.error("Erro ao aprovar:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDesaprovar = () => {
    setMotivo("");
  };

  return (
    <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
      {/* Header compacto */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-yellow-900">
          Justificativa da Diferença
        </div>
        <div className="text-xs font-semibold text-yellow-700">
          -R$ {Math.abs(acrescimo).toFixed(2)}
        </div>
      </div>

      {/* Estado aprovado */}
      {aprovada && dataAprovacao && (
        <div className="flex items-center justify-between gap-2 bg-green-100 rounded px-2 py-1.5">
          <div className="text-xs text-green-700">
            <span className="mr-1">✓</span>
            Aprovada em {new Date(dataAprovacao).toLocaleDateString("pt-BR")}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDesaprovar}
            disabled={loading}
            className="h-6 px-2 text-xs text-green-700 hover:text-green-900"
          >
            Desfazer
          </Button>
        </div>
      )}

      {/* Estado não aprovado */}
      {!aprovada && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Select value={motivo} onValueChange={setMotivo} disabled={disabled || loading}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proventos">Diferença em Proventos</SelectItem>
                <SelectItem value="descontos">Diferença em Descontos</SelectItem>
                <SelectItem value="processamento">Diferença de Processamento</SelectItem>
                <SelectItem value="conformidade">Diferença de Conformidade</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleAprovar}
            disabled={!motivo || disabled || loading}
            size="sm"
            className="h-8 px-3 text-xs"
          >
            {loading ? "..." : "Aprovar"}
          </Button>
        </div>
      )}
    </div>
  );
}
