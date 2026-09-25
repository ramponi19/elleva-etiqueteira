"use client";

// ============================================================
// Menu da conta nas barras "A Noite" (home, evento, agenda, institucional)
// ============================================================
// Antes essas 4 barras mostravam só um link solto "Minha conta" — e no celular
// nem isso (o .entrar some por CSS abaixo de ~720px). Os itens espelham o menu
// do avatar de components/elleva/nav.tsx (visual claro, usado em /conta).
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Icon from "@/components/shared/icon";
import type { ContaResumo } from "@/lib/auth";
import s from "./menu-conta.module.css";

function iniciais(nome: string, email: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length && !nome.includes("@")) {
    const a = partes[0][0] ?? "";
    const b = partes.length > 1 ? partes[partes.length - 1][0] : "";
    return (a + b).toUpperCase();
  }
  return (email[0] ?? "?").toUpperCase();
}

const primeiroNome = (nome: string) => (nome.includes("@") ? nome.split("@")[0] : nome.trim().split(/\s+/)[0]);

export function MenuConta({ conta }: { conta: ContaResumo }) {
  const router = useRouter();
  const pathname = usePathname();
  // Guarda EM QUE PÁGINA foi aberto: navegou (inclusive voltar/avançar do
  // navegador) → não bate mais com o pathname → fecha sozinho, sem efeito.
  const [abertoEm, setAbertoEm] = useState<string | null>(null);
  const aberto = abertoEm !== null && abertoEm === pathname;
  const setAberto = (v: boolean | ((a: boolean) => boolean)) =>
    setAbertoEm((atual) => {
      const agora = atual !== null && atual === pathname;
      return (typeof v === "function" ? v(agora) : v) ? pathname : null;
    });
  const raiz = useRef<HTMLDivElement>(null);
  const gatilho = useRef<HTMLButtonElement>(null);
  const painel = useRef<HTMLDivElement>(null);

  // Mantém o painel dentro da tela. Ele abre alinhado à direita do botão, mas no
  // celular o botão não fica no canto (o "Ver eventos" vem à direita dele) e o
  // painel vazava 14px pela esquerda — medido no teste E2E. Cada uma das 4 barras
  // tem uma largura diferente, então não dá pra fixar no CSS: mede e empurra.
  // Mexe só no style do DOM (sem setState) e antes da pintura, sem piscar.
  useLayoutEffect(() => {
    const el = painel.current;
    if (!aberto || !el) return;
    el.style.transform = "";
    const r = el.getBoundingClientRect();
    const margem = 12;
    const dx = r.left < margem ? margem - r.left : r.right > innerWidth - margem ? innerWidth - margem - r.right : 0;
    if (dx) el.style.transform = `translateX(${Math.round(dx)}px)`;
  }, [aberto]);

  // fecha ao clicar fora e no Esc (devolvendo o foco pro botão)
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbertoEm(null);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setAbertoEm(null); gatilho.current?.focus(); }
    };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc); };
  }, [aberto]);

  async function sair() {
    // import dinâmico: supabase-js fica fora do bundle de quem não sai
    const { createClient } = await import("@/lib/supabase/client");
    // scope local: sai SÓ deste aparelho. O padrão do supabase-js é "global" (derruba a sessão em todos os aparelhos — sair no celular deslogava o computador); a própria doc recomenda local pra maioria dos apps.
    await createClient().auth.signOut({ scope: "local" });
    setAberto(false);
    router.push("/");
    router.refresh();
  }

  const fechar = () => setAberto(false);

  return (
    <div className={s.root} ref={raiz}>
      <button
        ref={gatilho}
        type="button"
        className={s.gatilho}
        onClick={() => setAberto((v) => !v)}
        aria-haspopup="true"
        aria-expanded={aberto}
        aria-label={`Menu da conta de ${conta.nome}`}
      >
        <span className={s.avatar} aria-hidden>{iniciais(conta.nome, conta.email)}</span>
        <span className={s.nome}>{primeiroNome(conta.nome)}</span>
        <span className={s.seta} aria-hidden><Icon icon="lucide:chevron-down" style={{ fontSize: 16 }} /></span>
      </button>

      {aberto && (
        <div className={s.painel} ref={painel}>
          <div className={s.cabeca}>
            <p className={s.cabecaNome}>{conta.nome}</p>
            {conta.email && <p className={s.cabecaEmail}>{conta.email}</p>}
          </div>

          <div className={s.grupo}>
            <Link href="/conta" className={s.item} onClick={fechar}>
              <Icon icon="lucide:ticket" style={{ fontSize: 17 }} /> Meus ingressos
            </Link>
            <Link href="/conta/perfil" className={s.item} onClick={fechar}>
              <Icon icon="lucide:user-round" style={{ fontSize: 17 }} /> Meus dados
            </Link>
            <Link href="/conta/favoritos" className={s.item} onClick={fechar}>
              <Icon icon="lucide:heart" style={{ fontSize: 17 }} /> Favoritos
            </Link>
          </div>

          <div className={s.grupo}>
            <Link href="/produtor" className={s.item} onClick={fechar}>
              <Icon icon="lucide:calendar-check" style={{ fontSize: 17 }} /> Meus eventos
            </Link>
            <Link href="/criar-evento" className={s.item} onClick={fechar}>
              <Icon icon="lucide:circle-plus" style={{ fontSize: 17 }} /> Criar evento
            </Link>
            {conta.papel === "admin" && (
              <Link href="/admin" className={s.item} onClick={fechar}>
                <Icon icon="lucide:shield-check" style={{ fontSize: 17 }} /> Administração
              </Link>
            )}
          </div>

          <div className={s.grupo}>
            <Link href="/ajuda" className={s.item} onClick={fechar}>
              <Icon icon="lucide:circle-help" style={{ fontSize: 17 }} /> Central de ajuda
            </Link>
            <button type="button" className={`${s.item} ${s.sair}`} onClick={sair}>
              <Icon icon="lucide:log-out" style={{ fontSize: 17 }} /> Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
