-- Tables de sécurité pour Agrikura
-- À exécuter dans Supabase SQL Editor

-- Table pour l'authentification 2FA
CREATE TABLE IF NOT EXISTS user_2fa (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    secret TEXT NOT NULL,
    enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Table pour KYC (Know Your Customer)
CREATE TABLE IF NOT EXISTS user_kyc (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    documents JSONB, -- Stockage des URLs de documents
    statut TEXT DEFAULT 'none' CHECK (statut IN ('none', 'pending', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejected_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Table pour les logs de sécurité
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL, -- 'login_attempt', 'password_change', etc.
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT,
    success BOOLEAN DEFAULT false,
    ip_address INET,
    user_agent TEXT,
    details JSONB, -- Informations supplémentaires
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON user_2fa(user_id);
CREATE INDEX IF NOT EXISTS idx_user_kyc_user_id ON user_kyc(user_id);
CREATE INDEX IF NOT EXISTS idx_user_kyc_statut ON user_kyc(statut);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip ON security_logs(ip_address);

-- Politiques RLS (Row Level Security)
ALTER TABLE user_2fa ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Politique pour user_2fa : utilisateurs voient seulement leur propre 2FA
CREATE POLICY "Users can view own 2FA settings" ON user_2fa
    FOR ALL USING (auth.uid() = user_id);

-- Politique pour user_kyc : utilisateurs voient seulement leur propre KYC
CREATE POLICY "Users can view own KYC status" ON user_kyc
    FOR SELECT USING (auth.uid() = user_id);

-- Politique pour security_logs : seulement les admins peuvent voir
CREATE POLICY "Only admins can view security logs" ON security_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_user_2fa_updated_at BEFORE UPDATE ON user_2fa
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_kyc_updated_at BEFORE UPDATE ON user_kyc
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
