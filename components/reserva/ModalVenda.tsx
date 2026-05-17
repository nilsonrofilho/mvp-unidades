"use client";
import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { marcarComoVendidaAction } from "@/lib/actions/reservas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ModalVenda({
  open,
  onOpenChange,
  unidadeId,
  sugerido,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  unidadeId: string;
  sugerido: number | null;
}) {
  const [valor, setValor] = useState<string>(
    sugerido != null ? String(sugerido) : "",
  );
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await marcarComoVendidaAction(unidadeId, Number(valor));
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Unidade marcada como vendida");
        onOpenChange(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar como vendida</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Valor final da venda</Label>
            <Input
              type="number"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              Confirmar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
