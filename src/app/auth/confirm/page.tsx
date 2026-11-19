import type { Metadata } from "next";
import { Suspense } from "react";
import { EcranAuth } from "@/components/EcranAuth";
import { confirmerLien } from "./actions";

export const metadata: Metadata = { title: "Nouveau mot de passe · Le Club by LCS" };

/**
 * Page intermédiaire : le lien de l'e-mail n'est validé qu'au clic sur le bouton.
 * Certaines messageries ouvrent les liens à l'avance pour les analyser,
 * ce qui « consommerait » un lien validé directement à l'ouverture.
 */
export default function PageConfirmation({ searchParams }: PageProps<"/auth/confirm">) {
  return (
    <EcranAuth titre="Ton mot de passe">
      <Suspense fallback={null}>
        <Formulaire searchParams={searchParams} />
      </Suspense>
    </EcranAuth>
  );
}

async function Formulaire({ searchParams }: Pick<PageProps<"/auth/confirm">, "searchParams">) {
  const { code, token_hash, type, error } = await searchParams;
  const lienOk = typeof code === "string" || (typeof token_hash === "string" && typeof type === "string");

  if (error) {
    return (
      <p className="message-erreur" role="alert">
        Ce lien n&apos;est plus valable (il a peut-être déjà servi ou expiré). Redemande un e-mail depuis « Mot de
        passe oublié ».
      </p>
    );
  }
  if (!lienOk) {
    return (
      <p className="message-erreur" role="alert">
        Ce lien est incomplet. Redemande un e-mail depuis « Mot de passe oublié ».
      </p>
    );
  }

  return (
    <form action={confirmerLien} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {typeof code === "string" && <input type="hidden" name="code" value={code} />}
      {typeof token_hash === "string" && <input type="hidden" name="token_hash" value={token_hash} />}
      {typeof type === "string" && <input type="hidden" name="type" value={type} />}
      <p className="message-info" style={{ color: "var(--texte-doux)" }}>
        Clique sur le bouton pour choisir ton mot de passe.
      </p>
      <button type="submit" className="bouton-principal">
        Choisir mon mot de passe
      </button>
    </form>
  );
}
