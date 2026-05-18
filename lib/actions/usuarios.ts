"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminProfile } from "@/lib/auth";

// --- Cadastrar corretor (sem login) -----------------------------------------
// Estratégia: cria auth.users com senha aleatória (não usada) — o trigger
// handle_new_user cria o profile correspondente — em seguida garantimos role
// 'corretor', telefone e ativo=true.
const corretorSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  telefone: z.string().min(8, "Telefone obrigatório"),
  email: z
    .union([z.string().email("E-mail inválido"), z.literal("")])
    .optional()
    .nullable(),
});

export type CorretorInput = z.infer<typeof corretorSchema>;

function randomPassword() {
  // 32 chars, mistura alfanumérica — não vai ser usada, só precisa passar na
  // política mínima do Supabase Auth (>=6 chars por padrão).
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 32; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out + "!1A"; // garante caractere especial/numero/maiúsc
}

function slug(nome: string) {
  const s = nome
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return s || "corretor";
}

function emailPlaceholder(nome: string) {
  // Supabase Auth rejeita domínios que não passam em uma validação básica.
  // Usamos um domínio reservado para exemplos (RFC 2606) que ele aceita.
  return `${slug(nome)}.${Date.now()}@example.com`;
}

function envOk(): { ok: true } | { ok: false; error: string } {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return {
      ok: false,
      error:
        "NEXT_PUBLIC_SUPABASE_URL não configurada nas variáveis de ambiente.",
    };
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY não configurada — é necessária para cadastrar corretor sem login. Configure em .env.local (dev) ou nas variáveis da Vercel (produção).",
    };
  }
  return { ok: true };
}

function traduzErroSupabase(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already exists")) {
    return "Já existe um usuário com esse e-mail.";
  }
  if (lower.includes("invalid email") || lower.includes("email_address_invalid")) {
    return "E-mail inválido. Tente outro endereço.";
  }
  if (lower.includes("password")) {
    return "Erro interno gerando senha. Tente de novo.";
  }
  if (lower.includes("service_role") || lower.includes("not authorized")) {
    return "A chave SUPABASE_SERVICE_ROLE_KEY não está configurada ou está incorreta.";
  }
  return msg;
}

export async function cadastrarCorretorAction(input: CorretorInput) {
  try {
    await requireAdminProfile();
  } catch {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const parsed = corretorSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  const env = envOk();
  if (!env.ok) return { error: env.error };

  const admin = createSupabaseAdminClient();
  const email =
    data.email && data.email.trim() ? data.email.trim() : emailPlaceholder(data.nome);

  try {
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password: randomPassword(),
      email_confirm: true, // pula confirmação — corretor não vai logar
      user_metadata: {
        nome: data.nome,
        role: "corretor",
        telefone: data.telefone,
      },
    });
    if (error || !created?.user) {
      return {
        error: traduzErroSupabase(error?.message ?? "Falha ao cadastrar corretor"),
      };
    }

    // Garante role/telefone (caso o trigger não tenha lido do metadata).
    const { error: updErr } = await admin
      .from("profiles")
      .update({
        role: "corretor",
        telefone: data.telefone,
        nome: data.nome,
        ativo: true,
      })
      .eq("id", created.user.id);

    if (updErr) {
      // Rollback: remove auth.user pra evitar usuário órfão.
      await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
      return {
        error:
          "Corretor criado parcialmente mas a atualização do perfil falhou: " +
          updErr.message,
      };
    }

    revalidatePath("/corretores");
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: traduzErroSupabase(msg) };
  }
}

// --- Convidar outro admin (com login por e-mail) ----------------------------
const adminInviteSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  telefone: z.string().optional().nullable(),
});
export type AdminInviteInput = z.infer<typeof adminInviteSchema>;

export async function convidarAdminAction(input: AdminInviteInput) {
  try {
    await requireAdminProfile();
  } catch {
    return { error: "Sessão expirada. Faça login novamente." };
  }
  const parsed = adminInviteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const env = envOk();
  if (!env.ok) return { error: env.error };

  const admin = createSupabaseAdminClient();
  try {
    const { data: result, error } = await admin.auth.admin.inviteUserByEmail(
      parsed.data.email,
      {
        data: {
          nome: parsed.data.nome,
          role: "admin",
          telefone: parsed.data.telefone,
        },
      },
    );
    if (error || !result?.user) {
      return {
        error: traduzErroSupabase(error?.message ?? "Falha ao convidar"),
      };
    }
    await admin
      .from("profiles")
      .update({
        role: "admin",
        telefone: parsed.data.telefone,
        nome: parsed.data.nome,
      })
      .eq("id", result.user.id);
    revalidatePath("/corretores");
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: traduzErroSupabase(msg) };
  }
}

// --- Atualizar perfil -------------------------------------------------------
export async function atualizarUsuarioAction(
  id: string,
  patch: {
    role?: "admin" | "corretor";
    ativo?: boolean;
    nome?: string;
    telefone?: string | null;
  },
) {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/corretores");
  return { success: true };
}

// --- Excluir corretor -------------------------------------------------------
export async function excluirCorretorAction(id: string) {
  await requireAdminProfile();
  const env = envOk();
  if (!env.ok) return { error: env.error };
  const admin = createSupabaseAdminClient();

  const [reservas, vendas, clientes] = await Promise.all([
    admin
      .from("reservas")
      .select("id", { count: "exact", head: true })
      .eq("corretor_id", id),
    admin
      .from("vendas")
      .select("id", { count: "exact", head: true })
      .eq("corretor_id", id),
    admin
      .from("clientes")
      .select("id", { count: "exact", head: true })
      .eq("criado_por", id),
  ]);
  const totalRefs =
    (reservas.count ?? 0) + (vendas.count ?? 0) + (clientes.count ?? 0);
  if (totalRefs > 0) {
    return {
      error:
        "Este corretor tem reservas, vendas ou clientes vinculados. Desative em vez de excluir.",
    };
  }
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { error: traduzErroSupabase(error.message) };
  revalidatePath("/corretores");
  return { success: true };
}

// --- Aliases retrocompat (não usado na UI nova, mas evita quebrar imports)
export const convidarUsuarioAction = convidarAdminAction;
