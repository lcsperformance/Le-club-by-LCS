import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const SECRET = "whsec_test_secret";
const traiter = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/abonnement/dependances", () => ({ dependancesReelles: () => ({}) }));
vi.mock("@/lib/abonnement/webhook", () => ({ traiterEvenement: (...a: unknown[]) => traiter(...a) }));

const evenement = JSON.stringify({ id: "evt_1", type: "invoice.paid", data: { object: {} } });
const signer = (corps: string, secret = SECRET) =>
  new Stripe("sk_test_factice").webhooks.generateTestHeaderString({ payload: corps, secret });
const requete = (corps: string, signature?: string) =>
  new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    body: corps,
    headers: signature ? { "stripe-signature": signature } : {},
  });

beforeEach(() => {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_factice");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", SECRET);
  traiter.mockReset().mockResolvedValue({ action: "mis-a-jour" });
});

describe("route du webhook Stripe", () => {
  it("refuse un message sans signature", async () => {
    const { POST } = await import("@/app/api/stripe/webhook/route");
    expect((await POST(requete(evenement))).status).toBe(400);
    expect(traiter).not.toHaveBeenCalled();
  });

  it("refuse une signature faite avec un autre secret (message qui ne vient pas de Stripe)", async () => {
    const { POST } = await import("@/app/api/stripe/webhook/route");
    expect((await POST(requete(evenement, signer(evenement, "whsec_pirate")))).status).toBe(400);
    expect(traiter).not.toHaveBeenCalled();
  });

  it("refuse un message modifié après signature", async () => {
    const { POST } = await import("@/app/api/stripe/webhook/route");
    const signature = signer(evenement);
    const modifie = evenement.replace("invoice.paid", "customer.subscription.deleted");
    expect((await POST(requete(modifie, signature))).status).toBe(400);
  });

  it("accepte un message signé par Stripe et le traite", async () => {
    const { POST } = await import("@/app/api/stripe/webhook/route");
    const r = await POST(requete(evenement, signer(evenement)));
    expect(r.status).toBe(200);
    expect(traiter).toHaveBeenCalledWith(expect.objectContaining({ id: "evt_1", type: "invoice.paid" }), {});
  });

  it("répond 500 si le traitement échoue, pour que Stripe renvoie l'événement", async () => {
    traiter.mockRejectedValue(new Error("base indisponible"));
    const { POST } = await import("@/app/api/stripe/webhook/route");
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await POST(requete(evenement, signer(evenement)))).status).toBe(500);
  });
});
