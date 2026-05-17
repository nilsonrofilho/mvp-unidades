import { describe, it, expect } from "vitest";
import { isAdmin, requireAdmin } from "../permissoes";

describe("permissoes", () => {
  it("isAdmin true for admin profile", () => {
    expect(isAdmin({ role: "admin" })).toBe(true);
  });
  it("isAdmin false for corretor profile", () => {
    expect(isAdmin({ role: "corretor" })).toBe(false);
  });
  it("isAdmin false for null", () => {
    expect(isAdmin(null)).toBe(false);
  });
  it("requireAdmin throws on non-admin", () => {
    expect(() => requireAdmin({ role: "corretor" })).toThrow();
  });
  it("requireAdmin passes on admin", () => {
    expect(() => requireAdmin({ role: "admin" })).not.toThrow();
  });
});
