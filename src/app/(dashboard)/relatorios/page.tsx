import Link from "next/link";
import {
  AlertOctagon,
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock,
  Coins,
  Handshake,
  Layers,
  ReceiptText,
  ScrollText,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";

interface ReportItem {
  href: string;
  title: string;
  description: string;
  Icon: React.ElementType;
}

const ARRECADACAO: ReportItem[] = [
  {
    href: "/relatorios/mensal",
    title: "Relatório Mensal",
    description: "Arrecadação por competência (mês, ano e órgão).",
    Icon: CalendarDays,
  },
  {
    href: "/relatorios/anual",
    title: "Relatório Anual",
    description: "Consolidado do exercício por tipo de contribuição.",
    Icon: CalendarRange,
  },
  {
    href: "/relatorios/orgao",
    title: "Por Órgão",
    description: "Desempenho individual do ente municipal.",
    Icon: Building2,
  },
  {
    href: "/relatorios/patronal",
    title: "Patronal",
    description: "Contribuições patronais por período.",
    Icon: Briefcase,
  },
  {
    href: "/relatorios/segurado",
    title: "Segurado",
    description: "Contribuições dos servidores por período.",
    Icon: Users,
  },
  {
    href: "/relatorios/inadimplencia",
    title: "Inadimplência",
    description: "Ranking e consolidado de inadimplência RPPS.",
    Icon: AlertOctagon,
  },
];

const ACORDOS: ReportItem[] = [
  {
    href: "/relatorios/acordos/geral",
    title: "Geral de Acordos",
    description: "Lista completa de acordos com totais consolidado e pago.",
    Icon: Handshake,
  },
  {
    href: "/relatorios/acordos/parcelas-pagas",
    title: "Parcelas Pagas",
    description: "Acordos com parcelas quitadas: quantidade, valor e data.",
    Icon: CheckCircle2,
  },
  {
    href: "/relatorios/acordos/parcelas-em-atraso",
    title: "Parcelas em Atraso",
    description: "Acordos vigentes com parcelas vencidas até a data atual.",
    Icon: Clock,
  },
  {
    href: "/relatorios/acordos/extrato",
    title: "Extrato do Parcelamento",
    description: "Detalhe de um acordo: composição, lançamentos e cronograma.",
    Icon: ReceiptText,
  },
  {
    href: "/relatorios/acordos/demonstrativo-orgao",
    title: "Demonstrativo por Órgão",
    description: "Acordos agrupados por órgão devedor com subtotais.",
    Icon: Layers,
  },
  {
    href: "/relatorios/acordos/anual",
    title: "Anual de Parcelamentos",
    description: "Acordos firmados em um exercício específico.",
    Icon: ScrollText,
  },
];

export const metadata = { title: "Relatórios — Santana Previdência" };

export default function RelatoriosHubPage() {
  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Emita relatórios institucionais em PDF — selecione a categoria abaixo."
      />

      <div className="space-y-10">
        <ReportSection
          title="Arrecadação"
          subtitle="Folhas previdenciárias, contribuições e inadimplência"
          Icon={Coins}
          accent="from-primary/20 to-primary/5"
          items={ARRECADACAO}
        />

        <ReportSection
          title="Acordos"
          subtitle="Termos de parcelamento, cronograma e demonstrativos"
          Icon={Handshake}
          accent="from-amber-500/20 to-amber-500/5"
          items={ACORDOS}
        />
      </div>
    </>
  );
}

function ReportSection({
  title,
  subtitle,
  Icon,
  accent,
  items,
}: {
  title: string;
  subtitle: string;
  Icon: React.ElementType;
  accent: string;
  items: ReportItem[];
}) {
  return (
    <section aria-label={`Relatórios de ${title}`}>
      {/* Cabeçalho da seção */}
      <div className="mb-5 flex items-center gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} ring-1 ring-border`}
        >
          <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {items.length} relatórios
        </span>
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {items.map((item) => (
          <ReportCard key={item.href} item={item} />
        ))}
      </div>
    </section>
  );
}

function ReportCard({ item }: { item: ReportItem }) {
  const Icon = item.Icon;
  return (
    <Link
      href={item.href}
      aria-label={item.title}
      className="group relative block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="relative flex h-full flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        {/* Faixa decorativa superior */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        {/* Ícone */}
        <div className="flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 transition-colors group-hover:bg-primary/15">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/60 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>

        {/* Texto */}
        <div className="flex flex-1 flex-col">
          <h3 className="text-[15px] font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
            {item.title}
          </h3>
          <p className="mt-1.5 text-sm leading-snug text-muted-foreground">
            {item.description}
          </p>
        </div>
      </div>
    </Link>
  );
}
