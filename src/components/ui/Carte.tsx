import Link from "next/link";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import styles from "./ui.module.css";

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Si fourni, la carte entière devient un lien. */
  href?: string;
  /** Balise HTML (section, article…) quand la carte n'est pas un lien. */
  as?: "div" | "section" | "article" | "li" | "nav";
} & Omit<HTMLAttributes<HTMLElement>, "children" | "className" | "style">;

/** Carte en verre fumé : flou, bordure dégradée 1 px, lueur interne. */
export function Carte({ children, className = "", style, href, as: Balise = "div", ...reste }: Props) {
  if (href) {
    return (
      <Link href={href} className={`${styles.carte} ${styles.carteCliquable} ${className}`} style={style} {...(reste as Record<string, unknown>)}>
        {children}
      </Link>
    );
  }
  return (
    <Balise className={`${styles.carte} ${className}`} style={style} {...reste}>
      {children}
    </Balise>
  );
}
