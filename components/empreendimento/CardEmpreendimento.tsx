import Link from "next/link";
import Image from "next/image";
import type { EmpreendimentoComContadores } from "@/lib/data/empreendimentos";
import { Progress } from "@/components/ui/progress";
import { formatBRL } from "@/lib/formatacao";
import { MapPin, ImageOff } from "lucide-react";

const statusInfo: Record<string, { label: string; classes: string }> = {
  lancamento: {
    label: "Lançamento",
    classes: "bg-emerald-100 text-emerald-900 border-emerald-200",
  },
  em_obras: {
    label: "Em obras",
    classes: "bg-amber-100 text-amber-900 border-amber-200",
  },
  pronto: {
    label: "Pronto",
    classes: "bg-blue-100 text-blue-900 border-blue-200",
  },
};

export function CardEmpreendimento({
  emp,
}: {
  emp: EmpreendimentoComContadores;
}) {
  const total = emp.total_unidades;
  const vendidas = emp.vendidas;
  const pct = total > 0 ? Math.round((vendidas / total) * 100) : 0;
  const status = statusInfo[emp.status] ?? statusInfo.em_obras;
  const local = [emp.cidade, emp.estado].filter(Boolean).join("/");
  const esgotado = emp.disponiveis === 0 && total > 0;

  return (
    <Link
      href={`/empreendimentos/${emp.id}`}
      className="group block rounded-2xl border bg-background overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all"
    >
      {/* Foto em destaque (60% do card) */}
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        {emp.foto_capa_url ? (
          <Image
            src={emp.foto_capa_url}
            alt={emp.nome}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <ImageOff className="size-8 opacity-40" />
              <span className="text-xs">Sem foto de capa</span>
            </div>
          </div>
        )}

        {/* Badge de status sobre a foto */}
        <span
          className={
            "absolute top-3 right-3 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm " +
            status.classes
          }
        >
          {status.label}
        </span>

        {esgotado && (
          <span className="absolute top-3 left-3 inline-flex items-center rounded-full border bg-background/90 backdrop-blur px-2.5 py-1 text-xs font-medium">
            Esgotado
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-base leading-tight line-clamp-2">
            {emp.nome}
          </h3>
          {local && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="size-3.5" /> {local}
            </p>
          )}
        </div>

        {/* Preço em destaque */}
        {emp.preco_min_disponivel != null ? (
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              A partir de
            </p>
            <p className="text-xl font-semibold leading-tight">
              {formatBRL(emp.preco_min_disponivel)}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Preço
            </p>
            <p className="text-sm text-muted-foreground">a definir</p>
          </div>
        )}

        {/* Disponíveis */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-semibold">{emp.disponiveis}</span>
          <span className="text-sm text-muted-foreground">
            {emp.disponiveis === 1 ? "disponível" : "disponíveis"} de {total}
          </span>
        </div>

        {/* Progresso */}
        <div className="space-y-1">
          <Progress value={pct} />
          <p className="text-xs text-muted-foreground">
            {pct}% vendido
          </p>
        </div>
      </div>
    </Link>
  );
}
