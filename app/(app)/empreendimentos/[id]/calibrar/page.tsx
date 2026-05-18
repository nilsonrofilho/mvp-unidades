import { requireAdminProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CalibradorBlocos } from "@/components/mapa/CalibradorBlocos";
import type { Empreendimento, Unidade } from "@/types/database";

export default async function CalibrarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminProfile();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: emp } = await supabase
    .from("empreendimentos")
    .select("*")
    .eq("id", id)
    .single();
  if (!emp) notFound();
  const empT = emp as Empreendimento;

  if (empT.tipo !== "horizontal" || !empT.planta_implantacao_url) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Calibrar blocos</h1>
        <p className="text-muted-foreground">
          Este empreendimento não é horizontal ou ainda não tem planta de
          implantação cadastrada.
        </p>
      </div>
    );
  }

  const { data: unidades } = await supabase
    .from("unidades")
    .select("*")
    .eq("empreendimento_id", id)
    .order("identificador");
  const lista = (unidades ?? []) as Unidade[];

  if (lista.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Calibrar blocos</h1>
        <p className="text-muted-foreground">
          Cadastre unidades antes de calibrar a planta.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Calibrar blocos — {empT.nome}</h1>
        <p className="text-sm text-muted-foreground">
          Desenhe um retângulo em cima de cada bloco da planta. As casas dentro
          são geradas automaticamente em grid 4×2 (térreas 1XX em cima, duplex
          2XX embaixo).
        </p>
      </header>
      <CalibradorBlocos
        plantaUrl={empT.planta_implantacao_url}
        unidades={lista}
        empreendimentoId={id}
      />
    </div>
  );
}
