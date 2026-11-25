-- Le Club by LCS — Codes partenaires : on accepte aussi « ! » et « ? » (ex. un code du type LCS2026?!).
-- Rien d'autre ne change : 3 à 30 caractères, lettres, chiffres, tirets, tiret bas ; ni espace ni accent.

alter table public.partenaires drop constraint partenaires_code_check;
alter table public.partenaires add constraint partenaires_code_check check (code ~ '^[A-Za-z0-9_!?-]{3,30}$');
