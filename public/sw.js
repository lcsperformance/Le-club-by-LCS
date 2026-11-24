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

/*
 * Notifications du Club (annonces, rappel la veille d'une FAQ). Le serveur envoie
 * { titre, corps, url, etiquette } ; rien n'est gardé sur l'appareil.
 */
self.addEventListener("push", (evenement) => {
  let n = {};
  try {
    n = evenement.data ? evenement.data.json() : {};
  } catch {
    n = { corps: evenement.data ? evenement.data.text() : "" };
  }
  // Seules les adresses du Club peuvent être ouvertes depuis une notification.
  const url = typeof n.url === "string" && n.url.startsWith("/") && !n.url.startsWith("//") ? n.url : "/accueil";
  evenement.waitUntil(
    self.registration.showNotification(n.titre || "Le Club", {
      body: n.corps || "",
      icon: "/icones/icone-192.png",
      badge: "/icones/icone-192.png",
      tag: n.etiquette || undefined,
      lang: "fr",
      data: { url },
    }),
  );
});

// Toucher la notification : ouvre la page (ou revient sur l'app déjà ouverte).
self.addEventListener("notificationclick", (evenement) => {
  evenement.notification.close();
  const url = new URL((evenement.notification.data && evenement.notification.data.url) || "/accueil", self.location.origin).href;
  evenement.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((fenetres) => {
      const ouverte = fenetres.find((f) => f.url.startsWith(self.location.origin));
      if (ouverte) return ouverte.navigate(url).then((f) => (f || ouverte).focus());
      return self.clients.openWindow(url);
    }),
  );
});
