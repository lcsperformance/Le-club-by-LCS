import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    throw new Error("la base ne doit pas être lue sans le secret");
  },
}));

const { GET } = await import("@/app/api/rappels-faq/route");

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("route /api/rappels-faq", () => {
  it("refuse sans le secret de la tâche Vercel", async () => {
    vi.stubEnv("CRON_SECRET", "secret-de-test");
    expect((await GET(new Request("https://club.test/api/rappels-faq"))).status).toBe(401);
    const mauvais = new Request("https://club.test/api/rappels-faq", { headers: { authorization: "Bearer autre" } });
    expect((await GET(mauvais)).status).toBe(401);
  });

  it("refuse tout si aucun secret n'est configuré", async () => {
    vi.stubEnv("CRON_SECRET", "");
    const r = new Request("https://club.test/api/rappels-faq", { headers: { authorization: "Bearer " } });
    expect((await GET(r)).status).toBe(401);
  });
});
