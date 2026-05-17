"use server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/auth";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const DOC_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const IMAGE_MAX = 10 * 1024 * 1024;
const DOC_MAX = 50 * 1024 * 1024;

export type UploadKind = "image" | "document";

export async function uploadFileAction(
  bucket: "empreendimentos" | "unidades" | "arquivos",
  kind: UploadKind,
  file: File,
  pathPrefix: string,
): Promise<{ url?: string; path?: string; error?: string }> {
  await requireAdminProfile();

  const allowed = kind === "image" ? IMAGE_TYPES : DOC_TYPES;
  const max = kind === "image" ? IMAGE_MAX : DOC_MAX;

  if (!allowed.includes(file.type))
    return { error: "Tipo de arquivo não permitido" };
  if (file.size > max) return { error: "Arquivo muito grande" };

  const supabase = await createSupabaseServerClient();
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { error: "Falha no upload: " + error.message };

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function deleteFileAction(
  bucket: "empreendimentos" | "unidades" | "arquivos",
  path: string,
): Promise<{ error?: string }> {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) return { error: error.message };
  return {};
}
