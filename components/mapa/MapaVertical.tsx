"use client";
import type { Unidade } from "@/types/database";
import { STATUS_COLORS } from "@/lib/cores-status";

type Props = {
  unidades: Unidade[];
  qtdAndares: number;
  qtdUnidadesPorAndar: number;
  filtro: {
    status?: string[];
    precoMin?: number;
    precoMax?: number;
    quartos?: number;
  };
  onSelect: (u: Unidade) => void;
};

function isPlaceholder(u: Unidade): boolean {
  return (
    u.area_privativa_m2 == null &&
    u.preco_total == null &&
    u.qtd_quartos == null
  );
}

function matchesFilter(u: Unidade, f: Props["filtro"]): boolean {
  if (f.status && f.status.length > 0 && !f.status.includes(u.status))
    return false;
  if (f.precoMin != null && (u.preco_total ?? 0) < f.precoMin) return false;
  if (f.precoMax != null && (u.preco_total ?? 0) > f.precoMax) return false;
  if (f.quartos != null && u.qtd_quartos !== f.quartos) return false;
  return true;
}

const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function MapaVertical({
  unidades,
  qtdAndares,
  qtdUnidadesPorAndar,
  filtro,
  onSelect,
}: Props) {
  const grid: Record<number, Unidade[]> = {};
  unidades.forEach((u) => {
    if (u.andar == null) return;
    grid[u.andar] = grid[u.andar] ?? [];
    grid[u.andar].push(u);
  });

  const andares = Array.from(
    { length: qtdAndares },
    (_, i) => qtdAndares - i,
  );

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full space-y-1 p-2">
        {andares.map((andar) => (
          <div key={andar} className="flex items-center gap-2">
            <div className="w-10 shrink-0 text-right text-xs text-muted-foreground">
              {andar}º
            </div>
            <div className="flex gap-1">
              {Array.from({ length: qtdUnidadesPorAndar }, (_, i) => {
                const u = (grid[andar] ?? []).find(
                  (x) =>
                    x.posicao_no_andar === LETRAS[i] ||
                    x.posicao_no_andar === String(i + 1),
                );
                if (!u) return <div key={i} className="w-16 h-12 rounded bg-muted/40" />;
                const placeholder = isPlaceholder(u);
                const color = STATUS_COLORS[placeholder ? "sem_dados" : u.status];
                const dim = !matchesFilter(u, filtro);
                return (
                  <button
                    key={u.id}
                    onClick={() => onSelect(u)}
                    title={u.identificador}
                    className="w-16 h-12 rounded text-xs font-medium transition border"
                    style={{
                      background: color.bg,
                      color: placeholder ? "#374151" : "#ffffff",
                      borderColor: color.border,
                      opacity: dim ? 0.2 : 1,
                    }}
                  >
                    {u.identificador}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
