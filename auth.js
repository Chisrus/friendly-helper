// auth.js - Module d'authentification
import { supabase } from './db.js';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// Vérifier si l'utilisateur est connecté
export async function getUser() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
}

// Écouter les changements d'auth
export function onAuthChange(callback) {
    supabase.auth.onAuthStateChange((event, session) => {
        callback(session?.user || null, event);
    });
}

// Inscription
export async function inscription(email, password, nomComplet, telephone, ville) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: window.location.origin,
            data: { nom_complet: nomComplet }
        }
    });

    if (error) throw error;

    // Mettre à jour le profil si l'inscription réussit
    if (data.user) {
        await supabase.from('profiles').update({
            nom_complet: nomComplet,
            telephone: telephone,
            ville: ville
        }).eq('id', data.user.id);
    }

    return data;
}

// Connexion
export async function connexion(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

// Déconnexion
export async function deconnexion() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

// Récupérer le profil
export async function getProfil(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error) return null;
    return data;
}

// Mettre à jour le profil
export async function updateProfil(userId, updates) {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
    if (error) throw error;
    return data;
}

// Protéger une page (redirige si non connecté)
export async function requireAuth() {
    const user = await getUser();
    if (!user) {
        window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return null;
    }
    return user;
}

// Mettre à jour la navbar selon l'état d'auth
export async function updateNavAuth() {
    const user = await getUser();
    const btnConnect = document.querySelector('.btn-connect');
    
    if (btnConnect) {
        if (user) {
            const profil = await getProfil(user.id);
            const nom = profil?.nom_complet || user.email.split('@')[0];
            btnConnect.textContent = nom;
            btnConnect.href = '/dashboard.html';
            btnConnect.classList.add('logged-in');
        } else {
            btnConnect.textContent = document.documentElement.lang === 'en' ? 'Investor Space' : 'Espace Investisseur';
            btnConnect.href = '/login.html';
            btnConnect.classList.remove('logged-in');
        }
    }
}

// ==== FONCTIONS 2FA (Authentification à deux facteurs) ====

// Générer un secret 2FA pour un utilisateur
export function generate2FASecret() {
    return authenticator.generateSecret();
}

// Générer le QR code pour configurer 2FA
export async function generate2FAQRCode(secret, email) {
    const otpauth = authenticator.keyuri(email, 'Agrikura', secret);
    try {
        const qrCodeDataURL = await QRCode.toDataURL(otpauth);
        return { secret, qrCodeDataURL, otpauth };
    } catch (error) {
        throw new Error('Erreur génération QR code: ' + error.message);
    }
}

// Vérifier un code 2FA
export function verify2FAToken(secret, token) {
    try {
        return authenticator.verify({ token, secret });
    } catch (error) {
        return false;
    }
}

// Activer 2FA pour un utilisateur
export async function enable2FA(userId, secret) {
    const { error } = await supabase
        .from('user_2fa')
        .upsert({
            user_id: userId,
            secret: secret,
            enabled: true,
            created_at: new Date().toISOString()
        });

    if (error) throw error;
}

// Désactiver 2FA pour un utilisateur
export async function disable2FA(userId) {
    const { error } = await supabase
        .from('user_2fa')
        .update({ enabled: false })
        .eq('user_id', userId);

    if (error) throw error;
}

// Vérifier si 2FA est activé pour un utilisateur
export async function is2FAEnabled(userId) {
    const { data, error } = await supabase
        .from('user_2fa')
        .select('enabled')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') return false; // PGRST116 = not found
    return data?.enabled || false;
}

// Récupérer le secret 2FA d'un utilisateur
export async function get2FASecret(userId) {
    const { data, error } = await supabase
        .from('user_2fa')
        .select('secret')
        .eq('user_id', userId)
        .single();

    if (error) return null;
    return data?.secret;
}

// Connexion avec vérification 2FA si activé
export async function connexionAvec2FA(email, password, token2FA = null) {
    // Connexion normale
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const user = data.user;
    if (!user) throw new Error('Utilisateur non trouvé');

    // Vérifier si 2FA est activé
    const has2FA = await is2FAEnabled(user.id);
    
    if (has2FA) {
        if (!token2FA) {
            // 2FA requis mais pas fourni
            throw new Error('2FA_REQUIRED');
        }
        
        // Vérifier le token 2FA
        const secret = await get2FASecret(user.id);
        if (!secret || !verify2FAToken(secret, token2FA)) {
            throw new Error('Code 2FA invalide');
        }
    }

    return data;
}

// ==== FONCTIONS KYC (Know Your Customer) ====

// Soumettre des documents KYC
export async function soumettreKYCDocuments(userId, documents) {
    const { error } = await supabase
        .from('user_kyc')
        .upsert({
            user_id: userId,
            documents: documents,
            statut: 'pending',
            submitted_at: new Date().toISOString()
        });

    if (error) throw error;
}

// Récupérer le statut KYC d'un utilisateur
export async function getKYCStatus(userId) {
    const { data, error } = await supabase
        .from('user_kyc')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || { statut: 'none' };
}

// Approuver KYC (admin seulement)
export async function approuverKYC(userId, adminId) {
    const { error } = await supabase
        .from('user_kyc')
        .update({ 
            statut: 'approved',
            approved_by: adminId,
            approved_at: new Date().toISOString()
        })
        .eq('user_id', userId);

    if (error) throw error;
}

// Rejeter KYC (admin seulement)
export async function rejeterKYC(userId, adminId, raison) {
    const { error } = await supabase
        .from('user_kyc')
        .update({ 
            statut: 'rejected',
            rejected_by: adminId,
            rejected_at: new Date().toISOString(),
            rejection_reason: raison
        })
        .eq('user_id', userId);

    if (error) throw error;
}

// ==== FONCTIONS RGPD ====

// Exporter les données personnelles d'un utilisateur
export async function exporterDonneesUtilisateur(userId) {
    const [profil, investissements, kyc] = await Promise.all([
        getProfil(userId),
        supabase.from('investissements').select('*').eq('user_id', userId),
        getKYCStatus(userId)
    ]);

    return {
        profil,
        investissements: investissements.data || [],
        kyc,
        exported_at: new Date().toISOString()
    };
}

// Supprimer définitivement les données d'un utilisateur (RGPD)
export async function supprimerDonneesUtilisateur(userId) {
    // Supprimer dans l'ordre pour respecter les contraintes de clés étrangères
    await Promise.all([
        supabase.from('user_kyc').delete().eq('user_id', userId),
        supabase.from('user_2fa').delete().eq('user_id', userId),
        supabase.from('investissements').delete().eq('user_id', userId),
        supabase.from('profiles').delete().eq('id', userId)
    ]);

    // Supprimer le compte auth Supabase
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
}

// ==== FONCTIONS SÉCURITÉ ====

// Logger une tentative de connexion
export async function logConnexionAttempt(email, success, ip = null, userAgent = null) {
    const { error } = await supabase
        .from('security_logs')
        .insert({
            event_type: 'login_attempt',
            email: email,
            success: success,
            ip_address: ip,
            user_agent: userAgent,
            created_at: new Date().toISOString()
        });

    if (error) console.error('Erreur logging connexion:', error);
}

// Vérifier si une IP est suspecte (trop de tentatives échouées)
export async function isIPSuspect(ip, windowMinutes = 15) {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
        .from('security_logs')
        .select('id')
        .eq('ip_address', ip)
        .eq('success', false)
        .gte('created_at', since);

    if (error) return false;
    return (data?.length || 0) > 5; // Plus de 5 échecs = suspect
}
