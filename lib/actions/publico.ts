"use server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const reservaPublicaSchema = z.object({
  unidade_id: z.string().uuid(),
  corretor_id: z.string().uuid(),
  nome: z.string().min(2, "Informe seu nome"),
  telefone: z.string().min(8, "Informe um telefone válido"),
  email: z
    .union([z.string().email(), z.literal("")])
    .optional()
    .nullable(),
  observacoes: z.string().optional().nullable(),
});

export type ReservaPublicaInput = z.infer<typeof reservaPublicaSchema>;

export type CorretorPublico = {
  id: string;
  nome: string;
  telefone: string | null;
};

export async function listarCorretoresPublicoAction(): Promise<
  CorretorPublico[]
> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, nome, telefone")
    .eq("ativo", true)
    .in("role", ["admin", "corretor"])
    .order("nome");
  return (data ?? []) as CorretorPublico[];
}

export async function criarReservaPublicaAction(
  input: ReservaPublicaInput,
): Promise<{ success: true } | { error: string }> {
  const parsed = reservaPublicaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;
  const admin = createSupabaseAdminClient();

  // Unidade precisa existir e estar disponível.
  const { data: unidade } = await admin
    .from("unidades")
    .select("id, status, preco_total")
    .eq("id", data.unidade_id)
    .single();
  if (!unidade) return { error: "Imóvel não encontrado" };
  if (unidade.status !== "disponivel")
    return { error: "Este imóvel não está mais disponível" };

  // Corretor precisa estar ativo.
  const { data: corretor } = await admin
    .from("profiles")
    .select("id, ativo, role")
    .eq("id", data.corretor_id)
    .single();
  if (!corretor || !corretor.ativo || !["admin", "corretor"].includes(corretor.role))
    return { error: "Corretor inválido" };

  // Cria cliente (criado_por = o próprio corretor escolhido).
  const { data: cliente, error: cliErr } = await admin
    .from("clientes")
    .insert({
      nome: data.nome,
      telefone: data.telefone,
      email: data.email || null,
      criado_por: data.corretor_id,
    })
    .select("id")
    .single();
  if (cliErr || !cliente)
    return { error: cliErr?.message ?? "Falha ao cadastrar cliente" };

  // Cria reserva.
  const { error: resErr } = await admin.from("reservas").insert({
    unidade_id: data.unidade_id,
    cliente_id: cliente.id,
    corretor_id: data.corretor_id,
    valor_proposta_total: unidade.preco_total ?? 0,
    observacoes:
      (data.observacoes ? data.observacoes + "\n" : "") +
      "[Reserva via link público]",
    status: "ativa",
  });
  if (resErr) return { error: resErr.message };

  // Marca unidade como reservada.
  const { error: updErr } = await admin
    .from("unidades")
    .update({ status: "reservada" })
    .eq("id", data.unidade_id);
  if (updErr) return { error: updErr.message };

  return { success: true };
}
