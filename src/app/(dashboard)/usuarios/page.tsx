import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageUsuarios } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { UsuariosCRM } from "./usuarios-crm";

export const metadata = { title: "Usuários — Santana Previdência" };
export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const session = await auth();
  const currentUserId = session?.user?.id ?? "";
  const canManage = canManageUsuarios(session?.user?.role);

  const usuarios = await prisma.user.findMany({
    select: { id: true, email: true, nome: true, role: true, createdAt: true },
    orderBy: { nome: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Painel de Usuários"
        description="Gerencie os usuários com acesso ao sistema Santana Previdência."
      />
      <UsuariosCRM
        usuarios={usuarios}
        currentUserId={currentUserId}
        canManage={canManage}
      />
    </>
  );
}
