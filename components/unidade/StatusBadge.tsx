import type { UnidadeStatus } from "@/types/database";
import { STATUS_COLORS } from "@/lib/cores-status";

export function StatusBadge({ status }: { status: UnidadeStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ background: c.bg }}
    >
      {c.label}
    </span>
  );
}
