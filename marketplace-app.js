// marketplace-app.js - Logique de la page marketplace
import { chargerProjets, chargerConditions, supabase } from './db.js';
import { getUser, updateNavAuth } from './auth.js';

let projetsAgricoles = [];
let conditionsIdeales = {};
let projetActuelSelectionne = null;

// Analyse de risque
function analyserRisque(projet) {
    const ideales = conditionsIdeales[projet.culture];
    if (!ideales) return { niveau: "Inconnu", couleur: "#8b949e", icone: "--", details: "Données insuffisantes", score: 0 };

    let score = 100;
    let problemes = [];

    if (projet.humidite < ideales.humiditeMin) {
        score -= (ideales.humiditeMin - projet.humidite) * 2;
        problemes.push(`Humidité basse (${projet.humidite}%)`);
    } else if (projet.humidite > ideales.humiditeMax) {
        score -= (projet.humidite - ideales.humiditeMax) * 2;
        problemes.push(`Humidité haute (${projet.humidite}%)`);
    }

    if (projet.temperature < ideales.tempMin) {
        score -= (ideales.tempMin - projet.temperature) * 3;
        problemes.push(`Temp. basse (${projet.temperature}°C)`);
    } else if (projet.temperature > ideales.tempMax) {
        score -= (projet.temperature - ideales.tempMax) * 3;
        problemes.push(`Temp. haute (${projet.temperature}°C)`);
    }

    if (score >= 80) return { niveau: "Favorable", couleur: "#2ea043", icone: "✅", details: "Conditions optimales.", score };
    if (score >= 50) return { niveau: "Modéré", couleur: "#d29922", icone: "⚠️", details: problemes.join(' | '), score };
    return { niveau: "Risqué", couleur: "#f85149", icone: "🔴", details: problemes.join(' | '), score };
}

function creerCarteProjet(projet) {
    const risque = analyserRisque(projet);
    const pourcentFinance = projet.montant_besoin > 0 
        ? Math.round((projet.financement_actuel / projet.montant_besoin) * 100) 
        : 0;

    return `
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

    projectsGrid.innerHTML = projetsAgricoles.map(p => creerCarteProjet(p)).join('');
    ajouterEvenements();
}

function ajouterEvenements() {
    document.querySelectorAll('.btn-invest').forEach(btn => {
        btn.addEventListener('click', async function () {
            const user = await getUser();
            if (!user) {
                montrerNotification("🔐 <b>Connexion requise</b><br>Vous devez être connecté pour investir.", "info");
                setTimeout(() => window.location.href = '/login.html?redirect=/marketplace.html', 1500);
                return;
            }
            const projet = projetsAgricoles.find(p => p.id === this.getAttribute('data-id'));
            if (projet) ouvrirModale(projet);
        });
    });

    document.querySelectorAll('.btn-risk-toggle').forEach(btn => {
        btn.addEventListener('click', function () {
            const panel = document.getElementById('risk-details-' + this.getAttribute('data-risk-id'));
            const isHidden = panel.style.display === 'none';
            panel.style.display = isHidden ? 'block' : 'none';
            this.textContent = this.textContent.replace(isHidden ? '▼' : '▲', isHidden ? '▲' : '▼');
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
    modalTitle.innerHTML = `Investir dans :<br>${projet.titre}`;
    amountInput.value = '';
    modal.classList.add('active');
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

    btnConfirm.disabled = true;
    btnConfirm.textContent = 'Traitement...';

    const { error } = await supabase.from('investissements').insert({
        projet_id: projetActuelSelectionne.id,
        montant,
        methode_paiement: methode,
        user_id: user.id
    });

    btnConfirm.disabled = false;
    btnConfirm.textContent = 'Confirmer le Paiement';
    modal.classList.remove('active');

    if (!error) {
        montrerNotification(`✅ <b>Investissement enregistré</b><br>${montant.toLocaleString('fr-FR')} FCFA via ${methode}`, "info");
        afficherProjets();
    } else {
        montrerNotification("❌ Erreur : " + error.message, "info");
    }
});

// Notifications
function montrerNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerHTML = message;
    container.appendChild(notif);
    setTimeout(() => notif.classList.add('show'), 10);
    setTimeout(() => { notif.classList.remove('show'); setTimeout(() => notif.remove(), 300); }, 4000);
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
