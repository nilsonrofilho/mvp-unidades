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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  criarClienteAction,
  buscarClientesAction,
  type ClienteInput,
} from "@/lib/actions/clientes";
import { criarReservaAction, type ReservaInput } from "@/lib/actions/reservas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ModalReserva({
  open,
  onOpenChange,
  unidadeId,
  unidadeNome,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  unidadeId: string;
  unidadeNome: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [usarExistente, setUsarExistente] = useState(false);
  const [buscaQ, setBuscaQ] = useState("");
  const [resultados, setResultados] = useState<
    Array<{ id: string; nome: string; cpf: string | null; telefone: string }>
  >([]);
  const [clienteExistenteId, setClienteExistenteId] = useState<string | null>(
    null,
  );
  const [composta, setComposta] = useState(false);

  const [cli, setCli] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    email: "",
    renda: "",
    nome_2: "",
    cpf_2: "",
    renda_2: "",
  });
  const [prop, setProp] = useState({
    valor_proposta_total: "",
    valor_entrada: "",
    forma_pagamento: "" as "" | "a_vista" | "financiado",
    observacoes: "",
  });

  async function buscar() {
    const res = await buscarClientesAction(buscaQ);
    setResultados(res.results);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      let clienteId = clienteExistenteId;
      if (!clienteId) {
        const clientePayload = {
          nome: cli.nome,
          cpf: cli.cpf || null,
          telefone: cli.telefone,
          email: cli.email || null,
          renda: cli.renda ? Number(cli.renda) : null,
          tipo_renda: composta ? "composta" : "individual",
          nome_2: composta ? cli.nome_2 || null : null,
          cpf_2: composta ? cli.cpf_2 || null : null,
          renda_2: composta && cli.renda_2 ? Number(cli.renda_2) : null,
        } as unknown as ClienteInput;
        const r = await criarClienteAction(clientePayload);
        if (r?.error || !r?.id) {
          toast.error(r?.error ?? "Falha ao cadastrar cliente");
          return;
        }
        clienteId = r.id;
      }
      const reservaPayload = {
        unidade_id: unidadeId,
        cliente_id: clienteId,
        valor_proposta_total: Number(prop.valor_proposta_total),
        valor_entrada: prop.valor_entrada ? Number(prop.valor_entrada) : null,
        forma_pagamento: prop.forma_pagamento || null,
        observacoes: prop.observacoes || null,
      } as unknown as ReservaInput;
      const res = await criarReservaAction(reservaPayload);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Reserva criada");
        onOpenChange(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reservar {unidadeNome}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Cliente</h3>
              <label className="text-xs flex items-center gap-1">
                <Checkbox
                  checked={usarExistente}
                  onCheckedChange={(v) => setUsarExistente(!!v)}
                />
                Já cadastrado
              </label>
            </div>
            {usarExistente ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar por nome ou CPF"
                    value={buscaQ}
                    onChange={(e) => setBuscaQ(e.target.value)}
                  />
                  <Button type="button" variant="outline" onClick={buscar}>
                    Buscar
                  </Button>
                </div>
                <ul className="border rounded divide-y max-h-40 overflow-y-auto">
                  {resultados.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => setClienteExistenteId(r.id)}
                        className={`w-full text-left p-2 hover:bg-accent text-sm ${clienteExistenteId === r.id ? "bg-accent" : ""}`}
                      >
                        <span className="font-medium">{r.nome}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {r.telefone}
                          {r.cpf ? ` · ${r.cpf}` : ""}
                        </span>
                      </button>
                    </li>
                  ))}
                  {resultados.length === 0 && (
                    <li className="p-2 text-xs text-muted-foreground">
                      Nenhum resultado.
                    </li>
                  )}
                </ul>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Nome*</Label>
                    <Input
                      value={cli.nome}
                      onChange={(e) => setCli({ ...cli, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Telefone*</Label>
                    <Input
                      value={cli.telefone}
                      onChange={(e) =>
                        setCli({ ...cli, telefone: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>CPF</Label>
                    <Input
                      value={cli.cpf}
                      onChange={(e) => setCli({ ...cli, cpf: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={cli.email}
                      onChange={(e) =>
                        setCli({ ...cli, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Renda</Label>
                    <Input
                      type="number"
                      value={cli.renda}
                      onChange={(e) =>
                        setCli({ ...cli, renda: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1 flex items-end gap-2">
                    <label className="text-sm flex items-center gap-2">
                      <Checkbox
                        checked={composta}
                        onCheckedChange={(v) => setComposta(!!v)}
                      />
                      Renda composta
                    </label>
                  </div>
                </div>
                {composta && (
                  <div className="grid md:grid-cols-3 gap-3 rounded border bg-accent/20 p-3">
                    <div className="space-y-1">
                      <Label>Nome (2ª pessoa)</Label>
                      <Input
                        value={cli.nome_2}
                        onChange={(e) =>
                          setCli({ ...cli, nome_2: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>CPF (2ª pessoa)</Label>
                      <Input
                        value={cli.cpf_2}
                        onChange={(e) =>
                          setCli({ ...cli, cpf_2: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Renda (2ª pessoa)</Label>
                      <Input
                        type="number"
                        value={cli.renda_2}
                        onChange={(e) =>
                          setCli({ ...cli, renda_2: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="font-medium">Proposta</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Valor total*</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={prop.valor_proposta_total}
                  onChange={(e) =>
                    setProp({
                      ...prop,
                      valor_proposta_total: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Entrada</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={prop.valor_entrada}
                  onChange={(e) =>
                    setProp({ ...prop, valor_entrada: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Forma de pagamento</Label>
                <Select
                  value={prop.forma_pagamento || undefined}
                  onValueChange={(v) =>
                    setProp({
                      ...prop,
                      forma_pagamento: (v as "a_vista" | "financiado") ?? "",
                    })
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
            </div>
            <div className="space-y-1">
              <Label>Observações</Label>
              <Textarea
                rows={3}
                value={prop.observacoes}
                onChange={(e) =>
                  setProp({ ...prop, observacoes: e.target.value })
                }
              />
            </div>
          </section>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Confirmar reserva"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
