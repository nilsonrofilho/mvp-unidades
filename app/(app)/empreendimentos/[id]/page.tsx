import { requireAuthenticatedProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { HeaderEmpreendimento } from "./HeaderEmpreendimento";
import { EmpreendimentoTabs } from "@/components/empreendimento/EmpreendimentoTabs";
import { listarArquivos } from "@/lib/data/arquivos";
import type { Empreendimento, Unidade } from "@/types/database";

export default async function EmpreendimentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireAuthenticatedProfile();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: emp } = await supabase
    .from("empreendimentos")
    .select("*")
    .eq("id", id)
    .single();
  if (!emp) notFound();
  const { data: unidades } = await supabase
    .from("unidades")
    .select("*")
    .eq("empreendimento_id", id)
    .order("identificador");
  const arquivos = await listarArquivos(id);
  const list = (unidades ?? []) as Unidade[];
  return (
    <div className="space-y-6">
      <HeaderEmpreendimento
        emp={emp as Empreendimento}
        isAdmin={profile.role === "admin"}
      />
      <EmpreendimentoTabs
        emp={emp as Empreendimento}
        unidades={list}
        arquivos={arquivos}
        profile={profile}
      />
    </div>
  );
}
