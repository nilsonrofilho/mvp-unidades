import type { Profile } from "@/types/database";

export function isAdmin(profile: Pick<Profile, "role"> | null | undefined): boolean {
  return profile?.role === "admin";
}

export function requireAdmin(profile: Pick<Profile, "role"> | null | undefined): void {
  if (!isAdmin(profile)) {
    throw new Error("Acesso negado: requer admin");
  }
}
