import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { RppsPanel } from "./rpps-panel";

export const metadata = { title: "Informações do RPPS — Santana Previdência" };
export const dynamic = "force-dynamic";

export default async function RppsPage() {
  const dados = await prisma.institutoRpps.findFirst();

  return (
    <>
      <PageHeader
        title="Informações do RPPS"
        description="Gerencie os dados institucionais e a logomarca do regime próprio de previdência."
      />
      <RppsPanel dados={dados} />
    </>
  );
}
