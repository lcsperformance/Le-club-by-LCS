import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { destinataires, type MembreNotifiable, type Notification, type TypeNotification } from "./notifications";

/**
 * Clés d'envoi des notifications (VAPID). La clé publique est aussi donnée au navigateur.
 * Sans elles (tests, développement), rien n'est envoyé et l'app fonctionne normalement.
 */
export const clePubliqueNotifications = () => process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;

function configurer(): boolean {
  const publique = clePubliqueNotifications();
  const privee = process.env.VAPID_PRIVATE_KEY;
  if (!publique || !privee) return false;
  webpush.setVapidDetails(process.env.VAPID_CONTACT ?? "mailto:Leclub@lcsperformance.fr", publique, privee);
  return true;
}

/**
 * Envoie une notification aux membres concernés (accès ouvert, réglage du Profil activé, pas l'auteur).
 * Les appareils disparus (désinstallés, autorisation retirée) sont retirés de la base.
 * Renvoie le nombre d'appareils atteints.
 */
export async function envoyerNotification(type: TypeNotification, notification: Notification, auteurId?: string): Promise<number> {
  if (!configurer()) {
    console.warn("Notifications : clés VAPID absentes, rien n'est envoyé.");
    return 0;
  }
  const admin = createAdminClient();
  const { data: membres, error } = await admin
    .from("membres")
    .select("id, role, abonnement_fin, acces_offert_jusqua, acces_coupe, notif_annonces, notif_faq");
  if (error) {
    console.error("Notifications : lecture des membres impossible", error.code, error.message);
    return 0;
  }
  const ids = destinataires((membres ?? []) as MembreNotifiable[], type, new Date(), auteurId);
  if (!ids.length) return 0;

  const { data: appareils, error: errApp } = await admin.from("appareils_notifications").select("id, endpoint, p256dh, auth").in("membre_id", ids);
  if (errApp) {
    console.error("Notifications : lecture des appareils impossible", errApp.code, errApp.message);
    return 0;
  }

  const contenu = JSON.stringify(notification);
  const disparus: string[] = [];
  let atteints = 0;
  await Promise.all(
    (appareils ?? []).map(async (a) => {
      try {
        await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, contenu, { TTL: 12 * 3600 });
        atteints++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) disparus.push(a.id);
        else console.error("Notifications : envoi impossible", code ?? (e as Error).message);
      }
    }),
  );
  if (disparus.length) await admin.from("appareils_notifications").delete().in("id", disparus);
  return atteints;
}
