import { requireAdminProfile } from "@/lib/auth";
import { EmpreendimentoForm } from "@/components/empreendimento/EmpreendimentoForm";

export default async function NovoEmpreendimentoPage() {
  await requireAdminProfile();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Novo empreendimento</h1>
      <EmpreendimentoForm mode="create" />
    </div>
  );
}
