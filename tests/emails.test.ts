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
