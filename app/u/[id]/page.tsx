import { notFound } from "next/navigation";
import Image from "next/image";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { listarCorretoresPublicoAction } from "@/lib/actions/publico";
import { formatBRL, formatM2 } from "@/lib/formatacao";
import { branding } from "@/config/branding";
import { ReservarPublicoForm } from "./ReservarPublicoForm";

export const dynamic = "force-dynamic";

export default async function UnidadePublicaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data: unidade } = await admin
    .from("unidades")
    .select("*, empreendimento:empreendimentos(*)")
    .eq("id", id)
    .single();
  if (!unidade) notFound();

  const emp = unidade.empreendimento as {
    nome: string;
    cidade: string | null;
    estado: string | null;
    descricao: string | null;
    foto_capa_url: string | null;
    status: string;
  };
  const corretores = await listarCorretoresPublicoAction();
  const disponivel = unidade.status === "disponivel";

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-3xl p-4 sm:p-6 space-y-6">
        <header className="text-center space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {branding.companyName}
          </p>
          <h1 className="text-2xl font-semibold">{emp.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {emp.cidade}
            {emp.estado ? ` / ${emp.estado}` : ""} · Unidade{" "}
            <strong>{unidade.identificador}</strong>
          </p>
        </header>

        {(unidade.foto_url || emp.foto_capa_url) && (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
            <Image
              src={unidade.foto_url ?? emp.foto_capa_url!}
              alt={unidade.identificador}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        )}

        <section className="rounded-lg border bg-background p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-semibold">
              {formatBRL(unidade.preco_total)}
            </p>
            <span
              className={
                "text-xs px-2 py-1 rounded-full " +
                (disponivel
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800")
              }
            >
              {disponivel ? "Disponível" : "Indisponível"}
            </span>
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs">Área privativa</dt>
              <dd>{formatM2(unidade.area_privativa_m2)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Área total</dt>
              <dd>{formatM2(unidade.area_total_m2)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Quartos</dt>
              <dd>
                {unidade.qtd_quartos ?? "—"}
                {unidade.qtd_suites
                  ? ` (${unidade.qtd_suites} suítes)`
                  : ""}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Banheiros</dt>
              <dd>{unidade.qtd_banheiros ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Vagas</dt>
              <dd>{unidade.qtd_vagas ?? "—"}</dd>
            </div>
          </dl>
        </section>

        {emp.descricao && (
          <section className="rounded-lg border bg-background p-4">
            <h2 className="font-medium mb-2">Sobre o empreendimento</h2>
            <p className="text-sm whitespace-pre-line text-muted-foreground">
              {emp.descricao}
            </p>
          </section>
        )}

        <section className="rounded-lg border bg-background p-4 space-y-3">
          <h2 className="font-medium">Tenho interesse</h2>
          {disponivel ? (
            corretores.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum corretor disponível no momento.
              </p>
            ) : (
              <ReservarPublicoForm
                unidadeId={unidade.id}
                corretores={corretores}
              />
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              Este imóvel não está mais disponível. Entre em contato com a equipe
              para outras opções.
            </p>
          )}
        </section>

        <footer className="text-center text-xs text-muted-foreground py-4">
          {branding.companyName} · Painel de unidades
        </footer>
      </div>
    </main>
  );
}
