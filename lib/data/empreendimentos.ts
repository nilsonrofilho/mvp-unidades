import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Empreendimento, UnidadeStatus } from "@/types/database";

export type EmpreendimentoComContadores = Empreendimento & {
  total_unidades: number;
  disponiveis: number;
  reservadas: number;
  vendidas: number;
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
    .select("empreendimento_id, status");
  const byEmp = new Map<
    string,
    { total: number; disp: number; res: number; vend: number }
  >();
  (units ?? []).forEach((u) => {
    const cur = byEmp.get(u.empreendimento_id as string) ?? {
      total: 0,
      disp: 0,
      res: 0,
      vend: 0,
    };
    cur.total += 1;
    if ((u.status as UnidadeStatus) === "disponivel") cur.disp += 1;
    if ((u.status as UnidadeStatus) === "reservada") cur.res += 1;
    if ((u.status as UnidadeStatus) === "vendida") cur.vend += 1;
    byEmp.set(u.empreendimento_id as string, cur);
  });
  return (emps as Empreendimento[]).map((e) => {
    const c = byEmp.get(e.id) ?? { total: 0, disp: 0, res: 0, vend: 0 };
    return {
      ...e,
      total_unidades: c.total,
      disponiveis: c.disp,
      reservadas: c.res,
      vendidas: c.vend,
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
