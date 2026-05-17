import type { UnidadeStatus } from "@/types/database";

export const STATUS_COLORS: Record<
  UnidadeStatus | "sem_dados",
  { bg: string; border: string; label: string }
> = {
  disponivel: { bg: "#16a34a", border: "#166534", label: "Disponível" },
  reservada: { bg: "#eab308", border: "#a16207", label: "Reservada" },
  vendida: { bg: "#dc2626", border: "#991b1b", label: "Vendida" },
  sem_dados: { bg: "#e5e7eb", border: "#9ca3af", label: "Sem dados" },
};
