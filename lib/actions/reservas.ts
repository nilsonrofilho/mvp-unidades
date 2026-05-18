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

// Lista os corretores que têm atuação (reservas ativas + vendas) num empreendimento.
export type CorretorDoEmpreendimento = {
  id: string;
  nome: string;
  telefone: string | null;
  ativo: boolean;
  reservas_ativas: number;
  vendas: number;
};

export async function listarCorretoresDoEmpreendimentoAction(
  empreendimentoId: string,
): Promise<CorretorDoEmpreendimento[]> {
  await requireAuthenticatedProfile();
  const supabase = await createSupabaseServerClient();

  // Reservas ativas (corretor + unidade.empreendimento_id)
  const { data: reservas } = await supabase
    .from("reservas")
    .select("corretor_id, unidade:unidades!inner(empreendimento_id)")
    .eq("status", "ativa")
    .eq("unidade.empreendimento_id", empreendimentoId);

  // Vendas
  const { data: vendas } = await supabase
    .from("vendas")
    .select("corretor_id, unidade:unidades!inner(empreendimento_id)")
    .eq("unidade.empreendimento_id", empreendimentoId);

  const tally = new Map<string, { reservas: number; vendas: number }>();
  (reservas ?? []).forEach((r) => {
    const id = r.corretor_id as string;
    const cur = tally.get(id) ?? { reservas: 0, vendas: 0 };
    cur.reservas += 1;
    tally.set(id, cur);
  });
  (vendas ?? []).forEach((v) => {
    const id = v.corretor_id as string;
    const cur = tally.get(id) ?? { reservas: 0, vendas: 0 };
    cur.vendas += 1;
    tally.set(id, cur);
  });

  if (tally.size === 0) return [];
  const ids = Array.from(tally.keys());
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, nome, telefone, ativo")
    .in("id", ids);

  return (profiles ?? [])
    .map((p) => {
      const t = tally.get(p.id as string) ?? { reservas: 0, vendas: 0 };
      return {
        id: p.id as string,
        nome: p.nome as string,
        telefone: (p.telefone as string | null) ?? null,
        ativo: p.ativo as boolean,
        reservas_ativas: t.reservas,
        vendas: t.vendas,
      };
    })
    .sort(
      (a, b) =>
        b.vendas + b.reservas_ativas - (a.vendas + a.reservas_ativas) ||
        a.nome.localeCompare(b.nome),
    );
}

// Retorna o corretor e o cliente atualmente atribuídos à unidade:
// - se 'vendida': pega a venda mais recente
// - se 'reservada': pega a reserva ativa
// - caso contrário: null
export type AtribuicaoUnidade = {
  origem: "venda" | "reserva";
  cliente: { nome: string; telefone: string };
  corretor: { nome: string; telefone: string | null };
} | null;

export async function obterAtribuicaoUnidadeAction(
  unidadeId: string,
): Promise<AtribuicaoUnidade> {
  await requireAuthenticatedProfile();
  const supabase = await createSupabaseServerClient();

  const { data: u } = await supabase
    .from("unidades")
    .select("status")
    .eq("id", unidadeId)
    .single();
  if (!u) return null;

  if (u.status === "vendida") {
    const { data: v } = await supabase
      .from("vendas")
      .select(
        "cliente:clientes(nome, telefone), corretor:profiles(nome, telefone)",
      )
      .eq("unidade_id", unidadeId)
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!v?.cliente || !v?.corretor) return null;
    const cliente = v.cliente as unknown as { nome: string; telefone: string };
    const corretor = v.corretor as unknown as {
      nome: string;
      telefone: string | null;
    };
    return { origem: "venda", cliente, corretor };
  }

  if (u.status === "reservada") {
    const { data: r } = await supabase
      .from("reservas")
      .select(
        "cliente:clientes(nome, telefone), corretor:profiles(nome, telefone)",
      )
      .eq("unidade_id", unidadeId)
      .eq("status", "ativa")
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!r?.cliente || !r?.corretor) return null;
    const cliente = r.cliente as unknown as { nome: string; telefone: string };
    const corretor = r.corretor as unknown as {
      nome: string;
      telefone: string | null;
    };
    return { origem: "reserva", cliente, corretor };
  }

  return null;
}
