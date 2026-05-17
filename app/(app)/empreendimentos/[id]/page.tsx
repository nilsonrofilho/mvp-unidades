import { requireAuthenticatedProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { HeaderEmpreendimento } from "./HeaderEmpreendimento";
import { ArquivosTab } from "@/components/empreendimento/ArquivosTab";
import { listarArquivos } from "@/lib/data/arquivos";
import type { Empreendimento, Unidade } from "@/types/database";

export default async function EmpreendimentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireAuthenticatedProfile();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: emp } = await supabase
    .from("empreendimentos")
    .select("*")
    .eq("id", id)
    .single();
  if (!emp) notFound();
  const { data: unidades } = await supabase
    .from("unidades")
    .select("*")
    .eq("empreendimento_id", id);
  const arquivos = await listarArquivos(id);
  const list = (unidades ?? []) as Unidade[];
  const contadores = {
    disponiveis: list.filter((u) => u.status === "disponivel").length,
    reservadas: list.filter((u) => u.status === "reservada").length,
    vendidas: list.filter((u) => u.status === "vendida").length,
  };
  const isAdmin = profile.role === "admin";

  return (
    <div className="space-y-6">
      <HeaderEmpreendimento
        emp={emp as Empreendimento}
        isAdmin={isAdmin}
        contadores={contadores}
      />
      <Tabs defaultValue="mapa">
        <TabsList>
          <TabsTrigger value="mapa">Mapa</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
        </TabsList>
        <TabsContent value="mapa">
          <p className="text-muted-foreground p-4">Mapa em construção.</p>
        </TabsContent>
        <TabsContent value="lista">
          <p className="text-muted-foreground p-4">Lista em construção.</p>
        </TabsContent>
        <TabsContent value="arquivos">
          <ArquivosTab
            empreendimentoId={id}
            arquivos={arquivos}
            isAdmin={isAdmin}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
