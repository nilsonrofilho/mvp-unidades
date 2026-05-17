"use client";
import { useState, useTransition } from "react";
import type { Profile } from "@/types/database";
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
  convidarUsuarioAction,
  atualizarUsuarioAction,
} from "@/lib/actions/usuarios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export function UsuariosClient({ usuarios }: { usuarios: Profile[] }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    role: "corretor" as "admin" | "corretor",
  });
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function convidar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await convidarUsuarioAction(form);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Convite enviado");
        setOpen(false);
        setForm({ nome: "", email: "", role: "corretor" });
        router.refresh();
      }
    });
  }

  function toggleRole(p: Profile) {
    startTransition(async () => {
      await atualizarUsuarioAction(p.id, {
        role: p.role === "admin" ? "corretor" : "admin",
      });
      router.refresh();
    });
  }
  function toggleAtivo(p: Profile) {
    startTransition(async () => {
      await atualizarUsuarioAction(p.id, { ativo: !p.ativo });
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-1 size-4" /> Convidar usuário
        </Button>
      </div>
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.nome}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  {u.role === "admin" ? "Admin" : "Corretor"}
                </TableCell>
                <TableCell>{u.ativo ? "Ativo" : "Inativo"}</TableCell>
                <TableCell className="space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleRole(u)}
                  >
                    Alternar papel
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleAtivo(u)}
                  >
                    {u.ativo ? "Desativar" : "Ativar"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={convidar} className="space-y-3">
            <div className="space-y-1">
              <Label>Nome*</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>E-mail*</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Papel*</Label>
              <Select
                value={form.role}
                onValueChange={(v) =>
                  setForm({ ...form, role: (v as "admin" | "corretor") ?? "corretor" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corretor">Corretor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Enviando..." : "Enviar convite"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
