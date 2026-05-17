"use client";
import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { uploadFileAction, type UploadKind } from "@/lib/actions/uploads";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

type Bucket = "empreendimentos" | "unidades" | "arquivos";

type Props = {
  bucket: Bucket;
  kind: UploadKind;
  pathPrefix: string;
  currentUrl?: string | null;
  onUploaded: (url: string, path: string, file: File) => void;
  onRemoved?: () => void;
  label?: string;
};

export function FileUploader({
  bucket,
  kind,
  pathPrefix,
  currentUrl,
  onUploaded,
  onRemoved,
  label,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const ref = useRef<HTMLInputElement>(null);

  async function handle(file: File) {
    setBusy(true);
    setProgress(15);
    if (kind === "image") setPreview(URL.createObjectURL(file));
    setProgress(40);
    const res = await uploadFileAction(bucket, kind, file, pathPrefix);
    setProgress(90);
    if (res.error) {
      toast.error(res.error);
      setBusy(false);
      setPreview(currentUrl ?? null);
      return;
    }
    setProgress(100);
    if (res.url && res.path) onUploaded(res.url, res.path, file);
    setBusy(false);
    setTimeout(() => setProgress(0), 400);
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handle(f);
  }
  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handle(f);
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => ref.current?.click()}
        className="relative rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 text-center cursor-pointer hover:bg-accent/40"
      >
        <input
          ref={ref}
          type="file"
          hidden
          onChange={onFileChange}
          accept={
            kind === "image"
              ? "image/*"
              : ".pdf,image/*,.doc,.docx,.xls,.xlsx"
          }
        />
        {preview && kind === "image" ? (
          <div className="relative mx-auto aspect-video max-w-sm">
            <Image
              src={preview}
              alt="preview"
              fill
              className="object-contain rounded"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="size-6" />
            <p className="text-sm">
              Arraste um arquivo ou clique para selecionar
            </p>
            <p className="text-xs">Máx {kind === "image" ? "10MB" : "50MB"}</p>
          </div>
        )}
        {progress > 0 && (
          <div className="absolute inset-x-4 bottom-2">
            <Progress value={progress} />
          </div>
        )}
      </div>
      {preview && onRemoved && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setPreview(null);
            onRemoved();
          }}
          disabled={busy}
        >
          <X className="mr-1 size-4" /> Remover
        </Button>
      )}
    </div>
  );
}

export function FileUploaderMultiple({
  bucket,
  kind,
  pathPrefix,
  onUploaded,
}: {
  bucket: "arquivos";
  kind: "document";
  pathPrefix: string;
  onUploaded: (url: string, path: string, file: File) => void;
}) {
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    setBusy(true);
    for (const f of Array.from(files)) {
      const res = await uploadFileAction(bucket, kind, f, pathPrefix);
      if (res.error) toast.error(`${f.name}: ${res.error}`);
      else if (res.url && res.path) onUploaded(res.url, res.path, f);
    }
    setBusy(false);
  }

  return (
    <div>
      <Button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
      >
        <Upload className="mr-1 size-4" /> {busy ? "Enviando..." : "Adicionar arquivo"}
      </Button>
      <input
        ref={ref}
        type="file"
        hidden
        multiple
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        accept=".pdf,image/*,.doc,.docx,.xls,.xlsx"
      />
    </div>
  );
}
