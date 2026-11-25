import Link from "next/link";
import { EnTeteMembre } from "@/components/EnTeteMembre";
import { Carte, DeuxColonnes, SurOrdinateur } from "@/components/ui";
import type { Utilisateur } from "@/lib/auth";
import type { Canal } from "@/lib/club";
import { ActualiserEnDirect } from "./ActualiserEnDirect";
import { ListeCanaux } from "./ListeCanaux";
import styles from "./club.module.css";

/** Onglets du Club (maquette) : Discussion, Questions, Agenda. */
export function OngletsClub({ actif }: { actif: "discussion" | "questions" | "agenda" }) {
  const onglets = [
    { cle: "discussion", libelle: "Discussion", href: "/club" },
    { cle: "questions", libelle: "Questions", href: "/club/questions" },
    { cle: "agenda", libelle: "Agenda", href: "/club/agenda" },
  ] as const;
  return (
    <nav className={styles.onglets} aria-label="Rubriques du Club">
      {onglets.map((o) => (
        <Link key={o.cle} href={o.href} className={styles.onglet} aria-current={o.cle === actif ? "page" : undefined}>
          {o.libelle}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Le Club (maquette) : la liste des canaux collectifs, avec le badge de non-lus et « Mon bloc ».
 * direct : met à jour les badges dès qu'un message arrive (désactivé dans les aperçus).
 */
export function EcranClub({
  utilisateur,
  canaux,
  nonLus,
  monBloc,
  direct = true,
}: {
  utilisateur: Utilisateur;
  canaux: Canal[];
  nonLus: Record<string, number>;
  monBloc: string | null;
  direct?: boolean;
}) {
  return (
    <>
      <EnTeteMembre utilisateur={utilisateur} titre="Le Club" />
      <OngletsClub actif="discussion" />
      {/* Sur ordinateur : la liste à gauche ; à droite, l'invitation à ouvrir un canal. */}
      <DeuxColonnes
        liste
        principale={<ListeCanaux canaux={canaux} nonLus={nonLus} monBloc={monBloc} />}
        laterale={
          <SurOrdinateur>
            <Carte className={styles.choisirCanal}>
              <span className={styles.diese} aria-hidden>
                #
              </span>
              <p className={styles.choisirCanalTexte}>Choisis un canal pour lire et écrire.</p>
            </Carte>
          </SurOrdinateur>
        }
      />
      {direct && <ActualiserEnDirect />}
    </>
  );
}
