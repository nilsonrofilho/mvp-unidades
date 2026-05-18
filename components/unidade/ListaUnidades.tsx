"use client";
import { useMemo, useState } from "react";
import type { Unidade } from "@/types/database";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "./StatusBadge";
import { formatBRL, formatM2 } from "@/lib/formatacao";
import { Search, ChevronRight } from "lucide-react";

function nomeDoBloco(u: Unidade): string {
  if (u.posicao_no_andar && u.posicao_no_andar.trim()) {
    return u.posicao_no_andar.trim();
  }
  const id = u.identificador;
  const idx = id.indexOf("-");
  return idx > 0 ? id.slice(0, idx) : "Geral";
}

export function ListaUnidades({
  unidades,
  onSelect,
}: {
  unidades: Unidade[];
  onSelect: (u: Unidade) => void;
}) {
  const [busca, setBusca] = useState("");
  const [abertos, setAbertos] = useState<Set<string>>(new Set());

  const blocos = useMemo(() => {
    const filtradas = busca
      ? unidades.filter((u) =>
          u.identificador.toLowerCase().includes(busca.toLowerCase()),
        )
      : unidades;
    const map = new Map<string, Unidade[]>();
    for (const u of filtradas) {
      const b = nomeDoBloco(u);
      const arr = map.get(b) ?? [];
      arr.push(u);
      map.set(b, arr);
    }
    return Array.from(map.entries())
      .map(([nome, lista]) => ({
        nome,
        unidades: lista.sort((a, b) =>
          a.identificador.localeCompare(b.identificador, undefined, {
            numeric: true,
          }),
        ),
        disponiveis: lista.filter((u) => u.status === "disponivel").length,
        reservadas: lista.filter((u) => u.status === "reservada").length,
        vendidas: lista.filter((u) => u.status === "vendida").length,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [unidades, busca]);

  function toggle(b: string) {
    setAbertos((prev) => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b);
      else next.add(b);
      return next;
    });
  }

  // Quando há busca, abre todos automaticamente
  const todosAbertos = busca.length > 0;

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar unidade..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      {blocos.length === 0 ? (
        <p className="text-muted-foreground text-center py-6 text-sm">
          Nenhuma unidade encontrada.
        </p>
      ) : (
        <ul className="space-y-2">
          {blocos.map((b) => {
            const aberto = todosAbertos || abertos.has(b.nome);
            return (
              <li
                key={b.nome}
                className="rounded-xl border bg-background overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggle(b.nome)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent text-left transition"
                  aria-expanded={aberto}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ChevronRight
                      className={
                        "size-4 text-muted-foreground transition-transform " +
                        (aberto ? "rotate-90" : "")
                      }
                    />
                    <div>
                      <p className="font-semibold">{b.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.unidades.length}{" "}
                        {b.unidades.length === 1 ? "unidade" : "unidades"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="text-emerald-700">
                      <strong>{b.disponiveis}</strong> disp.
                    </span>
                    <span className="text-amber-700">
                      <strong>{b.reservadas}</strong> reserv.
                    </span>
                    <span className="text-rose-700">
                      <strong>{b.vendidas}</strong> vend.
                    </span>
                  </div>
                </button>

                {aberto && (
                  <div className="border-t bg-muted/20">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-xs text-muted-foreground">
                          <tr className="border-b">
                            <th className="text-left font-medium px-4 py-2">
                              Unidade
                            </th>
                            <th className="text-left font-medium px-2 py-2">
                              Área priv.
                            </th>
                            <th className="text-left font-medium px-2 py-2">
                              Quartos
                            </th>
                            <th className="text-left font-medium px-2 py-2">
                              Vagas
                            </th>
                            <th className="text-left font-medium px-2 py-2">
                              Preço
                            </th>
                            <th className="text-left font-medium px-2 py-2">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {b.unidades.map((u) => (
                            <tr
                              key={u.id}
                              onClick={() => onSelect(u)}
                              className="cursor-pointer hover:bg-background border-b last:border-b-0"
                            >
                              <td className="font-medium px-4 py-2">
                                {u.identificador}
                              </td>
                              <td className="px-2 py-2">
                                {formatM2(u.area_privativa_m2)}
                              </td>
                              <td className="px-2 py-2">
                                {u.qtd_quartos ?? "—"}
                              </td>
                              <td className="px-2 py-2">
                                {u.qtd_vagas ?? "—"}
                              </td>
                              <td className="px-2 py-2">
                                {formatBRL(u.preco_total)}
                              </td>
                              <td className="px-2 py-2">
                                <StatusBadge status={u.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
