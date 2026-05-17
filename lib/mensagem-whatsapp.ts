import type { Empreendimento, Unidade } from "@/types/database";
import type { Branding } from "@/config/branding";
import { formatBRL, formatMonthYear, pluralize } from "@/lib/formatacao";

export function gerarMensagemUnidade(
  u: Unidade,
  e: Empreendimento,
  b: Branding,
): string {
  const precoM2 =
    u.preco_total != null && u.area_privativa_m2
      ? u.preco_total / u.area_privativa_m2
      : null;
  const suites =
    u.qtd_suites && u.qtd_suites > 0 ? ` (${u.qtd_suites} suítes)` : "";
  const vagas =
    u.qtd_vagas != null ? pluralize(u.qtd_vagas, "vaga", "vagas") : "";

  const replacements: Record<string, string> = {
    empreendimento: e.nome,
    unidade: u.identificador,
    areaPrivativa:
      u.area_privativa_m2 != null
        ? String(u.area_privativa_m2).replace(".", ",")
        : "",
    quartos: u.qtd_quartos != null ? String(u.qtd_quartos) : "",
    suites,
    banheiros: u.qtd_banheiros != null ? String(u.qtd_banheiros) : "",
    vagas,
    precoTotal:
      u.preco_total != null ? formatBRL(u.preco_total).replace("R$ ", "") : "",
    precoM2: precoM2 != null ? formatBRL(precoM2).replace("R$ ", "") : "",
    endereco: e.endereco ?? "",
    cidade: e.cidade ?? "",
    estado: e.estado ?? "",
    dataEntrega: e.data_entrega_prevista
      ? formatMonthYear(e.data_entrega_prevista)
      : "",
    footer: b.whatsappFooter,
  };

  let out = b.whatsappTemplate;
  for (const [k, v] of Object.entries(replacements)) {
    out = out.replaceAll(`{${k}}`, v);
  }
  // Drop emoji-only lines that ended up empty after substitution
  out = out
    .split("\n")
    .filter((line) => {
      const stripped = line.trim();
      if (stripped === "") return true;
      return !/^[\p{Emoji}\s—]+$/u.test(stripped);
    })
    .join("\n");
  return out;
}

export function gerarLinkWhatsapp(mensagem: string): string {
  return `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
}
