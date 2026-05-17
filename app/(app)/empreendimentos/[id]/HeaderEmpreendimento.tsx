import Image from "next/image";
import Link from "next/link";
import type { Empreendimento } from "@/types/database";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus } from "lucide-react";
import { formatMonthYear } from "@/lib/formatacao";

const statusLabel: Record<string, string> = {
  lancamento: "Lançamento",
  em_obras: "Em obras",
  pronto: "Pronto",
};

export function HeaderEmpreendimento({
  emp,
  isAdmin,
  contadores,
}: {
  emp: Empreendimento;
  isAdmin: boolean;
  contadores: { disponiveis: number; reservadas: number; vendidas: number };
}) {
  return (
    <div className="space-y-4">
      <div className="relative aspect-[16/5] rounded-xl overflow-hidden bg-muted">
        {emp.foto_capa_url ? (
          <Image
            src={emp.foto_capa_url}
            alt={emp.nome}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            Sem foto de capa
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{emp.nome}</h1>
            <Badge variant="secondary">{statusLabel[emp.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {[emp.endereco, emp.cidade, emp.estado].filter(Boolean).join(", ")}
          </p>
          <p className="text-sm text-muted-foreground">
            Entrega: {formatMonthYear(emp.data_entrega_prevista)}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Link
              href={`/empreendimentos/${emp.id}/editar`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Pencil className="mr-1 size-4" /> Editar
            </Link>
            <Link
              href={`/empreendimentos/${emp.id}/unidades/novo`}
              className={buttonVariants({ size: "sm" })}
            >
              <Plus className="mr-1 size-4" /> Nova unidade
            </Link>
          </div>
        )}
      </div>
      <div className="flex gap-4 text-sm">
        <span>
          🟢 <strong>{contadores.disponiveis}</strong> disponíveis
        </span>
        <span>
          🟡 <strong>{contadores.reservadas}</strong> reservadas
        </span>
        <span>
          🔴 <strong>{contadores.vendidas}</strong> vendidas
        </span>
      </div>
    </div>
  );
}
