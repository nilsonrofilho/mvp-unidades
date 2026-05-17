import { requireAuthenticatedProfile } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAuthenticatedProfile();
  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar profile={profile} />
      <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
    </div>
  );
}
