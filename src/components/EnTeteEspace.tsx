import { seDeconnecter } from "@/app/auth/actions";
import { BoutonSecondaire } from "@/components/ui";

/** En-tête des espaces coach et admin, avec déconnexion. */
export function EnTeteEspace({ titre, email }: { titre: string; email: string }) {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
      <div>
        <h1 className="titre" style={{ fontSize: 24, color: "var(--accent)" }}>
          {titre}
        </h1>
        <p style={{ fontSize: 13, color: "var(--texte-doux)", marginTop: 4 }}>{email}</p>
      </div>
      <form action={seDeconnecter}>
        <BoutonSecondaire type="submit" compact>
          Se déconnecter
        </BoutonSecondaire>
      </form>
    </header>
  );
}
