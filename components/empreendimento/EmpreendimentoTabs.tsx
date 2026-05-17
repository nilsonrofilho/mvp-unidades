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
  const mensagem = sel ? gerarMensagemUnidade(sel, emp, branding) : "";
  const link = gerarLinkWhatsapp(mensagem);
  const isAdmin = profile.role === "admin";

  return (
    <>
      <Tabs defaultValue="lista">
        <TabsList>
          <TabsTrigger value="mapa">Mapa</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
        </TabsList>
        <TabsContent value="mapa">
          <p className="text-muted-foreground p-4 text-sm">
            Mapa em construção (Phase 7).
          </p>
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
