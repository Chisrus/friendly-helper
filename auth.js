// auth.js - Module d'authentification
import { supabase } from './db.js';

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
