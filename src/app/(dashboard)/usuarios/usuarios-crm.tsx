"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  User,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { ALL_ROLES, ROLE_DESCRIPTION, ROLE_LABEL } from "@/lib/permissions";

interface UsuarioRow {
  id: number;
  email: string;
  nome: string;
  role: Role;
  createdAt: Date | string;
}

interface Props {
  usuarios: UsuarioRow[];
  currentUserId: string;
  canManage: boolean;
}

type ModalMode = "criar" | "editar" | "senha";

function RoleBadge({ role }: { role: Role }) {
  const styles: Record<Role, string> = {
    GESTOR: "bg-primary/10 text-primary border-primary/20",
    OPERADOR: "bg-accent/10 text-accent-foreground border-accent/30",
  };
  return (
    <Badge variant="outline" className={styles[role]}>
      {ROLE_LABEL[role]}
    </Badge>
  );
}

export function UsuariosCRM({ usuarios: inicial, currentUserId, canManage }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [modal, setModal] = useState<{ mode: ModalMode; usuario?: UsuarioRow } | null>(null);

  const [nome, setNome] = useState("");
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [role, setRole] = useState<Role>("OPERADOR");

  function abrirCriar() {
    setNome(""); setLogin(""); setSenha(""); setConfirmar("");
    setRole("OPERADOR");
    setModal({ mode: "criar" });
  }

  function abrirEditar(u: UsuarioRow) {
    setNome(u.nome); setLogin(u.email); setSenha(""); setConfirmar("");
    setRole(u.role);
    setModal({ mode: "editar", usuario: u });
  }

  function abrirSenha(u: UsuarioRow) {
    setSenha(""); setConfirmar("");
    setModal({ mode: "senha", usuario: u });
  }

  function fechar() { setModal(null); }

  async function salvarCriar() {
    if (!nome.trim() || !login.trim()) { toast.error("Nome e usuário são obrigatórios."); return; }
    if (senha.length < 4) { toast.error("Senha deve ter ao menos 4 caracteres."); return; }
    if (senha !== confirmar) { toast.error("As senhas não conferem."); return; }

    start(async () => {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), email: login.trim(), password: senha, role }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Erro ao criar usuário."); return; }
      toast.success(`Usuário "${data.nome}" criado com sucesso.`);
      fechar();
      router.refresh();
    });
  }

  async function salvarEditar() {
    if (!modal?.usuario) return;
    if (!nome.trim() || !login.trim()) { toast.error("Nome e usuário são obrigatórios."); return; }

    const isSelf = String(modal.usuario.id) === currentUserId;

    start(async () => {
      const payload: Record<string, unknown> = {
        nome: nome.trim(),
        email: login.trim(),
      };
      // Só envia role se não for o próprio usuário (server também valida)
      if (!isSelf) payload.role = role;

      const res = await fetch(`/api/usuarios/${modal.usuario!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Erro ao atualizar usuário."); return; }
      toast.success("Usuário atualizado.");
      fechar();
      router.refresh();
    });
  }

  async function salvarSenha() {
    if (!modal?.usuario) return;
    if (senha.length < 4) { toast.error("Senha deve ter ao menos 4 caracteres."); return; }
    if (senha !== confirmar) { toast.error("As senhas não conferem."); return; }

    start(async () => {
      const res = await fetch(`/api/usuarios/${modal.usuario!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: senha }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Erro ao alterar senha."); return; }
      toast.success("Senha alterada com sucesso.");
      fechar();
    });
  }

  async function excluir(u: UsuarioRow) {
    if (!confirm(`Excluir o usuário "${u.nome}" (${u.email})?`)) return;
    start(async () => {
      const res = await fetch(`/api/usuarios/${u.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Erro ao excluir usuário."); return; }
      toast.success("Usuário excluído.");
      router.refresh();
    });
  }

  const tituloModal = {
    criar: "Novo Usuário",
    editar: "Editar Usuário",
    senha: "Alterar Senha",
  };

  return (
    <>
      {!canManage && (
        <div className="mb-4 flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            Você está com nível de acesso somente leitura. Apenas usuários com perfil
            <strong> Gestor </strong> podem criar, editar ou excluir usuários.
          </p>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Usuários cadastrados</CardTitle>
            <CardDescription>
              {inicial.length} usuário{inicial.length !== 1 ? "s" : ""} com acesso ao sistema
            </CardDescription>
          </div>
          {canManage && (
            <Button onClick={abrirCriar} size="sm">
              <Plus className="h-4 w-4" />
              Novo usuário
            </Button>
          )}
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Criado em</TableHead>
                {canManage && <TableHead className="w-[160px] text-center">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {inicial.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 5 : 4} className="py-10 text-center text-muted-foreground">
                    Nenhum usuário cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                inicial.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <User className="h-4 w-4" aria-hidden />
                        </div>
                        <span className="font-medium">{u.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                        {u.email}
                      </code>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={u.role} />
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums text-sm">
                      {formatDate(new Date(u.createdAt))}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar dados"
                            onClick={() => abrirEditar(u)}
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Alterar senha"
                            onClick={() => abrirSenha(u)}
                          >
                            <KeyRound className="h-4 w-4" aria-hidden />
                            <span className="sr-only">Alterar senha</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir usuário"
                            className="text-destructive hover:text-destructive"
                            onClick={() => excluir(u)}
                            disabled={pending || String(u.id) === currentUserId}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Modal ── */}
      <Dialog open={!!modal} onOpenChange={(o) => { if (!o) fechar(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
              {modal ? tituloModal[modal.mode] : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Criar / Editar */}
            {(modal?.mode === "criar" || modal?.mode === "editar") && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="u-nome">Nome completo</Label>
                  <Input
                    id="u-nome"
                    placeholder="Ex: João Silva"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="u-login">Login (usuário)</Label>
                  <Input
                    id="u-login"
                    placeholder="Ex: joao.silva"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="u-role">Nível de acesso</Label>
                  <Select
                    value={role}
                    onValueChange={(v) => setRole(v as Role)}
                    disabled={
                      modal?.mode === "editar" &&
                      String(modal?.usuario?.id) === currentUserId
                    }
                  >
                    <SelectTrigger id="u-role">
                      <SelectValue placeholder="Selecione um nível" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_DESCRIPTION[role]}
                  </p>
                  {modal?.mode === "editar" &&
                    String(modal?.usuario?.id) === currentUserId && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Você não pode alterar seu próprio nível de acesso.
                      </p>
                    )}
                </div>
              </>
            )}

            {/* Senha (criar ou alterar senha) */}
            {(modal?.mode === "criar" || modal?.mode === "senha") && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="u-senha">
                    {modal?.mode === "senha" ? "Nova senha" : "Senha"}
                  </Label>
                  <Input
                    id="u-senha"
                    type="password"
                    placeholder="Mínimo 4 caracteres"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="u-confirmar">Confirmar senha</Label>
                  <Input
                    id="u-confirmar"
                    type="password"
                    placeholder="Repita a senha"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={fechar} disabled={pending}>
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button
              onClick={
                modal?.mode === "criar"
                  ? salvarCriar
                  : modal?.mode === "editar"
                  ? salvarEditar
                  : salvarSenha
              }
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {modal?.mode === "senha" ? "Alterar senha" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
