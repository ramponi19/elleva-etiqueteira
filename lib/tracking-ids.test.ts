import { describe, it, expect } from "vitest";
import { safeMetaPixel, safeGaId } from "@/lib/tracking-ids";

describe("safeMetaPixel (allowlist do C2 — Meta)", () => {
  it("aceita só dígitos (8 a 20)", () => {
    expect(safeMetaPixel("123456789012345")).toBe("123456789012345");
    expect(safeMetaPixel("  123456789012  ")).toBe("123456789012"); // trim
  });
  it("recusa qualquer coisa com aspa/parêntese/tag (o payload de XSS)", () => {
    expect(safeMetaPixel("');alert(document.cookie)//")).toBeNull();
    expect(safeMetaPixel("123<script>")).toBeNull();
    expect(safeMetaPixel("abc")).toBeNull();
    expect(safeMetaPixel("")).toBeNull();
    expect(safeMetaPixel(null)).toBeNull();
  });
});

describe("safeGaId (allowlist do C2 — Google)", () => {
  it("aceita os prefixos conhecidos", () => {
    expect(safeGaId("G-ABC1234")).toBe("G-ABC1234");
    expect(safeGaId("UA-123456-1")).toBe("UA-123456-1");
    expect(safeGaId("AW-99999999")).toBe("AW-99999999");
  });
  it("recusa formato inválido e injeção", () => {
    expect(safeGaId("G-X');window.x=1;//")).toBeNull();
    expect(safeGaId("XX-123")).toBeNull();
    expect(safeGaId("123456")).toBeNull();
    expect(safeGaId(undefined)).toBeNull();
  });
});
