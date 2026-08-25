import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Testes de unidade das funções puras do caminho do dinheiro e de segurança.
// Ambiente node (sem DOM) — não testamos componentes aqui, só a lógica.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
