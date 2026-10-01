"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { Modal, PromptDialog } from "@/components/ui/modal";
import { createEvent, updateEvent } from "@/lib/actions/events";
import { TEMAS } from "@/lib/arte";

const MOSTRAR_TEMA = false;
import { maskCEP } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

// ── estilos base compartilhados ────────────────────────────────────────────
const card = "rounded-[var(--radius-card)] border-[1.5px] border-tinta bg-white p-6 sm:p-8";
const input =
  "w-full rounded-[10px] border-[1.5px] border-tinta bg-white px-3.5 py-2.5 text-[16px] text-tinta outline-none placeholder:text-tinta-35 focus:border-sol disabled:bg-papel-2 disabled:text-tinta-60";
const labelCls = "mb-1.5 block text-[13.5px] font-medium text-tinta";
const hint = "corpo-suave mt-1 block text-right";

const ASSUNTOS: { value: string; label: string }[] = [
  { value: "SHOW", label: "Show / Música" },
  { value: "FESTA", label: "Festa" },
  { value: "ESPORTE", label: "Esporte" },
  { value: "TEATRO", label: "Teatro / Espetáculo" },
  { value: "CORPORATIVO", label: "Corporativo / Congresso" },
  { value: "CURSO", label: "Curso / Workshop" },
];

function Req() {
  // text-sol-escuro (#FF7A45 nos temas escuros), não text-sol: #E8481F é a cor de
  // FUNDO de botão e, como texto no card escuro, dava 4,22:1 (mín 4,5). Auditoria 2026-09-25.
  return <span className="text-sol-escuro"> *</span>;
}

function SectionHead({ n, title, sub }: { n: number; title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h2 className="titulo-card text-tinta">
        <span className="text-sol-escuro">{n}.</span> {title}
      </h2>
      {sub && <p className="corpo-suave mt-1">{sub}</p>}
    </div>
  );
}

interface Tier {
  name: string;
  description: string;
  price: string;
  capacity: string;
  isFree: boolean;
  isAddon: boolean;
  isHalf: boolean;
}

interface Sector {
  name: string;
  tierIndex: number; // índice do lote (em tiers) que define o preço do setor
  rows: string;
  cols: string;
}

interface FormState {
  title: string;
  coverUrl: string;
  category: string;
  subcategory: string;
  date: string;
  time: string;
  endDate: string;
  endTime: string;
  description: string;
  venue: string;
  cep: string;
  address: string;
  addressNumber: string;
  addressComplement: string;
  neighborhood: string;
  city: string;
  state: string;
  showOnMaps: boolean;
  tiers: Tier[];
  hasSeating: boolean;
  sectors: Sector[];
  absorbFee: boolean;
  nomenclature: string;
  producerName: string;
  producerBio: string;
  trackingMetaPixel: string;
  trackingGa: string;
  theme: string;
  certificateEnabled: boolean;
  certificateTitle: string;
  certificateBody: string;
  certificateHours: string;
  certificateSigner: string;
  accepted: boolean;
  visibility: "public" | "private";
}

const emptyTier = (opts: { isFree?: boolean; isAddon?: boolean; isHalf?: boolean } = {}): Tier => ({
  name: opts.isHalf ? "Meia-entrada" : "",
  description: "",
  price: "",
  capacity: "",
  isFree: opts.isFree ?? false,
  isAddon: opts.isAddon ?? false,
  isHalf: opts.isHalf ?? false,
});

const EMPTY: FormState = {
  title: "",
  coverUrl: "",
  category: "",
  subcategory: "",
  date: "",
  time: "",
  endDate: "",
  endTime: "",
  description: "",
  venue: "",
  cep: "",
  address: "",
  addressNumber: "",
  addressComplement: "",
  neighborhood: "",
  city: "",
  state: "",
  showOnMaps: true,
  tiers: [],
  hasSeating: false,
  sectors: [],
  absorbFee: false,
  nomenclature: "Ingresso",
  producerName: "",
  producerBio: "",
  trackingMetaPixel: "",
  trackingGa: "",
  theme: "",
  certificateEnabled: false,
  certificateTitle: "",
  certificateBody: "",
  certificateHours: "",
  certificateSigner: "",
  accepted: false,
  visibility: "public",
};

export function CriarEventoForm({
  eventId,
  statusAtual,
  initial,
}: {
  eventId?: string;
  /** status atual do evento (edição) — pra o preview não despublicar */
  statusAtual?: string;
  initial?: FormState;
} = {}) {
  const router = useRouter();
  const isEdit = !!eventId;
  const [f, setF] = useState<FormState>(initial ?? EMPTY);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // M13: num form longo, a mensagem de erro nascia fora da tela e o "Salvar"
  // parecia morto. Rola até ela sempre que aparece.
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);
  const [notice, setNotice] = useState<{ msg: string; go: () => void } | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setF((s) => ({ ...s, [k]: v }));

  // ── imagem ────────────────────────────────────────────────────────────
  async function upload(file: File) {
    const ok = ["image/jpeg", "image/png", "image/gif"];
    if (!ok.includes(file.type)) return setError("Use JPEG, PNG ou GIF.");
    if (file.size > 2 * 1024 * 1024) return setError("Imagem acima de 2MB.");
    setError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("event-covers")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("event-covers").getPublicUrl(path);
      set("coverUrl", data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  }

  // ── CEP → autofill (ViaCEP) ───────────────────────────────────────────
  async function lookupCep(raw: string) {
    const cep = raw.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = await r.json();
      if (d.erro) return;
      setF((s) => ({
        ...s,
        address: d.logradouro || s.address,
        neighborhood: d.bairro || s.neighborhood,
        city: d.localidade || s.city,
        state: d.uf || s.state,
      }));
    } catch {
      /* silencioso: usuário preenche à mão */
    }
  }

  // ── ingressos ─────────────────────────────────────────────────────────
  const addTier = (opts: { isFree?: boolean; isAddon?: boolean; isHalf?: boolean } = {}) =>
    setF((s) => ({ ...s, tiers: [...s.tiers, emptyTier(opts)] }));
  const setTier = (i: number, k: keyof Tier, v: string | boolean) =>
    setF((s) => ({ ...s, tiers: s.tiers.map((t, idx) => (idx === i ? { ...t, [k]: v } : t)) }));
  const rmTier = (i: number) =>
    setF((s) => {
      const tiers = s.tiers.filter((_, idx) => idx !== i);
      // Setores apontam pro lote por ÍNDICE — ao remover um lote é obrigatório
      // remapear, senão o setor passa a apontar pro lote errado (ou pra nenhum,
      // virando assento sem preço).
      const primeiroIngresso = Math.max(0, tiers.findIndex((t) => !t.isAddon));
      const sectors = s.sectors.map((sec) => ({
        ...sec,
        tierIndex:
          sec.tierIndex === i ? primeiroIngresso : sec.tierIndex > i ? sec.tierIndex - 1 : sec.tierIndex,
      }));
      return { ...s, tiers, sectors };
    });

  // ── assentos marcados ───────────────────────────────────────────────────
  const addSector = () =>
    setF((s) => {
      const firstSeat = s.tiers.findIndex((t) => !t.isAddon);
      return { ...s, sectors: [...s.sectors, { name: "", tierIndex: firstSeat < 0 ? 0 : firstSeat, rows: "", cols: "" }] };
    });
  const setSector = (i: number, k: keyof Sector, v: string | number) =>
    setF((s) => ({ ...s, sectors: s.sectors.map((sec, idx) => (idx === i ? { ...sec, [k]: v } : sec)) }));
  const rmSector = (i: number) =>
    setF((s) => ({ ...s, sectors: s.sectors.filter((_, idx) => idx !== i) }));

  // duração
  const durTxt = (() => {
    if (!f.date || !f.endDate) return null;
    const a = new Date(f.date);
    const b = new Date(f.endDate);
    const days = Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
    if (isNaN(days) || days < 1) return null;
    return days === 1 ? "1 dia" : `${days} dias`;
  })();

  // ── submit ────────────────────────────────────────────────────────────
  async function persist(status: "draft" | "published", then: (slug?: string) => void) {
    setError(null);

    if (!f.title.trim()) return setError("Informe o nome do evento.");
    if (!f.category) return setError("Selecione um assunto.");
    if (!f.date || !f.time) return setError("Informe a data e a hora de início.");
    if (!f.venue.trim()) return setError("Informe o nome do local.");
    if (!f.city.trim() || !f.state.trim()) return setError("Informe cidade e estado (o CEP preenche).");
    if (!f.tiers.length) return setError("Adicione ao menos um ingresso.");
    if (f.tiers.some((t) => !t.name.trim())) return setError("Dê um nome a cada ingresso.");
    // lote pago sem preço saía publicado a R$ 0,00 e era vendido de graça
    if (f.tiers.some((t) => !t.isFree && !(Number(String(t.price).replace(",", ".")) > 0)))
      return setError("Informe o preço de cada ingresso pago (ou marque como gratuito).");
    if (f.hasSeating) {
      if (!f.sectors.length) return setError("Adicione ao menos um setor de assentos (ou desligue os assentos marcados).");
      if (f.sectors.some((s) => !Number(s.rows) || !Number(s.cols)))
        return setError("Cada setor precisa de nº de fileiras e assentos por fileira.");
      if (f.sectors.some((s) => !f.tiers[s.tierIndex] || f.tiers[s.tierIndex].isAddon))
        return setError("Cada setor precisa apontar para um ingresso válido. Confira os setores.");
    }
    if (status === "published" && !f.accepted)
      return setError("Aceite as responsabilidades para publicar.");

    setSaving(true);
    const payload = {
      title: f.title,
      description: f.description || undefined,
      category: f.category as "SHOW",
      subcategory: f.subcategory || undefined,
      venue: f.venue,
      city: f.city,
      state: f.state || undefined,
      cep: f.cep || undefined,
      address: f.address || undefined,
      addressNumber: f.addressNumber || undefined,
      addressComplement: f.addressComplement || undefined,
      neighborhood: f.neighborhood || undefined,
      showOnMaps: f.showOnMaps,
      date: f.date,
      time: f.time,
      endDate: f.endDate || undefined,
      endTime: f.endTime || undefined,
      coverUrl: f.coverUrl || undefined,
      producerName: f.producerName || undefined,
      producerBio: f.producerBio || undefined,
      trackingMetaPixel: f.trackingMetaPixel || undefined,
      trackingGa: f.trackingGa || undefined,
      theme: f.theme || undefined,
      visibility: f.visibility,
      absorbFee: f.absorbFee,
      nomenclature: f.nomenclature || undefined,
      status,
      tiers: f.tiers.map((t) => ({
        name: t.name,
        description: t.description || undefined,
        price: t.isFree ? 0 : t.price || 0,
        capacity: t.capacity || undefined,
        isFree: t.isFree,
        isAddon: t.isAddon,
        isHalf: t.isHalf,
      })),
      hasSeating: f.hasSeating,
      sectors: f.hasSeating
        ? f.sectors.map((s) => ({
            name: s.name || undefined,
            tierIndex: s.tierIndex,
            rows: Number(s.rows) || 1,
            cols: Number(s.cols) || 1,
          }))
        : undefined,
      certificateEnabled: f.certificateEnabled,
      certificateTitle: f.certificateEnabled ? f.certificateTitle || undefined : undefined,
      certificateBody: f.certificateEnabled ? f.certificateBody || undefined : undefined,
      certificateHours: f.certificateEnabled ? f.certificateHours || undefined : undefined,
      certificateSigner: f.certificateEnabled ? f.certificateSigner || undefined : undefined,
    };
    const res = isEdit ? await updateEvent(eventId!, payload) : await createEvent(payload);
    setSaving(false);
    if (!res.ok) return setError(res.error ?? "Erro ao salvar.");
    // aviso do servidor (ex.: lotes preservados por já haver vendas) — não é erro,
    // mas o produtor PRECISA saber que o lote não mudou
    if (res.notice) { setNotice({ msg: res.notice, go: () => then(res.slug) }); return; }
    then(res.slug);
  }

  const publicar = () => persist("published", () => { router.push("/produtor"); router.refresh(); });
  const rascunho = () => persist("draft", () => { router.push("/produtor"); router.refresh(); });
  // Pré-visualizar NUNCA pode rebaixar o status: num evento já publicado isso
  // tirava o evento do ar (links de campanha morriam) sem o produtor perceber.
  const preview = () =>
    persist(isEdit && statusAtual === "published" ? "published" : "draft", (slug) =>
      router.push(slug ? `/evento/${slug}` : "/produtor")
    );

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Informações básicas */}
      <section className={card}>
        <SectionHead n={1} title="Informações básicas" sub="Adicione as principais informações do evento." />

        <label className={labelCls}>Nome do evento<Req /></label>
        <input
          className={input}
          maxLength={100}
          value={f.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Nome do evento"
        />
        <span className={hint}>{100 - f.title.length} caracteres restantes</span>

        <label className={clsx(labelCls, "mt-5")}>Imagem de divulgação (opcional)</label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) upload(file);
            }}
            className="relative flex h-[150px] w-full max-w-[280px] cursor-pointer items-center justify-center overflow-hidden rounded-[10px] border-[1.5px] border-dashed border-tinta bg-papel-2 text-center"
          >
            {f.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.coverUrl} alt="Capa" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-2 px-4 text-tinta-60">
                <Icon icon="lucide:image-plus" style={{ fontSize: 26 }} />
                <span className="text-[13px]">
                  {uploading ? "Enviando..." : "Clique ou arraste a imagem aqui"}
                </span>
              </span>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file);
              }}
            />
          </label>
          <div className="flex-1">
            <p className="corpo-suave">
              Formatos aceitos: JPEG, GIF ou PNG de até 2MB. Dimensão recomendada: 1600×838px.
            </p>
            {f.coverUrl && (
              <button
                type="button"
                onClick={() => set("coverUrl", "")}
                className="mt-2 text-[13px] text-sol-escuro underline underline-offset-2"
              >
                Remover imagem
              </button>
            )}
          </div>
        </div>

        <p className="rotulo mt-6 text-tinta-60">Classifique seu evento</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Assunto<Req /></label>
            <select className={input} value={f.category} onChange={(e) => set("category", e.target.value)}>
              <option value="">Selecione um assunto</option>
              {ASSUNTOS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Categoria (opcional)</label>
            <input
              className={input}
              value={f.subcategory}
              onChange={(e) => set("subcategory", e.target.value)}
              placeholder="Ex.: Sertanejo, Stand-up..."
            />
          </div>
        </div>

        {/* "Tema da página" escondido desde 01/10/2026: a página clara do evento usa a
            imagem do evento e cores neutras e ignora o tema. O campo segue salvo
            (f.theme) — para voltar, reexibir o seletor de TEMAS (lib/arte). */}
        {MOSTRAR_TEMA && (
          <>
            <p className="rotulo mt-6 text-tinta-60">Tema da página</p>
            <p className="corpo-suave mt-1">A cor que pinta a página do evento (o pôster). Automático segue a categoria.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {TEMAS.map((t) => (
                <button
                  key={t.value || "auto"}
                  type="button"
                  onClick={() => set("theme", t.value)}
                  className={clsx(
                    "flex items-center gap-2 rounded-[var(--radius-pill)] border-[1.5px] px-3 py-2 text-[13px] font-medium transition-colors",
                    f.theme === t.value ? "border-sol bg-papel-2 text-tinta" : "border-tinta text-tinta hover:bg-papel-2"
                  )}
                >
                  <span className="h-4 w-4 rounded-full border-[1.5px] border-tinta" style={{ background: t.swatch }} />
                  {t.label}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {/* 2. Data e horário */}
      <section className={card}>
        <SectionHead n={2} title="Data e horário" sub="Informe aos participantes quando seu evento vai acontecer." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelCls}>Data de Início<Req /></label>
            <input type="date" className={input} value={f.date} onChange={(e) => set("date", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Hora de Início<Req /></label>
            <input type="time" className={input} value={f.time} onChange={(e) => set("time", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Data de Término</label>
            <input type="date" className={input} value={f.endDate} onChange={(e) => set("endDate", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Hora de Término</label>
            <input type="time" className={input} value={f.endTime} onChange={(e) => set("endTime", e.target.value)} />
          </div>
        </div>
        {durTxt && <p className="corpo mt-3">Seu evento vai durar <strong>{durTxt}</strong>.</p>}
      </section>

      {/* 3. Descrição */}
      <section className={card}>
        <SectionHead n={3} title="Descrição do evento" sub="Conte todos os detalhes: programação, atrações e os diferenciais da sua produção!" />
        <RichText value={f.description} onChange={(html) => set("description", html)} />
      </section>

      {/* 4. Local */}
      <section className={card}>
        <SectionHead n={4} title="Onde o seu evento vai acontecer?" />
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Nome do Local<Req /></label>
            <input
              className={input}
              maxLength={100}
              value={f.venue}
              onChange={(e) => set("venue", e.target.value)}
              placeholder="Ex.: Teatro Municipal"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>CEP</label>
              <input
                className={input}
                value={f.cep}
                inputMode="numeric"
                onChange={(e) => {
                  const masked = maskCEP(e.target.value);
                  set("cep", masked);
                  if (masked.replace(/\D/g, "").length === 8) lookupCep(masked); // autofill ao completar
                }}
                onBlur={(e) => lookupCep(e.target.value)}
                placeholder="_____-___"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Av./Rua<Req /></label>
              <input className={input} value={f.address} onChange={(e) => set("address", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Número</label>
              <input className={input} value={f.addressNumber} onChange={(e) => set("addressNumber", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Complemento</label>
              <input
                className={input}
                maxLength={250}
                value={f.addressComplement}
                onChange={(e) => set("addressComplement", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Bairro</label>
              <input className={input} value={f.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Cidade<Req /></label>
              <input className={input} value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="Preenchido pelo CEP" />
            </div>
            <div>
              <label className={labelCls}>Estado<Req /></label>
              <input className={input} value={f.state} onChange={(e) => set("state", e.target.value)} placeholder="UF" />
            </div>
          </div>
          <label className="mt-1 flex cursor-pointer items-center gap-2.5 text-[14px] text-tinta">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--color-sol)]"
              checked={f.showOnMaps}
              onChange={(e) => set("showOnMaps", e.target.checked)}
            />
            Mostrar o endereço no Google Maps
          </label>
        </div>
      </section>

      {/* 5. Ingressos */}
      <section className={card}>
        <SectionHead n={5} title="Ingressos" />
        <p className="corpo-suave text-center">O que você deseja criar?</p>
        <p className="corpo-suave mt-1 text-center">
          Você recebe o valor cheio do lote: a taxa de serviço da Elleva
          (padrão 10%, negociável) é paga pelo comprador, por fora.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          <Button variante="contorno" type="button" onClick={() => addTier({})}>
            <Icon icon="lucide:plus" style={{ fontSize: 16 }} /> Ingresso pago
          </Button>
          <Button variante="contorno" type="button" onClick={() => addTier({ isFree: true })}>
            <Icon icon="lucide:plus" style={{ fontSize: 16 }} /> Ingresso gratuito
          </Button>
          <Button variante="contorno" type="button" onClick={() => addTier({ isHalf: true })}>
            <Icon icon="lucide:plus" style={{ fontSize: 16 }} /> Meia-entrada
          </Button>
          <Button variante="contorno" type="button" onClick={() => addTier({ isAddon: true })}>
            <Icon icon="lucide:plus" style={{ fontSize: 16 }} /> Produto/adicional
          </Button>
        </div>
        <p className="corpo-suave mt-2 text-center text-[12.5px] text-tinta-60">
          Produto/adicional (copo, camiseta, estacionamento) é vendido junto, mas não gera QR de entrada.
        </p>
        <p className="corpo-suave mt-1 text-center text-[12.5px] text-tinta-60">
          Meia-entrada: por lei, ofereça pelo menos 40% dos ingressos a metade do preço (defina o preço
          e a cota na capacidade do lote). O comprador apresenta documento na entrada.
        </p>

        {f.tiers.length > 0 && (
          <div className="mt-6 flex flex-col gap-3">
            {f.tiers.map((t, i) => (
              <div key={i} className="rounded-[10px] border-[1.5px] border-tinta p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rotulo text-tinta-60">
                    {t.isAddon ? "Produto/adicional" : t.isHalf ? "Meia-entrada" : t.isFree ? "Ingresso gratuito" : "Ingresso pago"}
                  </span>
                  <button
                    type="button"
                    onClick={() => rmTier(i)}
                    aria-label="Remover ingresso"
                    // área de toque 42px (era 18px, o ícone): apaga o lote. -m-3 compensa o p-3.
                    className="-m-3 flex rounded-[10px] p-3 text-tinta-60 hover:text-sol-escuro"
                  >
                    <Icon icon="lucide:trash-2" style={{ fontSize: 18 }} />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_0.8fr]">
                  <input
                    className={input}
                    placeholder={`Nome (ex.: ${f.nomenclature} inteira)`}
                    value={t.name}
                    onChange={(e) => setTier(i, "name", e.target.value)}
                  />
                  {!t.isFree && (
                    <input
                      className={input}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Preço (R$)"
                      value={t.price}
                      onChange={(e) => setTier(i, "price", e.target.value)}
                    />
                  )}
                  <input
                    className={input}
                    type="number"
                    min="1"
                    placeholder="Quantidade"
                    value={t.capacity}
                    onChange={(e) => setTier(i, "capacity", e.target.value)}
                  />
                </div>
                <input
                  className={clsx(input, "mt-3")}
                  placeholder="Descrição (opcional)"
                  value={t.description}
                  onChange={(e) => setTier(i, "description", e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Assentos marcados (opt-in) */}
        <div className="mt-6 rounded-[10px] border-[1.5px] border-tinta p-4">
          <label className="flex cursor-pointer items-start gap-2.5 text-[14px] text-tinta">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-[var(--color-sol)]"
              checked={f.hasSeating}
              onChange={(e) => set("hasSeating", e.target.checked)}
            />
            <span>
              <strong>Assentos marcados</strong> — o comprador escolhe o lugar no mapa.
              <span className="corpo-suave block">Deixe desligado para venda por quantidade (geral). Cada setor vira uma grade de fileiras × assentos, com o preço do lote escolhido.</span>
            </span>
          </label>

          {f.hasSeating && (
            <div className="mt-4 flex flex-col gap-3">
              {f.sectors.map((sec, i) => {
                const seatTiers = f.tiers
                  .map((t, idx) => ({ t, idx }))
                  .filter(({ t }) => !t.isAddon);
                const n = (Number(sec.rows) || 0) * (Number(sec.cols) || 0);
                return (
                  <div key={i} className="rounded-[8px] border-[1.5px] border-tinta/50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rotulo text-tinta-60">Setor {i + 1}</span>
                      <button type="button" onClick={() => rmSector(i)} aria-label="Remover setor" className="text-tinta-60 hover:text-sol-escuro">
                        <Icon icon="lucide:trash-2" style={{ fontSize: 16 }} />
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[1.3fr_1.1fr_0.7fr_0.7fr]">
                      <input className={input} placeholder="Nome (ex.: Plateia)" value={sec.name} onChange={(e) => setSector(i, "name", e.target.value)} />
                      <select className={input} value={sec.tierIndex} onChange={(e) => setSector(i, "tierIndex", Number(e.target.value))}>
                        {seatTiers.length === 0 && <option value={0}>Crie um ingresso antes</option>}
                        {seatTiers.map(({ t, idx }) => (
                          <option key={idx} value={idx}>{t.name || `Lote ${idx + 1}`}</option>
                        ))}
                      </select>
                      <input className={input} type="number" min="1" placeholder="Fileiras" value={sec.rows} onChange={(e) => setSector(i, "rows", e.target.value)} />
                      <input className={input} type="number" min="1" placeholder="Assentos/fila" value={sec.cols} onChange={(e) => setSector(i, "cols", e.target.value)} />
                    </div>
                    {n > 0 && <p className="corpo-suave mt-1.5">{n} assento(s) neste setor (fileiras A, B, C…).</p>}
                  </div>
                );
              })}
              <Button variante="contorno" type="button" onClick={addSector} className="self-start">
                <Icon icon="lucide:plus" style={{ fontSize: 16 }} /> Adicionar setor
              </Button>
              <p className="corpo-suave text-[12.5px] text-tinta-60">
                A capacidade passa a ser o total de assentos do mapa. Edite o mapa antes de começar a vender — depois da primeira venda ele fica travado.
              </p>
            </div>
          )}
        </div>

        {/* Configurações */}
        <div className="mt-6 rounded-[10px] border-[1.5px] border-tinta p-4">
          <p className="rotulo mb-3 text-tinta-60">Configurações</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-tinta">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--color-sol)]"
                checked={f.absorbFee}
                onChange={(e) => set("absorbFee", e.target.checked)}
              />
              Absorver a taxa de serviço
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[14px] text-tinta">Nomenclatura:</span>
              <select
                className={clsx(input, "w-auto py-2")}
                value={f.nomenclature}
                onChange={(e) => set("nomenclature", e.target.value)}
              >
                <option>Ingresso</option>
                <option>Inscrição</option>
                <option>Convite</option>
                <option>Doação</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Sobre o produtor */}
      <section className={card}>
        <SectionHead
          n={6}
          title="Sobre o produtor"
          sub="Conte um pouco sobre você ou a sua empresa — mostra ao público quem está por trás do evento."
        />
        <label className={labelCls}>Nome<Req /></label>
        <input
          className={input}
          maxLength={60}
          value={f.producerName}
          onChange={(e) => set("producerName", e.target.value)}
        />
        <span className={hint}>{60 - f.producerName.length} caracteres restantes</span>

        <label className={clsx(labelCls, "mt-4")}>Descrição do produtor (opcional)</label>
        <textarea
          className={clsx(input, "min-h-[110px] resize-y")}
          maxLength={500}
          value={f.producerBio}
          onChange={(e) => set("producerBio", e.target.value)}
        />
        <span className={hint}>{500 - f.producerBio.length} caracteres restantes</span>
      </section>

      {/* 7. Rastreamento (opcional) */}
      <section className={card}>
        <SectionHead
          n={7}
          title="Rastreamento (opcional)"
          sub="Meça sua divulgação. Os pixels só disparam com o consentimento de cookies do visitante (LGPD)."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Meta Pixel ID</label>
            <input className={input} value={f.trackingMetaPixel} onChange={(e) => set("trackingMetaPixel", e.target.value)} placeholder="Ex.: 123456789012345" />
          </div>
          <div>
            <label className={labelCls}>Google Analytics (GA4)</label>
            <input className={input} value={f.trackingGa} onChange={(e) => set("trackingGa", e.target.value)} placeholder="Ex.: G-XXXXXXX" />
          </div>
        </div>
      </section>

      {/* 8. Certificado de participação (opcional) */}
      <section className={card}>
        <SectionHead
          n={8}
          title="Certificado de participação"
          sub="Ideal para palestras, cursos e congressos. O participante baixa o certificado depois do evento — só quem fez check-in."
        />
        <label className="flex cursor-pointer items-start gap-2.5 text-[14px] text-tinta">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-[var(--color-sol)]"
            checked={f.certificateEnabled}
            onChange={(e) => set("certificateEnabled", e.target.checked)}
          />
          <span><strong>Emitir certificado</strong> para este evento.</span>
        </label>

        {f.certificateEnabled && (
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label className={labelCls}>Título</label>
              <input className={input} maxLength={80} placeholder="Certificado de Participação" value={f.certificateTitle} onChange={(e) => set("certificateTitle", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Texto do certificado</label>
              <textarea
                className={clsx(input, "min-h-[90px] resize-y")}
                maxLength={600}
                placeholder="Certificamos que {nome} participou do evento {evento}, realizado em {data}, na cidade de {cidade}."
                value={f.certificateBody}
                onChange={(e) => set("certificateBody", e.target.value)}
              />
              <span className="corpo-suave mt-1 block">
                Use as variáveis <code>{"{nome}"}</code>, <code>{"{evento}"}</code>, <code>{"{data}"}</code>, <code>{"{cidade}"}</code>, <code>{"{horas}"}</code> — o sistema preenche cada uma automaticamente. Em branco, usamos um texto padrão.
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Carga horária (opcional)</label>
                <input className={input} maxLength={40} placeholder="Ex.: 8 horas" value={f.certificateHours} onChange={(e) => set("certificateHours", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Assinado por (opcional)</label>
                <input className={input} maxLength={80} placeholder="Ex.: Maria Silva — Coordenadora" value={f.certificateSigner} onChange={(e) => set("certificateSigner", e.target.value)} />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 9. Responsabilidades */}
      <section className={card}>
        <SectionHead n={9} title="Responsabilidades" />
        <label className="flex cursor-pointer items-start gap-3 text-[14px] leading-relaxed text-tinta">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 flex-shrink-0 accent-[var(--color-sol)]"
            checked={f.accepted}
            onChange={(e) => set("accepted", e.target.checked)}
          />
          <span>
            Ao publicar este evento, declaro estar de acordo com os{" "}
            <a href="/terms" target="_blank" className="text-sol-escuro underline underline-offset-2">Termos de Uso</a> e a{" "}
            <a href="/privacy" target="_blank" className="text-sol-escuro underline underline-offset-2">Política de Privacidade</a>,
            e ciente das obrigações legais aplicáveis, incluindo regras de acessibilidade.
          </span>
        </label>
      </section>

      {error && (
        <p ref={errorRef} className="rounded-[10px] border-[1.5px] border-sol bg-[rgb(232_72_31/0.08)] px-4 py-3 text-[14px] text-sol-escuro">
          {error}
        </p>
      )}

      {/* Rodapé de ações */}
      <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center justify-between gap-4 border-t-[1.5px] border-tinta bg-papel px-5 py-4 sm:-mx-10 sm:px-10">
        <div className="flex items-center gap-2 text-[14px] text-tinta">
          <span>Visibilidade:</span>
          <label className="flex cursor-pointer items-center gap-1.5">
            <input type="radio" name="vis" className="accent-[var(--color-sol)]" checked={f.visibility === "public"} onChange={() => set("visibility", "public")} />
            Público
          </label>
          <label className="flex cursor-pointer items-center gap-1.5">
            <input type="radio" name="vis" className="accent-[var(--color-sol)]" checked={f.visibility === "private"} onChange={() => set("visibility", "private")} />
            Privado
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={rascunho}
            disabled={saving}
            className="text-[15px] font-medium text-tinta hover:text-sol-escuro disabled:opacity-50"
          >
            Salvar rascunho
          </button>
          <Button variante="contorno" type="button" onClick={preview} disabled={saving}>
            Pré-visualizar
          </Button>
          <Button variante="primario" type="button" onClick={publicar} disabled={saving}>
            {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Publicar Evento"}
          </Button>
        </div>
      </div>

      {notice && (
        <Modal open onClose={() => { const g = notice.go; setNotice(null); g(); }} title="Evento salvo" maxWidth={460}>
          <p className="corpo-suave m-0 mt-1">{notice.msg}</p>
          <div className="mt-5 flex justify-end">
            <Button variante="tinta" type="button" onClick={() => { const g = notice.go; setNotice(null); g(); }}>
              Entendi
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Editor rich-text simples (B/I/U, listas, link) ──────────────────────────
function RichText({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const selRef = useRef<Range | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  // Sincroniza o HTML no DOM só quando o editor NÃO está focado (carga inicial /
  // edição de evento). Enquanto digita, não re-injetamos innerHTML — senão o
  // cursor pula pro começo a cada tecla (texto "corre pra trás").
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.innerHTML !== (value ?? "")) {
      el.innerHTML = value ?? "";
    }
  }, [value]);
  const cmd = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    onChange(ref.current?.innerHTML ?? "");
  };
  const btn =
    "flex h-10 w-10 items-center justify-center rounded-[6px] text-tinta hover:bg-papel-2";
  return (
    <div className="overflow-hidden rounded-[10px] border-[1.5px] border-tinta">
      <div className="flex flex-wrap items-center gap-1 border-b-[1.5px] border-tinta bg-papel-2 p-1.5">
        <button type="button" className={btn} onMouseDown={(e) => e.preventDefault()} onClick={() => cmd("bold")} aria-label="Negrito"><b>B</b></button>
        <button type="button" className={btn} onMouseDown={(e) => e.preventDefault()} onClick={() => cmd("italic")} aria-label="Itálico"><i>I</i></button>
        <button type="button" className={btn} onMouseDown={(e) => e.preventDefault()} onClick={() => cmd("underline")} aria-label="Sublinhado"><u>U</u></button>
        <span className="mx-1 h-5 w-px bg-tinta/20" />
        <button type="button" className={btn} onMouseDown={(e) => e.preventDefault()} onClick={() => cmd("insertUnorderedList")} aria-label="Lista"><Icon icon="lucide:list" style={{ fontSize: 17 }} /></button>
        <button type="button" className={btn} onMouseDown={(e) => e.preventDefault()} onClick={() => cmd("insertOrderedList")} aria-label="Lista numerada"><Icon icon="lucide:list-ordered" style={{ fontSize: 17 }} /></button>
        <button
          type="button"
          className={btn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            // guarda a seleção: abrir o modal tira o foco do editor e a seleção some
            const sel = window.getSelection();
            selRef.current = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
            setLinkOpen(true);
          }}
          aria-label="Link"
        >
          <Icon icon="lucide:link" style={{ fontSize: 16 }} />
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML ?? "")}
        data-placeholder="Adicione aqui a descrição do seu evento..."
        dir="ltr"
        role="textbox"
        aria-multiline="true"
        aria-label="Descrição do evento"
        className="min-h-[180px] px-4 py-3 text-[16px] leading-relaxed text-tinta outline-none [&:empty::before]:text-tinta-35 [&:empty::before]:content-[attr(data-placeholder)]"
      />

      <PromptDialog
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        onSubmit={(url) => {
          setLinkOpen(false);
          // devolve o foco e a seleção antes de aplicar o link
          ref.current?.focus();
          const sel = window.getSelection();
          if (selRef.current && sel) {
            sel.removeAllRanges();
            sel.addRange(selRef.current);
          }
          const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
          cmd("createLink", href);
        }}
        title="Inserir link"
        message="Selecione o texto antes de clicar no link para aplicá-lo nele."
        label="Endereço"
        placeholder="https://..."
        confirmLabel="Inserir"
        validate={(v) => (v.trim().length > 3 ? null : "Informe o endereço do link.")}
      />
    </div>
  );
}
