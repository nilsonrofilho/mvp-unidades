import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return (data ?? null) as Profile | null;
});

export async function requireAuthenticatedProfile(): Promise<Profile> {
  const p = await getCurrentProfile();
  if (!p) redirect("/login");
  // Apenas admins acessam o painel. Sessões antigas de corretor são derrubadas.
  if (p.role !== "admin" || !p.ativo) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/login");
  }
  return p;
}

// Mantido por compatibilidade; agora qualquer perfil autenticado já é admin.
export async function requireAdminProfile(): Promise<Profile> {
  return requireAuthenticatedProfile();
}
