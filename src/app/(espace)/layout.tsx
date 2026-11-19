import { FondNeon } from "@/components/FondNeon";

export default function LayoutEspace({ children }: LayoutProps<"/">) {
  return (
    <>
      <FondNeon />
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px", display: "grid", gap: 24 }}>
        {children}
      </main>
    </>
  );
}
