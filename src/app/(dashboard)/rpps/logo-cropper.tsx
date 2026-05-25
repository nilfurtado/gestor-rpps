"use client";

import { useState, useCallback, useRef } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Upload, ZoomIn, ZoomOut, Check, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLogo } from "@/lib/logo-context";

interface Props {
  currentLogoPath: string | null;
  onLogoSaved: (path: string) => void;
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise<void>((resolve) => {
    image.onload = () => resolve();
  });

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas vazio"))),
      "image/jpeg",
      0.92
    );
  });
}

export function LogoCropper({ currentLogoPath, onLogoSaved }: Props) {
  const [rawDataUrl, setRawDataUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(
    currentLogoPath ?? null
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const { refreshLogo } = useLogo();

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExts = [".jpg", ".jpeg", ".png", ".webp"];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!validExts.includes(ext)) {
      toast.error("Formato inválido. Use JPG, PNG ou WEBP.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo: 5 MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawDataUrl(ev.target?.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleConfirm() {
    if (!rawDataUrl || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob(rawDataUrl, croppedAreaPixels);
      const fd = new FormData();
      fd.append("file", blob, "logo.jpg");
      const res = await fetch("/api/rpps/logo", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar logo.");

      const newSrc = `${data.path}?t=${Date.now()}`;
      setPreviewSrc(newSrc);
      onLogoSaved(data.path);
      refreshLogo();
      setRawDataUrl(null);
      toast.success("Logomarca salva com sucesso.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar logo.");
    } finally {
      setUploading(false);
    }
  }

  function handleCancel() {
    setRawDataUrl(null);
  }

  return (
    <div className="space-y-4">
      {/* Crop modal area */}
      {rawDataUrl ? (
        <div className="space-y-3">
          {/* Cropper */}
          <div className="relative h-72 w-full overflow-hidden rounded-lg border bg-muted">
            <Cropper
              image={rawDataUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* Zoom control */}
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
              aria-label="Zoom do recorte"
            />
            <ZoomIn className="h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden />
            <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
              {zoom.toFixed(1)}×
            </span>
          </div>

          {/* Confirm / cancel */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={uploading}
              className="gap-1.5"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={uploading}
              className="gap-1.5"
            >
              <Check className="h-3.5 w-3.5" aria-hidden />
              {uploading ? "Salvando…" : "Confirmar recorte"}
            </Button>
          </div>
        </div>
      ) : (
        /* Preview + upload button */
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {/* Preview box */}
          <div
            className={cn(
              "flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed",
              previewSrc ? "border-border bg-transparent" : "border-muted-foreground/30 bg-muted"
            )}
          >
            {previewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewSrc}
                alt="Logomarca atual"
                className="h-full w-full rounded-lg object-contain"
                onError={() => setPreviewSrc(null)}
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <ImageIcon className="h-8 w-8" aria-hidden />
                <span className="text-xs">Sem logo</span>
              </div>
            )}
          </div>

          {/* Upload instructions */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {previewSrc ? "Logomarca cadastrada" : "Nenhuma logomarca cadastrada"}
            </p>
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: JPG, PNG, WEBP · Máximo: 5 MB
              <br />
              Após selecionar, use a ferramenta de recorte para ajustar o enquadramento.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              className="gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden />
              {previewSrc ? "Trocar logomarca" : "Selecionar imagem"}
            </Button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
