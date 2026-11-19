import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { ReactNode } from "react";
import { Chargement } from "@/components/Chargement";
import { BoutonPrincipal, BoutonSecondaire, Carte, Champ, Compteur, NOMS_ZONES, PastilleZone, ZONES } from "@/components/ui";
import { exigerRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Composants · Le Club by LCS" };

export default function PageComposants() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

function Bloc({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h2 className="titre" style={{ fontSize: 18 }}>
        {titre}
      </h2>
      {children}
    </section>
  );
}

async function Contenu() {
  await exigerRole("admin");
  return (
    <>
      <header style={{ display: "grid", gap: 6 }}>
        <Link href="/admin" className="lien" style={{ fontSize: 14 }}>
          ← Administration
        </Link>
        <h1 className="titre" style={{ fontSize: 28, color: "var(--accent)" }}>
          Composants
        </h1>
        <p style={{ color: "var(--texte-doux)", fontSize: 14 }}>
          Les briques du style Neon, à réutiliser sur tous les écrans.
        </p>
      </header>

      <div style={{ display: "grid", gap: 28, maxWidth: 420 }}>
        <Bloc titre="Cartes">
          <Carte>
            <p style={{ fontWeight: 800 }}>Carte simple</p>
            <p style={{ fontSize: 13, color: "var(--texte-doux)", marginTop: 4 }}>
              Verre fumé, flou, bordure dégradée 1 px, lueur interne.
            </p>
          </Carte>
          <Carte href="/admin/composants">
            <p style={{ fontWeight: 800 }}>Carte cliquable →</p>
            <p style={{ fontSize: 13, color: "var(--texte-doux)", marginTop: 4 }}>Toute la carte est un lien.</p>
          </Carte>
        </Bloc>

        <Bloc titre="Boutons">
          <BoutonPrincipal>Bouton principal</BoutonPrincipal>
          <BoutonPrincipal enCours texteEnCours="Enregistrement…">
            Enregistrer
          </BoutonPrincipal>
          <BoutonSecondaire>Bouton secondaire</BoutonSecondaire>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <BoutonPrincipal compact>Compact</BoutonPrincipal>
            <BoutonSecondaire compact>Compact</BoutonSecondaire>
            <BoutonSecondaire compact disabled>
              Désactivé
            </BoutonSecondaire>
          </div>
        </Bloc>

        <Bloc titre="Champs de saisie">
          <Champ libelle="E-mail" name="demo_email" type="email" placeholder="ton.adresse@exemple.fr" />
          <Champ libelle="FTP (watts)" name="demo_ftp" inputMode="numeric" placeholder="250" aide="Ta puissance au seuil sur 1 heure." />
          <Champ libelle="FC seuil" name="demo_fc" defaultValue="320" erreur="Une fréquence cardiaque doit être entre 80 et 230." />
        </Bloc>

        <Bloc titre="Compteur">
          <Compteur
            name="demo_compteur"
            valeurInitiale={220}
            pas={5}
            min={80}
            max={450}
            libelleMoins="Moins"
            libellePlus="Plus"
            intitule="Exemple en watts"
          />
        </Bloc>

        <Bloc titre="Pastilles de zone">
          <Carte style={{ display: "grid", gap: 10 }}>
            {ZONES.map((z) => (
              <div key={z} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <PastilleZone zone={z} />
                <span style={{ fontWeight: 700 }}>{NOMS_ZONES[z]}</span>
              </div>
            ))}
          </Carte>
          <div style={{ display: "flex", gap: 6 }}>
            {ZONES.map((z) => (
              <PastilleZone key={z} zone={z} taille="petite" />
            ))}
          </div>
        </Bloc>
      </div>
    </>
  );
}
