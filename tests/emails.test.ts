/** E-mail de bienvenue (modèle Supabase « invitation ») : il donne bien les identifiants. */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const invitation = readFileSync(new URL("../supabase/emails/invitation.html", import.meta.url), "utf8");

describe("e-mail de bienvenue", () => {
  it("donne l'identifiant (l'adresse e-mail du membre)", () => {
    expect(invitation).toMatch(/Ton identifiant : <strong>\{\{ \.Email \}\}<\/strong>/);
  });

  it("contient le lien pour choisir son mot de passe (jamais de mot de passe en clair)", () => {
    expect(invitation).toContain("/auth/confirm?token_hash={{ .TokenHash }}&type=invite");
    expect(invitation).not.toMatch(/\{\{ \.(Password|Token) \}\}/);
  });
});

describe("e-mails du webhook (Resend)", async () => {
  const { emailDoublon, emailReprise } = await import("../src/lib/abonnement/emails");
  it("doublon : dit que le second paiement est remboursé et que l'abonnement en cours ne change pas", () => {
    const html = emailDoublon("https://club.exemple");
    expect(html).toContain("remboursé en totalité");
    expect(html).toContain("Ton abonnement en cours ne change pas");
    expect(html).toContain('href="https://club.exemple/profil"');
  });
  it("reprise : renvoie vers la connexion", () => {
    expect(emailReprise("https://club.exemple")).toContain('href="https://club.exemple/connexion"');
  });
});
