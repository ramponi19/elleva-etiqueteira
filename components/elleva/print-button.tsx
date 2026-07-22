"use client";

import { Button } from "@/components/ui/button";

// Botão de impressão do certificado — o navegador salva como PDF.
export function PrintButton() {
  return (
    <Button type="button" variante="primario" onClick={() => window.print()}>
      Baixar / imprimir PDF
    </Button>
  );
}
