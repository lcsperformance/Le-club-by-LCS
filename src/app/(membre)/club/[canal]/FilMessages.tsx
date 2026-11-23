"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import {
  fusionnerMessages,
  groupesParJour,
  heureMessage,
  initialeAuteur,
  libelleRole,
  LONGUEUR_MAX_MESSAGE,
  lireMessage,
  lireMessageRecu,
  retirerMessage,
  type Canal,
  type Message,
} from "@/lib/club";
import { createClient } from "@/lib/supabase/client";
import { envoyerMessage, messagesPrecedents, noterLecture, supprimerMessage } from "../actions";
import styles from "../club.module.css";

/**
 * Fil d'un canal, en direct : les nouveaux messages apparaissent et les messages supprimés disparaissent
 * sans recharger la page (Supabase Realtime ; la base n'envoie que ce que la personne a le droit de lire).
 * moi : la personne connectée (ses messages à droite, suppression des siens ; l'admin supprime tout).
 * direct : abonnement en direct (désactivé dans les aperçus).
 */
export function FilMessages({
  canal,
  initiaux,
  encore: encoreInitial,
  aujourdhui,
  moi,
  peutEcrire,
  direct = true,
}: {
  canal: Canal;
  initiaux: Message[];
  encore: boolean;
  aujourdhui: string;
  moi: { id: string; role: string };
  peutEcrire: boolean;
  direct?: boolean;
}) {
  const [messages, setMessages] = useState(initiaux);
  const [encore, setEncore] = useState(encoreInitial);
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  const bas = useRef<HTMLDivElement>(null);
  const premier = useRef(true);
  const dernierId = messages.at(-1)?.id;

  // Défile jusqu'au dernier message à l'ouverture, puis quand un nouveau message arrive en bas du fil.
  useEffect(() => {
    if (!dernierId) return;
    bas.current?.scrollIntoView({ block: "end", behavior: premier.current ? "auto" : "smooth" });
    premier.current = false;
  }, [dernierId]);

  useEffect(() => {
    if (!direct) return;
    const supabase = createClient();
    let lecture: ReturnType<typeof setTimeout> | null = null;
    const abonnement = supabase
      .channel(`club-${canal.cle}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages_club", filter: `canal=eq.${canal.cle}` }, (p) => {
        const m = lireMessageRecu(p.new);
        if (!m) return;
        setMessages((actuels) => fusionnerMessages(actuels, [m]));
        // On regarde le canal : le message est lu (une seule mise à jour pour une rafale).
        if (lecture) clearTimeout(lecture);
        lecture = setTimeout(() => void noterLecture(canal.cle), 1500);
      })
      // Une suppression n'envoie que l'identifiant du message.
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages_club" }, (p) => {
        const id = (p.old as { id?: string }).id;
        if (id) setMessages((actuels) => retirerMessage(actuels, id));
      })
      .subscribe();
    return () => {
      if (lecture) clearTimeout(lecture);
      void supabase.removeChannel(abonnement);
    };
  }, [canal.cle, direct]);

  function envoyer(e: FormEvent) {
    e.preventDefault();
    const lu = lireMessage(texte);
    if ("erreur" in lu) {
      setErreur(lu.erreur);
      return;
    }
    setErreur(null);
    demarrer(async () => {
      const r = await envoyerMessage(canal.cle, lu.texte);
      if (r.erreur) setErreur(r.erreur);
      else {
        setTexte("");
        if (r.message) setMessages((actuels) => fusionnerMessages(actuels, [r.message!]));
      }
    });
  }

  function supprimer(m: Message) {
    const sienne = m.membre_id === moi.id;
    if (!window.confirm(sienne ? "Supprimer ton message ?" : `Supprimer le message de ${m.auteur} ? La suppression sera notée dans le journal.`)) return;
    demarrer(async () => {
      const r = await supprimerMessage(m.id);
      if (r.erreur) setErreur(r.erreur);
      else setMessages((actuels) => retirerMessage(actuels, m.id));
    });
  }

  function precedents() {
    const avant = messages[0]?.cree_le;
    if (!avant) return;
    demarrer(async () => {
      const r = await messagesPrecedents(canal.cle, avant);
      if ("erreur" in r) setErreur(r.erreur);
      else {
        setMessages((actuels) => fusionnerMessages(r.messages, actuels));
        setEncore(r.encore);
      }
    });
  }

  return (
    <>
      <section className={styles.fil} aria-label={`Messages de # ${canal.nom}`} aria-live="polite">
        {encore && (
          <button type="button" className={styles.precedents} onClick={precedents} disabled={enCours}>
            Voir les messages précédents
          </button>
        )}
        {!messages.length && <p className={styles.vide}>Aucun message pour l&apos;instant. Lance la discussion.</p>}
        {groupesParJour(messages, aujourdhui).map((g) => (
          <div key={g.jour} style={{ display: "grid", gap: 12 }}>
            <p className={styles.jour}>{g.jour}</p>
            {g.messages.map((m) => {
              const mien = m.membre_id === moi.id;
              const role = libelleRole(m.auteur_role);
              return (
                <article key={m.id} className={`${styles.ligne} ${mien ? styles.ligneMienne : ""}`}>
                  {!mien && (
                    <span className={styles.avatar} aria-hidden>
                      {initialeAuteur(m.auteur)}
                    </span>
                  )}
                  <div className={styles.bulle}>
                    <p className={styles.entete}>
                      <span className={styles.auteur}>{mien ? "Toi" : m.auteur}</span>
                      {role && <span className={styles.role}>{role}</span>}
                      <span className={styles.heure}>{heureMessage(m.cree_le)}</span>
                    </p>
                    <p className={styles.texte}>{m.texte}</p>
                    {(mien || moi.role === "admin") && (
                      <button type="button" className={styles.supprimer} onClick={() => supprimer(m)} disabled={enCours}>
                        Supprimer
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ))}
        <div ref={bas} />
      </section>

      {erreur && (
        <p role="alert" className="message-erreur">
          {erreur}
        </p>
      )}
      {peutEcrire ? (
        <form className={styles.saisie} onSubmit={envoyer}>
          <input
            className={styles.champ}
            type="text"
            aria-label="Ton message"
            placeholder={`Écrire dans # ${canal.nom}`}
            value={texte}
            maxLength={LONGUEUR_MAX_MESSAGE}
            enterKeyHint="send"
            onChange={(e) => {
              setTexte(e.target.value);
              setErreur(null);
            }}
          />
          <button type="submit" className={styles.envoyer} aria-label="Envoyer" disabled={enCours}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--fond)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 12l16-8-6 16-3-7z" />
            </svg>
          </button>
        </form>
      ) : (
        <p className={styles.lectureSeule}>Seuls l&apos;équipe du Club et le coach publient ici.</p>
      )}
    </>
  );
}
