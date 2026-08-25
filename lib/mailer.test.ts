import { describe, it, expect } from "vitest";
import { escapeHtml } from "@/lib/mailer";

describe("escapeHtml (A6 — e-mails)", () => {
  it("neutraliza tags e aspas (o vetor de phishing pelo título do evento)", () => {
    expect(escapeHtml('<a href="http://evil">clique</a>')).toBe(
      "&lt;a href=&quot;http://evil&quot;&gt;clique&lt;/a&gt;"
    );
    expect(escapeHtml("<script>alert(1)</script>")).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
  it("escapa & primeiro (não gera dupla-escapada errada)", () => {
    expect(escapeHtml("A & B")).toBe("A &amp; B");
    expect(escapeHtml("<b>")).toBe("&lt;b&gt;");
  });
  it("texto comum passa intacto", () => {
    expect(escapeHtml("Show da Ana Cañas")).toBe("Show da Ana Cañas");
  });
  it("nulo/undefined viram string vazia", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
});
