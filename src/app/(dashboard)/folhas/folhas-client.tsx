"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TipoFolha } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { FolhasTable } from "./folhas-table";
import { ModalNovaFolha } from "./modal-nova";
import { ModalEditar } from "./modal-editar";
import { RequisitosLancamento } from "./requisitos-lancamento";
import { ImportDialog } from "./import-dialog";
import { Card } from "@/components/ui/card";

interface TipoFolhaComCount extends TipoFolha {
  lancamentosCount: number;
}

interface FolhasClientProps {
  tiposFolha: TipoFolhaComCount[];
}

export function FolhasClient({ tiposFolha }: FolhasClientProps) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState<"todos" | "ativo" | "inativo">("todos");
  const [tiposAtualizados, setTiposAtualizados] = useState(tiposFolha);
  const [openModal, setOpenModal] = useState(false);
  const [tipoEditando, setTipoEditando] = useState<TipoFolha | null>(null);
  const [openModalEditar, setOpenModalEditar] = useState(false);
  const [openImport, setOpenImport] = useState(false);

  const filtered = tiposAtualizados.filter((tipo) => {
    const matchBusca =
      tipo.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (tipo.descricao?.toLowerCase().includes(busca.toLowerCase()) ?? false);

    const matchFiltro =
      filtroAtivo === "todos" ||
      (filtroAtivo === "ativo" && tipo.ativo) ||
      (filtroAtivo === "inativo" && !tipo.ativo);

    return matchBusca && matchFiltro;
  });

  const handleNovoTipo = (novoTipo: TipoFolha) => {
    setTiposAtualizados([...tiposAtualizados, { ...novoTipo, lancamentosCount: 0 }]);
    setOpenModal(false);
  };

  const handleEditar = (tipo: TipoFolha) => {
    setTipoEditando(tipo);
    setOpenModalEditar(true);
  };

  const handleTipoAtualizado = (tipoAtualizado: TipoFolha) => {
    const novostipos = tiposAtualizados.map((t) =>
      t.id === tipoAtualizado.id ? { ...tipoAtualizado, lancamentosCount: t.lancamentosCount } : t
    );
    setTiposAtualizados(novostipos);
  };

  const handleImportSuccess = () => {
    router.refresh();
  };

  const exportarCSV = () => {
    const headers = ["ID", "Nome", "Descrição", "Tipo", "Origem", "Status", "Lançamentos"];
    const rows = tiposAtualizados.map((tipo) => [
      tipo.id,
      tipo.nome,
      tipo.descricao || "",
      tipo.obrigatorio ? "Obrigatória" : "Opcional",
      tipo.customizado ? "Customizado" : "Built-in",
      tipo.ativo ? "Ativa" : "Inativa",
      (tiposAtualizados.find((t) => t.id === tipo.id)?.lancamentosCount || 0).toString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `tipos-folhas-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const tiposObrigatorios = tiposFolha.filter((t) => t.obrigatorio && t.ativo);

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header com Botões Importar e Exportar */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpenImport(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar Lançamentos
          </Button>
          <Button variant="outline" size="sm" onClick={exportarCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Requisitos para Novo Lançamento */}
        <RequisitosLancamento tiposObrigatorios={tiposObrigatorios} />

        {/* Filtros */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide">Buscar</Label>
            <Input
              placeholder="Nome ou descrição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide">Status</Label>
            <div className="flex gap-2">
              {(["todos", "ativo", "inativo"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFiltroAtivo(status)}
                  className={`px-3 py-2 text-xs font-medium rounded-md transition ${
                    filtroAtivo === status
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {status === "todos" ? "Todos" : status === "ativo" ? "Ativos" : "Inativos"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">{tiposAtualizados.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-green-600">
              {tiposAtualizados.filter((t) => t.ativo).length}
            </div>
            <div className="text-xs text-muted-foreground">Ativos</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {tiposAtualizados.filter((t) => t.customizado).length}
            </div>
            <div className="text-xs text-muted-foreground">Customizados</div>
          </Card>
        </div>

        {/* Tabela */}
        <FolhasTable
          dados={filtered}
          onTiposAtualizados={setTiposAtualizados}
          allTipos={tiposAtualizados}
          onEditar={handleEditar}
        />
      </div>

      <ModalNovaFolha open={openModal} onOpenChange={setOpenModal} onNovoTipo={handleNovoTipo} />
      <ModalEditar
        tipo={tipoEditando}
        open={openModalEditar}
        onOpenChange={setOpenModalEditar}
        onSalvo={handleTipoAtualizado}
      />
      <ImportDialog open={openImport} onOpenChange={setOpenImport} onSuccess={handleImportSuccess} />
    </>
  );
}
