import { requireAdminProfile } from "@/lib/auth";
import { UnidadeForm } from "@/components/unidade/UnidadeForm";

export default async function NovaUnidadePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminProfile();
  const { id } = await params;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Nova unidade</h1>
      <UnidadeForm mode="create" empreendimentoId={id} />
    </div>
  );
}
