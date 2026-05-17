"use client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function FiltrosDashboard({ cidades }: { cidades: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [busca, setBusca] = useState(params.get("q") ?? "");

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

  function setParam(key: string, value: string | null) {
    const p = new URLSearchParams(params.toString());
    if (value && value !== "todas" && value !== "todos") p.set(key, value);
    else p.delete(key);
    router.replace(`/?${p.toString()}`);
  }

  return (
    <div className="flex flex-col md:flex-row gap-3">
      <Input
        placeholder="Buscar por nome..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="md:max-w-xs"
      />
      <Select
        value={params.get("cidade") ?? "todas"}
        onValueChange={(v) => setParam("cidade", v)}
      >
        <SelectTrigger className="md:w-48">
          <SelectValue placeholder="Cidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as cidades</SelectItem>
          {cidades.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={params.get("status") ?? "todos"}
        onValueChange={(v) => setParam("status", v)}
      >
        <SelectTrigger className="md:w-48">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos status</SelectItem>
          <SelectItem value="lancamento">Lançamento</SelectItem>
          <SelectItem value="em_obras">Em obras</SelectItem>
          <SelectItem value="pronto">Pronto</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
