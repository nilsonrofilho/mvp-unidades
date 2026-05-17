export function formatBRL(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatM2(value: number | null | undefined): string {
  if (value == null) return "—";
  const str = value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  return `${str} m²`;
}

export function formatMonthYear(
  date: string | Date | null | undefined,
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

export function pluralize(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
