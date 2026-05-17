import Link from "next/link";
import Image from "next/image";
import { branding } from "@/config/branding";
import { UserMenu } from "./UserMenu";
import type { Profile } from "@/types/database";

export function Navbar({ profile }: { profile: Profile }) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={branding.logoPath}
              alt={branding.companyName}
              width={28}
              height={28}
            />
            <span className="font-semibold">{branding.companyName}</span>
          </Link>
          <nav className="hidden gap-4 md:flex">
            <Link href="/" className="text-sm hover:underline">
              Empreendimentos
            </Link>
            {profile.role === "admin" && (
              <Link href="/usuarios" className="text-sm hover:underline">
                Usuários
              </Link>
            )}
          </nav>
        </div>
        <UserMenu nome={profile.nome} />
      </div>
    </header>
  );
}
