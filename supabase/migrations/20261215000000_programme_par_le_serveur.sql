-- Le Club by LCS — le programme d'entraînement n'est plus lisible directement par les membres.
--
-- Avant : tout compte connecté pouvait lire, avec sa session, le programme entier (toutes les semaines,
-- phases, niveaux et profils) et le détail de toutes les séances.
-- Désormais : seul le serveur lit le programme (clé secrète, src/lib/programme-serveur.ts), après avoir
-- vérifié la personne, et ne donne que la semaine affichée, au niveau et au profil du membre.
-- Les membres gardent seulement le titre, le sport et la durée des séances (affichés à côté d'un
-- ressenti dans la fiche coach et dans l'export) : rien du contenu (blocs, zones, consignes).

revoke select on public.programme, public.blocs_seance from authenticated;
drop policy "connecté : lit le programme" on public.programme;
drop policy "connecté : lit les blocs de séance" on public.blocs_seance;

revoke select on public.seances from authenticated;
grant select (id, sport, titre, duree_minutes) on public.seances to authenticated;
