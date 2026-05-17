"use client";
import { useState } from "react";
import type { Unidade } from "@/types/database";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "./StatusBadge";
import { formatBRL, formatM2 } from "@/lib/formatacao";

export function ListaUnidades({
  unidades,
  onSelect,
}: {
  unidades: Unidade[];
  onSelect: (u: Unidade) => void;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("todos");
  const [quartos, setQuartos] = useState<string>("todos");

  const filtered = unidades.filter((u) => {
    if (q && !u.identificador.toLowerCase().includes(q.toLowerCase()))
      return false;
    if (status !== "todos" && u.status !== status) return false;
    if (quartos !== "todos" && String(u.qtd_quartos) !== quartos) return false;
    return true;
  });

  const quartosDistintos = Array.from(
    new Set(unidades.map((u) => u.qtd_quartos).filter((n) => n != null)),
  ) as number[];

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-2">
        <Input
          placeholder="Buscar unidade..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="md:max-w-xs"
        />
        <Select value={status} onValueChange={(v) => setStatus(v ?? "todos")}>
          <SelectTrigger className="md:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos status</SelectItem>
            <SelectItem value="disponivel">Disponível</SelectItem>
            <SelectItem value="reservada">Reservada</SelectItem>
            <SelectItem value="vendida">Vendida</SelectItem>
          </SelectContent>
        </Select>
        <Select value={quartos} onValueChange={(v) => setQuartos(v ?? "todos")}>
          <SelectTrigger className="md:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Quartos: todos</SelectItem>
            {quartosDistintos
              .sort((a, b) => a - b)
              .map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} quartos
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unidade</TableHead>
              <TableHead>Área priv.</TableHead>
              <TableHead>Quartos</TableHead>
              <TableHead>Vagas</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow
                key={u.id}
                onClick={() => onSelect(u)}
                className="cursor-pointer"
              >
                <TableCell className="font-medium">{u.identificador}</TableCell>
                <TableCell>{formatM2(u.area_privativa_m2)}</TableCell>
                <TableCell>{u.qtd_quartos ?? "—"}</TableCell>
                <TableCell>{u.qtd_vagas ?? "—"}</TableCell>
                <TableCell>{formatBRL(u.preco_total)}</TableCell>
                <TableCell>
                  <StatusBadge status={u.status} />
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-6"
                >
                  Nenhuma unidade.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
