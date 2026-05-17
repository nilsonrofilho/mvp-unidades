import {
  listarEmpreendimentos,
  resumoDashboard,
  type EmpreendimentoComContadores,
} from "@/lib/data/empreendimentos";
import { CardEmpreendimento } from "@/components/empreendimento/CardEmpreendimento";
import { ResumoCards } from "@/components/dashboard/ResumoCards";
import { FiltrosDashboard } from "@/components/dashboard/FiltrosDashboard";
import { requireAuthenticatedProfile } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

function filtra(
  list: EmpreendimentoComContadores[],
  q?: string,
  cidade?: string,
  status?: string,
  statusUnidade?: string,
) {
  return list.filter((e) => {
    if (q && !e.nome.toLowerCase().includes(q.toLowerCase())) return false;
    if (cidade && e.cidade !== cidade) return false;
    if (status && e.status !== status) return false;
    if (statusUnidade === "disponivel" && e.disponiveis === 0) return false;
    if (statusUnidade === "reservada" && e.reservadas === 0) return false;
    if (statusUnidade === "vendida" && e.vendidas === 0) return false;
    return true;
  });
}

type Search = {
  q?: string;
  cidade?: string;
  status?: string;
  statusUnidade?: string;
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const profile = await requireAuthenticatedProfile();
  const params = await searchParams;
  const [resumo, todos] = await Promise.all([
    resumoDashboard(),
    listarEmpreendimentos(),
  ]);
  const cidades = Array.from(
    new Set(todos.map((e) => e.cidade).filter(Boolean)),
  ) as string[];
  const filtrados = filtra(
    todos,
    params.q,
    params.cidade,
    params.status,
    params.statusUnidade,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Empreendimentos</h1>
        {profile.role === "admin" && (
          <Link
            href="/empreendimentos/novo"
            className={buttonVariants({ variant: "default" })}
          >
            <Plus className="mr-1 size-4" /> Novo empreendimento
          </Link>
        )}
      </div>
      <ResumoCards resumo={resumo} />
      <FiltrosDashboard cidades={cidades} />
      {filtrados.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          Nenhum empreendimento encontrado.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtrados.map((e) => (
            <CardEmpreendimento key={e.id} emp={e} />
          ))}
        </div>
      )}
    </div>
  );
}
