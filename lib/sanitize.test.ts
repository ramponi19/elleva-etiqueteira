import { describe, it, expect } from "vitest";
import { sanitizeRichText, toPlainText } from "@/lib/sanitize";

describe("sanitizeRichText (XSS na descrição do evento)", () => {
  it("remove <script> e conteúdo perigoso", () => {
    const out = sanitizeRichText('<p>ok</p><script>alert(1)</script>');
    expect(out).toContain("<p>ok</p>");
    expect(out).not.toContain("<script");
    expect(out).not.toContain("alert(1)");
  });
  it("remove handlers inline (onerror/onclick)", () => {
    const out = sanitizeRichText('<img src=x onerror="alert(1)">');
    expect(out).not.toContain("onerror");
    expect(out).not.toContain("alert(1)");
  });
  it("mantém formatação básica permitida", () => {
    const out = sanitizeRichText("<p>oi <strong>mundo</strong></p><ul><li>a</li></ul>");
    expect(out).toContain("<strong>mundo</strong>");
    expect(out).toContain("<li>a</li>");
  });
  it("links ganham rel de segurança e recusam javascript:", () => {
    const ok = sanitizeRichText('<a href="https://x.com">x</a>');
    expect(ok).toContain('rel="noopener noreferrer nofollow"');
    const js = sanitizeRichText('<a href="javascript:alert(1)">x</a>');
    expect(js).not.toContain("javascript:");
  });
  it("nulo/undefined viram string vazia", () => {
    expect(sanitizeRichText(null)).toBe("");
    expect(sanitizeRichText(undefined)).toBe("");
  });
});

describe("toPlainText", () => {
  it("tira todas as tags", () => {
    expect(toPlainText("<p>oi <b>mundo</b></p>")).toBe("oi mundo");
  });
  it("trunca com reticências no limite", () => {
    const s = toPlainText("<p>" + "a".repeat(300) + "</p>", 10);
    expect(s.endsWith("…")).toBe(true);
    expect(s.length).toBeLessThanOrEqual(11);
  });
});
