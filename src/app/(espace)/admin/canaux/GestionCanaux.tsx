"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { RetourAdmin } from "@/app/(espace)/admin/ressources/EcranAdminRessources";
import styles from "@/app/(espace)/admin/ressources/admin-ressources.module.css";
import { BoutonPrincipal, BoutonSecondaire, Carte, Champ, FeuilleModale } from "@/components/ui";
import { CANAL_PROTEGE } from "@/lib/admin/canaux";
import type { Canal } from "@/lib/club";
import { enregistrerCanal, supprimerCanal, type ResultatCanal } from "./actions";

/**
 * Canaux du Club (admin) : ajouter, renommer, réordonner, passer en « annonces seulement »,
 * supprimer définitivement (avec ses messages, après une confirmation).
 * Les canaux sont toujours collectifs : lisibles par tous les membres, pas de canal privé.
 */
export function GestionCanaux({ canaux, messagesParCanal }: { canaux: Canal[]; messagesParCanal: Record<string, number> }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null);
  const [aSupprimer, setASupprimer] = useState<Canal | null>(null);
  const [enCours, demarrer] = useTransition();

  const lancer = (action: () => Promise<ResultatCanal>, reussite: (r: ResultatCanal) => string, ensuite?: () => void) => {
    setMessage(null);
    demarrer(async () => {
      const r = await action();
      if (r.erreur) {
        setMessage({ texte: r.erreur, erreur: true });
        return;
      }
      setMessage({ texte: reussite(r), erreur: false });
      ensuite?.();
      router.refresh();
    });
  };

  return (
    <>
      <RetourAdmin />
      <header>
        <h1 className="titre" style={{ fontSize: 26 }}>
          Canaux du Club
        </h1>
        <p className={styles.aide} style={{ marginTop: 6 }}>
          Tous les canaux sont collectifs : chaque membre les lit. Pas de canal privé, pas de message privé.
        </p>
      </header>
      <p role={message?.erreur ? "alert" : "status"} className={message?.erreur ? "message-erreur" : styles.aide} hidden={!message}>
        {message?.texte}
      </p>
      <ul className={styles.liste}>
        {canaux.map((c) => (
          <Carte as="li" key={c.cle} className={styles.formulaire} style={{ alignContent: "start" }}>
            <FormulaireCanal
              canal={c}
              nbMessages={messagesParCanal[c.cle] ?? 0}
              enCours={enCours}
              onValider={(saisie) => lancer(() => enregistrerCanal(c.cle, saisie), () => `# ${String(saisie.nom)} enregistré ✓`)}
              onSupprimer={() => setASupprimer(c)}
            />
          </Carte>
        ))}
      </ul>
      <Carte as="section" aria-labelledby="titre-nouveau-canal" className={styles.formulaire}>
        <h2 id="titre-nouveau-canal" className={styles.themeNom}>
          Nouveau canal
        </h2>
        <FormulaireCanal
          ordreParDefaut={Math.min(99, Math.max(0, ...canaux.map((c) => c.ordre)) + 1)}
          enCours={enCours}
          onValider={(saisie) => lancer(() => enregistrerCanal(null, saisie), () => `# ${String(saisie.nom)} ajouté ✓`)}
        />
      </Carte>
      {aSupprimer && (
        <FenetreSuppression
          canal={aSupprimer}
          nbMessages={messagesParCanal[aSupprimer.cle] ?? 0}
          enCours={enCours}
          fermer={() => setASupprimer(null)}
          confirmer={() =>
            lancer(
              () => supprimerCanal(aSupprimer.cle),
              (r) => `# ${aSupprimer.nom} supprimé, avec ${r.supprimes ?? 0} message${(r.supprimes ?? 0) > 1 ? "s" : ""}.`,
              () => setASupprimer(null),
            )
          }
        />
      )}
    </>
  );
}

function FormulaireCanal({
  canal,
  nbMessages = 0,
  ordreParDefaut = 1,
  enCours,
  onValider,
  onSupprimer,
}: {
  canal?: Canal;
  nbMessages?: number;
  ordreParDefaut?: number;
  enCours: boolean;
  onValider: (saisie: Record<string, unknown>) => void;
  onSupprimer?: () => void;
}) {
  const [nom, setNom] = useState(canal?.nom ?? "");
  const [description, setDescription] = useState(canal?.description ?? "");
  const [lectureSeule, setLectureSeule] = useState(canal?.lecture_seule ?? false);
  const [ordre, setOrdre] = useState(String(canal?.ordre ?? ordreParDefaut));
  const id = canal?.cle ?? "nouveau";
  const protege = canal?.cle === CANAL_PROTEGE;

  return (
    <form
      className={styles.formulaire}
      aria-label={canal ? `Canal # ${canal.nom}` : "Nouveau canal"}
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onValider({ nom, description, lecture_seule: protege || lectureSeule, ordre });
        if (!canal) {
          setNom("");
          setDescription("");
          setLectureSeule(false);
        }
      }}
    >
      {canal && (
        <p className={styles.aide}>
          Adresse : /club/{canal.cle} · {nbMessages} message{nbMessages > 1 ? "s" : ""}
        </p>
      )}
      <div className={styles.ligneSousRubrique}>
        <Champ libelle="Nom" name={`nom-canal-${id}`} value={nom} maxLength={30} onChange={(e) => setNom(e.target.value)} />
        <div className={styles.ordre}>
          <Champ libelle="Ordre" name={`ordre-canal-${id}`} type="number" min={1} max={99} inputMode="numeric" value={ordre} onChange={(e) => setOrdre(e.target.value)} />
        </div>
      </div>
      <Champ libelle="Description" name={`description-canal-${id}`} value={description} maxLength={80} onChange={(e) => setDescription(e.target.value)} />
      <label style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44, cursor: protege ? "default" : "pointer" }}>
        <input
          type="checkbox"
          style={{ width: 22, height: 22, accentColor: "var(--accent)" }}
          checked={protege || lectureSeule}
          disabled={protege}
          onChange={(e) => setLectureSeule(e.target.checked)}
        />
        <span className={styles.libelle} style={{ color: "var(--texte)", fontSize: 14 }}>
          Seule l&apos;équipe du Club publie (comme « annonces »)
        </span>
      </label>
      {protege && <p className={styles.aide}>« annonces » sert aux notifications : il reste réservé à l&apos;équipe et ne peut pas être supprimé.</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <BoutonPrincipal type="submit" compact disabled={enCours}>
          {canal ? "Enregistrer" : "Ajouter le canal"}
        </BoutonPrincipal>
        {canal && !protege && onSupprimer && (
          <BoutonSecondaire type="button" compact className={styles.danger} onClick={onSupprimer} disabled={enCours}>
            Supprimer
          </BoutonSecondaire>
        )}
      </div>
    </form>
  );
}

/** Suppression définitive : une confirmation, avec le nombre de messages qui partent avec le canal. */
function FenetreSuppression({
  canal,
  nbMessages,
  enCours,
  fermer,
  confirmer,
}: {
  canal: Canal;
  nbMessages: number;
  enCours: boolean;
  fermer: () => void;
  confirmer: () => void;
}) {
  return (
    <FeuilleModale titre={`Supprimer # ${canal.nom}`} fermer={fermer}>
      <p className="message-erreur">
        Le canal et ses {nbMessages} message{nbMessages > 1 ? "s" : ""} seront supprimés définitivement. Cette action ne peut pas être annulée.
      </p>
      <BoutonPrincipal type="button" disabled={enCours} onClick={confirmer}>
        Supprimer définitivement
      </BoutonPrincipal>
      <BoutonSecondaire type="button" onClick={fermer} disabled={enCours}>
        Annuler
      </BoutonSecondaire>
    </FeuilleModale>
  );
}
