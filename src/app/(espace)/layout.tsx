export default function LayoutEspace({ children }: LayoutProps<"/">) {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px", display: "grid", gap: 24 }}>
      {children}
    </main>
  );
}
