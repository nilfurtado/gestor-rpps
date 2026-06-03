import { OrgaoForm } from "./orgao-form";

export default function NovoOrgaoPage() {
  return (
    <main className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Novo Órgão</h1>
        <p className="text-sm text-muted-foreground">Cadastre um novo ente municipal</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <OrgaoForm />
      </div>
    </main>
  );
}
