import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ArquivoEmpreendimento } from "@/types/database";

export async function listarArquivos(
  empreendimentoId: string,
): Promise<ArquivoEmpreendimento[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("arquivos_empreendimento")
    .select("*")
    .eq("empreendimento_id", empreendimentoId)
    .order("criado_em", { ascending: false });
  return (data ?? []) as ArquivoEmpreendimento[];
}
