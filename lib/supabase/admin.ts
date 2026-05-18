import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL não configurada. Defina em .env.local (dev) ou nas variáveis de ambiente da Vercel.",
    );
  }
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada. Pegue em Supabase Dashboard → Project Settings → API → service_role (secret) e defina em .env.local (dev) ou nas variáveis de ambiente da Vercel. Após adicionar, reinicie o dev server.",
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
