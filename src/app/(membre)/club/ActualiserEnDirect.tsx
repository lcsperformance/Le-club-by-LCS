"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** Liste des canaux : dès qu'un message arrive ou disparaît, les badges de non-lus sont recalculés. */
export function ActualiserEnDirect() {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    let attente: ReturnType<typeof setTimeout> | null = null;
    const actualiser = () => {
      // Plusieurs messages d'un coup : une seule actualisation.
      if (attente) return;
      attente = setTimeout(() => {
        attente = null;
        router.refresh();
      }, 400);
    };
    const abonnement = supabase
      .channel("club-canaux")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages_club" }, actualiser)
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages_club" }, actualiser)
      .subscribe();
    return () => {
      if (attente) clearTimeout(attente);
      void supabase.removeChannel(abonnement);
    };
  }, [router]);
  return null;
}
