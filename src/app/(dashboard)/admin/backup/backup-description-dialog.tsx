"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BackupDescriptionDialogProps {
  isOpen: boolean;
  onConfirm: (description: string) => void;
  onCancel: () => void;
}

export function BackupDescriptionDialog({
  isOpen,
  onConfirm,
  onCancel,
}: BackupDescriptionDialogProps) {
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const validateDescription = (value: string): boolean => {
    if (value.length > 50) {
      setError("Máximo 50 caracteres");
      return false;
    }
    if (!/^[a-zA-Z0-9\-_]*$/.test(value)) {
      setError("Apenas letras, números, hífens e underscores");
      return false;
    }
    setError("");
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDescription(value);
    if (value) validateDescription(value);
    else setError("");
  };

  const handleConfirm = () => {
    if (description && validateDescription(description)) {
      onConfirm(description);
      setDescription("");
      setError("");
    } else if (!description) {
      onConfirm("");
      setDescription("");
      setError("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Backup</DialogTitle>
          <DialogDescription>
            Adicione uma descrição opcional para identificar este backup
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">
              Descrição (opcional)
            </Label>
            <Input
              id="description"
              placeholder="Ex: ANTES-DEPLOY-1.3.0"
              value={description}
              onChange={handleChange}
              maxLength={50}
            />
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {description.length}/50
              </span>
              {error && <span className="text-red-500">{error}</span>}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Criar Backup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
