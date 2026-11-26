import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { adresseAutorisee, iconesDeclarees, ipInterne, typeImage } from "@/lib/logo-partenaire";
import { recupererLogo, type Outils } from "@/lib/logo-partenaire-serveur";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new Array(200).fill(1)]);
const ICO = new Uint8Array([0, 0, 1, 0, ...new Array(200).fill(2)]);

describe("icônes déclarées par le site", () => {
  it("apple-touch-icon d'abord, puis la plus grande, puis /favicon.ico ; SVG ignoré", () => {
    const html = `<head>
      <link rel="icon" href="/petit.png" sizes="16x16">
      <link rel="icon" type="image/svg+xml" href="/logo.svg">
      <link rel="shortcut icon" href="https://cdn.pyrene.fr/grand.png" sizes="192x192">
      <link href="/apple.png" rel="apple-touch-icon">
    </head>`;
    expect(iconesDeclarees(html, "https://www.pyrene.fr/boutique/")).toEqual([
      "https://www.pyrene.fr/apple.png",
      "https://cdn.pyrene.fr/grand.png",
      "https://www.pyrene.fr/petit.png",
      "https://www.pyrene.fr/favicon.ico",
    ]);
  });

  it("sans icône déclarée : /favicon.ico", () => {
    expect(iconesDeclarees("<html></html>", "https://onatera.com/")).toEqual(["https://onatera.com/favicon.ico"]);
  });
});

describe("adresses que le serveur accepte d'appeler", () => {
  it("https vers un vrai site seulement", () => {
    expect(adresseAutorisee("https://www.onatera.com/")).toBe(true);
    for (const a of [
      "http://onatera.com",
      "https://localhost/",
      "https://127.0.0.1/",
      "https://10.0.0.5/",
      "https://192.168.1.1/",
      "https://169.254.169.254/latest/meta-data",
      "https://[::1]/",
      "https://intranet/",
      "https://site.local/",
      "https://user:mdp@onatera.com/",
      "https://onatera.com:8443/",
      "pas une adresse",
    ]) {
      expect(adresseAutorisee(a), a).toBe(false);
    }
  });

  it("IP internes reconnues", () => {
    for (const ip of ["10.1.2.3", "172.20.0.1", "192.168.0.10", "127.0.0.1", "169.254.1.1", "0.0.0.0", "::1", "fd00::1", "::ffff:10.0.0.1"]) {
      expect(ipInterne(ip), ip).toBe(true);
    }
    for (const ip of ["93.184.216.34", "2606:4700::1111"]) expect(ipInterne(ip), ip).toBe(false);
  });
});

describe("type réel de l'image", () => {
  it("PNG, JPEG, WebP, ICO reconnus à leurs premiers octets ; le reste refusé", () => {
    expect(typeImage(PNG)?.ext).toBe("png");
    expect(typeImage(ICO)?.ext).toBe("ico");
    expect(typeImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))?.ext).toBe("jpg");
    expect(typeImage(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))?.ext).toBe("webp");
    expect(typeImage(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'><script/></svg>"))).toBeNull();
  });
});

/** Faux réseau : adresse → réponse ; tous les noms se résolvent vers une IP publique, sauf « interne ». */
function faux(pages: Record<string, () => Response>): Outils & { appels: string[] } {
  const appels: string[] = [];
  return {
    appels,
    appeler: async (adresse) => {
      appels.push(adresse);
      const p = pages[adresse];
      return p ? p() : new Response("introuvable", { status: 404 });
    },
    resoudre: async (hote) => (hote.includes("interne") ? ["10.0.0.7"] : ["93.184.216.34"]),
  };
}

const html = (corps: string) => new Response(corps, { headers: { "content-type": "text/html; charset=utf-8" } });
const image = (octets: Uint8Array) => new Response(new Blob([octets as Uint8Array<ArrayBuffer>]), { headers: { "content-type": "image/png" } });

describe("récupérer le logo d'un partenaire", () => {
  it("prend l'apple-touch-icon déclarée par la page", async () => {
    const o = faux({
      "https://pyrene.fr/": () => html('<link rel="apple-touch-icon" href="/apple.png">'),
      "https://pyrene.fr/apple.png": () => image(PNG),
    });
    const logo = await recupererLogo("https://pyrene.fr/", o);
    expect(logo?.type.ext).toBe("png");
    expect(logo?.octets.length).toBe(PNG.length);
  });

  it("à défaut, le favicon", async () => {
    const o = faux({ "https://onatera.com/": () => html("<p>Bonjour</p>"), "https://onatera.com/favicon.ico": () => image(ICO) });
    expect((await recupererLogo("https://onatera.com/", o))?.type.ext).toBe("ico");
  });

  it("suit une redirection publique, refuse une redirection vers une adresse interne", async () => {
    const o = faux({
      "https://pyrene.fr/": () => new Response(null, { status: 301, headers: { location: "https://www.pyrene.fr/" } }),
      "https://www.pyrene.fr/": () => html('<link rel="icon" href="https://interne.pyrene.fr/logo.png">'),
      "https://interne.pyrene.fr/logo.png": () => image(PNG),
    });
    expect(await recupererLogo("https://pyrene.fr/", o)).toBeNull();
    expect(o.appels).not.toContain("https://interne.pyrene.fr/logo.png");
  });

  it("refuse un faux PNG (du HTML ou du SVG), une image vide ou trop grosse", async () => {
    const gros = new Uint8Array(1024 * 1024 + 10);
    gros.set(PNG.slice(0, 8));
    const o = faux({
      "https://a.fr/": () => html('<link rel="icon" href="/faux.png"><link rel="icon" href="/vide.png" sizes="32x32"><link rel="icon" href="/gros.png" sizes="16x16">'),
      "https://a.fr/faux.png": () => image(new TextEncoder().encode("<svg><script>alert(1)</script></svg>".padEnd(300, " "))),
      "https://a.fr/vide.png": () => image(PNG.slice(0, 20)),
      "https://a.fr/gros.png": () => image(gros),
    });
    expect(await recupererLogo("https://a.fr/", o)).toBeNull();
  });

  it("site injoignable : null, sans erreur", async () => {
    const o: Outils = { appeler: async () => Promise.reject(new Error("délai dépassé")), resoudre: async () => ["93.184.216.34"] };
    expect(await recupererLogo("https://injoignable.fr/", o)).toBeNull();
  });
});

describe("logo déposé à la main", () => {
  it("JPG, PNG ou WebP, 1 Mo au plus", async () => {
    const { erreurLogo } = await import("@/lib/partenaires");
    expect(erreurLogo({ type: "image/png", size: 200_000 })).toBeNull();
    expect(erreurLogo({ type: "image/webp", size: 1024 * 1024 })).toBeNull();
    expect(erreurLogo({ type: "image/svg+xml", size: 1000 })).toMatch(/JPG, PNG ou WebP/);
    expect(erreurLogo({ type: "image/png", size: 1024 * 1024 + 1 })).toMatch(/1 Mo/);
  });
});
