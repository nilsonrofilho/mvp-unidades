"use client";
import { useState, useTransition } from "react";
import type { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  cadastrarCorretorAction,
  atualizarUsuarioAction,
  excluirCorretorAction,
} from "@/lib/actions/usuarios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { MoreVertical, Plus } from "lucide-react";

export function CorretoresClient({ lista }: { lista: Profile[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [form, setForm] = useState({ nome: "", telefone: "", email: "" });

  function abrir() {
    setForm({ nome: "", telefone: "", email: "" });
    setOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await cadastrarCorretorAction({
        nome: form.nome,
        telefone: form.telefone,
        email: form.email || null,
      });
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Corretor cadastrado");
        setOpen(false);
        router.refresh();
      }
    });
  }

  function editarTelefone(p: Profile) {
    const novo = window.prompt(`Telefone de ${p.nome}`, p.telefone ?? "");
    if (novo === null) return;
    startTransition(async () => {
      const res = await atualizarUsuarioAction(p.id, {
        telefone: novo.trim() || null,
      });
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Telefone atualizado");
        router.refresh();
      }
    });
  }
  function toggleAtivo(p: Profile) {
    startTransition(async () => {
      await atualizarUsuarioAction(p.id, { ativo: !p.ativo });
      router.refresh();
    });
  }
  function excluir(p: Profile) {
    if (!confirm(`Excluir ${p.nome}? Esta ação é permanente.`)) return;
    startTransition(async () => {
      const res = await excluirCorretorAction(p.id);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Corretor excluído");
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={abrir}>
          <Plus className="mr-1 size-4" /> Cadastrar corretor
        </Button>
      </div>
      <div className="rounded-lg border bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.map((u) => {
              const isPlaceholderEmail = u.email.endsWith("@no-login.local");
              const isAdmin = u.role === "admin";
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.telefone ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {isPlaceholderEmail ? "—" : u.email}
                  </TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <Badge>Admin</Badge>
                    ) : (
                      <Badge variant="secondary">Corretor</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.ativo ? (
                      <span className="text-xs">Ativo</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Inativo
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Admins não podem ser editados por aqui (você é o único). */}
                    {!isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={`Ações para ${u.nome}`}
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => editarTelefone(u)}>
                            Editar telefone
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant={u.ativo ? "destructive" : "default"}
                            onClick={() => toggleAtivo(u)}
                          >
                            {u.ativo ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => excluir(u)}
                          >
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar corretor</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Corretor não faz login — aparece apenas na lista do link público.
          </p>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1">
              <Label>Nome*</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Telefone*</Label>
              <Input
                placeholder="(00) 00000-0000"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>E-mail (opcional)</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando..." : "Cadastrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
