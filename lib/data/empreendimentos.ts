import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Empreendimento, UnidadeStatus } from "@/types/database";

export type EmpreendimentoComContadores = Empreendimento & {
  total_unidades: number;
  disponiveis: number;
  reservadas: number;
  vendidas: number;
  preco_min_disponivel: number | null;
};

export type ResumoDashboard = {
  totalEmpreendimentos: number;
  totalUnidades: number;
  disponiveis: number;
  reservadas: number;
  vendidas: number;
};

export async function listarEmpreendimentos(): Promise<
  EmpreendimentoComContadores[]
> {
  const supabase = await createSupabaseServerClient();
  const { data: emps, error } = await supabase
    .from("empreendimentos")
    .select("*")
    .order("criado_em", { ascending: false });
  if (error || !emps) return [];
  const { data: units } = await supabase
    .from("unidades")
    .select("empreendimento_id, status, preco_total");
  const byEmp = new Map<
    string,
    {
      total: number;
      disp: number;
      res: number;
      vend: number;
      preco_min: number | null;
    }
  >();
  (units ?? []).forEach((u) => {
    const cur = byEmp.get(u.empreendimento_id as string) ?? {
      total: 0,
      disp: 0,
      res: 0,
      vend: 0,
      preco_min: null,
    };
    cur.total += 1;
    const status = u.status as UnidadeStatus;
    if (status === "disponivel") {
      cur.disp += 1;
      const preco = u.preco_total as number | null;
      if (preco != null && (cur.preco_min == null || preco < cur.preco_min)) {
        cur.preco_min = preco;
      }
    }
    if (status === "reservada") cur.res += 1;
    if (status === "vendida") cur.vend += 1;
    byEmp.set(u.empreendimento_id as string, cur);
  });
  return (emps as Empreendimento[]).map((e) => {
    const c = byEmp.get(e.id) ?? {
      total: 0,
      disp: 0,
      res: 0,
      vend: 0,
      preco_min: null,
    };
    return {
      ...e,
      total_unidades: c.total,
      disponiveis: c.disp,
      reservadas: c.res,
      vendidas: c.vend,
      preco_min_disponivel: c.preco_min,
    };
  });
}

export async function resumoDashboard(): Promise<ResumoDashboard> {
  const emps = await listarEmpreendimentos();
  return emps.reduce(
    (acc, e) => ({
      totalEmpreendimentos: acc.totalEmpreendimentos + 1,
      totalUnidades: acc.totalUnidades + e.total_unidades,
      disponiveis: acc.disponiveis + e.disponiveis,
      reservadas: acc.reservadas + e.reservadas,
      vendidas: acc.vendidas + e.vendidas,
    }),
    {
      totalEmpreendimentos: 0,
      totalUnidades: 0,
      disponiveis: 0,
      reservadas: 0,
      vendidas: 0,
    },
  );
}
