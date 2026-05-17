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
  return p;
}

export async function requireAdminProfile(): Promise<Profile> {
  const p = await requireAuthenticatedProfile();
  if (p.role !== "admin") redirect("/");
  return p;
}
