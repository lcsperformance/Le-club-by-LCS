import { FondNeon } from "@/components/FondNeon";

/** Pages légales : lisibles par tous, connectés ou non. */
export default function LayoutLegal({ children }: LayoutProps<"/">) {
  return (
    <>
      <FondNeon />
      <main>{children}</main>
    </>
  );
}
