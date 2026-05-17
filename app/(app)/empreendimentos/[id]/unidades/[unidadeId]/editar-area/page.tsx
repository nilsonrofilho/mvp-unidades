import { requireAdminProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { EditorAreas } from "@/components/mapa/EditorAreas";
import type { Empreendimento, Unidade } from "@/types/database";

export default async function EditarAreaPage({
  params,
}: {
  params: Promise<{ id: string; unidadeId: string }>;
}) {
  await requireAdminProfile();
  const { id, unidadeId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: emp } = await supabase
    .from("empreendimentos")
    .select("*")
    .eq("id", id)
    .single();
  const { data: u } = await supabase
    .from("unidades")
    .select("*")
    .eq("id", unidadeId)
    .single();
  if (!emp || !u) notFound();
  const empT = emp as Empreendimento;
  if (empT.tipo !== "horizontal" || !empT.planta_implantacao_url) {
    return (
      <p>
        Este empreendimento não é horizontal ou ainda não tem planta de
        implantação.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">
        Marcar área — {(u as Unidade).identificador}
      </h1>
      <EditorAreas
        plantaUrl={empT.planta_implantacao_url}
        unidadeId={unidadeId}
        identificador={(u as Unidade).identificador}
        empreendimentoId={id}
        coordsAtuais={(u as Unidade).coordenadas_poligono}
      />
    </div>
  );
}
