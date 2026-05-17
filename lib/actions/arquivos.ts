"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/auth";

const schema = z.object({
  empreendimento_id: z.string().uuid(),
  nome: z.string().min(1),
  url: z.string().url(),
  tamanho_bytes: z.number().int().positive(),
  tipo_mime: z.string(),
});

export async function registrarArquivoAction(input: z.infer<typeof schema>) {
  const profile = await requireAdminProfile();
  const data = schema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("arquivos_empreendimento").insert({
    ...data,
    enviado_por: profile.id,
  });
  if (error) return { error: error.message };
  revalidatePath(`/empreendimentos/${data.empreendimento_id}`);
  return { success: true };
}

export async function excluirArquivoAction(
  id: string,
  empreendimento_id: string,
) {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("arquivos_empreendimento")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/empreendimentos/${empreendimento_id}`);
  return { success: true };
}
