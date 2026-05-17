export type Branding = {
  companyName: string;
  logoPath: string;
  logoDarkPath: string;
  faviconPath: string;
  primaryColor: string;
  whatsappFooter: string;
  whatsappTemplate: string;
};

export const branding: Branding = {
  companyName: "MVP Engenharia",
  logoPath: "/branding/logo.png",
  logoDarkPath: "/branding/logo-dark.png",
  faviconPath: "/branding/favicon.ico",
  primaryColor: "#0066cc",
  whatsappFooter: "— MVP Engenharia",
  whatsappTemplate: `🏢 *{empreendimento}* — {unidade}

📐 {areaPrivativa}m² privativa
🛏️ {quartos} quartos{suites}
🚿 {banheiros} banheiros
🚗 {vagas}

💰 R$ {precoTotal} (R$ {precoM2}/m²)

📍 {endereco}, {cidade}/{estado}
🗓️ Entrega: {dataEntrega}

{footer}`,
};
