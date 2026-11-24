import { faqARappeler, notificationRappelFaq } from "@/lib/notifications";
import { envoyerNotification } from "@/lib/notifications-serveur";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Evenement } from "@/lib/agenda";

/**
 * Rappel la veille au soir de chaque FAQ en visio (tâche Vercel, voir vercel.json).
 * Vercel appelle cette adresse avec « Authorization: Bearer <CRON_SECRET> » : sans ce secret, rien ne se passe.
 * Chaque FAQ n'est rappelée qu'une fois (table rappels_faq_envoyes).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Non autorisé", { status: 401 });
  }

  const admin = createAdminClient();
  const [{ data: evenements, error }, { data: deja }] = await Promise.all([
    admin.from("evenements").select("id, titre, type, debut, fin, lieu, lien, description, dates_a_confirmer, periode"),
    admin.from("rappels_faq_envoyes").select("evenement_id"),
  ]);
  if (error) {
    console.error("Rappels FAQ : lecture de l'agenda impossible", error.code, error.message);
    return Response.json({ erreur: "agenda" }, { status: 500 });
  }

  const maintenant = new Date();
  const aRappeler = faqARappeler(
    (evenements ?? []).map((e) => ({ ...e, debut: new Date(e.debut as string).toISOString() })) as Evenement[],
    maintenant,
    new Set((deja ?? []).map((d) => d.evenement_id as string)),
  );

  const envois = [];
  for (const faq of aRappeler) {
    // On note d'abord le rappel : un second passage de la tâche ne le renverra pas.
    const { error: errNote } = await admin.from("rappels_faq_envoyes").insert({ evenement_id: faq.id });
    if (errNote) continue;
    envois.push({ faq: faq.id, appareils: await envoyerNotification("faq", notificationRappelFaq(faq)) });
  }
  return Response.json({ envois });
}
