import { branding } from "@/config/branding";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center bg-muted p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-background p-8 shadow">
        <div className="flex flex-col items-center gap-2">
          <Image
            src={branding.logoPath}
            alt={branding.companyName}
            width={120}
            height={48}
            priority
          />
          <h1 className="text-lg font-semibold">{branding.companyName}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
