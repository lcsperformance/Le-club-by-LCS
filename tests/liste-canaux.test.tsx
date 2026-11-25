import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ListeCanaux } from "@/app/(membre)/club/ListeCanaux";
import type { Canal } from "@/lib/club";

const canaux = [
  { cle: "annonces", nom: "annonces", description: "Les annonces du Club", lecture_seule: true, ordre: 1 },
  { cle: "general", nom: "général", description: "Pour tout le monde", lecture_seule: false, ordre: 2 },
] as unknown as Canal[];

describe("liste des canaux", () => {
  it("un lien par canal collectif, badges de non-lus", () => {
    const html = renderToStaticMarkup(<ListeCanaux canaux={canaux} nonLus={{ general: 3 }} monBloc={null} />);
    expect(html.match(/href="\/club\/[a-z-]+"/g)).toEqual(['href="/club/annonces"', 'href="/club/general"']);
    expect(html).toContain("3 messages non lus");
    expect(html).not.toContain("aria-current");
  });

  it("le canal ouvert à côté est marqué", () => {
    const html = renderToStaticMarkup(<ListeCanaux canaux={canaux} nonLus={{}} monBloc={null} actif="general" />);
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html.match(/<a [^>]*aria-current="page"[^>]*>/)?.[0]).toContain('href="/club/general"');
  });
});
