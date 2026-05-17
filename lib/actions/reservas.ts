"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  requireAuthenticatedProfile,
  requireAdminProfile,
} from "@/lib/auth";

const reservaSchema = z.object({
  unidade_id: z.string().uuid(),
  cliente_id: z.string().uuid(),
  valor_proposta_total: z.coerce.number().positive(),
  valor_entrada: z.coerce.number().nonnegative().optional().nullable(),
  forma_pagamento: z.enum(["a_vista", "financiado"]).optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

export type ReservaInput = z.infer<typeof reservaSchema>;

export async function criarReservaAction(input: ReservaInput) {
  const profile = await requireAuthenticatedProfile();
  const data = reservaSchema.parse(input);
  const supabase = await createSupabaseServerClient();

  const { data: u } = await supabase
    .from("unidades")
    .select("status, empreendimento_id")
    .eq("id", data.unidade_id)
    .single();
  if (!u || u.status !== "disponivel")
    return { error: "Unidade não está disponível" };

  const { error: insertError } = await supabase
    .from("reservas")
    .insert({ ...data, corretor_id: profile.id });
  if (insertError) return { error: insertError.message };

  const { error: updateError } = await supabase
    .from("unidades")
    .update({ status: "reservada" })
    .eq("id", data.unidade_id);
  if (updateError) return { error: updateError.message };

  revalidatePath(`/empreendimentos/${u.empreendimento_id}`);
  return { success: true };
}

export async function cancelarReservaAction(reservaId: string) {
  const profile = await requireAuthenticatedProfile();
  const supabase = await createSupabaseServerClient();
  const { data: r } = await supabase
    .from("reservas")
    .select("corretor_id, unidade_id, status")
    .eq("id", reservaId)
    .single();
  if (!r) return { error: "Reserva não encontrada" };
  if (r.status !== "ativa") return { error: "Reserva não está ativa" };
  if (profile.role !== "admin" && r.corretor_id !== profile.id)
    return { error: "Sem permissão" };

  await supabase
    .from("reservas")
    .update({ status: "cancelada" })
    .eq("id", reservaId);
  const { data: outras } = await supabase
    .from("reservas")
    .select("id")
    .eq("unidade_id", r.unidade_id)
    .eq("status", "ativa");
  if (!outras || outras.length === 0) {
    await supabase
      .from("unidades")
      .update({ status: "disponivel" })
      .eq("id", r.unidade_id);
  }
  const { data: u } = await supabase
    .from("unidades")
    .select("empreendimento_id")
    .eq("id", r.unidade_id)
    .single();
  if (u) revalidatePath(`/empreendimentos/${u.empreendimento_id}`);
  return { success: true };
}

export async function marcarComoVendidaAction(
  unidadeId: string,
  valorFinal: number,
) {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data: u } = await supabase
    .from("unidades")
    .select("status, empreendimento_id")
    .eq("id", unidadeId)
    .single();
  if (!u || u.status !== "reservada")
    return { error: "Unidade não está reservada" };

  const { data: r } = await supabase
    .from("reservas")
    .select("id, cliente_id, corretor_id")
    .eq("unidade_id", unidadeId)
    .eq("status", "ativa")
    .maybeSingle();
  if (!r) return { error: "Nenhuma reserva ativa para esta unidade" };

  await supabase.from("vendas").insert({
    unidade_id: unidadeId,
    cliente_id: r.cliente_id,
    corretor_id: r.corretor_id,
    reserva_origem_id: r.id,
    valor_final: valorFinal,
  });
  await supabase
    .from("reservas")
    .update({ status: "convertida_em_venda" })
    .eq("id", r.id);
  await supabase
    .from("unidades")
    .update({ status: "vendida" })
    .eq("id", unidadeId);
  revalidatePath(`/empreendimentos/${u.empreendimento_id}`);
  return { success: true };
}

export async function historicoReservasAction(unidadeId: string) {
  await requireAuthenticatedProfile();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("reservas")
    .select(
      "*, cliente:clientes(nome, telefone), corretor:profiles(nome)",
    )
    .eq("unidade_id", unidadeId)
    .order("criado_em", { ascending: false });
  return { reservas: data ?? [] };
}
