import { describe, it, expect } from "vitest";
import {
  gerarMensagemUnidade,
  gerarLinkWhatsapp,
} from "../mensagem-whatsapp";
import type { Empreendimento, Unidade } from "@/types/database";
import { branding } from "@/config/branding";

const emp: Empreendimento = {
  id: "e1",
  nome: "Pipa Aruan",
  tipo: "vertical",
  status: "em_obras",
  endereco: "Rua X, 123",
  cidade: "Natal",
  estado: "RN",
  cep: "59000-000",
  data_entrega_prevista: "2026-12-15",
  foto_capa_url: null,
  descricao: null,
  qtd_andares: 10,
  qtd_unidades_por_andar: 4,
  planta_implantacao_url: null,
  criado_em: "",
  atualizado_em: "",
};

const u: Unidade = {
  id: "u1",
  empreendimento_id: "e1",
  identificador: "Apto 302",
  andar: 3,
  posicao_no_andar: "A",
  area_privativa_m2: 75,
  area_total_m2: 90,
  qtd_quartos: 2,
  qtd_suites: 1,
  qtd_banheiros: 2,
  qtd_vagas: 1,
  preco_total: 580000,
  valor_condominio: 450,
  status: "disponivel",
  foto_url: null,
  coordenadas_poligono: null,
  criado_em: "",
  atualizado_em: "",
};

describe("gerarMensagemUnidade", () => {
  it("includes empreendimento name and identifier", () => {
    const msg = gerarMensagemUnidade(u, emp, branding);
    expect(msg).toContain("Pipa Aruan");
    expect(msg).toContain("Apto 302");
  });
  it("formats price in BRL", () => {
    const msg = gerarMensagemUnidade(u, emp, branding);
    expect(msg).toContain("580.000,00");
  });
  it("includes suites annotation", () => {
    const msg = gerarMensagemUnidade(u, emp, branding);
    expect(msg).toContain("1 suítes");
  });
  it("pluralizes vagas correctly", () => {
    const msg = gerarMensagemUnidade(u, emp, branding);
    expect(msg).toContain("1 vaga");
  });
  it("includes footer", () => {
    const msg = gerarMensagemUnidade(u, emp, branding);
    expect(msg).toContain(branding.whatsappFooter);
  });
});

describe("gerarLinkWhatsapp", () => {
  it("encodes message", () => {
    expect(gerarLinkWhatsapp("oi mundo")).toBe(
      "https://wa.me/?text=oi%20mundo",
    );
  });
});
