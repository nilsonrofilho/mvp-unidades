import { requireAdminProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UsuariosClient } from "./UsuariosClient";
import type { Profile } from "@/types/database";

export default async function UsuariosPage() {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("*").order("nome");
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Usuários</h1>
      <UsuariosClient usuarios={(data ?? []) as Profile[]} />
    </div>
  );
}
