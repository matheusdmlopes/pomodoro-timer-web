const translations = {};
let currentLang = localStorage.getItem('language') || 'pt'; // Default to pt

async function fetchTranslations(lang) {
    if (translations[lang]) {
        return translations[lang];
    }
    try {
        const response = await fetch(`locales/${lang}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        translations[lang] = data;
        return data;
    } catch (error) {
        console.error('Could not fetch translations:', error);
        // Fallback to Portuguese if the requested language fails
        if (lang !== 'pt') { // Fallback to pt
            return await fetchTranslations('pt'); // Fallback to pt
        }
        return {}; // Return empty if even Portuguese fails
    }
}

function updateContent(langData) {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (langData[key]) {
            // Handle specific elements like title, meta tags, etc.
            if (element.tagName === 'TITLE') {
                element.textContent = langData[key];
            } else if (element.tagName === 'META' && element.name === 'description') {
                element.content = langData[key];
            } else if (element.tagName === 'META' && element.name === 'keywords') {
                element.content = langData[key];
            } else {
                element.textContent = langData[key];
            }
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (langData[key]) {
            element.placeholder = langData[key];
        }
    });

    document.querySelectorAll('[data-i18n-label]').forEach(element => {
        const key = element.getAttribute('data-i18n-label');
        if (langData[key]) {
            element.setAttribute('aria-label', langData[key]);
        }
    });

    // Update the lang attribute on the HTML tag
    // Use the *currentLang* variable (which holds 'pt', 'en', 'es')
    let htmlLang = currentLang; // Use the globally stored current language
    if (currentLang === 'pt') htmlLang = 'pt-BR';
    else if (currentLang === 'es') htmlLang = 'es-ES'; // Example, adjust if needed
    else if (currentLang === 'en') htmlLang = 'en-US'; // Example, adjust if needed

    document.documentElement.lang = htmlLang;
    // Keep data-lang consistent with the keys we use ('pt', 'en', 'es')
    document.documentElement.setAttribute('data-lang', currentLang);
}

async function setLanguage(lang) {
    if (lang === currentLang && translations[lang]) {
        return; // Don't reload if language is already set and loaded
    }
    currentLang = lang;
    const langData = await fetchTranslations(lang);
    if (Object.keys(langData).length > 0) {
        updateContent(langData);
        localStorage.setItem('language', lang);
        updateActiveButton(lang);
        // Dispatch a custom event to notify other scripts (like timer.js for mode names)
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { langData } }));
    } else {
        console.error(`Failed to load translations for ${lang}`);
    }
}

function updateActiveButton(lang) {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setLanguage(currentLang); // currentLang is now initialized with 'pt'

    document.querySelectorAll('.lang-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const lang = event.target.getAttribute('data-lang');
            setLanguage(lang);
        });
    });
});

// Function for other scripts to get translations
function getTranslation(key) {
    const langData = translations[currentLang] || translations['pt'] || {}; // Fallback to pt
    return langData[key] || key; // Return key as fallback
} 