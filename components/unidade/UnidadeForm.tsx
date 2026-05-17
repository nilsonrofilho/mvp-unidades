"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Unidade } from "@/types/database";
import {
  criarUnidadeAction,
  atualizarUnidadeAction,
  type UnidadeInput,
} from "@/lib/actions/unidades";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUploader } from "@/components/upload/FileUploader";
import { toast } from "sonner";

export function UnidadeForm({
  mode,
  empreendimentoId,
  initial,
}: {
  mode: "create" | "edit";
  empreendimentoId: string;
  initial?: Unidade;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    empreendimento_id: empreendimentoId,
    identificador: initial?.identificador ?? "",
    andar: initial?.andar ?? null,
    posicao_no_andar: initial?.posicao_no_andar ?? "",
    area_privativa_m2: initial?.area_privativa_m2 ?? null,
    area_total_m2: initial?.area_total_m2 ?? null,
    qtd_quartos: initial?.qtd_quartos ?? null,
    qtd_suites: initial?.qtd_suites ?? null,
    qtd_banheiros: initial?.qtd_banheiros ?? null,
    qtd_vagas: initial?.qtd_vagas ?? null,
    preco_total: initial?.preco_total ?? null,
    valor_condominio: initial?.valor_condominio ?? null,
    foto_url: initial?.foto_url ?? "",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function num(value: string) {
    return value === "" ? null : Number(value);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const payload = form as unknown as UnidadeInput;
      const result =
        mode === "create"
          ? await criarUnidadeAction(payload)
          : await atualizarUnidadeAction(initial!.id, payload);
      if (result?.error) toast.error(result.error);
      else {
        toast.success(mode === "create" ? "Unidade criada" : "Unidade atualizada");
        router.push(`/empreendimentos/${empreendimentoId}`);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label>Identificador*</Label>
          <Input
            value={form.identificador}
            onChange={(e) => set("identificador", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label>Andar</Label>
          <Input
            type="number"
            value={form.andar ?? ""}
            onChange={(e) => set("andar", num(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <Label>Posição</Label>
          <Input
            value={form.posicao_no_andar ?? ""}
            onChange={(e) => set("posicao_no_andar", e.target.value)}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Área privativa (m²)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.area_privativa_m2 ?? ""}
            onChange={(e) => set("area_privativa_m2", num(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <Label>Área total (m²)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.area_total_m2 ?? ""}
            onChange={(e) => set("area_total_m2", num(e.target.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <Label>Quartos</Label>
          <Input
            type="number"
            value={form.qtd_quartos ?? ""}
            onChange={(e) => set("qtd_quartos", num(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <Label>Suítes</Label>
          <Input
            type="number"
            value={form.qtd_suites ?? ""}
            onChange={(e) => set("qtd_suites", num(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <Label>Banheiros</Label>
          <Input
            type="number"
            value={form.qtd_banheiros ?? ""}
            onChange={(e) => set("qtd_banheiros", num(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <Label>Vagas</Label>
          <Input
            type="number"
            value={form.qtd_vagas ?? ""}
            onChange={(e) => set("qtd_vagas", num(e.target.value))}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Preço total (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.preco_total ?? ""}
            onChange={(e) => set("preco_total", num(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <Label>Condomínio (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.valor_condominio ?? ""}
            onChange={(e) => set("valor_condominio", num(e.target.value))}
          />
        </div>
      </div>

      <FileUploader
        bucket="unidades"
        kind="image"
        pathPrefix={`unidade/${initial?.id ?? "novo"}`}
        currentUrl={form.foto_url}
        onUploaded={(url) => set("foto_url", url)}
        onRemoved={() => set("foto_url", "")}
        label="Foto/planta da unidade"
      />

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
