"use client";

import {
  Bar,
  ComposedChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { formatBRL, formatPercent } from "@/lib/format";
import type { ParetoData } from "@/lib/dashboard";

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

const DEFAULT_ORGAO_COLOR = "#0F5132";

export function ParetoChart({ data }: { data: ParetoData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="sigla" stroke="var(--color-muted-foreground)" fontSize={11} />
        <YAxis
          yAxisId="left"
          stroke="var(--color-muted-foreground)"
          fontSize={11}
          tickFormatter={(v) => `R$ ${abbrev(v as number)}`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="var(--color-muted-foreground)"
          fontSize={11}
          tickFormatter={(v) => `${v.toFixed(0)}%`}
        />
        <Tooltip
          formatter={(v, name) => {
            if (name === "deficit") return formatBRL(Number(v));
            if (name === "percentualAcumulado") return `${Number(v).toFixed(1)}%`;
            return v;
          }}
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            color: "var(--color-foreground)",
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <ReferenceLine yAxisId="right" y={80} stroke={COLORS.warning} strokeDasharray="5 5" label="80%" />
        <Bar yAxisId="left" dataKey="deficit" name="Déficit por órgão" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.sigla} fill={entry.cor || DEFAULT_ORGAO_COLOR} />
          ))}
        </Bar>
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="percentualAcumulado"
          name="% Acumulado"
          stroke={COLORS.destructive}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
