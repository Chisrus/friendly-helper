// db.js - Module de connexion à la base de données Lovable Cloud
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Récupérer tous les projets actifs
export async function chargerProjets() {
    const { data, error } = await supabase
        .from('projets')
        .select('*')
        .eq('statut', 'actif')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erreur chargement projets:', error);
        return [];
    }
    return data;
}

// Récupérer les conditions idéales
export async function chargerConditions() {
    const { data, error } = await supabase
        .from('conditions_ideales')
        .select('*');

    if (error) {
        console.error('Erreur chargement conditions:', error);
        return {};
    }
    // Transformer en objet indexé par culture
    const conditions = {};
    data.forEach(c => {
        conditions[c.culture] = {
            humiditeMin: c.humidite_min,
            humiditeMax: c.humidite_max,
            tempMin: c.temp_min,
            tempMax: c.temp_max
        };
    });
    return conditions;
}

// Enregistrer un investissement
export async function enregistrerInvestissement(projetId, montant, methodePaiement) {
    const { data, error } = await supabase
        .from('investissements')
        .insert({
            projet_id: projetId,
            montant: montant,
            methode_paiement: methodePaiement
        })
        .select()
        .single();

    if (error) {
        console.error('Erreur investissement:', error);
        return null;
    }

    // Mettre à jour le financement actuel du projet
    const { error: updateError } = await supabase.rpc('increment_financement', {
        p_id: projetId,
        p_montant: montant
    }).catch(() => {
        // Si la fonction RPC n'existe pas, on fait un update direct
        return supabase
            .from('projets')
            .update({ financement_actuel: montant })
            .eq('id', projetId);
    });

    return data;
}
