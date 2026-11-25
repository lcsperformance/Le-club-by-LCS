"use client";

import { useEffect, useState } from "react";
import { nonLusApresMessage, type Canal } from "@/lib/club";
import { createClient } from "@/lib/supabase/client";
import { ListeCanaux } from "./ListeCanaux";

/**
 * Liste des canaux à côté d'un canal ouvert (ordinateur) : les badges de non-lus des autres canaux
 * montent en direct quand un message arrive, sans recharger la page (le fil du canal ouvert,
 * FilMessages, a son propre abonnement). Un message supprimé est pris en compte au changement de canal.
 * direct : désactivé dans les aperçus.
 */
export function ListeCanauxEnDirect({
  canaux,
  nonLus: initiaux,
  monBloc,
  actif,
  moi,
  direct = true,
}: {
  canaux: Canal[];
  nonLus: Record<string, number>;
  monBloc: string | null;
  actif: string;
  moi: string;
  direct?: boolean;
}) {
  const [nonLus, setNonLus] = useState(initiaux);

  useEffect(() => {
    if (!direct) return;
    const supabase = createClient();
    const abonnement = supabase
      .channel(`club-liste-${actif}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages_club" }, (p) => {
        const m = p.new as { canal?: unknown; membre_id?: unknown };
        if (typeof m.canal !== "string" || typeof m.membre_id !== "string") return;
        setNonLus((actuels) => nonLusApresMessage(actuels, { canal: m.canal as string, membre_id: m.membre_id as string }, actif, moi));
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(abonnement);
    };
  }, [direct, actif, moi]);

  return <ListeCanaux canaux={canaux} nonLus={nonLus} monBloc={monBloc} actif={actif} />;
}
