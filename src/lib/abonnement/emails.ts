/** E-mails envoyés par le webhook (via Resend), au style du Club. Sans dépendance : testables. */

const cadre = (contenu: string) => `<div style="background:#090A0F;padding:32px 24px;font-family:Helvetica,Arial,sans-serif;color:#F4EEFF">
  <p style="font-size:28px;font-weight:800;color:#DEFD62;margin:0 0 24px">le club</p>
${contenu}
  <p style="font-size:14px;line-height:1.5;color:#B8B4D6">L'équipe LCS Performance</p>
</div>`;

const bouton = (lien: string, texte: string) =>
  `<p style="margin:28px 0"><a href="${lien}" style="background:#DEFD62;color:#090A0F;padding:14px 22px;border-radius:14px;font-weight:800;text-decoration:none;display:inline-block">${texte}</a></p>`;

/** Ancien membre qui se réabonne : il garde son compte. */
export function emailReprise(site: string) {
  return cadre(`  <p style="font-size:16px;line-height:1.5">Bonjour,</p>
  <p style="font-size:16px;line-height:1.5">Ton abonnement au Club by LCS est de nouveau actif. Tu gardes ton compte : connecte-toi avec ton adresse e-mail et ton mot de passe habituel.</p>
  ${bouton(`${site}/connexion`, "Me connecter")}
  <p style="font-size:14px;line-height:1.5;color:#B8B4D6">Mot de passe oublié ? Utilise le lien « Mot de passe oublié ? » sur l'écran de connexion.</p>`);
}

/** Membre déjà abonné qui a payé une seconde fois : le second abonnement est annulé et remboursé. */
export function emailDoublon(site: string) {
  return cadre(`  <p style="font-size:16px;line-height:1.5">Bonjour,</p>
  <p style="font-size:16px;line-height:1.5">Tu avais déjà un abonnement en cours au Club by LCS : ton second paiement a été annulé et <strong>remboursé en totalité</strong>. Le remboursement apparaît sur ton compte bancaire sous 5 à 10 jours ouvrés.</p>
  <p style="font-size:16px;line-height:1.5">Ton abonnement en cours ne change pas : tu n'as rien à faire.</p>
  ${bouton(`${site}/profil`, "Voir mon abonnement")}`);
}
