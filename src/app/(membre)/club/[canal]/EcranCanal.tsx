import Link from "next/link";
import type { ReactNode } from "react";
import { DeuxColonnes, SurOrdinateur, SurTelephone } from "@/components/ui";
import { peutEcrire, type Canal, type Message } from "@/lib/club";
import styles from "../club.module.css";
import { FilMessages } from "./FilMessages";

/**
 * Un canal du Club (maquette) : titre, rappel « pas de messages privés », fil en direct, envoi.
 * liste : la liste des canaux, affichée à gauche du fil sur ordinateur seulement.
 */
export function EcranCanal({
  canal,
  messages,
  encore,
  aujourdhui,
  moi,
  direct = true,
  liste = null,
}: {
  canal: Canal;
  messages: Message[];
  encore: boolean;
  aujourdhui: string;
  moi: { id: string; role: string };
  direct?: boolean;
  liste?: ReactNode;
}) {
  const ecriture = peutEcrire(canal, moi.role);
  return (
    <DeuxColonnes
      liste
      principale={liste && <SurOrdinateur>{liste}</SurOrdinateur>}
      laterale={
        <>
          {/* Sur ordinateur, la liste des canaux est déjà à côté. */}
          <SurTelephone>
            <Link href="/club" className={styles.retour}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M15 5l-7 7 7 7" />
              </svg>
              Canaux
            </Link>
          </SurTelephone>
          <header>
            <h1 className="titre" style={{ fontSize: 22, lineHeight: 1.15 }}>
              # {canal.nom}
            </h1>
            <p className={styles.description}>{canal.description}</p>
          </header>
          {!canal.lecture_seule && (
            <p className={styles.bandeau}>
              Entre membres ici. Une question pour le coach ?{" "}
              <Link href="/club/questions" className="lien">
                Pose-la dans la boîte à questions
              </Link>{" "}
              : pas de messages privés, tout le monde profite des réponses en FAQ.
            </p>
          )}
          <FilMessages
            key={canal.cle}
            canal={canal}
            initiaux={messages}
            encore={encore}
            aujourdhui={aujourdhui}
            moi={moi}
            peutEcrire={ecriture}
            direct={direct}
          />
        </>
      }
    />
  );
}
