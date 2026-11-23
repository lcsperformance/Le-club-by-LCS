"use client";

import { useEffect } from "react";

/**
 * Enregistre le petit programme de l'app (public/sw.js), qui affiche « Pas de connexion » sans réseau.
 * Seulement sur l'app compilée : en développement, rien n'est enregistré.
 */
export function EnregistrementApp() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Sans programme, l'app fonctionne normalement ; seule la page hors ligne manque.
    });
  }, []);
  return null;
}
