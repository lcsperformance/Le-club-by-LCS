import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";
import { estCheminPublic } from "@/lib/roles";

/** Rafraîchit la session Supabase à chaque requête et renvoie les cookies à jour. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = getSupabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // Ne rien placer entre la création du client et cet appel.
  const { data } = await supabase.auth.getClaims();
  const connecte = Boolean(data?.claims?.sub);

  // Visiteur non connecté sur une page protégée : direction la connexion.
  if (!connecte && !estCheminPublic(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = "";
    const redirection = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirection.cookies.set(c));
    return redirection;
  }

  return response;
}
