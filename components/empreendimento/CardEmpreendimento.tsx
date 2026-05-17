import Link from "next/link";
import Image from "next/image";
import type { EmpreendimentoComContadores } from "@/lib/data/empreendimentos";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const statusLabel: Record<string, string> = {
  lancamento: "Lançamento",
  em_obras: "Em obras",
  pronto: "Pronto",
};

export function CardEmpreendimento({
  emp,
}: {
  emp: EmpreendimentoComContadores;
}) {
  const total = emp.total_unidades;
  const vendidas = emp.vendidas;
  const pct = total > 0 ? Math.round((vendidas / total) * 100) : 0;
  return (
    <Link
      href={`/empreendimentos/${emp.id}`}
      className="group rounded-lg border bg-background overflow-hidden hover:shadow-md transition"
    >
      <div className="relative aspect-video bg-muted">
        {emp.foto_capa_url ? (
          <Image
            src={emp.foto_capa_url}
            alt={emp.nome}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 25vw"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground text-sm">
            Sem foto
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium leading-tight">{emp.nome}</h3>
          <Badge variant="secondary">{statusLabel[emp.status]}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{emp.cidade ?? "—"}</p>
        <div className="space-y-1">
          <Progress value={pct} />
          <p className="text-xs text-muted-foreground">
            {pct}% vendido ({vendidas} de {total})
          </p>
        </div>
      </div>
    </Link>
  );
}
