import { requireAdminProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UnidadeForm } from "@/components/unidade/UnidadeForm";
import { notFound } from "next/navigation";
import type { Unidade } from "@/types/database";

export default async function EditarUnidadePage({
  params,
}: {
  params: Promise<{ id: string; unidadeId: string }>;
}) {
  await requireAdminProfile();
  const { id, unidadeId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("unidades")
    .select("*")
    .eq("id", unidadeId)
    .single();
  if (!data) notFound();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Editar unidade</h1>
      <UnidadeForm
        mode="edit"
        empreendimentoId={id}
        initial={data as Unidade}
      />
    </div>
  );
}
