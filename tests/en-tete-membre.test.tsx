import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EnTeteMembre } from "@/components/EnTeteMembre";
import type { Utilisateur } from "@/lib/auth";

const caroline = { id: "1", email: "caroline@exemple.fr", prenom: "Caroline", nom: null, role: "membre" } as unknown as Utilisateur;

describe("en-tête des écrans membre", () => {
  it("un seul symbole du Club devant « le club »", () => {
    const html = renderToStaticMarkup(<EnTeteMembre utilisateur={caroline} titre="Le Club" />);
    expect(html.match(/<svg[^>]*viewBox="0 0 200 200"/g)).toHaveLength(1);
    expect(html).toContain("le club");
  });
});
