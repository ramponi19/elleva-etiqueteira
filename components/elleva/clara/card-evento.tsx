// Card de evento da grade (home e "outros eventos" na página do evento):
// capa com selo de data, nome, "Local, Cidade - UF" e a data por extenso.
import Image from "next/image";
import Link from "next/link";
import type { EventItem } from "@/lib/events";
import { FUNDO, dataExtensa, localCompleto } from "@/lib/evento-formato";

export function CardEvento({ e }: { e: EventItem }) {
  return (
    <Link href={`/evento/${e.id}`} className="card">
      <span className={"capa " + (e.cover ? "" : FUNDO[e.catLabel] ?? "g-show")}>
        {e.cover ? (
          <Image src={e.cover} alt="" fill sizes="(max-width: 760px) 100vw, (max-width: 1024px) 50vw, 400px" />
        ) : (
          <span className="capa-titulo" aria-hidden>{e.title}</span>
        )}
        <span className="selo-data" aria-hidden><b>{e.d}</b>{e.mon}</span>
        {e.soldOut && <span className="selo-esgotado">Esgotado</span>}
      </span>
      <strong className="card-titulo">{e.title}</strong>
      <span className="card-info">{localCompleto(e)}</span>
      <span className="card-info">{dataExtensa(e.startsAtISO)}</span>
    </Link>
  );
}
