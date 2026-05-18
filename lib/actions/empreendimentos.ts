"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/auth";

const baseSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  tipo: z.enum(["vertical", "horizontal"]),
  status: z.enum(["lancamento", "em_obras", "pronto"]).default("em_obras"),
  endereco: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().length(2, "UF deve ter 2 letras").optional().nullable(),
  cep: z.string().optional().nullable(),
  data_entrega_prevista: z.string().optional().nullable(),
  descricao: z.string().optional().nullable(),
  foto_capa_url: z.string().optional().nullable(),
  planta_implantacao_url: z.string().optional().nullable(),
  qtd_andares: z.coerce.number().int().positive().optional().nullable(),
  qtd_unidades_por_andar: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
});

export type EmpreendimentoInput = z.infer<typeof baseSchema>;

export async function criarEmpreendimentoAction(input: EmpreendimentoInput) {
  await requireAdminProfile();
  const data = baseSchema.parse(input);
  const supabase = await createSupabaseServerClient();

  if (data.tipo === "vertical") {
    if (!data.qtd_andares || !data.qtd_unidades_por_andar) {
      return {
        error: "Vertical requer qtd_andares e qtd_unidades_por_andar",
      };
    }
  }

  const { data: created, error } = await supabase
    .from("empreendimentos")
    .insert(data)
    .select("id")
    .single();
  if (error || !created) return { error: error?.message ?? "Falha ao criar" };

  if (
    data.tipo === "vertical" &&
    data.qtd_andares &&
    data.qtd_unidades_por_andar
  ) {
    const placeholders = [];
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    for (let andar = 1; andar <= data.qtd_andares; andar++) {
      for (let pos = 0; pos < data.qtd_unidades_por_andar; pos++) {
        const letra = letras[pos] ?? String(pos + 1);
        placeholders.push({
          empreendimento_id: created.id,
          identificador: `${andar}${letra}`,
          andar,
          posicao_no_andar: letra,
          status: "disponivel" as const,
        });
      }
    }
    await supabase.from("unidades").insert(placeholders);
  }

  revalidatePath("/");
  redirect(`/empreendimentos/${created.id}`);
}

export async function atualizarEmpreendimentoAction(
  id: string,
  input: EmpreendimentoInput,
) {
  await requireAdminProfile();
  const data = baseSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("empreendimentos")
    .update(data)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath(`/empreendimentos/${id}`);
  return { success: true };
}

export async function atualizarMidiaEmpreendimentoAction(
  id: string,
  campo: "foto_capa_url" | "planta_implantacao_url",
  url: string | null,
) {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("empreendimentos")
    .update({ [campo]: url })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath(`/empreendimentos/${id}`);
  return { success: true };
}

export async function excluirEmpreendimentoAction(id: string) {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("empreendimentos")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  redirect("/");
}
