"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

export interface FilterDefs {
  showExercicio?: boolean;
  showCompetencia?: boolean;
  showOrgao?: boolean;
  showTipo?: boolean;
  showStatus?: boolean;
}

interface Props {
  defs: FilterDefs;
  orgaos: { id: number; sigla: string; nome: string }[];
  exercicios: { id: number; ano: number }[];
  competencias: { id: number; ordem: number; mes: string }[];
}

export function ReportFilters({ defs, orgaos, exercicios, competencias }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  const [exercicioId, setExercicioId] = useState(sp.get("exercicioId") ?? ALL);
  const [competenciaId, setCompetenciaId] = useState(sp.get("competenciaId") ?? ALL);
  const [orgaoId, setOrgaoId] = useState(sp.get("orgaoId") ?? ALL);
  const [tipo, setTipo] = useState(sp.get("tipo") ?? ALL);
  const [status, setStatus] = useState(sp.get("status") ?? ALL);

  function apply() {
    const params = new URLSearchParams();
    if (exercicioId !== ALL) params.set("exercicioId", exercicioId);
    if (competenciaId !== ALL) params.set("competenciaId", competenciaId);
    if (orgaoId !== ALL) params.set("orgaoId", orgaoId);
    if (tipo !== ALL) params.set("tipo", tipo);
    if (status !== ALL) params.set("status", status);
    start(() => router.push(`?${params.toString()}`));
  }

  function reset() {
    setExercicioId(ALL);
    setCompetenciaId(ALL);
    setOrgaoId(ALL);
    setTipo(ALL);
    setStatus(ALL);
    start(() => router.push(`?`));
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {defs.showExercicio ? (
            <FilterItem label="Exercício">
              <Select value={exercicioId} onValueChange={setExercicioId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  {exercicios.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterItem>
          ) : null}
          {defs.showCompetencia ? (
            <FilterItem label="Competência">
              <Select value={competenciaId} onValueChange={setCompetenciaId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
          {defs.showOrgao ? (
            <FilterItem label="Órgão">
              <Select value={orgaoId} onValueChange={setOrgaoId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
          {defs.showTipo ? (
            <FilterItem label="Tipo">
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  <SelectItem value="PATRONAL">Patronal</SelectItem>
                  <SelectItem value="SEGURADO">Segurado</SelectItem>
                </SelectContent>
              </Select>
            </FilterItem>
          ) : null}
          {defs.showStatus ? (
            <FilterItem label="Status">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  <SelectItem value="PAGO">Pago</SelectItem>
                  <SelectItem value="PARCIAL">Parcial</SelectItem>
                  <SelectItem value="INADIMPLENTE">Inadimplente</SelectItem>
                  <SelectItem value="PARCELADO">Parcelado</SelectItem>
                </SelectContent>
              </Select>
            </FilterItem>
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

function FilterItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
