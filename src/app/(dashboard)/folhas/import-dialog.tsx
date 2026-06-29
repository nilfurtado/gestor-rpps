"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PreviewRow } from "@/app/api/lancamentos/import/preview/route";
import type { ParseError } from "@/lib/import/lancamentos-parser";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Stage = "upload" | "preview" | "confirming";

interface PreviewData {
  preview: PreviewRow[];
  errors: ParseError[];
  stats: {
    total: number;
    valid: number;
    invalid: number;
  };
}

export function ImportDialog({ open, onOpenChange, onSuccess }: ImportDialogProps) {
  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetDialog();
    }
    onOpenChange(newOpen);
  };

  const resetDialog = () => {
    setStage("upload");
    setFile(null);
    setPreviewData(null);
    setLoading(false);
  };

  // Handle file selection
  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Por favor selecione um arquivo CSV");
      return;
    }

    setFile(selectedFile);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  // Load preview from API
  const handleContinueToPreview = async () => {
    if (!file) {
      toast.error("Por favor selecione um arquivo");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/lancamentos/import/preview", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao processar arquivo");
      }

      const data: PreviewData = await response.json();
      setPreviewData(data);
      setStage("preview");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao processar arquivo";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Confirm import
  const handleConfirmImport = async () => {
    if (!previewData) {
      toast.error("Dados de preview não disponíveis");
      return;
    }

    if (previewData.stats.valid === 0) {
      toast.error("Nenhuma linha válida para importar");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/lancamentos/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preview: previewData.preview,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao confirmar importação");
      }

      const result = await response.json();

      // Show success toast with created count
      toast.success(`${result.created} lançamento(s) criado(s) com sucesso`);

      // Show warnings if there are errors
      if (result.errors && result.errors.length > 0) {
        toast.warning(`${result.errors.length} erro(s) durante a importação`);
      }

      // Trigger callback and close
      onSuccess?.();
      handleOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao confirmar importação";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToUpload = () => {
    setStage("upload");
    setPreviewData(null);
  };

  // Render upload stage
  const renderUploadStage = () => (
    <div className="space-y-4">
      <DialogDescription>
        Selecione um arquivo CSV com as seguintes colunas: Órgão, Competência, Tipo,
        FolhaBase, Alíquota, ValorRecolhido
      </DialogDescription>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:bg-muted/30 transition"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium">Clique ou arraste um arquivo CSV</p>
        <p className="text-xs text-muted-foreground mt-1">
          Máximo de 1 arquivo, formato CSV
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
      />

      {/* Selected file */}
      {file && (
        <div className="bg-muted p-3 rounded-md">
          <p className="text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024).toFixed(2)} KB
          </p>
        </div>
      )}

      {/* Format help */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
        <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">
          Formato esperado:
        </p>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Órgão: Sigla ou nome do órgão</li>
          <li>• Competência: Mês em português (ex: Janeiro, Fevereiro)</li>
          <li>• Tipo: PATRONAL ou SEGURADO</li>
          <li>• FolhaBase: Número positivo (valor base da folha)</li>
          <li>• Alíquota: Número entre 0 e 100 (%)</li>
          <li>• ValorRecolhido: Número não-negativo (valor já recolhido)</li>
        </ul>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={() => handleOpenChange(false)}>
          Cancelar
        </Button>
        <Button onClick={handleContinueToPreview} disabled={!file || loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Continuar
        </Button>
      </div>
    </div>
  );

  // Render preview stage
  const renderPreviewStage = () => {
    if (!previewData) return null;

    const { preview, errors, stats } = previewData;
    const displayErrors = errors.slice(0, 5);
    const hasMoreErrors = errors.length > 5;

    return (
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="border rounded-lg p-3">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="border rounded-lg p-3 border-green-200 bg-green-50 dark:bg-green-900/20">
            <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
            <div className="text-xs text-green-700 dark:text-green-300">Válidos</div>
          </div>
          <div className="border rounded-lg p-3 border-red-200 bg-red-50 dark:bg-red-900/20">
            <div className="text-2xl font-bold text-red-600">{stats.invalid}</div>
            <div className="text-xs text-red-700 dark:text-red-300">Inválidos</div>
          </div>
        </div>

        {/* Errors display */}
        {displayErrors.length > 0 && (
          <div className="border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <p className="font-medium text-red-900 dark:text-red-100 mb-2">
                  Erros encontrados:
                </p>
                <ul className="space-y-1 text-red-800 dark:text-red-200">
                  {displayErrors.map((error, i) => (
                    <li key={i} className="text-xs">
                      Linha {error.row}: {error.field} - {error.message}
                    </li>
                  ))}
                </ul>
                {hasMoreErrors && (
                  <p className="text-xs mt-2 text-red-700 dark:text-red-300">
                    ... e mais {errors.length - 5} erro(s)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Data table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-8">✓</TableHead>
                <TableHead>Órgão</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">FolhaBase</TableHead>
                <TableHead className="text-right">Alíquota</TableHead>
                <TableHead className="text-right">Recolhido</TableHead>
                <TableHead className="text-right">Recolher</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.map((row, idx) => (
                <TableRow
                  key={idx}
                  className={row.valid ? "" : "bg-red-50 dark:bg-red-900/20"}
                >
                  <TableCell className="w-8">
                    {row.valid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{row.orgaoSigla}</TableCell>
                  <TableCell className="text-sm">{row.competenciaMes}</TableCell>
                  <TableCell className="text-sm">{row.tipo}</TableCell>
                  <TableCell className="text-sm text-right">
                    {row.folhaBase.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-sm text-right">{row.aliquota}%</TableCell>
                  <TableCell className="text-sm text-right">
                    {row.valorRecolhido.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-sm text-right">
                    {row.valorRecolher.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleBackToUpload}>
            Voltar
          </Button>
          <Button
            onClick={handleConfirmImport}
            disabled={stats.valid === 0 || loading}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Confirmar Importação ({stats.valid} lançamentos)
          </Button>
        </div>
      </div>
    );
  };

  // Render confirming stage
  const renderConfirmingStage = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
      <p className="text-center text-sm font-medium">Importando lançamentos...</p>
      <p className="text-xs text-muted-foreground mt-1">
        Isso pode levar alguns momentos
      </p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Lançamentos</DialogTitle>
        </DialogHeader>

        {stage === "upload" && renderUploadStage()}
        {stage === "preview" && renderPreviewStage()}
        {stage === "confirming" && renderConfirmingStage()}
      </DialogContent>
    </Dialog>
  );
}
