import Image from "next/image";
import Link from "next/link";
import type { Empreendimento } from "@/types/database";
import { buttonVariants } from "@/components/ui/button";
import { Pencil, Plus, MapPin, Calendar, Crosshair } from "lucide-react";
import { formatMonthYear } from "@/lib/formatacao";
import { MidiaUploaderInline } from "@/components/empreendimento/MidiaUploaderInline";
import { CorretoresDoEmpreendimento } from "@/components/empreendimento/CorretoresDoEmpreendimento";

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

export function HeaderEmpreendimento({
  emp,
  isAdmin,
}: {
  emp: Empreendimento;
  isAdmin: boolean;
}) {
  const status = statusInfo[emp.status] ?? statusInfo.em_obras;

  return (
    <div className="space-y-6">
      {/* Hero — foto + status badge sobreposto */}
      <div className="relative aspect-[16/5] rounded-2xl overflow-hidden bg-muted">
        {emp.foto_capa_url && (
          <Image
            src={emp.foto_capa_url}
            alt={emp.nome}
            fill
            className="object-cover"
            priority
          />
        )}
        <span
          className={
            "absolute top-4 left-4 inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium shadow-sm " +
            status.classes
          }
        >
          {status.label}
        </span>
        {isAdmin ? (
          <MidiaUploaderInline
            empreendimentoId={emp.id}
            campo="foto_capa_url"
            currentUrl={emp.foto_capa_url}
            variant="hero"
            label="Trocar capa"
            emptyLabel="Adicionar foto de capa"
          />
        ) : (
          !emp.foto_capa_url && (
            <div className="grid h-full w-full place-items-center text-muted-foreground">
              Sem foto de capa
            </div>
          )
        )}
      </div>

      {/* Título + ações */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2 min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight">{emp.nome}</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" />
              {[emp.endereco, emp.cidade, emp.estado]
                .filter(Boolean)
                .join(", ")}
            </span>
            {emp.data_entrega_prevista && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-4" />
                Entrega {formatMonthYear(emp.data_entrega_prevista)}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <CorretoresDoEmpreendimento empreendimentoId={emp.id} />
          {isAdmin && (
            <>
              {emp.tipo === "horizontal" && emp.planta_implantacao_url && (
                <Link
                  href={`/empreendimentos/${emp.id}/calibrar`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  <Crosshair className="mr-1 size-4" /> Calibrar blocos
                </Link>
              )}
              <Link
                href={`/empreendimentos/${emp.id}/editar`}
                className={buttonVariants({ variant: "outline" })}
              >
                <Pencil className="mr-1 size-4" /> Editar
              </Link>
              <Link
                href={`/empreendimentos/${emp.id}/unidades/novo`}
                className={buttonVariants({})}
              >
                <Plus className="mr-1 size-4" /> Nova unidade
              </Link>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
