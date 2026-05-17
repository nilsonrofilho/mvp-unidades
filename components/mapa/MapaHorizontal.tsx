"use client";
import type { Unidade } from "@/types/database";
import { STATUS_COLORS } from "@/lib/cores-status";
import Image from "next/image";

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
}: {
  plantaUrl: string;
  unidades: Unidade[];
  filtro: Filtro;
  onSelect: (u: Unidade) => void;
}) {
  const semPosicao = unidades.filter((u) => !u.coordenadas_poligono);
  const comPosicao = unidades.filter((u) => u.coordenadas_poligono);

  return (
    <div className="space-y-3">
      <div className="relative w-full rounded-lg border bg-muted overflow-hidden">
        <Image
          src={plantaUrl}
          alt="Planta"
          width={1600}
          height={1000}
          className="w-full h-auto"
        />
        {comPosicao.map((u) => {
          const c = u.coordenadas_poligono!;
          const color = STATUS_COLORS[u.status];
          const dimmed = !matches(u, filtro);
          return (
            <button
              key={u.id}
              onClick={() => onSelect(u)}
              className="absolute rounded-sm border-2 text-xs font-bold text-white grid place-items-center hover:opacity-90 transition"
              style={{
                left: `${c.x * 100}%`,
                top: `${c.y * 100}%`,
                width: `${c.width * 100}%`,
                height: `${c.height * 100}%`,
                background: color.bg,
                borderColor: color.border,
                opacity: dimmed ? 0.2 : 0.7,
              }}
            >
              {u.identificador}
            </button>
          );
        })}
      </div>
      {semPosicao.length > 0 && (
        <div className="rounded border bg-accent/30 p-3">
          <p className="text-xs font-medium mb-2">
            Sem posição na planta ({semPosicao.length}):
          </p>
          <div className="flex flex-wrap gap-1">
            {semPosicao.map((u) => (
              <button
                key={u.id}
                onClick={() => onSelect(u)}
                className="text-xs rounded border px-2 py-1 bg-background hover:bg-accent"
              >
                {u.identificador}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
