import { describe, it, expect } from "vitest";
import { branding } from "../branding";

describe("branding", () => {
  it("exposes companyName", () => {
    expect(branding.companyName).toBeTruthy();
  });
  it("has whatsappTemplate with required placeholders", () => {
    expect(branding.whatsappTemplate).toContain("{empreendimento}");
    expect(branding.whatsappTemplate).toContain("{unidade}");
    expect(branding.whatsappTemplate).toContain("{precoTotal}");
  });
});
