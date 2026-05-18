"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha mínima de 6 caracteres"),
});

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const supabase = await createSupabaseServerClient();
  const { data: signIn, error } = await supabase.auth.signInWithPassword(
    parsed.data,
  );
  if (error || !signIn.user) {
    return { error: "E-mail ou senha incorretos" };
  }
  // Só admin pode acessar o painel. Corretores são contatos do link público
  // e não logam no sistema.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, ativo")
    .eq("id", signIn.user.id)
    .single();
  if (!profile || profile.role !== "admin" || !profile.ativo) {
    await supabase.auth.signOut();
    return {
      error:
        "Acesso restrito aos administradores. Corretores não fazem login — usem o link do imóvel enviado pelo admin.",
    };
  }
  redirect("/");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  if (!z.string().email().safeParse(email).success) {
    return { error: "E-mail inválido" };
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email);
  return { success: true };
}
