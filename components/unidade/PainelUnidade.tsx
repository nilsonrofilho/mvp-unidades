"use client";
import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import type { Unidade, Profile } from "@/types/database";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "./StatusBadge";
import { formatBRL, formatM2 } from "@/lib/formatacao";
import {
  Copy,
  MessageCircle,
  Pencil,
  Trash2,
  Phone,
  Link2,
  MoreVertical,
  Share2,
  XCircle,
  CheckCircle2,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { excluirUnidadeAction } from "@/lib/actions/unidades";
import {
  obterAtribuicaoUnidadeAction,
  type AtribuicaoUnidade,
} from "@/lib/actions/reservas";
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
  const [atribuicao, setAtribuicao] = useState<AtribuicaoUnidade>(null);
  const unidadeId = unidade?.id;
  const unidadeStatus = unidade?.status;

  useEffect(() => {
    if (!unidadeId || unidadeStatus === "disponivel") return;
    let cancel = false;
    obterAtribuicaoUnidadeAction(unidadeId).then((r) => {
      if (!cancel) setAtribuicao(r);
    });
    return () => {
      cancel = true;
      setAtribuicao(null);
    };
  }, [unidadeId, unidadeStatus]);

  if (!unidade) return null;
  const isAdmin = profile.role === "admin";

  function copiar() {
    navigator.clipboard.writeText(mensagemWhatsapp);
    toast.success("Mensagem copiada");
  }
  function copiarLinkPublico() {
    const url = `${window.location.origin}/u/${unidade!.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link público copiado");
  }
  function abrirWa() {
    window.open(linkWhatsapp, "_blank");
  }
  function excluir() {
    if (!confirm("Excluir unidade? Esta ação é permanente.")) return;
    startTransition(async () => {
      const res = await excluirUnidadeAction(unidade!.id);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Unidade excluída");
        router.refresh();
      }
    });
  }
  function navegarEdicao() {
    router.push(
      `/empreendimentos/${unidade!.empreendimento_id}/unidades/${unidade!.id}/editar`,
    );
  }

  const podeReservar = unidade.status === "disponivel" && !!onReservar;
  const podeMarcarVendida =
    unidade.status === "reservada" && isAdmin && !!onMarcarVendida;
  const podeCancelarReserva =
    unidade.status === "reservada" && isAdmin && !!onCancelarReserva;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="ml-auto w-full sm:max-w-md">
        <DrawerHeader className="border-b">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {empreendimentoNome}
              </p>
              <DrawerTitle className="truncate text-xl">
                {unidade.identificador}
              </DrawerTitle>
              <div className="mt-2">
                <StatusBadge status={unidade.status} />
              </div>
            </div>
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="sm" aria-label="Mais ações">
                      <MoreVertical className="size-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  {podeCancelarReserva && (
                    <DropdownMenuItem
                      onClick={() => onCancelarReserva!(unidade)}
                    >
                      <XCircle /> Cancelar reserva
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem variant="destructive" onClick={excluir}>
                    <Trash2 /> Excluir unidade
                  </DropdownMenuItem>
                  {podeCancelarReserva && <DropdownMenuSeparator />}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto">
          {/* 3 botões de ação primária — sempre visíveis no topo */}
          {isAdmin && (
            <div className="grid grid-cols-3 gap-2 p-4 border-b bg-muted/20">
              <AcaoPrimaria
                icon={<Tag className="size-5" />}
                label="Reservar"
                disabled={!podeReservar}
                onClick={() => podeReservar && onReservar!(unidade)}
                variant="primary"
              />
              <AcaoPrimaria
                icon={<CheckCircle2 className="size-5" />}
                label="Vender"
                disabled={!podeMarcarVendida}
                onClick={() =>
                  podeMarcarVendida && onMarcarVendida!(unidade)
                }
                variant="success"
              />
              <AcaoPrimaria
                icon={<Pencil className="size-5" />}
                label="Editar"
                onClick={navegarEdicao}
                variant="neutral"
              />
            </div>
          )}

          {/* Para corretor (sem botões admin) — mostra só Reservar como CTA principal */}
          {!isAdmin && podeReservar && (
            <div className="p-4 border-b">
              <Button
                size="lg"
                className="w-full"
                onClick={() => onReservar!(unidade)}
              >
                <Tag className="mr-2 size-4" /> Reservar esta unidade
              </Button>
            </div>
          )}

          <div className="px-4 py-4 space-y-4">
            {unidade.foto_url && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <Image
                  src={unidade.foto_url}
                  alt={unidade.identificador}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Preço grande */}
            <div className="rounded-lg bg-accent/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Preço total
              </p>
              <p className="text-3xl font-semibold leading-tight">
                {formatBRL(unidade.preco_total)}
              </p>
              {isAdmin && unidade.valor_condominio != null && (
                <p className="text-xs text-muted-foreground mt-1">
                  Condomínio: {formatBRL(unidade.valor_condominio)}
                </p>
              )}
            </div>

            {/* Specs */}
            <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs">Área privativa</dt>
                <dd className="font-medium">{formatM2(unidade.area_privativa_m2)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Área total</dt>
                <dd className="font-medium">{formatM2(unidade.area_total_m2)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Quartos</dt>
                <dd className="font-medium">
                  {unidade.qtd_quartos ?? "—"}
                  {unidade.qtd_suites
                    ? ` (${unidade.qtd_suites} suítes)`
                    : ""}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Banheiros</dt>
                <dd className="font-medium">{unidade.qtd_banheiros ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Vagas</dt>
                <dd className="font-medium">{unidade.qtd_vagas ?? "—"}</dd>
              </div>
            </dl>

            {atribuicao && (
              <div
                className={
                  "rounded-lg border p-3 text-sm space-y-2.5 " +
                  (atribuicao.origem === "venda"
                    ? "border-rose-200 bg-rose-50/40"
                    : "border-amber-200 bg-amber-50/40")
                }
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground">
                    {atribuicao.origem === "venda"
                      ? "Vendida"
                      : "Reservada"}
                  </p>
                  {atribuicao.origem === "venda" && (
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {formatarData(atribuicao.data_venda)}
                    </span>
                  )}
                </div>

                {/* Valor em destaque */}
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    {atribuicao.origem === "venda"
                      ? "Valor final"
                      : "Valor proposto"}
                  </p>
                  <p className="text-xl font-semibold leading-none">
                    {formatBRL(
                      atribuicao.origem === "venda"
                        ? atribuicao.valor_final
                        : atribuicao.valor_proposta_total,
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {labelFormaPagamento(atribuicao.forma_pagamento)}
                    {atribuicao.valor_entrada
                      ? ` · entrada ${formatBRL(atribuicao.valor_entrada)}`
                      : ""}
                  </p>
                </div>

                {/* Corretor + cliente */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-foreground/5">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Corretor</p>
                    <p className="font-medium leading-tight">
                      {atribuicao.corretor.nome}
                    </p>
                    {atribuicao.corretor.telefone && (
                      <a
                        href={`https://wa.me/${atribuicao.corretor.telefone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        <Phone className="size-3" />
                        {atribuicao.corretor.telefone}
                      </a>
                    )}
                  </div>
                  {isAdmin && (
                    <div>
                      <p className="text-[11px] text-muted-foreground">Cliente</p>
                      <p className="font-medium leading-tight">
                        {atribuicao.cliente.nome}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {atribuicao.cliente.telefone}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Compartilhar */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <Share2 className="size-3" /> Compartilhar com cliente
              </p>
              <Button
                variant="default"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={abrirWa}
              >
                <MessageCircle className="mr-1 size-4" /> Abrir WhatsApp
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={copiar}>
                  <Copy className="mr-1 size-4" /> Copiar mensagem
                </Button>
                <Button variant="outline" onClick={copiarLinkPublico}>
                  <Link2 className="mr-1 size-4" /> Copiar link
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function formatarData(iso: string): string {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function labelFormaPagamento(
  f: "a_vista" | "financiado" | null | undefined,
): string {
  if (f === "a_vista") return "À vista";
  if (f === "financiado") return "Financiado";
  return "Forma de pagamento não informada";
}

function AcaoPrimaria({
  icon,
  label,
  onClick,
  disabled,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant: "primary" | "success" | "neutral";
}) {
  const base =
    "flex flex-col items-center justify-center gap-1 rounded-lg p-3 text-xs font-medium transition-all border";
  const styles = disabled
    ? "bg-muted text-muted-foreground border-transparent cursor-not-allowed opacity-50"
    : variant === "primary"
      ? "bg-primary text-primary-foreground border-primary hover:opacity-90 shadow-sm"
      : variant === "success"
        ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-sm"
        : "bg-background text-foreground border-border hover:bg-accent";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles}`}
    >
      {icon}
      {label}
    </button>
  );
}
