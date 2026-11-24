/**
 * Notifications, côté navigateur : état de l'appareil, activation (après un toucher du membre), désactivation.
 * La fenêtre d'autorisation du téléphone n'est ouverte QUE par `activerSurCetAppareil`, appelée au toucher d'un bouton.
 */
import { appareilEnregistre, enregistrerAppareil, retirerAppareil } from "@/app/(membre)/notifications/actions";
import { estAppareilApple } from "./installation";

/** Clé publique d'envoi (VAPID), connue à la compilation ; sans elle, les notifications ne sont pas proposées. */
const CLE_PUBLIQUE = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export type EtatAppareil = {
  priseEnCharge: boolean;
  permission: NotificationPermission | null;
  abonne: boolean;
  apple: boolean;
  installee: boolean;
};

export const priseEnCharge = () =>
  !!CLE_PUBLIQUE && typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;

async function abonnementActuel(): Promise<PushSubscription | null> {
  if (!priseEnCharge()) return null;
  const inscription = await navigator.serviceWorker.getRegistration();
  return (await inscription?.pushManager.getSubscription()) ?? null;
}

/** État de cet appareil (sans rien demander au membre). */
export async function etatAppareil(): Promise<EtatAppareil> {
  const prise = priseEnCharge();
  const abonnement = prise ? await abonnementActuel() : null;
  return {
    priseEnCharge: prise,
    permission: prise ? Notification.permission : null,
    abonne: !!abonnement && (await appareilEnregistre(abonnement.endpoint)),
    apple: estAppareilApple(navigator.userAgent, navigator.maxTouchPoints),
    installee:
      window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true,
  };
}

/** Clé publique (base64 « url ») en octets, comme l'attend le navigateur. */
function enOctets(base64: string): Uint8Array<ArrayBuffer> {
  const complet = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const brut = atob(complet);
  const octets = new Uint8Array(new ArrayBuffer(brut.length));
  for (let i = 0; i < brut.length; i++) octets[i] = brut.charCodeAt(i);
  return octets;
}

/** À appeler au toucher d'un bouton : demande l'autorisation, puis enregistre l'appareil. */
export async function activerSurCetAppareil(): Promise<{ erreur?: string }> {
  if (!priseEnCharge()) return { erreur: "Cet appareil ne peut pas recevoir de notifications." };
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { erreur: "Notifications refusées. Tu peux les autoriser dans les réglages de ton téléphone." };
  try {
    const inscription = await navigator.serviceWorker.ready;
    const abonnement =
      (await inscription.pushManager.getSubscription()) ??
      (await inscription.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: enOctets(CLE_PUBLIQUE) }));
    return await enregistrerAppareil(abonnement.toJSON());
  } catch {
    return { erreur: "Impossible d'activer les notifications pour le moment. Réessaie dans un instant." };
  }
}

/** « Désactiver sur cet appareil » : plus aucune notification ici (les autres appareils ne changent pas). */
export async function desactiverSurCetAppareil(): Promise<{ erreur?: string }> {
  const abonnement = await abonnementActuel();
  if (!abonnement) return {};
  const resultat = await retirerAppareil(abonnement.endpoint);
  await abonnement.unsubscribe().catch(() => undefined);
  return resultat;
}
