"use client";

import { motion } from "framer-motion";

// template.tsx re-monta a cada navegação (diferente de layout.tsx), então
// o conteúdo da página entra com um fade + leve subida em toda troca de rota.
export default function MarketingTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
