// ==== SYSTÈME MULTILINGUE ====
const translations = {
    fr: {
        // Navigation
        'Le Concept': 'Le Concept',
        'Marketplace': 'Marketplace',
        'Impact': 'Impact',
        'Équipe': 'Équipe',
        'Sécurité': 'Sécurité',
        'Espace Investisseur': 'Espace Investisseur',
        
        // Hero
        'hero_title': 'La Finance Agricole <br><span class="highlight">Réinventée</span>.',
        'hero_subtitle': 'Soutenez des projets agricoles réels, suivez les rendements via nos capteurs connectés, et participez à l\'agriculture de demain grâce à notre plateforme innovante.',
        'explore_fields': 'Explorer les Champs',
        'discover_concept': 'Découvrir le Concept',
        
        // Concept
        'how_it_works': 'Comment ça <span class="highlight">Marche ?</span>',
        'how_it_works_subtitle': 'Un processus simple et transparent garanti par notre technologie.',
        'step1_title': 'Choisissez un Projet',
        'step1_desc': 'Parcourez la place de marché et sélectionnez une culture avec un rendement qui vous convient.',
        'step2_title': 'Financez en Direct',
        'step2_desc': 'Investissez directement via votre espace personnel. Pas d\'intermédiaires, plus de gains partagés.',
        'step3_title': 'Suivez et Récoltez',
        'step3_desc': 'Vérifiez les données du champ connectées aux capteurs et recevez vos rendements à la récolte.',
        
        // Marketplace
        'available_projects': 'Projets <span class="highlight">Disponibles</span>',
        'marketplace_subtitle': 'Découvrez les exploitations agricoles qui n\'attendent que votre soutien.',
        'invest_now': 'Investir Maintenant',
        'estimated_return': 'Rendement Est.',
        'funding': 'Financement',
        
        // Statistics
        'our_impact': 'Notre <span class="highlight">Impact</span>',
        'impact_subtitle': 'Des chiffres qui parlent d\'eux-mêmes',
        'hectares_cultivated': 'Hectares Cultivés',
        'farmers_supported': 'Agriculteurs Soutenus',
        'fcfa_invested': 'FCFA Investis',
        'avg_return': '% Rendement Moyen',
        
        // Team
        'our_team': 'Notre <span class="highlight">Équipe</span>',
        'team_subtitle': 'Des experts passionnés au service de l\'agriculture',
        'our_partners': 'Nos <span class="highlight">Partenaires</span>',
        
        // Testimonials
        'they_trust_us': 'Ils Nous <span class="highlight">Font Confiance</span>',
        'testimonials_subtitle': 'Retours d\'expérience de nos partenaires',
        
        // Risk & Guarantees
        'transparency_security': 'Transparence et <span class="highlight">Sécurité</span>',
        'risk_subtitle': 'Tout ce que vous devez savoir sur votre investissement',
        'guarantees': 'Nos Garanties',
        'risks': 'Risques Potentiels',
        'performance': 'Performance Historique',
        'success_rate': 'Taux de réussite',
        'avg_performance': 'Rendement moyen',
        'delivered_projects': 'Projets livrés',
        'important_info': 'Informations Importantes',
        'disclaimer': 'Les investissements agricoles comportent des risques. Pass performance ne garantit pas les résultats futurs. Nous vous recommandons de diversifier vos investissements et de ne pas investir plus que ce que vous pouvez vous permettre de perdre.'
    },
    en: {
        // Navigation
        'Le Concept': 'How it Works',
        'Marketplace': 'Marketplace',
        'Impact': 'Impact',
        'Équipe': 'Team',
        'Sécurité': 'Security',
        'Espace Investisseur': 'Investor Space',
        
        // Hero
        'hero_title': 'Agricultural Finance <br><span class="highlight">Reinvented</span>.',
        'hero_subtitle': 'Support real agricultural projects, track yields through our connected sensors, and participate in tomorrow\'s agriculture through our innovative platform.',
        'explore_fields': 'Explore Fields',
        'discover_concept': 'Discover Concept',
        
        // Concept
        'how_it_works': 'How <span class="highlight">It Works</span>',
        'how_it_works_subtitle': 'A simple and transparent process guaranteed by our technology.',
        'step1_title': 'Choose a Project',
        'step1_desc': 'Browse the marketplace and select a crop with a return that suits you.',
        'step2_title': 'Invest Directly',
        'step2_desc': 'Invest directly through your personal space. No intermediaries, more shared profits.',
        'step3_title': 'Track and Harvest',
        'step3_desc': 'Check field data connected to sensors and receive your returns at harvest.',
        
        // Marketplace
        'available_projects': 'Available <span class="highlight">Projects</span>',
        'marketplace_subtitle': 'Discover agricultural operations that are waiting for your support.',
        'invest_now': 'Invest Now',
        'estimated_return': 'Est. Return',
        'funding': 'Funding',
        
        // Statistics
        'our_impact': 'Our <span class="highlight">Impact</span>',
        'impact_subtitle': 'Numbers that speak for themselves',
        'hectares_cultivated': 'Hectares Cultivated',
        'farmers_supported': 'Farmers Supported',
        'fcfa_invested': 'FCFA Invested',
        'avg_return': 'Avg. Return %',
        
        // Team
        'our_team': 'Our <span class="highlight">Team</span>',
        'team_subtitle': 'Passionate experts serving agriculture',
        'our_partners': 'Our <span class="highlight">Partners</span>',
        
        // Testimonials
        'they_trust_us': 'They <span class="highlight">Trust Us</span>',
        'testimonials_subtitle': 'Feedback from our partners',
        
        // Risk & Guarantees
        'transparency_security': 'Transparency and <span class="highlight">Security</span>',
        'risk_subtitle': 'Everything you need to know about your investment',
        'guarantees': 'Our Guarantees',
        'risks': 'Potential Risks',
        'performance': 'Historical Performance',
        'success_rate': 'Success Rate',
        'avg_performance': 'Average Return',
        'delivered_projects': 'Delivered Projects',
        'important_info': 'Important Information',
        'disclaimer': 'Agricultural investments involve risks. Past performance does not guarantee future results. We recommend diversifying your investments and not investing more than you can afford to lose.'
    }
};

let currentLang = 'fr';

function switchLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    
    // Update navigation
    document.querySelectorAll('[data-fr][data-en]').forEach(element => {
        element.textContent = element.getAttribute(`data-${lang}`);
    });
    
    // Update hero section
    const heroTitle = document.querySelector('.hero-content h1');
    const heroSubtitle = document.querySelector('.hero-content p');
    const heroButtons = document.querySelectorAll('.hero-buttons a');
    
    if (heroTitle) heroTitle.innerHTML = translations[lang].hero_title;
    if (heroSubtitle) heroSubtitle.textContent = translations[lang].hero_subtitle;
    if (heroButtons[0]) heroButtons[0].textContent = translations[lang].explore_fields;
    if (heroButtons[1]) heroButtons[1].textContent = translations[lang].discover_concept;
    
    // Update section headers
    updateSectionHeaders(lang);
    
    // Update investment buttons
    document.querySelectorAll('.btn-invest').forEach(btn => {
        btn.textContent = translations[lang].invest_now;
    });
    
    // Update labels
    document.querySelectorAll('.label').forEach(label => {
        if (label.textContent.includes('Rendement Est.')) {
            label.textContent = translations[lang].estimated_return;
        } else if (label.textContent.includes('Financement')) {
            label.textContent = translations[lang].funding;
        }
    });
    
    // Update stat labels
    updateStatLabels(lang);
    
    // Update disclaimer
    const disclaimerText = document.querySelector('.disclaimer-box p');
    if (disclaimerText) {
        disclaimerText.textContent = translations[lang].disclaimer;
    }
    
    // Save preference
    localStorage.setItem('preferredLanguage', lang);
}

function updateSectionHeaders(lang) {
    const headers = {
        '#concept h2': translations[lang].how_it_works,
        '#concept .section-header p': translations[lang].how_it_works_subtitle,
        '#marketplace h2': translations[lang].available_projects,
        '#marketplace .section-header p': translations[lang].marketplace_subtitle,
        '#statistics h2': translations[lang].our_impact,
        '#statistics .section-header p': translations[lang].impact_subtitle,
        '#team h2': translations[lang].our_team,
        '#team .section-header p': translations[lang].team_subtitle,
        '#team h3': translations[lang].our_partners,
        '#testimonials h2': translations[lang].they_trust_us,
        '#testimonials .section-header p': translations[lang].testimonials_subtitle,
        '#risk-guarantees h2': translations[lang].transparency_security,
        '#risk-guarantees .section-header p': translations[lang].risk_subtitle
    };
    
    Object.entries(headers).forEach(([selector, text]) => {
        const element = document.querySelector(selector);
        if (element) {
            if (text.includes('<span')) {
                element.innerHTML = text;
            } else {
                element.textContent = text;
            }
        }
    });
}

function updateStatLabels(lang) {
    const statLabels = {
        'Hectares Cultivés': translations[lang].hectares_cultivated,
        'Agriculteurs Soutenus': translations[lang].farmers_supported,
        'FCFA Investis': translations[lang].fcfa_invested,
        '% Rendement Moyen': translations[lang].avg_return
    };
    
    document.querySelectorAll('.stat-label').forEach(label => {
        const currentText = label.textContent.trim();
        if (statLabels[currentText]) {
            label.textContent = statLabels[currentText];
        }
    });
}

// Language selector event listener
document.addEventListener('DOMContentLoaded', function() {
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        // Load saved preference
        const savedLang = localStorage.getItem('preferredLanguage') || 'fr';
        languageSelect.value = savedLang;
        switchLanguage(savedLang);
        
        // Add change event
        languageSelect.addEventListener('change', function(e) {
            switchLanguage(e.target.value);
        });
    }
});

// Add CSS for language selector
const langStyles = `
.language-selector {
    margin-left: var(--spacing-md);
}

.lang-select {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    color: var(--text-color);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: 6px;
    font-family: 'Outfit', sans-serif;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.lang-select:hover {
    border-color: var(--accent-color);
}

.lang-select:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.2);
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = langStyles;
document.head.appendChild(styleSheet);
