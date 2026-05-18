"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/auth";

const unidadeSchema = z.object({
  empreendimento_id: z.string().uuid(),
  identificador: z.string().min(1),
  andar: z.coerce.number().int().optional().nullable(),
  posicao_no_andar: z.string().optional().nullable(),
  area_privativa_m2: z.coerce.number().positive().optional().nullable(),
  area_total_m2: z.coerce.number().positive().optional().nullable(),
  qtd_quartos: z.coerce.number().int().min(0).optional().nullable(),
  qtd_suites: z.coerce.number().int().min(0).optional().nullable(),
  qtd_banheiros: z.coerce.number().int().min(0).optional().nullable(),
  qtd_vagas: z.coerce.number().int().min(0).optional().nullable(),
  preco_total: z.coerce.number().positive().optional().nullable(),
  valor_condominio: z.coerce.number().positive().optional().nullable(),
  foto_url: z.string().optional().nullable(),
});

export type UnidadeInput = z.infer<typeof unidadeSchema>;

export async function criarUnidadeAction(input: UnidadeInput) {
  await requireAdminProfile();
  const data = unidadeSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { data: created, error } = await supabase
    .from("unidades")
    .insert(data)
    .select("id")
    .single();
  if (error || !created) return { error: error?.message ?? "Falha" };
  revalidatePath(`/empreendimentos/${data.empreendimento_id}`);
  return { success: true, id: created.id };
}

export async function atualizarUnidadeAction(
  id: string,
  input: Partial<UnidadeInput>,
) {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const partial = unidadeSchema.partial().parse(input);
  const { data, error } = await supabase
    .from("unidades")
    .update(partial)
    .eq("id", id)
    .select("empreendimento_id")
    .single();
  if (error || !data) return { error: error?.message ?? "Falha" };
  revalidatePath(`/empreendimentos/${data.empreendimento_id}`);
  return { success: true };
}

export async function excluirUnidadeAction(id: string) {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("unidades")
    .delete()
    .eq("id", id)
    .select("empreendimento_id")
    .single();
  if (error || !data) return { error: error?.message ?? "Falha" };
  revalidatePath(`/empreendimentos/${data.empreendimento_id}`);
  redirect(`/empreendimentos/${data.empreendimento_id}`);
}

export async function salvarCoordenadasAction(
  unidadeId: string,
  coords: { x: number; y: number; width: number; height: number } | null,
) {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("unidades")
    .update({ coordenadas_poligono: coords })
    .eq("id", unidadeId)
    .select("empreendimento_id")
    .single();
  if (error || !data) return { error: error?.message ?? "Falha" };
  revalidatePath(`/empreendimentos/${data.empreendimento_id}`);
  return { success: true };
}

// Salva várias unidades de uma vez (usado pelo auto-arranjar em grade).
export async function salvarCoordenadasEmLoteAction(
  empreendimentoId: string,
  itens: Array<{
    unidade_id: string;
    coords: { x: number; y: number; width: number; height: number } | null;
  }>,
) {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  for (const it of itens) {
    const { error } = await supabase
      .from("unidades")
      .update({ coordenadas_poligono: it.coords })
      .eq("id", it.unidade_id)
      .eq("empreendimento_id", empreendimentoId);
    if (error) return { error: error.message };
  }
  revalidatePath(`/empreendimentos/${empreendimentoId}`);
  return { success: true };
}
