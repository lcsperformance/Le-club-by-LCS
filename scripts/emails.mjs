/**
 * Installe les e-mails en français (mot de passe oublié, invitation) sur le projet Supabase.
 * À lancer une fois l'envoi par Resend (SMTP) configuré : sans SMTP personnalisé,
 * Supabase refuse de modifier les modèles d'e-mail.
 *
 *   SUPABASE_PROJECT_REF=… SUPABASE_ACCESS_TOKEN=… npm run emails
 */
import { readFileSync } from "node:fs";

const REF = process.env.SUPABASE_PROJECT_REF;
const JETON = process.env.SUPABASE_ACCESS_TOKEN;
if (!REF || !JETON) {
  console.error("Renseigne SUPABASE_PROJECT_REF et SUPABASE_ACCESS_TOKEN.");
  process.exit(1);
}

const lire = (nom) => readFileSync(new URL(`../supabase/emails/${nom}`, import.meta.url), "utf8");
const gabarit = lire("gabarit.html").replace(/<!--[\s\S]*?-->\n?/, "");
const email = (nom) => gabarit.replace("{{CONTENU}}", lire(nom).trim());

const reglages = {
  mailer_subjects_recovery: "Le Club by LCS : choisis ton nouveau mot de passe",
  mailer_templates_recovery_content: email("recuperation.html"),
  mailer_subjects_invite: "Bienvenue au Club by LCS : choisis ton mot de passe",
  mailer_templates_invite_content: email("invitation.html"),
  // Avec Resend, la limite d'envoi peut être relevée (2 par heure avec l'envoi intégré de Supabase).
  rate_limit_email_sent: 60,
};

const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/config/auth`, {
  method: "PATCH",
  headers: { "content-type": "application/json", authorization: `Bearer ${JETON}` },
  body: JSON.stringify(reglages),
});
const corps = await r.json().catch(() => ({}));

if (!r.ok) {
  if (corps?.error?.code === "entitlement_required" || /custom SMTP/i.test(corps?.message ?? "")) {
    console.error(
      "✖ Supabase refuse : l'envoi par Resend (SMTP personnalisé) n'est pas encore configuré.\n" +
        "  Voir README.md, rubrique « E-mails (Resend) ».",
    );
  } else {
    console.error(`✖ Erreur ${r.status} : ${corps.message ?? JSON.stringify(corps)}`);
  }
  process.exit(1);
}
console.log("✓ E-mails en français installés (mot de passe oublié, invitation) et limite d'envoi relevée.");
