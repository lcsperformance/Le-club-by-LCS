import { seDeconnecter } from "@/app/auth/actions";

/** En-tête provisoire des espaces connectés, avec déconnexion. */
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
        <button type="submit" className="bouton-secondaire" style={{ padding: "0 16px" }}>
          Se déconnecter
        </button>
      </form>
    </header>
  );
}
