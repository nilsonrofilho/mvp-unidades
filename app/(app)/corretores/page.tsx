import { requireAdminProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CorretoresClient } from "./CorretoresClient";
import type { Profile } from "@/types/database";

export default async function CorretoresPage() {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("*").order("nome");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Corretores</h1>
        <p className="text-sm text-muted-foreground">
          Corretores são exibidos no link público do imóvel para o cliente
          escolher. Não fazem login no painel.
        </p>
      </div>
      <CorretoresClient lista={(data ?? []) as Profile[]} />
    </div>
  );
}
