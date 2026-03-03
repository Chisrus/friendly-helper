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

// Enregistrer un investissement avec calculs ROI et analyse de risque
export async function enregistrerInvestissementComplet(projetId, montant, methodePaiement, userId, projections = {}) {
    // Récupérer les détails du projet pour les calculs
    const { data: projet, error: projetError } = await supabase
        .from('projets')
        .select('*')
        .eq('id', projetId)
        .single();

    if (projetError) throw projetError;

    // Calculer les métriques d'investissement
    const rendementAnnuel = projet.rendement_estime / 100;
    const gainAnnuel = montant * rendementAnnuel;
    const retourTotalEstime = montant + gainAnnuel;
    const roi = ((retourTotalEstime - montant) / montant) * 100;

    // Analyser le risque
    const analyseRisque = analyserRisqueInvestissement(projet, montant);

    // Créer l'investissement
    const { data: investissement, error: investError } = await supabase
        .from('investissements')
        .insert({
            projet_id: projetId,
            user_id: userId,
            montant: montant,
            methode_paiement: methodePaiement,
            rendement_estime: projet.rendement_estime,
            gain_estime: gainAnnuel,
            retour_total_estime: retourTotalEstime,
            roi_estime: roi,
            score_risque: analyseRisque.score,
            niveau_risque: analyseRisque.niveau,
            statut: 'confirme',
            date_investissement: new Date().toISOString()
        })
        .select()
        .single();

    if (investError) throw investError;

    // Mettre à jour le financement du projet
    const { error: updateError } = await supabase.rpc('increment_financement', {
        p_id: projetId,
        p_montant: montant
    }).catch(async () => {
        // Si la fonction RPC n'existe pas, faire une mise à jour directe
        const { data: projetActuel } = await supabase
            .from('projets')
            .select('financement_actuel')
            .eq('id', projetId)
            .single();

        const nouveauFinancement = (projetActuel?.financement_actuel || 0) + montant;

        return await supabase
            .from('projets')
            .update({ financement_actuel: nouveauFinancement })
            .eq('id', projetId);
    });

    if (updateError) throw updateError;

    return {
        investissement,
        projections: {
            gainAnnuel,
            retourTotalEstime,
            roi,
            analyseRisque
        }
    };
}

// Analyser le risque d'un investissement
function analyserRisqueInvestissement(projet, montant) {
    let score = 100;
    let facteursRisque = [];

    // Évaluation basée sur les conditions du projet
    if (projet.humidite < 40 || projet.humidite > 80) {
        score -= 20;
        facteursRisque.push('Conditions d\'humidité défavorables');
    }

    if (projet.temperature < 15 || projet.temperature > 35) {
        score -= 15;
        facteursRisque.push('Température non optimale');
    }

    // Évaluation basée sur le financement actuel
    const tauxFinancement = projet.financement_actuel / projet.montant_besoin;
    if (tauxFinancement > 0.9) {
        score -= 10;
        facteursRisque.push('Projet presque entièrement financé');
    }

    // Évaluation basée sur le rendement promis
    if (projet.rendement_estime > 30) {
        score -= 15;
        facteursRisque.push('Rendement potentiellement irréaliste');
    } else if (projet.rendement_estime < 10) {
        score -= 5;
        facteursRisque.push('Rendement relativement faible');
    }

    // Évaluation basée sur la taille de l'investissement
    const pourcentageInvesti = montant / projet.montant_besoin;
    if (pourcentageInvesti > 0.5) {
        score -= 10;
        facteursRisque.push('Investissement significatif dans ce projet');
    }

    // Déterminer le niveau de risque
    let niveau, description;
    if (score >= 80) {
        niveau = 'Faible';
        description = 'Risque faible avec bonnes perspectives de rendement.';
    } else if (score >= 60) {
        niveau = 'Modéré';
        description = 'Risque acceptable avec monitoring recommandé.';
    } else if (score >= 40) {
        niveau = 'Élevé';
        description = 'Risque significatif. Diversification recommandée.';
    } else {
        niveau = 'Très Élevé';
        description = 'Risque très élevé. Investissement déconseillé.';
    }

    return {
        score,
        niveau,
        description,
        facteursRisque
    };
}

// Récupérer les investissements d'un utilisateur avec détails
export async function chargerInvestissementsUtilisateur(userId) {
    const { data, error } = await supabase
        .from('investissements')
        .select(`
            *,
            projets:projet_id (
                titre,
                localisation,
                culture,
                rendement_estime,
                image_url
            )
        `)
        .eq('user_id', userId)
        .order('date_investissement', { ascending: false });

    if (error) throw error;
    return data;
}

// Calculer le portefeuille total d'un utilisateur
export async function calculerPortefeuilleUtilisateur(userId) {
    const investissements = await chargerInvestissementsUtilisateur(userId);

    const totalInvesti = investissements.reduce((sum, inv) => sum + inv.montant, 0);
    const gainEstimeTotal = investissements.reduce((sum, inv) => sum + (inv.gain_estime || 0), 0);
    const retourEstimeTotal = totalInvesti + gainEstimeTotal;
    const roiMoyen = totalInvesti > 0 ? ((gainEstimeTotal / totalInvesti) * 100) : 0;

    // Répartition par culture
    const repartitionParCulture = {};
    investissements.forEach(inv => {
        const culture = inv.projets?.culture || 'Non spécifiée';
        repartitionParCulture[culture] = (repartitionParCulture[culture] || 0) + inv.montant;
    });

    return {
        totalInvesti,
        gainEstimeTotal,
        retourEstimeTotal,
        roiMoyen,
        nombreInvestissements: investissements.length,
        repartitionParCulture,
        investissements
    };
}
