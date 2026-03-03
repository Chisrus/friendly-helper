// marketplace-app.js - Logique optimisée de la page marketplace
import { chargerProjets, chargerConditions, supabase } from './db.js';
import { getUser, updateNavAuth } from './auth.js';

let projetsAgricoles = [];
let conditionsIdeales = {};
let projetActuelSelectionne = null;
let projetsAffiches = 0;
const PROJETS_PAR_PAGE = 8;
let isLoading = false;

// Cache pour les cartes créées
const cartesCache = new Map();

// Analyse de risque (optimisée)
function analyserRisque(projet) {
    const ideales = conditionsIdeales[projet.culture];
    if (!ideales) return { niveau: "Inconnu", couleur: "#8b949e", icone: "--", details: "Données insuffisantes", score: 0 };

    let score = 100;
    let problemes = [];

    // Calculs optimisés
    const humiditeDiff = projet.humidite < ideales.humiditeMin ?
        (ideales.humiditeMin - projet.humidite) * 2 :
        projet.humidite > ideales.humiditeMax ?
        (projet.humidite - ideales.humiditeMax) * 2 : 0;

    const tempDiff = projet.temperature < ideales.tempMin ?
        (ideales.tempMin - projet.temperature) * 3 :
        projet.temperature > ideales.tempMax ?
        (projet.temperature - ideales.tempMax) * 3 : 0;

    score -= humiditeDiff + tempDiff;

    if (humiditeDiff > 0) problemes.push(`Humidité ${projet.humidite < ideales.humiditeMin ? 'basse' : 'haute'} (${projet.humidite}%)`);
    if (tempDiff > 0) problemes.push(`Temp. ${projet.temperature < ideales.tempMin ? 'basse' : 'haute'} (${projet.temperature}°C)`);

    if (score >= 80) return { niveau: "Favorable", couleur: "#2ea043", icone: "✅", details: "Conditions optimales.", score };
    if (score >= 50) return { niveau: "Modéré", couleur: "#d29922", icone: "⚠️", details: problemes.join(' | '), score };
    return { niveau: "Risqué", couleur: "#f85149", icone: "🔴", details: problemes.join(' | '), score };
}

// Création optimisée de carte projet (avec cache)
function creerCarteProjet(projet) {
    // Vérifier le cache
    if (cartesCache.has(projet.id)) {
        return cartesCache.get(projet.id);
    }

    const risque = analyserRisque(projet);
    const pourcentFinance = projet.montant_besoin > 0
        ? Math.round((projet.financement_actuel / projet.montant_besoin) * 100)
        : 0;

    const carteHTML = `
        <div class="project-card">
            <div class="card-image" style="background-image: url('${projet.image_url || ''}'); background-size: cover; background-position: center;">
                <div class="card-badge" style="background-color: ${projet.couleur_tag};">${projet.culture}</div>
            </div>
            <div class="card-content">
                <h3>${projet.titre}</h3>
                <p class="location">📍 ${projet.localisation}</p>

                <div class="sensor-data">
                    <div class="sensor">💧 ${projet.humidite}%</div>
                    <div class="sensor">🌡️ ${projet.temperature}°C</div>
                </div>

                <button class="btn-risk-toggle" data-risk-id="${projet.id}" style="border-color: ${risque.couleur}; color: ${risque.couleur};">
                    ${risque.icone} ${risque.niveau} (${risque.score}/100) ▼
                </button>
                <div class="risk-details" id="risk-details-${projet.id}" style="display: none; border-left-color: ${risque.couleur}; background: ${risque.couleur}15;">
                    <p class="risk-score" style="color: ${risque.couleur};">Score : ${risque.score}/100</p>
                    <p><b>Culture :</b> ${projet.culture}</p>
                    <p class="risk-diagnostic"><b>Diagnostic :</b> ${risque.details}</p>
                </div>

                <div class="investment-info">
                    <div>
                        <span class="label">Besoin</span>
                        <span class="value">${projet.montant_besoin.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div>
                        <span class="label">Rendement</span>
                        <span class="value highlight">${projet.rendement_estime}%</span>
                    </div>
                </div>

                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${pourcentFinance}%;"></div>
                    <span class="progress-text">${pourcentFinance}% financé</span>
                </div>

                <button class="btn-invest" data-id="${projet.id}">Investir Maintenant</button>
            </div>
        </div>
    `;

    // Mettre en cache
    cartesCache.set(projet.id, carteHTML);
    return carteHTML;
}

const projectsGrid = document.getElementById('projects-grid');

// Fonction optimisée d'affichage avec lazy loading
async function afficherProjets() {
    if (isLoading) return;
    isLoading = true;

    try {
        // Charger les données une seule fois
        if (projetsAgricoles.length === 0) {
            const [projets, conditions] = await Promise.all([chargerProjets(), chargerConditions()]);
            projetsAgricoles = projets;
            conditionsIdeales = conditions;
        }

        if (projetsAgricoles.length === 0) {
            projectsGrid.innerHTML = '<p class="no-projects">Aucun projet disponible.</p>';
            return;
        }

        // Lazy loading : afficher seulement les projets suivants
        const projetsAAfficher = projetsAgricoles.slice(projetsAffiches, projetsAffiches + PROJETS_PAR_PAGE);
        const cartesHTML = projetsAAfficher.map(p => creerCarteProjet(p)).join('');

        if (projetsAffiches === 0) {
            // Première charge
            projectsGrid.innerHTML = cartesHTML;
        } else {
            // Ajouter les nouvelles cartes
            projectsGrid.insertAdjacentHTML('beforeend', cartesHTML);
        }

        projetsAffiches += projetsAAfficher.length;

        // Ajouter les événements seulement pour les nouvelles cartes
        ajouterEvenements(projetsAAfficher);

        // Masquer le spinner de chargement initial
        const loadingSpinner = projectsGrid.querySelector('.loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }

        // Vérifier s'il y a plus de projets à charger
        if (projetsAffiches < projetsAgricoles.length) {
            setupInfiniteScroll();
        }

    } catch (error) {
        console.error('Erreur chargement projets:', error);
        montrerNotification('Erreur lors du chargement des projets', 'error');
    } finally {
        isLoading = false;
    }
}

// Infinite scroll optimisé
let scrollHandler = null;
function setupInfiniteScroll() {
    if (scrollHandler) return; // Déjà configuré

    const threshold = 200; // Distance avant la fin pour déclencher le chargement

    scrollHandler = debounce(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        if (documentHeight - (scrollTop + windowHeight) < threshold) {
            afficherProjets();
        }
    }, 100);

    window.addEventListener('scroll', scrollHandler, { passive: true });
}

// Fonction debounce pour optimiser les événements
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Événements optimisés (seulement pour les nouvelles cartes)
function ajouterEvenements(projets = projetsAgricoles) {
    projets.forEach(projet => {
        const card = projectsGrid.querySelector(`[data-id="${projet.id}"]`);
        if (!card) return;

        // Bouton investir
        const btnInvest = card.querySelector('.btn-invest');
        if (btnInvest && !btnInvest.hasAttribute('data-events-attached')) {
            btnInvest.setAttribute('data-events-attached', 'true');
            btnInvest.addEventListener('click', async function () {
                const user = await getUser();
                if (!user) {
                    montrerNotification("🔐 <b>Connexion requise</b><br>Vous devez être connecté pour investir.", "info");
                    setTimeout(() => window.location.href = '/login.html?redirect=/marketplace.html', 1000);
                    return;
                }
                ouvrirModale(projet);
            });
        }

        // Bouton risque
        const btnRisk = card.querySelector('.btn-risk-toggle');
        if (btnRisk && !btnRisk.hasAttribute('data-events-attached')) {
            btnRisk.setAttribute('data-events-attached', 'true');
            btnRisk.addEventListener('click', function () {
                const panel = document.getElementById('risk-details-' + this.getAttribute('data-risk-id'));
                const isHidden = panel.style.display === 'none';
                panel.style.display = isHidden ? 'block' : 'none';
                this.textContent = this.textContent.replace(isHidden ? '▼' : '▲', isHidden ? '▲' : '▼');
            });
        }
    });
}

// Modale (optimisée)
const modal = document.getElementById('invest-modal');
const modalTitle = document.getElementById('modal-project-title');
const btnClose = document.querySelector('.close-modal');
const btnConfirm = document.getElementById('btn-confirm-invest');
const amountInput = document.getElementById('amount');

function ouvrirModale(projet) {
    projetActuelSelectionne = projet;
    modalTitle.innerHTML = `Investir dans :<br>${projet.titre}`;
    amountInput.value = '';
    modal.classList.add('active');
    amountInput.focus();
}

btnClose.addEventListener('click', () => modal.classList.remove('active'));
modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

btnConfirm.addEventListener('click', async () => {
    const montant = parseInt(amountInput.value);
    const methode = document.querySelector('input[name="payment"]:checked')?.value;
    const user = await getUser();

    if (!user) { window.location.href = '/login.html'; return; }
    if (!methode) { montrerNotification("⚠️ Choisissez un mode de paiement.", "info"); return; }
    if (!montant || montant < 5000) { montrerNotification("⚠️ Minimum 5 000 FCFA.", "info"); return; }

    // Rediriger vers la page de confirmation avec les paramètres
    const params = new URLSearchParams({
        projet: projetActuelSelectionne.id,
        montant: montant,
        methode: methode
    });

    window.location.href = `/invest-confirm.html?${params.toString()}`;
});

// Notifications optimisées
function montrerNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const existingNotifications = container.querySelectorAll('.notification');
    if (existingNotifications.length >= 3) {
        existingNotifications[0].remove();
    }

    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerHTML = message;
    container.appendChild(notif);

    // Optimiser les animations
    requestAnimationFrame(() => {
        notif.classList.add('show');
        setTimeout(() => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 200);
        }, 3500);
    });
}

// Mobile menu (optimisé)
const mobileBtn = document.getElementById('mobile-menu-btn');
const navLinks = document.getElementById('nav-links');
if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
        mobileBtn.classList.toggle('active');
        navLinks.classList.toggle('active');
    }, { passive: true });
}

// Initialisation optimisée
document.addEventListener('DOMContentLoaded', () => {
    updateNavAuth();
    afficherProjets();
});

// Nettoyage des événements au déchargement
window.addEventListener('beforeunload', () => {
    if (scrollHandler) {
        window.removeEventListener('scroll', scrollHandler);
    }
});
