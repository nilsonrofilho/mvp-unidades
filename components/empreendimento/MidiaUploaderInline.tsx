"use client";
import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Upload, Camera, Image as ImageIcon, X } from "lucide-react";
import { uploadFileAction } from "@/lib/actions/uploads";
import { atualizarMidiaEmpreendimentoAction } from "@/lib/actions/empreendimentos";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Campo = "foto_capa_url" | "planta_implantacao_url";

export function MidiaUploaderInline({
  empreendimentoId,
  campo,
  currentUrl,
  variant,
  label,
  emptyLabel,
}: {
  empreendimentoId: string;
  campo: Campo;
  currentUrl: string | null;
  variant: "hero" | "block";
  label: string; // "Trocar capa" | "Trocar planta"
  emptyLabel: string; // "Adicionar foto de capa" | "Adicionar planta de implantação"
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function upload(file: File) {
    setBusy(true);
    const prefix = campo === "foto_capa_url" ? "capa" : "planta";
    const res = await uploadFileAction(
      "empreendimentos",
      "image",
      file,
      `${prefix}/${empreendimentoId}`,
    );
    if (res.error || !res.url) {
      toast.error(res.error ?? "Falha no upload");
      setBusy(false);
      return;
    }
    const upd = await atualizarMidiaEmpreendimentoAction(
      empreendimentoId,
      campo,
      res.url,
    );
    setBusy(false);
    if ("error" in upd && upd.error) {
      toast.error(upd.error);
      return;
    }
    toast.success(
      campo === "foto_capa_url" ? "Capa atualizada" : "Planta atualizada",
    );
    router.refresh();
  }

  function abrirSeletor() {
    inputRef.current?.click();
  }

  function remover() {
    if (!currentUrl) return;
    if (!confirm("Remover esta imagem?")) return;
    startTransition(async () => {
      const upd = await atualizarMidiaEmpreendimentoAction(
        empreendimentoId,
        campo,
        null,
      );
      if ("error" in upd && upd.error) {
        toast.error(upd.error);
        return;
      }
      toast.success("Removido");
      router.refresh();
    });
  }

  const inputEl = (
    <input
      ref={inputRef}
      type="file"
      hidden
      accept="image/*"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) upload(f);
        e.target.value = "";
      }}
    />
  );

  if (variant === "hero") {
    // Sobreposto à hero da capa: botão "Trocar capa" no canto se tem imagem,
    // ou hero inteira clicável se não tem.
    if (currentUrl) {
      return (
        <>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={abrirSeletor}
            disabled={busy}
            className="absolute top-3 right-3 shadow"
          >
            <Camera className="mr-1 size-4" />
            {busy ? "Enviando..." : label}
          </Button>
          {inputEl}
        </>
      );
    }
    return (
      <button
        type="button"
        onClick={abrirSeletor}
        disabled={busy}
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-accent/40 transition"
      >
        <ImageIcon className="size-8" />
        <span className="font-medium text-sm">
          {busy ? "Enviando..." : emptyLabel}
        </span>
        <span className="text-xs">Clique para selecionar uma imagem</span>
        {inputEl}
      </button>
    );
  }

  // variant 'block': card destacado pra planta de implantação.
  if (currentUrl) {
    return (
      <div className="rounded-lg border bg-background p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Planta de implantação</p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={abrirSeletor}
              disabled={busy}
            >
              <Camera className="mr-1 size-4" />
              {busy ? "Enviando..." : label}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={remover}
              disabled={busy}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
        <a
          href={currentUrl}
          target="_blank"
          rel="noreferrer"
          className="relative block aspect-video rounded overflow-hidden bg-muted"
        >
          <Image
            src={currentUrl}
            alt="Planta"
            fill
            className="object-contain"
          />
        </a>
        {inputEl}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={abrirSeletor}
      disabled={busy}
      className="w-full rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 text-center hover:bg-accent/40 transition flex flex-col items-center gap-2 text-muted-foreground"
    >
      <Upload className="size-6" />
      <span className="text-sm font-medium">
        {busy ? "Enviando..." : emptyLabel}
      </span>
      <span className="text-xs">
        A planta é o que liga as casas/lotes ao mapa do empreendimento
      </span>
      {inputEl}
    </button>
  );
}
