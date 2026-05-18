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
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

export function FiltrosDashboard({ cidades }: { cidades: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [busca, setBusca] = useState(params.get("q") ?? "");

  const cidadeSelecionada = params.get("cidade") ?? "todas";
  const statusSelecionado = params.get("status") ?? "todos";
  const filtrosAtivos =
    (cidadeSelecionada !== "todas" ? 1 : 0) +
    (statusSelecionado !== "todos" ? 1 : 0);

  useEffect(() => {
    const id = setTimeout(() => {
      const p = new URLSearchParams(params.toString());
      if (busca) p.set("q", busca);
      else p.delete("q");
      router.replace(`/?${p.toString()}`);
    }, 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  function setParam(key: string, value: string) {
    const p = new URLSearchParams(params.toString());
    if (value && value !== "todas" && value !== "todos") p.set(key, value);
    else p.delete(key);
    router.replace(`/?${p.toString()}`);
  }

  function limparFiltros() {
    const p = new URLSearchParams();
    if (busca) p.set("q", busca);
    router.replace(`/?${p.toString()}`);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
      <div className="relative flex-1 sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar empreendimento..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9 h-11"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="lg"
              className="h-11 relative gap-2"
            >
              <SlidersHorizontal className="size-4" />
              Filtros
              {filtrosAtivos > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                  {filtrosAtivos}
                </span>
              )}
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Cidade</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={cidadeSelecionada}
            onValueChange={(v) => setParam("cidade", v ?? "todas")}
          >
            <DropdownMenuRadioItem value="todas">
              Todas as cidades
            </DropdownMenuRadioItem>
            {cidades.map((c) => (
              <DropdownMenuRadioItem key={c} value={c}>
                {c}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Status</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={statusSelecionado}
            onValueChange={(v) => setParam("status", v ?? "todos")}
          >
            <DropdownMenuRadioItem value="todos">
              Todos os status
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="lancamento">
              Lançamento
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="em_obras">
              Em obras
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="pronto">Pronto</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>

          {filtrosAtivos > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={limparFiltros}>
                <X className="size-4" />
                Limpar filtros
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
