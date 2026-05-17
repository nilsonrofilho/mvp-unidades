import { requireAdminProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EmpreendimentoForm } from "@/components/empreendimento/EmpreendimentoForm";
import { notFound } from "next/navigation";
import type { Empreendimento } from "@/types/database";

export default async function EditarEmpreendimentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminProfile();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("empreendimentos")
    .select("*")
    .eq("id", id)
    .single();
  if (!data) notFound();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Editar empreendimento</h1>
      <EmpreendimentoForm
        mode="edit"
        initial={data as Empreendimento}
      />
    </div>
  );
}
