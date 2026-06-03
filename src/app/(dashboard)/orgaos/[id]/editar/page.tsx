import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { OrgaoForm } from "../../novo/orgao-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarOrgaoPage({ params }: PageProps) {
  const { id } = await params;
  const orgaoId = Number(id);

  if (!Number.isInteger(orgaoId)) {
    notFound();
  }

  const orgao = await prisma.orgao.findUnique({
    where: { id: orgaoId },
  });

  if (!orgao) {
    notFound();
  }

  return (
    <main className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Editar Órgão</h1>
        <p className="text-sm text-muted-foreground">Atualize os dados do ente municipal</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <OrgaoForm
          initial={{
            id: orgao.id,
            sigla: orgao.sigla,
            nome: orgao.nome,
            cnpj: orgao.cnpj,
            cep: orgao.cep,
            endereco: orgao.endereco,
            numero: orgao.numero,
            complemento: orgao.complemento,
            bairro: orgao.bairro,
            cidade: orgao.cidade,
            estado: orgao.estado,
            cor: orgao.cor,
            status: orgao.status,
          }}
        />
      </div>
    </main>
  );
}
