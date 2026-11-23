/*
 * Le Club by LCS — petit programme de l'app installable.
 *
 * Il garde UNIQUEMENT la page « Pas de connexion » et son icône (voir FICHIERS_HORS_LIGNE dans
 * src/lib/installation.ts). Il ne garde aucune page du Club : ni le programme, ni les messages,
 * ni les données de santé. Sans réseau, une page demandée est remplacée par « Pas de connexion ».
 * Tout le reste passe directement par le réseau, donc l'app est toujours à jour.
 */
const RESERVE = "le-club-hors-ligne-v1";
const FICHIERS = ["/hors-ligne.html", "/icones/icone-192.png"];

self.addEventListener("install", (evenement) => {
  evenement.waitUntil(
    caches
      .open(RESERVE)
      .then((reserve) => reserve.addAll(FICHIERS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (evenement) => {
  evenement.waitUntil(
    caches
      .keys()
      .then((noms) => Promise.all(noms.filter((nom) => nom !== RESERVE).map((nom) => caches.delete(nom))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evenement) => {
  const demande = evenement.request;
  if (demande.method !== "GET") return;
  const adresse = new URL(demande.url);
  if (adresse.origin !== self.location.origin) return;

  // L'icône de la page hors ligne.
  if (FICHIERS.includes(adresse.pathname) && adresse.pathname !== "/hors-ligne.html") {
    evenement.respondWith(fetch(demande).catch(() => caches.match(adresse.pathname)));
    return;
  }

  // Ouverture d'une page : le réseau d'abord, la page « Pas de connexion » s'il ne répond pas.
  if (demande.mode === "navigate") {
    evenement.respondWith(fetch(demande).catch(() => caches.match("/hors-ligne.html")));
  }
});
