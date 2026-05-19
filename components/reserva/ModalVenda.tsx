"use client";
import { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  marcarComoVendidaAction,
  obterAtribuicaoUnidadeAction,
  type AtribuicaoUnidade,
} from "@/lib/actions/reservas";
import { formatBRL } from "@/lib/formatacao";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CheckCircle2, User, Phone } from "lucide-react";

export function ModalVenda({
  open,
  onOpenChange,
  unidadeId,
  unidadeNome,
  empreendimentoNome,
  enderecoCompleto,
  sugerido,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  unidadeId: string;
  unidadeNome: string;
  empreendimentoNome: string;
  enderecoCompleto: string;
  sugerido: number | null;
}) {
  const [valor, setValor] = useState<string>(
    sugerido != null ? String(sugerido) : "",
  );
  const [formaPagamento, setFormaPagamento] = useState<
    "" | "a_vista" | "financiado"
  >("");
  const [dataVenda, setDataVenda] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [atribuicao, setAtribuicao] = useState<AtribuicaoUnidade>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    obterAtribuicaoUnidadeAction(unidadeId).then((r) => {
      setAtribuicao(r);
      if (r?.origem === "reserva" && r.forma_pagamento) {
        setFormaPagamento(r.forma_pagamento);
      }
    });
  }, [open, unidadeId]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await marcarComoVendidaAction(unidadeId, Number(valor), {
        forma_pagamento: formaPagamento || null,
        data_venda: dataVenda,
      });
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Unidade marcada como vendida");
        onOpenChange(false);
        router.refresh();
      }
    });
  }

  const reservaInfo =
    atribuicao?.origem === "reserva" ? atribuicao : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-600" />
            Confirmar venda
          </DialogTitle>
        </DialogHeader>

        {/* Contexto: condomínio + unidade */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Unidade
          </p>
          <p className="font-medium leading-tight">{unidadeNome}</p>
          <p className="text-xs text-muted-foreground">
            {empreendimentoNome}
            {enderecoCompleto ? ` · ${enderecoCompleto}` : ""}
          </p>
        </div>

        {/* Quem vai assinar a venda (vem da reserva ativa) */}
        {reservaInfo && (
          <div className="rounded-lg border p-3 space-y-2 text-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Vendido por · para
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-muted-foreground">Corretor</p>
                <p className="font-medium leading-tight inline-flex items-center gap-1">
                  <User className="size-3.5" />
                  {reservaInfo.corretor.nome}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Cliente</p>
                <p className="font-medium leading-tight">
                  {reservaInfo.cliente.nome}
                </p>
                <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  <Phone className="size-3" />
                  {reservaInfo.cliente.telefone}
                </p>
              </div>
            </div>
            {reservaInfo.valor_proposta_total != null && (
              <p className="text-xs text-muted-foreground pt-1 border-t">
                Proposta original:{" "}
                <span className="font-medium text-foreground">
                  {formatBRL(reservaInfo.valor_proposta_total)}
                </span>
              </p>
            )}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Valor final*</Label>
              <Input
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
                placeholder="0,00"
              />
            </div>
            <div className="space-y-1">
              <Label>Data da venda*</Label>
              <Input
                type="date"
                value={dataVenda}
                onChange={(e) => setDataVenda(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Forma de pagamento</Label>
            <Select
              value={formaPagamento || undefined}
              onValueChange={(v) =>
                setFormaPagamento(
                  (v as "a_vista" | "financiado") ?? "",
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a_vista">À vista</SelectItem>
                <SelectItem value="financiado">Financiado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="mr-1 size-4" />
              {pending ? "Salvando..." : "Confirmar venda"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
