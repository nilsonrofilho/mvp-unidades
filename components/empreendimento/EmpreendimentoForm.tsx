"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Empreendimento } from "@/types/database";
import {
  criarEmpreendimentoAction,
  atualizarEmpreendimentoAction,
  type EmpreendimentoInput,
} from "@/lib/actions/empreendimentos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUploader } from "@/components/upload/FileUploader";
import { toast } from "sonner";

type Mode = "create" | "edit";

export function EmpreendimentoForm({
  mode,
  initial,
}: {
  mode: Mode;
  initial?: Empreendimento;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    nome: initial?.nome ?? "",
    tipo: (initial?.tipo ?? "vertical") as "vertical" | "horizontal",
    status: (initial?.status ?? "em_obras") as
      | "lancamento"
      | "em_obras"
      | "pronto",
    endereco: initial?.endereco ?? "",
    cidade: initial?.cidade ?? "",
    estado: initial?.estado ?? "",
    cep: initial?.cep ?? "",
    data_entrega_prevista: initial?.data_entrega_prevista ?? "",
    descricao: initial?.descricao ?? "",
    foto_capa_url: initial?.foto_capa_url ?? "",
    planta_implantacao_url: initial?.planta_implantacao_url ?? "",
    qtd_andares: initial?.qtd_andares ?? null,
    qtd_unidades_por_andar: initial?.qtd_unidades_por_andar ?? null,
  });

  function set<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const payload = form as unknown as EmpreendimentoInput;
      const result =
        mode === "create"
          ? await criarEmpreendimentoAction(payload)
          : await atualizarEmpreendimentoAction(initial!.id, payload);
      if (result && "error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          mode === "create"
            ? "Empreendimento criado"
            : "Empreendimento atualizado",
        );
        if (mode === "edit") router.push(`/empreendimentos/${initial!.id}`);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Nome*</Label>
          <Input
            value={form.nome}
            onChange={(e) => set("nome", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label>Tipo*</Label>
          <Select
            value={form.tipo}
            onValueChange={(v) =>
              set("tipo", (v as "vertical" | "horizontal") ?? "vertical")
            }
            disabled={mode === "edit"}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vertical">Vertical (prédio)</SelectItem>
              <SelectItem value="horizontal">
                Horizontal (casas/lotes)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => set("status", (v as typeof form.status) ?? "em_obras")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lancamento">Lançamento</SelectItem>
              <SelectItem value="em_obras">Em obras</SelectItem>
              <SelectItem value="pronto">Pronto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Data de entrega prevista</Label>
          <Input
            type="date"
            value={form.data_entrega_prevista ?? ""}
            onChange={(e) => set("data_entrega_prevista", e.target.value)}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1 md:col-span-2">
          <Label>Endereço</Label>
          <Input
            value={form.endereco ?? ""}
            onChange={(e) => set("endereco", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Cidade</Label>
          <Input
            value={form.cidade ?? ""}
            onChange={(e) => set("cidade", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>UF</Label>
            <Input
              maxLength={2}
              value={form.estado ?? ""}
              onChange={(e) => set("estado", e.target.value.toUpperCase())}
            />
          </div>
          <div className="space-y-1">
            <Label>CEP</Label>
            <Input
              value={form.cep ?? ""}
              onChange={(e) => set("cep", e.target.value)}
            />
          </div>
        </div>
      </div>

      {form.tipo === "vertical" && mode === "create" && (
        <div className="grid grid-cols-2 gap-4 rounded-lg border bg-accent/30 p-4">
          <div className="space-y-1">
            <Label>Qtd. andares*</Label>
            <Input
              type="number"
              min={1}
              value={form.qtd_andares ?? ""}
              onChange={(e) =>
                set("qtd_andares", Number(e.target.value) || null)
              }
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Unidades por andar*</Label>
            <Input
              type="number"
              min={1}
              value={form.qtd_unidades_por_andar ?? ""}
              onChange={(e) =>
                set("qtd_unidades_por_andar", Number(e.target.value) || null)
              }
              required
            />
          </div>
          <p className="col-span-2 text-xs text-muted-foreground">
            Ao salvar, geramos as unidades automaticamente (ex: 1A, 1B, ...).
            Você preenche os dados depois.
          </p>
        </div>
      )}

      <div className="space-y-1">
        <Label>Descrição</Label>
        <Textarea
          rows={3}
          value={form.descricao ?? ""}
          onChange={(e) => set("descricao", e.target.value)}
        />
      </div>

      <FileUploader
        bucket="empreendimentos"
        kind="image"
        pathPrefix={`capa/${initial?.id ?? "novo"}`}
        currentUrl={form.foto_capa_url}
        onUploaded={(url) => set("foto_capa_url", url)}
        onRemoved={() => set("foto_capa_url", "")}
        label="Foto de capa"
      />

      {form.tipo === "horizontal" && (
        <FileUploader
          bucket="empreendimentos"
          kind="image"
          pathPrefix={`planta/${initial?.id ?? "novo"}`}
          currentUrl={form.planta_implantacao_url}
          onUploaded={(url) => set("planta_implantacao_url", url)}
          onRemoved={() => set("planta_implantacao_url", "")}
          label="Planta de implantação (opcional)"
        />
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Salvando..."
            : mode === "create"
              ? "Criar empreendimento"
              : "Salvar alterações"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
