import { seDeconnecter } from "@/app/auth/actions";
import { BoutonSecondaire } from "@/components/ui";
import styles from "./EnTeteEspace.module.css";

/** En-tête des espaces coach et admin, avec déconnexion. */
export function EnTeteEspace({ titre, email }: { titre: string; email: string }) {
  return (
    <header className={styles.entete}>
      <div className={styles.identite}>
        <h1 className={`titre ${styles.titre}`}>{titre}</h1>
        <p className={styles.email}>{email}</p>
      </div>
      <form action={seDeconnecter}>
        <BoutonSecondaire type="submit" compact>
          Se déconnecter
        </BoutonSecondaire>
      </form>
    </header>
  );
}
