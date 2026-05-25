import Link from "next/link";
import {
  AlertOctagon,
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarRange,
  CheckCircle2,
  Handshake,
  ReceiptText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Relatórios de Acordos — Santana Previdência" };

const ACORDO_REPORTS = [
  {
    href: "/relatorios/acordos/geral",
    title: "Relatório Geral de Acordos",
    description: "Lista completa de acordos com totais consolidado e pago.",
    Icon: Handshake,
  },
  {
    href: "/relatorios/acordos/parcelas-pagas",
    title: "Parcelas Pagas",
    description: "Acordos com parcelas quitadas: quantidade, valor e última paga.",
    Icon: CheckCircle2,
  },
  {
    href: "/relatorios/acordos/parcelas-em-atraso",
    title: "Parcelas em Atraso",
    description: "Acordos vigentes com parcelas vencidas até a data atual.",
    Icon: AlertOctagon,
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
    Icon: Building2,
  },
  {
    href: "/relatorios/acordos/anual",
    title: "Relatório Anual",
    description: "Acordos firmados em um exercício específico.",
    Icon: CalendarRange,
  },
];

export default function RelatoriosAcordosHub() {
  return (
    <>
      <PageHeader
        title="Relatórios de Acordos"
        description="Selecione o relatório para aplicar filtros e gerar em PDF."
        actions={
          <Button variant="outline" asChild>
            <Link href="/relatorios">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACORDO_REPORTS.map(({ href, title, description, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="h-full transition-colors group-hover:border-primary/50 group-hover:bg-primary/5">
              <CardContent className="flex items-start gap-4 p-6">
                <div className="rounded-md bg-primary/10 p-3 text-primary">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-foreground">{title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
                <ArrowRight className="h-4 w-4 self-center text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
