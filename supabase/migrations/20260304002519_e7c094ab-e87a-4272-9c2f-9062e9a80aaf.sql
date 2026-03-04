
-- Table des inscriptions investisseurs (liste d'attente)
CREATE TABLE public.inscriptions_investisseurs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    email TEXT,
    contact TEXT NOT NULL,
    capacite_financement BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inscriptions_investisseurs ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut s'inscrire (pas besoin d'auth)
CREATE POLICY "Anyone can insert investor registration"
ON public.inscriptions_investisseurs FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Seuls les admins pourront lire (via service role), mais on ajoute une policy select pour authenticated
CREATE POLICY "Authenticated can view investor registrations"
ON public.inscriptions_investisseurs FOR SELECT
TO authenticated
USING (true);

-- Table des inscriptions agriculteurs (liste d'attente)
CREATE TABLE public.inscriptions_agriculteurs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    email TEXT,
    contact TEXT NOT NULL,
    besoin_financement BIGINT NOT NULL DEFAULT 0,
    type_culture TEXT NOT NULL,
    capacite_champs TEXT NOT NULL,
    en_activite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inscriptions_agriculteurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert farmer registration"
ON public.inscriptions_agriculteurs FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can view farmer registrations"
ON public.inscriptions_agriculteurs FOR SELECT
TO authenticated
USING (true);
