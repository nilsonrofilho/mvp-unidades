"use client";
import { useRouter, useSearchParams } from "next/navigation";
import type { ResumoDashboard } from "@/lib/data/empreendimentos";

const cards: Array<{
  key: keyof ResumoDashboard;
  label: string;
  filter?: string;
}> = [
  { key: "totalEmpreendimentos", label: "Empreendimentos" },
  { key: "totalUnidades", label: "Unidades" },
  { key: "disponiveis", label: "Disponíveis", filter: "disponivel" },
  { key: "reservadas", label: "Reservadas", filter: "reservada" },
  { key: "vendidas", label: "Vendidas", filter: "vendida" },
];

export function ResumoCards({ resumo }: { resumo: ResumoDashboard }) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("statusUnidade");

  function toggle(filter?: string) {
    if (!filter) return;
    const p = new URLSearchParams(params.toString());
    if (current === filter) p.delete("statusUnidade");
    else p.set("statusUnidade", filter);
    router.push(`/?${p.toString()}`);
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((c) => (
        <button
          key={c.key}
          onClick={() => toggle(c.filter)}
          className={`rounded-lg border bg-background p-4 text-left transition ${current === c.filter ? "ring-2 ring-brand" : ""} ${c.filter ? "hover:bg-accent" : "cursor-default"}`}
          disabled={!c.filter}
        >
          <p className="text-xs text-muted-foreground">{c.label}</p>
          <p className="text-2xl font-semibold">{resumo[c.key]}</p>
        </button>
      ))}
    </div>
  );
}
