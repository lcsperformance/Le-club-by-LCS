import { FondNeon } from "@/components/FondNeon";
import styles from "./layout.module.css";

export default function LayoutEspace({ children }: LayoutProps<"/">) {
  return (
    <>
      <FondNeon />
      <main className={styles.contenu}>
        {children}
      </main>
    </>
  );
}
