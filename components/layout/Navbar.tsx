import Link from "next/link";
import { branding } from "@/config/branding";
import { UserMenu } from "./UserMenu";
import type { Profile } from "@/types/database";

export function Navbar({ profile }: { profile: Profile }) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold">{branding.companyName}</span>
          </Link>
          <nav className="hidden gap-4 md:flex">
            <Link href="/" className="text-sm hover:underline">
              Empreendimentos
            </Link>
            <Link href="/corretores" className="text-sm hover:underline">
              Corretores
            </Link>
          </nav>
        </div>
        <UserMenu nome={profile.nome} />
      </div>
    </header>
  );
}
