"use client";
import { useState, useTransition } from "react";
import type {
  Empreendimento,
  Unidade,
  Profile,
  ArquivoEmpreendimento,
} from "@/types/database";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ListaUnidades } from "@/components/unidade/ListaUnidades";
import { PainelUnidade } from "@/components/unidade/PainelUnidade";
import { ArquivosTab } from "@/components/empreendimento/ArquivosTab";
import { MapaVertical } from "@/components/mapa/MapaVertical";
import { MapaEsquematico } from "@/components/mapa/MapaEsquematico";
import { MapaHorizontal } from "@/components/mapa/MapaHorizontal";
import { MapaFiltros, type FiltroMapa } from "@/components/mapa/MapaFiltros";
import { ModalReserva } from "@/components/reserva/ModalReserva";
import { ModalVenda } from "@/components/reserva/ModalVenda";
import {
  gerarMensagemUnidade,
  gerarLinkWhatsapp,
} from "@/lib/mensagem-whatsapp";
import { cancelarReservaAction } from "@/lib/actions/reservas";
import { branding } from "@/config/branding";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function EmpreendimentoTabs({
  emp,
  unidades,
  arquivos,
  profile,
}: {
  emp: Empreendimento;
  unidades: Unidade[];
  arquivos: ArquivoEmpreendimento[];
  profile: Profile;
}) {
  const [sel, setSel] = useState<Unidade | null>(null);
  const [reservar, setReservar] = useState<Unidade | null>(null);
  const [vender, setVender] = useState<Unidade | null>(null);
  const [filtro, setFiltro] = useState<FiltroMapa>({ status: ["disponivel"] });
  const [, startTransition] = useTransition();
  const router = useRouter();
  const quartosDistintos = Array.from(
    new Set(unidades.map((u) => u.qtd_quartos).filter((n) => n != null)),
  ) as number[];
  const mensagem = sel ? gerarMensagemUnidade(sel, emp, branding) : "";
  const link = gerarLinkWhatsapp(mensagem);
  const isAdmin = profile.role === "admin";

  const verticalReady =
    emp.tipo === "vertical" && emp.qtd_andares && emp.qtd_unidades_por_andar;
  // O mapa esquemático horizontal funciona sem planta — basta haver unidades.
  const horizontalReady = emp.tipo === "horizontal" && unidades.length > 0;
  const defaultTab = verticalReady || horizontalReady ? "mapa" : "lista";

  async function cancelarAtivaDaUnidade(u: Unidade) {
    const { historicoReservasAction } = await import(
      "@/lib/actions/reservas"
    );
    const r = await historicoReservasAction(u.id);
    const ativa = (r.reservas as Array<{ id: string; status: string }>).find(
      (x) => x.status === "ativa",
    );
    if (!ativa) {
      toast.error("Sem reserva ativa para cancelar");
      return;
    }
    if (!confirm("Cancelar a reserva atual?")) return;
    startTransition(async () => {
      const res = await cancelarReservaAction(ativa.id);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Reserva cancelada");
        setSel(null);
        router.refresh();
      }
    });
  }

  function toggleStatusCard(s: "disponivel" | "reservada" | "vendida") {
    setFiltro((f) => {
      const apenasEsse = f.status.length === 1 && f.status[0] === s;
      return { ...f, status: apenasEsse ? [] : [s] };
    });
  }

  const contadores = {
    disponiveis: unidades.filter((u) => u.status === "disponivel").length,
    reservadas: unidades.filter((u) => u.status === "reservada").length,
    vendidas: unidades.filter((u) => u.status === "vendida").length,
  };
  const totalContadores =
    contadores.disponiveis + contadores.reservadas + contadores.vendidas;
  const statusUnico = filtro.status.length === 1 ? filtro.status[0] : null;

  return (
    <>
      {/* Status strip — única fonte de filtro por status (clicável) */}
      <div className="grid grid-cols-3 gap-2">
        <ResumoCard
          label="Disponíveis"
          valor={contadores.disponiveis}
          total={totalContadores}
          cor="bg-emerald-500"
          texto="text-emerald-700"
          ativo={statusUnico === "disponivel"}
          onClick={() => toggleStatusCard("disponivel")}
        />
        <ResumoCard
          label="Reservadas"
          valor={contadores.reservadas}
          total={totalContadores}
          cor="bg-amber-500"
          texto="text-amber-700"
          ativo={statusUnico === "reservada"}
          onClick={() => toggleStatusCard("reservada")}
        />
        <ResumoCard
          label="Vendidas"
          valor={contadores.vendidas}
          total={totalContadores}
          cor="bg-rose-500"
          texto="text-rose-700"
          ativo={statusUnico === "vendida"}
          onClick={() => toggleStatusCard("vendida")}
        />
      </div>

      <Tabs defaultValue={defaultTab}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <TabsList>
            <TabsTrigger value="mapa">Mapa</TabsTrigger>
            <TabsTrigger value="lista">
              Lista{" "}
              <span className="text-xs text-muted-foreground ml-1">
                ({unidades.length})
              </span>
            </TabsTrigger>
            <TabsTrigger value="arquivos">
              Arquivos
              {arquivos.length > 0 && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({arquivos.length})
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <MapaFiltros
            value={filtro}
            onChange={setFiltro}
            quartosDistintos={quartosDistintos}
          />
        </div>
        <TabsContent value="mapa" className="space-y-4 mt-4">
          {verticalReady && (
            <MapaVertical
              unidades={unidades}
              qtdAndares={emp.qtd_andares!}
              qtdUnidadesPorAndar={emp.qtd_unidades_por_andar!}
              filtro={filtro}
              onSelect={setSel}
            />
          )}
          {horizontalReady && emp.planta_implantacao_url && (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 items-start">
              <div className="min-w-0">
                <MapaEsquematico
                  unidades={unidades}
                  filtro={filtro}
                  onSelect={setSel}
                />
              </div>
              <aside className="min-w-0 lg:sticky lg:top-4 space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground px-1">
                  Planta de referência
                </p>
                <MapaHorizontal
                  plantaUrl={emp.planta_implantacao_url}
                  unidades={unidades}
                  filtro={filtro}
                  onSelect={setSel}
                  isAdmin={isAdmin}
                  empreendimentoId={emp.id}
                  showLista={false}
                />
              </aside>
            </div>
          )}
          {horizontalReady && !emp.planta_implantacao_url && (
            <MapaEsquematico
              unidades={unidades}
              filtro={filtro}
              onSelect={setSel}
            />
          )}
          {emp.tipo === "horizontal" && unidades.length === 0 && (
            <p className="text-muted-foreground p-4 text-sm">
              Cadastre unidades para o mapa aparecer.
            </p>
          )}
          {emp.tipo === "vertical" &&
            !(emp.qtd_andares && emp.qtd_unidades_por_andar) && (
              <p className="text-muted-foreground p-4 text-sm">
                Mapa indisponível. Defina andares e unidades por andar em
                Editar.
              </p>
            )}
        </TabsContent>
        <TabsContent value="lista">
          <ListaUnidades unidades={unidades} onSelect={setSel} />
        </TabsContent>
        <TabsContent value="arquivos">
          <ArquivosTab
            empreendimentoId={emp.id}
            arquivos={arquivos}
            isAdmin={isAdmin}
          />
        </TabsContent>
      </Tabs>

      <PainelUnidade
        unidade={sel}
        empreendimentoNome={emp.nome}
        profile={profile}
        open={!!sel}
        onOpenChange={(b) => !b && setSel(null)}
        mensagemWhatsapp={mensagem}
        linkWhatsapp={link}
        onReservar={(u) => {
          setReservar(u);
          setSel(null);
        }}
        onMarcarVendida={(u) => {
          setVender(u);
          setSel(null);
        }}
        onCancelarReserva={cancelarAtivaDaUnidade}
      />
      {reservar && (
        <ModalReserva
          open={!!reservar}
          onOpenChange={(b) => !b && setReservar(null)}
          unidadeId={reservar.id}
          unidadeNome={`${emp.nome} — ${reservar.identificador}`}
        />
      )}
      {vender && (
        <ModalVenda
          open={!!vender}
          onOpenChange={(b) => !b && setVender(null)}
          unidadeId={vender.id}
          sugerido={vender.preco_total}
        />
      )}
    </>
  );
}

function ResumoCard({
  label,
  valor,
  total,
  cor,
  texto,
  ativo,
  onClick,
}: {
  label: string;
  valor: number;
  total: number;
  cor: string;
  texto: string;
  ativo: boolean;
  onClick: () => void;
}) {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border bg-background px-3 py-2.5 text-left transition-colors " +
        (ativo
          ? "border-foreground/40 bg-muted/40"
          : "hover:border-foreground/20")
      }
      aria-pressed={ativo}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80">
          <span className={`inline-block size-2 rounded-full ${cor}`} />
          {label}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          /{total}
        </span>
      </div>
      <div className="mt-1.5 flex items-end justify-between gap-2">
        <span className={`text-2xl font-semibold leading-none ${texto}`}>
          {valor}
        </span>
        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden ml-2 mb-0.5">
          <div
            className={`h-full ${cor} transition-all`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </button>
  );
}
