"use client";
import { useState, useTransition } from "react";
import type { Unidade } from "@/types/database";
import { STATUS_COLORS } from "@/lib/cores-status";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { salvarCoordenadasEmLoteAction } from "@/lib/actions/unidades";

type Filtro = {
  status?: string[];
  precoMin?: number;
  precoMax?: number;
  quartos?: number;
};

function matches(u: Unidade, f: Filtro): boolean {
  if (f.status && f.status.length > 0 && !f.status.includes(u.status))
    return false;
  if (f.precoMin != null && (u.preco_total ?? 0) < f.precoMin) return false;
  if (f.precoMax != null && (u.preco_total ?? 0) > f.precoMax) return false;
  if (f.quartos != null && u.qtd_quartos !== f.quartos) return false;
  return true;
}

export function MapaHorizontal({
  plantaUrl,
  unidades,
  filtro,
  onSelect,
  isAdmin,
  empreendimentoId,
}: {
  plantaUrl: string;
  unidades: Unidade[];
  filtro: Filtro;
  onSelect: (u: Unidade) => void;
  isAdmin: boolean;
  empreendimentoId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const filtradas = unidades.filter((u) => matches(u, filtro));
  const temPosicoes = unidades.some((u) => u.coordenadas_poligono);

  function limparPosicoes() {
    if (
      !confirm(
        "Remover todas as posições das casas na planta? A planta volta a ficar limpa (sem retângulos sobrepostos).",
      )
    )
      return;
    startTransition(async () => {
      const itens = unidades
        .filter((u) => u.coordenadas_poligono)
        .map((u) => ({ unidade_id: u.id, coords: null }));
      const res = await salvarCoordenadasEmLoteAction(empreendimentoId, itens);
      if ("error" in res && res.error) toast.error(res.error);
      else {
        toast.success("Posições removidas");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Planta como imagem limpa (sem sobreposições) */}
      <div className="relative w-full rounded-xl border bg-muted overflow-hidden">
        <Image
          src={plantaUrl}
          alt="Planta"
          width={1600}
          height={1000}
          className="w-full h-auto"
        />
      </div>

      {isAdmin && temPosicoes && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={limparPosicoes}
            disabled={pending}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="mr-1 size-4" /> Limpar posições da planta
          </Button>
        </div>
      )}

      <ListaPorBloco unidades={filtradas} onSelect={onSelect} />
    </div>
  );
}

// Extrai o nome do bloco da unidade.
function nomeDoBloco(u: Unidade): string {
  if (u.posicao_no_andar && u.posicao_no_andar.trim()) {
    return u.posicao_no_andar.trim();
  }
  const id = u.identificador;
  const idx = id.indexOf("-");
  return idx > 0 ? id.slice(0, idx) : "Sem bloco";
}

function ListaPorBloco({
  unidades,
  onSelect,
}: {
  unidades: Unidade[];
  onSelect: (u: Unidade) => void;
}) {
  const [aberto, setAberto] = useState<string | null>(null);

  const grupos = new Map<string, Unidade[]>();
  for (const u of unidades) {
    const b = nomeDoBloco(u);
    const arr = grupos.get(b) ?? [];
    arr.push(u);
    grupos.set(b, arr);
  }
  const blocos = Array.from(grupos.entries())
    .map(([nome, lista]) => ({
      nome,
      lista: lista.sort((a, b) =>
        a.identificador.localeCompare(b.identificador, undefined, {
          numeric: true,
        }),
      ),
      disponiveis: lista.filter((u) => u.status === "disponivel").length,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const blocoAberto = blocos.find((b) => b.nome === aberto);

  if (blocos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Nenhuma unidade com os filtros aplicados.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Blocos</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {blocos.map((b) => {
          const isOpen = b.nome === aberto;
          const pct =
            b.lista.length > 0
              ? Math.round((b.disponiveis / b.lista.length) * 100)
              : 0;
          return (
            <button
              key={b.nome}
              type="button"
              onClick={() => setAberto(isOpen ? null : b.nome)}
              className={
                "group rounded-xl border bg-background p-3 text-left transition-all hover:shadow-md hover:border-primary/40 " +
                (isOpen ? "border-primary ring-2 ring-primary/30" : "")
              }
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium truncate">{b.nome}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Bloco
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-semibold leading-none">
                  {b.disponiveis}
                </span>
                <span className="text-xs text-muted-foreground">
                  de {b.lista.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {b.disponiveis === 0
                  ? "Esgotado"
                  : `disponíve${b.disponiveis === 1 ? "l" : "is"}`}
              </p>
              <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {blocoAberto && (
        <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="font-medium">{blocoAberto.nome}</p>
            <button
              type="button"
              onClick={() => setAberto(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Fechar ×
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {blocoAberto.lista.map((u) => {
              const color = STATUS_COLORS[u.status];
              const numero = u.identificador.includes("-")
                ? u.identificador.split("-").slice(1).join("-")
                : u.identificador;
              return (
                <button
                  key={u.id}
                  onClick={() => onSelect(u)}
                  className="rounded-lg border bg-background hover:border-primary/40 hover:shadow-sm p-3 text-left transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{numero}</span>
                    <span
                      className="inline-block size-2.5 rounded-full"
                      style={{ background: color.bg }}
                      aria-hidden
                    />
                  </div>
                  <p className="text-[11px] mt-1 text-muted-foreground capitalize">
                    {u.status === "disponivel"
                      ? "Disponível"
                      : u.status === "reservada"
                        ? "Reservada"
                        : "Vendida"}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
