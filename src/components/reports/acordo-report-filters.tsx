"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useCallback } from "react";
import { Filter, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRealtimeUpdates } from "@/lib/hooks/useRealtimeUpdates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

export interface AcordoFilterDefs {
  showOrgao?: boolean;
  showStatus?: boolean;
  showTipoDebito?: boolean;
  showCompetencia?: boolean;
  showPeriodo?: boolean;
  showAno?: boolean;
  showAcordo?: boolean;
  requiredAno?: boolean;
  requiredAcordo?: boolean;
}

interface Props {
  defs: AcordoFilterDefs;
  orgaos: { id: number; sigla: string; nome: string }[];
  competencias: { id: number; ordem: number; mes: string }[];
  anos: number[];
  acordos: { id: number; label: string }[];
}

export function AcordoReportFilters({
  defs,
  orgaos,
  competencias,
  anos,
  acordos,
}: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  // Monitorar atualizações em tempo real
  useRealtimeUpdates(
    useCallback((update) => {
      if (update.type === "acordo" || update.type === "lancamento") {
        toast.info("Dados atualizados", {
          description: "Recarregue a página para ver as alterações.",
          action: {
            label: "Recarregar",
            onClick: () => window.location.reload(),
          },
        });
      }
    }, [])
  );

  const [orgaoId, setOrgaoId] = useState(sp.get("orgaoId") ?? ALL);
  const [status, setStatus] = useState(sp.get("status") ?? ALL);
  const [tipoDebito, setTipoDebito] = useState(sp.get("tipoDebito") ?? ALL);
  const [competenciaId, setCompetenciaId] = useState(
    sp.get("competenciaId") ?? ALL
  );
  const [dataInicio, setDataInicio] = useState(sp.get("dataInicio") ?? "");
  const [dataFim, setDataFim] = useState(sp.get("dataFim") ?? "");
  const [ano, setAno] = useState(
    sp.get("ano") ??
      (defs.requiredAno && anos[0] ? String(anos[0]) : "")
  );
  const [acordoId, setAcordoId] = useState(sp.get("acordoId") ?? "");

  function apply() {
    const params = new URLSearchParams();
    if (defs.showOrgao && orgaoId !== ALL) params.set("orgaoId", orgaoId);
    if (defs.showStatus && status !== ALL) params.set("status", status);
    if (defs.showTipoDebito && tipoDebito !== ALL)
      params.set("tipoDebito", tipoDebito);
    if (defs.showCompetencia && competenciaId !== ALL)
      params.set("competenciaId", competenciaId);
    if (defs.showPeriodo && dataInicio) params.set("dataInicio", dataInicio);
    if (defs.showPeriodo && dataFim) params.set("dataFim", dataFim);
    if (defs.showAno && ano) params.set("ano", ano);
    if (defs.showAcordo && acordoId) params.set("acordoId", acordoId);
    start(() => router.push(`?${params.toString()}`));
  }

  function reset() {
    setOrgaoId(ALL);
    setStatus(ALL);
    setTipoDebito(ALL);
    setCompetenciaId(ALL);
    setDataInicio("");
    setDataFim("");
    if (!defs.requiredAno) setAno("");
    if (!defs.requiredAcordo) setAcordoId("");
    start(() => router.push(`?`));
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {defs.showAcordo ? (
            <FilterItem
              label={`Acordo${defs.requiredAcordo ? " *" : ""}`}
            >
              <Select value={acordoId} onValueChange={setAcordoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {acordos.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterItem>
          ) : null}

          {defs.showAno ? (
            <FilterItem label={`Ano${defs.requiredAno ? " *" : ""}`}>
              <Select value={ano} onValueChange={setAno}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {anos.length === 0 ? (
                    <SelectItem value={String(new Date().getFullYear())}>
                      {new Date().getFullYear()}
                    </SelectItem>
                  ) : (
                    anos.map((a) => (
                      <SelectItem key={a} value={String(a)}>
                        {a}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </FilterItem>
          ) : null}

          {defs.showOrgao ? (
            <FilterItem label="Órgão">
              <Select value={orgaoId} onValueChange={setOrgaoId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  {orgaos.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.sigla}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterItem>
          ) : null}

          {defs.showTipoDebito ? (
            <FilterItem label="Tipo de acordo">
              <Select value={tipoDebito} onValueChange={setTipoDebito}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  <SelectItem value="PATRONAL">Patronal</SelectItem>
                  <SelectItem value="SEGURADO">Segurado</SelectItem>
                  <SelectItem value="AMBOS">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </FilterItem>
          ) : null}

          {defs.showStatus ? (
            <FilterItem label="Status">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  <SelectItem value="VIGENTE">Vigente</SelectItem>
                  <SelectItem value="QUITADO">Quitado</SelectItem>
                  <SelectItem value="RESCINDIDO">Rescindido</SelectItem>
                  <SelectItem value="SUSPENSO">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </FilterItem>
          ) : null}

          {defs.showCompetencia ? (
            <FilterItem label="Competência">
              <Select value={competenciaId} onValueChange={setCompetenciaId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas</SelectItem>
                  {competencias.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.mes}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterItem>
          ) : null}

          {defs.showPeriodo ? (
            <>
              <FilterItem label="Período — de">
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="h-9"
                />
              </FilterItem>
              <FilterItem label="Período — até">
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="h-9"
                />
              </FilterItem>
            </>
          ) : null}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={reset} disabled={pending}>
            <RotateCcw className="h-4 w-4" />
            Limpar
          </Button>
          <Button size="sm" onClick={apply} disabled={pending}>
            <Filter className="h-4 w-4" />
            Aplicar filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
