"use client";
import { useState } from "react";
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
import { MapaHorizontal } from "@/components/mapa/MapaHorizontal";
import { MapaFiltros, type FiltroMapa } from "@/components/mapa/MapaFiltros";
import { LegendaMapa } from "@/components/mapa/Legenda";
import {
  gerarMensagemUnidade,
  gerarLinkWhatsapp,
} from "@/lib/mensagem-whatsapp";
import { branding } from "@/config/branding";

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
  const [filtro, setFiltro] = useState<FiltroMapa>({ status: [] });
  const quartosDistintos = Array.from(
    new Set(unidades.map((u) => u.qtd_quartos).filter((n) => n != null)),
  ) as number[];
  const mensagem = sel ? gerarMensagemUnidade(sel, emp, branding) : "";
  const link = gerarLinkWhatsapp(mensagem);
  const isAdmin = profile.role === "admin";

  const verticalReady =
    emp.tipo === "vertical" && emp.qtd_andares && emp.qtd_unidades_por_andar;
  const horizontalReady = emp.tipo === "horizontal" && emp.planta_implantacao_url;
  const defaultTab = verticalReady || horizontalReady ? "mapa" : "lista";

  return (
    <>
      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="mapa">Mapa</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
        </TabsList>
        <TabsContent value="mapa" className="space-y-3">
          <LegendaMapa />
          <MapaFiltros
            value={filtro}
            onChange={setFiltro}
            quartosDistintos={quartosDistintos}
          />
          {verticalReady && (
            <MapaVertical
              unidades={unidades}
              qtdAndares={emp.qtd_andares!}
              qtdUnidadesPorAndar={emp.qtd_unidades_por_andar!}
              filtro={filtro}
              onSelect={setSel}
            />
          )}
          {horizontalReady && (
            <MapaHorizontal
              plantaUrl={emp.planta_implantacao_url!}
              unidades={unidades}
              filtro={filtro}
              onSelect={setSel}
            />
          )}
          {!verticalReady && !horizontalReady && (
            <p className="text-muted-foreground p-4 text-sm">
              Mapa indisponível.{" "}
              {emp.tipo === "horizontal"
                ? "Suba a planta de implantação para visualizar."
                : "Defina andares e unidades por andar."}
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
      />
    </>
  );
}
