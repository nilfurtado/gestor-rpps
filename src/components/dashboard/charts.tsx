"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBRL, formatPercent } from "@/lib/format";

const COLORS = {
  primary: "var(--color-primary)",
  accent: "var(--color-accent)",
  warning: "var(--color-warning)",
  destructive: "var(--color-destructive)",
  info: "var(--color-info)",
};

const numCompact = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function abbrev(value: number) {
  return numCompact.format(value);
}

interface SerieBRL {
  mes: string;
  arrecadado: number;
  previsto: number;
}

export function ArrecadacaoMensalChart({ data }: { data: SerieBRL[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="mes" stroke="var(--color-muted-foreground)" fontSize={11} />
        <YAxis
          stroke="var(--color-muted-foreground)"
          fontSize={11}
          tickFormatter={(v) => `R$ ${abbrev(v as number)}`}
        />
        <Tooltip
          formatter={(v) => formatBRL(Number(v))}
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            color: "var(--color-foreground)",
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="previsto"
          name="Previsto"
          stroke={COLORS.info}
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="arrecadado"
          name="Arrecadado"
          stroke={COLORS.primary}
          strokeWidth={2.5}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface SeriePatSeg {
  mes: string;
  patronal: number;
  segurado: number;
}

export function PatronalSeguradoChart({ data }: { data: SeriePatSeg[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="mes" stroke="var(--color-muted-foreground)" fontSize={11} />
        <YAxis
          stroke="var(--color-muted-foreground)"
          fontSize={11}
          tickFormatter={(v) => `R$ ${abbrev(v as number)}`}
        />
        <Tooltip
          formatter={(v) => formatBRL(Number(v))}
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            color: "var(--color-foreground)",
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="patronal" name="Patronal" stackId="a" fill={COLORS.primary} radius={[0, 0, 0, 0]} />
        <Bar dataKey="segurado" name="Segurado" stackId="a" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface SerieInad {
  sigla: string;
  cor: string;
  inadimplencia: number;
}

const DEFAULT_ORGAO_COLOR = "#0F5132";

export function InadimplenciaOrgaoChart({ data }: { data: SerieInad[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          type="number"
          stroke="var(--color-muted-foreground)"
          fontSize={11}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          dataKey="sigla"
          type="category"
          width={70}
          stroke="var(--color-muted-foreground)"
          fontSize={11}
        />
        <Tooltip
          formatter={(v) => formatPercent(Number(v))}
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            color: "var(--color-foreground)",
          }}
        />
        <Bar dataKey="inadimplencia" name="Inadimplência" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell key={entry.sigla} fill={entry.cor || DEFAULT_ORGAO_COLOR} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface SerieAcumulado {
  mes: string;
  acumulado: number;
}

export function DeficitAcumuladoChart({ data }: { data: SerieAcumulado[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="defGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.destructive} stopOpacity={0.4} />
            <stop offset="95%" stopColor={COLORS.destructive} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="mes" stroke="var(--color-muted-foreground)" fontSize={11} />
        <YAxis
          stroke="var(--color-muted-foreground)"
          fontSize={11}
          tickFormatter={(v) => `R$ ${abbrev(v as number)}`}
        />
        <Tooltip
          formatter={(v) => formatBRL(Number(v))}
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            color: "var(--color-foreground)",
          }}
        />
        <Area
          type="monotone"
          dataKey="acumulado"
          name="Déficit acumulado"
          stroke={COLORS.destructive}
          fillOpacity={1}
          fill="url(#defGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
