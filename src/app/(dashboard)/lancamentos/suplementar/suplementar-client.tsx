"use client";

import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SupplementarTable, type SupplementarRow } from "./suplementar-table";
import { SupplementarForm } from "./suplementar-form";

interface FolhaOption {
  id: number;
  label: string;
}

interface Props {
  initialSupplementares: SupplementarRow[];
  folhas: FolhaOption[];
}

export function SupplementarClient({ initialSupplementares, folhas }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SupplementarRow | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(suplementar: SupplementarRow) {
    setEditing(suplementar);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  const handleSuccess = useCallback(() => {
    closeModal();
    router.refresh();
  }, [router]);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova Suplementar
        </Button>
      </div>

      <SupplementarTable
        suplementares={initialSupplementares}
        onEdit={openEdit}
        onRefresh={() => router.refresh()}
      />

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Folha Suplementar" : "Nova Folha Suplementar"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Atualize os dados da folha suplementar."
                : "Preencha os dados para registrar uma nova folha suplementar."}
            </DialogDescription>
          </DialogHeader>
          <SupplementarForm
            folhas={folhas}
            initial={
              editing
                ? {
                    id: editing.id,
                    folhaPrevidenciariaId: editing.folhaPrevidenciariaId,
                    motivo: editing.motivo,
                    descricao: editing.descricao,
                    folhaBase: editing.folhaBase,
                    observacoes: editing.observacoes,
                  }
                : undefined
            }
            onSuccess={handleSuccess}
            onCancel={closeModal}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
