"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, Phone, MessageCircle } from "lucide-react";
import {
  listarCorretoresDoEmpreendimentoAction,
  type CorretorDoEmpreendimento,
} from "@/lib/actions/reservas";

export function CorretoresDoEmpreendimento({
  empreendimentoId,
}: {
  empreendimentoId: string;
}) {
  const [open, setOpen] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [lista, setLista] = useState<CorretorDoEmpreendimento[]>([]);

  async function abrir() {
    setOpen(true);
    setCarregando(true);
    const data = await listarCorretoresDoEmpreendimentoAction(empreendimentoId);
    setLista(data);
    setCarregando(false);
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={abrir}>
        <Users className="mr-1 size-4" /> Corretores
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Corretores atuando aqui</DialogTitle>
          </DialogHeader>
          {carregando ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Carregando...
            </p>
          ) : lista.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Ainda não há corretores com reservas ou vendas neste empreendimento.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border bg-background">
              {lista.map((c) => {
                const waNumber = c.telefone?.replace(/\D/g, "") ?? "";
                return (
                  <li
                    key={c.id}
                    className="p-3 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {c.nome}
                        {!c.ativo && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (inativo)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.vendas} venda{c.vendas === 1 ? "" : "s"} ·{" "}
                        {c.reservas_ativas} reserva
                        {c.reservas_ativas === 1 ? "" : "s"} ativa
                        {c.reservas_ativas === 1 ? "" : "s"}
                      </p>
                      {c.telefone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="size-3" /> {c.telefone}
                        </p>
                      )}
                    </div>
                    {waNumber && (
                      <a
                        href={`https://wa.me/${waNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-accent"
                        aria-label={`WhatsApp de ${c.nome}`}
                      >
                        <MessageCircle className="size-4 text-emerald-600" />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
