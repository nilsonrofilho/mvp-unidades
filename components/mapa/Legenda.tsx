import { STATUS_COLORS } from "@/lib/cores-status";

export function LegendaMapa() {
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {(["disponivel", "reservada", "vendida", "sem_dados"] as const).map(
        (s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span
              className="size-3 rounded"
              style={{ background: STATUS_COLORS[s].bg }}
            />
            {STATUS_COLORS[s].label}
          </span>
        ),
      )}
    </div>
  );
}
