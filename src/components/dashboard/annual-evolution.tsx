"use client";

import {
  Line,
  LineChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBRL } from "@/lib/format";
import type { AnnualEvolutionData } from "@/lib/dashboard";

const COLORS = {
  "2023": "#a1a5b4",
  "2024": "#8b5cf6",
  "2025": "#22c55e",
};

const numCompact = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function abbrev(value: number) {
  return numCompact.format(value);
}

export function AnnualEvolutionChart({ data }: { data: AnnualEvolutionData[] }) {
  const anos = [2023, 2024, 2025].filter((ano) => data.some((d) => d[ano] !== undefined));

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
        {anos.map((ano) => (
          <Line
            key={ano}
            type="monotone"
            dataKey={ano}
            name={String(ano)}
            stroke={COLORS[String(ano) as keyof typeof COLORS] || "var(--color-primary)"}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
