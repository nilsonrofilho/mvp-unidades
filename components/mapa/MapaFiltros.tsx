"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FiltroMapa = {
  status: string[];
  precoMin?: number;
  precoMax?: number;
  quartos?: number;
};

export function MapaFiltros({
  value,
  onChange,
  quartosDistintos,
}: {
  value: FiltroMapa;
  onChange: (v: FiltroMapa) => void;
  quartosDistintos: number[];
}) {
  function toggleStatus(s: string) {
    const set = new Set(value.status);
    if (set.has(s)) set.delete(s);
    else set.add(s);
    onChange({ ...value, status: Array.from(set) });
  }

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="space-y-1">
        <p className="text-xs">Status</p>
        <div className="flex gap-2">
          {[
            ["disponivel", "Disp."],
            ["reservada", "Res."],
            ["vendida", "Vend."],
          ].map(([s, label]) => (
            <label key={s} className="flex items-center gap-1 text-xs">
              <Checkbox
                checked={value.status.includes(s)}
                onCheckedChange={() => toggleStatus(s)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-xs">Preço min.</p>
        <Input
          type="number"
          className="w-32"
          onChange={(e) =>
            onChange({
              ...value,
              precoMin: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
      </div>
      <div className="space-y-1">
        <p className="text-xs">Preço max.</p>
        <Input
          type="number"
          className="w-32"
          onChange={(e) =>
            onChange({
              ...value,
              precoMax: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
      </div>
      <div className="space-y-1">
        <p className="text-xs">Quartos</p>
        <Select
          value={value.quartos != null ? String(value.quartos) : "todos"}
          onValueChange={(v) =>
            onChange({
              ...value,
              quartos: !v || v === "todos" ? undefined : Number(v),
            })
          }
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {quartosDistintos
              .sort((a, b) => a - b)
              .map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
