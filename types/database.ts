export type UserRole = "admin" | "corretor";
export type EmpreendimentoTipo = "vertical" | "horizontal";
export type EmpreendimentoStatus = "lancamento" | "em_obras" | "pronto";
export type UnidadeStatus = "disponivel" | "reservada" | "vendida";
export type TipoRenda = "individual" | "composta";
export type FormaPagamento = "a_vista" | "financiado";
export type ReservaStatus = "ativa" | "cancelada" | "convertida_em_venda";

export type Profile = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  role: UserRole;
  ativo: boolean;
  criado_em: string;
};

export type Empreendimento = {
  id: string;
  nome: string;
  tipo: EmpreendimentoTipo;
  status: EmpreendimentoStatus;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  data_entrega_prevista: string | null;
  foto_capa_url: string | null;
  descricao: string | null;
  qtd_andares: number | null;
  qtd_unidades_por_andar: number | null;
  planta_implantacao_url: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type Coordenadas = { x: number; y: number; width: number; height: number };

export type Unidade = {
  id: string;
  empreendimento_id: string;
  identificador: string;
  andar: number | null;
  posicao_no_andar: string | null;
  area_privativa_m2: number | null;
  area_total_m2: number | null;
  qtd_quartos: number | null;
  qtd_suites: number | null;
  qtd_banheiros: number | null;
  qtd_vagas: number | null;
  preco_total: number | null;
  valor_condominio: number | null;
  status: UnidadeStatus;
  foto_url: string | null;
  coordenadas_poligono: Coordenadas | null;
  criado_em: string;
  atualizado_em: string;
};

export type Cliente = {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string;
  email: string | null;
  renda: number | null;
  tipo_renda: TipoRenda;
  nome_2: string | null;
  cpf_2: string | null;
  renda_2: number | null;
  criado_por: string;
  criado_em: string;
};

export type Reserva = {
  id: string;
  unidade_id: string;
  cliente_id: string;
  corretor_id: string;
  valor_proposta_total: number;
  valor_entrada: number | null;
  forma_pagamento: FormaPagamento | null;
  observacoes: string | null;
  status: ReservaStatus;
  criado_em: string;
  atualizado_em: string;
};

export type Venda = {
  id: string;
  unidade_id: string;
  cliente_id: string;
  corretor_id: string;
  reserva_origem_id: string | null;
  valor_final: number;
  data_venda: string;
  criado_em: string;
};

export type ArquivoEmpreendimento = {
  id: string;
  empreendimento_id: string;
  nome: string;
  url: string;
  tamanho_bytes: number;
  tipo_mime: string;
  enviado_por: string;
  criado_em: string;
};
