"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { SlidersHorizontal, X } from "lucide-react";

export type FiltroMapa = {
  status: string[];
  precoMin?: number;
  precoMax?: number;
  quartos?: number;
};

export function MapaFiltros({
  value,
  onChange,
  quartosDistintos,
}: {
  value: FiltroMapa;
  onChange: (v: FiltroMapa) => void;
  quartosDistintos: number[];
}) {
  const filtrosAvancadosAtivos =
    (value.precoMin != null ? 1 : 0) +
    (value.precoMax != null ? 1 : 0) +
    (value.quartos != null ? 1 : 0);

  function limparAvancados() {
    onChange({
      ...value,
      precoMin: undefined,
      precoMax: undefined,
      quartos: undefined,
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <SlidersHorizontal className="size-4" />
            Filtros
            {filtrosAvancadosAtivos > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {filtrosAvancadosAtivos}
              </span>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-64 p-3 space-y-2">
        <DropdownMenuLabel className="px-0">Faixa de preço</DropdownMenuLabel>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Min."
            value={value.precoMin ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                precoMin: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
          <Input
            type="number"
            placeholder="Max."
            value={value.precoMax ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                precoMax: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="px-0">Quartos</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={value.quartos != null ? String(value.quartos) : "todos"}
          onValueChange={(v) =>
            onChange({
              ...value,
              quartos: !v || v === "todos" ? undefined : Number(v),
            })
          }
        >
          <DropdownMenuRadioItem value="todos">Todos</DropdownMenuRadioItem>
          {quartosDistintos
            .sort((a, b) => a - b)
            .map((n) => (
              <DropdownMenuRadioItem key={n} value={String(n)}>
                {n} {n === 1 ? "quarto" : "quartos"}
              </DropdownMenuRadioItem>
            ))}
        </DropdownMenuRadioGroup>

        {filtrosAvancadosAtivos > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={limparAvancados}>
              <X className="size-4" />
              Limpar filtros
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
