"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuthenticatedProfile } from "@/lib/auth";

const clienteSchema = z.object({
  nome: z.string().min(1),
  cpf: z.string().optional().nullable(),
  telefone: z.string().min(1),
  email: z
    .union([z.string().email(), z.literal("")])
    .optional()
    .nullable(),
  renda: z.coerce.number().nonnegative().optional().nullable(),
  tipo_renda: z.enum(["individual", "composta"]).default("individual"),
  nome_2: z.string().optional().nullable(),
  cpf_2: z.string().optional().nullable(),
  renda_2: z.coerce.number().nonnegative().optional().nullable(),
});

export type ClienteInput = z.infer<typeof clienteSchema>;

export async function criarClienteAction(input: ClienteInput) {
  const profile = await requireAuthenticatedProfile();
  const data = clienteSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { data: created, error } = await supabase
    .from("clientes")
    .insert({ ...data, criado_por: profile.id })
    .select("id")
    .single();
  if (error || !created) return { error: error?.message ?? "Falha" };
  return { success: true, id: created.id };
}

export async function atualizarClienteAction(
  id: string,
  input: Partial<ClienteInput>,
) {
  await requireAuthenticatedProfile();
  const data = clienteSchema.partial().parse(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("clientes").update(data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { success: true };
}

export async function buscarClientesAction(q: string) {
  await requireAuthenticatedProfile();
  if (!q || q.length < 2) return { results: [] };
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("clientes")
    .select("id, nome, cpf, telefone")
    .or(`nome.ilike.%${q}%,cpf.ilike.%${q}%`)
    .limit(10);
  return { results: data ?? [] };
}
