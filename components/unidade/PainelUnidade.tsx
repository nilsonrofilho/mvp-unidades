"use client";
import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Unidade, Profile } from "@/types/database";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { formatBRL, formatM2 } from "@/lib/formatacao";
import { Copy, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { excluirUnidadeAction } from "@/lib/actions/unidades";
import { useRouter } from "next/navigation";

export function PainelUnidade({
  unidade,
  empreendimentoNome,
  profile,
  open,
  onOpenChange,
  mensagemWhatsapp,
  linkWhatsapp,
  onReservar,
  onMarcarVendida,
  onCancelarReserva,
}: {
  unidade: Unidade | null;
  empreendimentoNome: string;
  profile: Profile;
  open: boolean;
  onOpenChange: (b: boolean) => void;
  mensagemWhatsapp: string;
  linkWhatsapp: string;
  onReservar?: (u: Unidade) => void;
  onMarcarVendida?: (u: Unidade) => void;
  onCancelarReserva?: (u: Unidade) => void;
}) {
  const [, startTransition] = useTransition();
  const router = useRouter();
  if (!unidade) return null;
  const isAdmin = profile.role === "admin";

  function copiar() {
    navigator.clipboard.writeText(mensagemWhatsapp);
    toast.success("Mensagem copiada!");
  }
  function abrirWa() {
    window.open(linkWhatsapp, "_blank");
  }
  function excluir() {
    if (!confirm("Excluir unidade?")) return;
    startTransition(async () => {
      const res = await excluirUnidadeAction(unidade!.id);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Unidade excluída");
        router.refresh();
      }
    });
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="ml-auto w-full sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>
            {empreendimentoNome} — {unidade.identificador}
          </DrawerTitle>
          <StatusBadge status={unidade.status} />
        </DrawerHeader>
        <div className="px-4 pb-4 space-y-3 overflow-y-auto">
          {unidade.foto_url && (
            <div className="relative aspect-video rounded overflow-hidden bg-muted">
              <Image
                src={unidade.foto_url}
                alt={unidade.identificador}
                fill
                className="object-cover"
              />
            </div>
          )}
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Área privativa</dt>
            <dd>{formatM2(unidade.area_privativa_m2)}</dd>
            <dt className="text-muted-foreground">Área total</dt>
            <dd>{formatM2(unidade.area_total_m2)}</dd>
            <dt className="text-muted-foreground">Quartos</dt>
            <dd>
              {unidade.qtd_quartos ?? "—"}
              {unidade.qtd_suites ? ` (${unidade.qtd_suites} suítes)` : ""}
            </dd>
            <dt className="text-muted-foreground">Banheiros</dt>
            <dd>{unidade.qtd_banheiros ?? "—"}</dd>
            <dt className="text-muted-foreground">Vagas</dt>
            <dd>{unidade.qtd_vagas ?? "—"}</dd>
            <dt className="text-muted-foreground">Preço total</dt>
            <dd className="font-semibold">{formatBRL(unidade.preco_total)}</dd>
            {isAdmin && (
              <>
                <dt className="text-muted-foreground">Condomínio</dt>
                <dd>{formatBRL(unidade.valor_condominio)}</dd>
              </>
            )}
          </dl>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="outline" onClick={copiar}>
              <Copy className="mr-1 size-4" /> Copiar
            </Button>
            <Button variant="outline" onClick={abrirWa}>
              <MessageCircle className="mr-1 size-4" /> WhatsApp
            </Button>
          </div>

          {unidade.status === "disponivel" && onReservar && (
            <Button className="w-full" onClick={() => onReservar(unidade)}>
              Reservar
            </Button>
          )}
          {unidade.status === "reservada" && onCancelarReserva && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onCancelarReserva(unidade)}
            >
              Cancelar reserva
            </Button>
          )}
          {unidade.status === "reservada" && isAdmin && onMarcarVendida && (
            <Button className="w-full" onClick={() => onMarcarVendida(unidade)}>
              Marcar como vendida
            </Button>
          )}
          {isAdmin && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                href={`/empreendimentos/${unidade.empreendimento_id}/unidades/${unidade.id}/editar`}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                <Pencil className="mr-1 size-4" /> Editar
              </Link>
              <Button variant="ghost" size="sm" onClick={excluir}>
                <Trash2 className="mr-1 size-4 text-destructive" /> Excluir
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
