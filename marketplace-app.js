// marketplace-app.js - Logique de la page marketplace
import { chargerProjets, chargerConditions, supabase } from './db.js';
import { getUser, updateNavAuth } from './auth.js';

let projetsAgricoles = [];
let conditionsIdeales = {};
let projetActuelSelectionne = null;

const HTML_ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}

function toFiniteNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function maybeNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : '?';
}

function sanitizeColor(value, fallback = '#4CAF50') {
    const color = String(value ?? '').trim();
    return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color) ? color : fallback;
}

function sanitizeImageUrl(value) {
    if (!value) return '';
    try {
        const parsed = new URL(String(value), window.location.origin);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.href;
        }
    } catch (error) {
        return '';
    }
    return '';
}

// Analyse de risque
function analyserRisque(projet) {
    const ideales = conditionsIdeales[projet.culture];
    if (!ideales) {
        return {
            niveau: 'Inconnu',
            couleur: '#8b949e',
            icone: '--',
            details: 'Donnees insuffisantes',
            score: 0
        };
    }

    let score = 100;
    const problemes = [];

    if (projet.humidite < ideales.humiditeMin) {
        score -= (ideales.humiditeMin - projet.humidite) * 2;
        problemes.push(`Humidite basse (${projet.humidite}%)`);
    } else if (projet.humidite > ideales.humiditeMax) {
        score -= (projet.humidite - ideales.humiditeMax) * 2;
        problemes.push(`Humidite haute (${projet.humidite}%)`);
    }

    if (projet.temperature < ideales.tempMin) {
        score -= (ideales.tempMin - projet.temperature) * 3;
        problemes.push(`Temperature basse (${projet.temperature}C)`);
    } else if (projet.temperature > ideales.tempMax) {
        score -= (projet.temperature - ideales.tempMax) * 3;
        problemes.push(`Temperature haute (${projet.temperature}C)`);
    }

    if (score >= 80) {
        return { niveau: 'Favorable', couleur: '#2ea043', icone: 'OK', details: 'Conditions optimales.', score };
    }
    if (score >= 50) {
        return { niveau: 'Modere', couleur: '#d29922', icone: '!', details: problemes.join(' | '), score };
    }
    return { niveau: 'Risque', couleur: '#f85149', icone: 'X', details: problemes.join(' | '), score };
}

function creerCarteProjet(projet) {
    const risque = analyserRisque(projet);
    const montantBesoin = toFiniteNumber(projet.montant_besoin);
    const financementActuel = toFiniteNumber(projet.financement_actuel);
    const pourcentFinance = montantBesoin > 0 ? Math.round((financementActuel / montantBesoin) * 100) : 0;
    const pourcentFinanceForWidth = Math.max(0, Math.min(pourcentFinance, 100));

    const projetId = String(projet.id ?? '');
    const condition = conditionsIdeales[projet.culture] || {};
    const culture = escapeHtml(projet.culture);
    const titre = escapeHtml(projet.titre);
    const localisation = escapeHtml(projet.localisation);
    const humidite = toFiniteNumber(projet.humidite);
    const temperature = toFiniteNumber(projet.temperature);
    const rendementEstime = toFiniteNumber(projet.rendement_estime);
    const humiditeMin = maybeNumber(condition.humiditeMin);
    const humiditeMax = maybeNumber(condition.humiditeMax);
    const tempMin = maybeNumber(condition.tempMin);
    const tempMax = maybeNumber(condition.tempMax);
    const risqueCouleur = sanitizeColor(risque.couleur, '#8b949e');
    const risqueNiveau = escapeHtml(risque.niveau);
    const risqueIcone = escapeHtml(risque.icone);
    const risqueDetails = escapeHtml(risque.details);
    const couleurTag = sanitizeColor(projet.couleur_tag);
    const imageUrl = sanitizeImageUrl(projet.image_url);
    const imageStyle = imageUrl
        ? `background-image: url('${escapeHtml(imageUrl)}'); background-size: cover; background-position: center;`
        : '';

    return `
        <div class="project-card">
            <div class="card-image" style="${imageStyle}">
                <div class="card-badge" style="background-color: ${couleurTag};">${culture}</div>
            </div>
            <div class="card-content">
                <h3>${titre}</h3>
                <p class="location">${localisation}</p>

                <div class="sensor-data">
                    <div class="sensor">${humidite}%</div>
                    <div class="sensor">${temperature}C</div>
                </div>

                <button class="btn-risk-toggle" data-risk-id="${escapeHtml(projetId)}" style="border-color: ${risqueCouleur}; color: ${risqueCouleur};">
                    ${risqueIcone} ${risqueNiveau} (${risque.score}/100) v
                </button>
                <div class="risk-details" id="risk-details-${escapeHtml(projetId)}" style="display: none; border-left-color: ${risqueCouleur}; background: ${risqueCouleur}15;">
                    <p class="risk-score" style="color: ${risqueCouleur};">Score : ${risque.score}/100</p>
                    <p><b>Culture :</b> ${culture}</p>
                    <p><b>Humidite :</b> ${humidite}% (ideal : ${humiditeMin}-${humiditeMax}%)</p>
                    <p><b>Temperature :</b> ${temperature}C (ideal : ${tempMin}-${tempMax}C)</p>
                    <p class="risk-diagnostic"><b>Diagnostic :</b> ${risqueDetails}</p>
                </div>

                <div class="investment-info">
                    <div>
                        <span class="label">Besoin</span>
                        <span class="value">${montantBesoin.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div>
                        <span class="label">Rendement</span>
                        <span class="value highlight">${rendementEstime}%</span>
                    </div>
                </div>

                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${pourcentFinanceForWidth}%;"></div>
                    <span class="progress-text">${pourcentFinance}% finance</span>
                </div>

                <button class="btn-invest" data-id="${escapeHtml(projetId)}">Investir maintenant</button>
            </div>
        </div>
    `;
}

const projectsGrid = document.getElementById('projects-grid');

async function afficherProjets() {
    const [projets, conditions] = await Promise.all([chargerProjets(), chargerConditions()]);
    projetsAgricoles = projets;
    conditionsIdeales = conditions;

    if (projetsAgricoles.length === 0) {
        projectsGrid.innerHTML = '<p class="no-projects">Aucun projet disponible.</p>';
        return;
    }

    projectsGrid.innerHTML = projetsAgricoles.map((projet) => creerCarteProjet(projet)).join('');
    ajouterEvenements();
}

function ajouterEvenements() {
    document.querySelectorAll('.btn-invest').forEach((btn) => {
        btn.addEventListener('click', async function () {
            const user = await getUser();
            if (!user) {
                montrerNotification('Connexion requise. Vous devez etre connecte pour investir.', 'info');
                setTimeout(() => {
                    window.location.href = '/login.html?redirect=/marketplace.html';
                }, 1500);
                return;
            }

            const projet = projetsAgricoles.find((p) => p.id === this.getAttribute('data-id'));
            if (projet) ouvrirModale(projet);
        });
    });

    document.querySelectorAll('.btn-risk-toggle').forEach((btn) => {
        btn.addEventListener('click', function () {
            const panel = document.getElementById(`risk-details-${this.getAttribute('data-risk-id')}`);
            const isHidden = panel.style.display === 'none';
            panel.style.display = isHidden ? 'block' : 'none';
            this.textContent = this.textContent.replace(isHidden ? 'v' : '^', isHidden ? '^' : 'v');
        });
    });
}

// Modale
const modal = document.getElementById('invest-modal');
const modalTitle = document.getElementById('modal-project-title');
const btnClose = document.querySelector('.close-modal');
const btnConfirm = document.getElementById('btn-confirm-invest');
const amountInput = document.getElementById('amount');

function ouvrirModale(projet) {
    projetActuelSelectionne = projet;
    modalTitle.replaceChildren(
        document.createTextNode('Investir dans :'),
        document.createElement('br'),
        document.createTextNode(String(projet.titre ?? 'Projet'))
    );
    amountInput.value = '';
    modal.classList.add('active');
}

btnClose.addEventListener('click', () => modal.classList.remove('active'));
modal.addEventListener('click', (event) => {
    if (event.target === modal) modal.classList.remove('active');
});

btnConfirm.addEventListener('click', async () => {
    const montant = parseInt(amountInput.value, 10);
    const methode = document.querySelector('input[name="payment"]:checked')?.value;
    const user = await getUser();

    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    if (!methode) {
        montrerNotification('Choisissez un mode de paiement.', 'info');
        return;
    }
    if (!montant || montant < 5000) {
        montrerNotification('Le minimum est de 5 000 FCFA.', 'info');
        return;
    }

    btnConfirm.disabled = true;
    btnConfirm.textContent = 'Traitement...';

    const { error } = await supabase.from('investissements').insert({
        projet_id: projetActuelSelectionne.id,
        montant,
        methode_paiement: methode,
        user_id: user.id
    });

    btnConfirm.disabled = false;
    btnConfirm.textContent = 'Confirmer le paiement';
    modal.classList.remove('active');

    if (!error) {
        montrerNotification(`Investissement enregistre: ${montant.toLocaleString('fr-FR')} FCFA via ${methode}.`, 'info');
        afficherProjets();
    } else {
        montrerNotification(`Erreur: ${error.message || 'Une erreur est survenue.'}`, 'info');
    }
});

// Notifications
function montrerNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = String(message ?? '');
    container.appendChild(notif);
    setTimeout(() => notif.classList.add('show'), 10);
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 4000);
}

// Mobile menu
const mobileBtn = document.getElementById('mobile-menu-btn');
const navLinks = document.getElementById('nav-links');
if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
        mobileBtn.classList.toggle('active');
        navLinks.classList.toggle('active');
    });
}

// Init
updateNavAuth();
afficherProjets();
