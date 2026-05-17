"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminProfile } from "@/lib/auth";

const inviteSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["admin", "corretor"]),
});

export type InviteInput = z.infer<typeof inviteSchema>;

export async function convidarUsuarioAction(input: InviteInput) {
  await requireAdminProfile();
  const data = inviteSchema.parse(input);
  const admin = createSupabaseAdminClient();
  const { data: result, error } = await admin.auth.admin.inviteUserByEmail(
    data.email,
    { data: { nome: data.nome, role: data.role } },
  );
  if (error || !result?.user)
    return { error: error?.message ?? "Falha ao convidar" };
  revalidatePath("/usuarios");
  return { success: true };
}

export async function atualizarUsuarioAction(
  id: string,
  patch: { role?: "admin" | "corretor"; ativo?: boolean; nome?: string },
) {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/usuarios");
  return { success: true };
}
