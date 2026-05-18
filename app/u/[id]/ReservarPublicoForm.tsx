"use client";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  criarReservaPublicaAction,
  type CorretorPublico,
} from "@/lib/actions/publico";
import { toast } from "sonner";

export function ReservarPublicoForm({
  unidadeId,
  corretores,
}: {
  unidadeId: string;
  corretores: CorretorPublico[];
}) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    corretor_id: corretores[0]?.id ?? "",
    observacoes: "",
  });
  const [enviado, setEnviado] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await criarReservaPublicaAction({
        unidade_id: unidadeId,
        corretor_id: form.corretor_id,
        nome: form.nome,
        telefone: form.telefone,
        email: form.email || null,
        observacoes: form.observacoes || null,
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Pedido de reserva enviado!");
      setEnviado(true);
    });
  }

  if (enviado) {
    const escolhido = corretores.find((c) => c.id === form.corretor_id);
    return (
      <div className="rounded-md bg-green-50 border border-green-200 p-4 text-sm space-y-2">
        <p className="font-medium text-green-900">
          Recebemos seu interesse, {form.nome.split(" ")[0]}!
        </p>
        <p className="text-green-800">
          {escolhido?.nome ?? "O corretor responsável"} entrará em contato em
          breve
          {escolhido?.telefone ? ` pelo telefone ${escolhido.telefone}` : ""}.
        </p>
        {escolhido?.telefone && (
          <a
            href={`https://wa.me/${escolhido.telefone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm underline text-green-900"
          >
            Falar agora pelo WhatsApp →
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Seu nome*</Label>
          <Input
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            required
            minLength={2}
          />
        </div>
        <div className="space-y-1">
          <Label>Telefone / WhatsApp*</Label>
          <Input
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            required
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>E-mail (opcional)</Label>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label>Corretor*</Label>
        <Select
          value={form.corretor_id}
          onValueChange={(v) => setForm({ ...form, corretor_id: v ?? "" })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Escolha um corretor" />
          </SelectTrigger>
          <SelectContent>
            {corretores.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
                {c.telefone ? ` · ${c.telefone}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Mensagem (opcional)</Label>
        <Textarea
          rows={3}
          value={form.observacoes}
          onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
          placeholder="Conte sobre seu interesse, melhor horário para contato, etc."
        />
      </div>
      <Button type="submit" disabled={pending || !form.corretor_id} className="w-full">
        {pending ? "Enviando..." : "Quero reservar"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Ao enviar, a unidade fica reservada para você e o corretor selecionado
        entrará em contato.
      </p>
    </form>
  );
}
