const navbar = document.getElementById('navbar');
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');

const setNavbarShadow = () => {
    if (!navbar) {
        return;
    }
    navbar.classList.toggle('scrolled', window.scrollY > 8);
};

setNavbarShadow();
window.addEventListener('scroll', setNavbarShadow, { passive: true });

if (burger && mobileMenu) {
    const closeMobileMenu = () => {
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.remove('open');
    };

    burger.addEventListener('click', () => {
        const isOpen = burger.classList.toggle('open');
        burger.setAttribute('aria-expanded', String(isOpen));
        mobileMenu.classList.toggle('open', isOpen);
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            if (!link.classList.contains('lang-toggle')) {
                closeMobileMenu();
            }
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 920) {
            closeMobileMenu();
        }
    });
}

// FAQ accordion
document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const isOpen = btn.getAttribute('aria-expanded') === 'true';

        document.querySelectorAll('.faq-item').forEach((faqItem) => {
            faqItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            faqItem.classList.remove('open');
        });

        if (!isOpen && item) {
            btn.setAttribute('aria-expanded', 'true');
            item.classList.add('open');
        }
    });
});

const LANG_STORAGE_KEY = 'spotgo-language';

const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = value;
    }
};

const setHtml = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) {
        element.innerHTML = value;
    }
};

const setTextList = (selector, values) => {
    document.querySelectorAll(selector).forEach((element, index) => {
        if (typeof values[index] === 'string') {
            element.textContent = values[index];
        }
    });
};

const setHtmlList = (selector, values) => {
    document.querySelectorAll(selector).forEach((element, index) => {
        if (typeof values[index] === 'string') {
            element.innerHTML = values[index];
        }
    });
};

const TRANSLATIONS_BASE_PATH = 'i18n';
const translationCache = {};
const translationRequests = {};

const emptyTranslation = {
    documentLang: 'en',
    pageTitle: document.title,
    langCode: 'US',
    text: {},
    html: {},
    listText: [],
    listHtml: []
};

const normalizeLanguage = (language) => (language === 'es' ? 'es' : 'en');

const loadLanguageFile = async (language) => {
    const normalized = normalizeLanguage(language);

    if (translationCache[normalized]) {
        return translationCache[normalized];
    }

    if (!translationRequests[normalized]) {
        translationRequests[normalized] = fetch(`${TRANSLATIONS_BASE_PATH}/${normalized}.json`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Could not load ${normalized}.json (${response.status})`);
                }
                return response.json();
            })
            .then((data) => {
                translationCache[normalized] = data;
                return data;
            })
            .catch((error) => {
                console.error(`[i18n] Failed to load language file: ${normalized}`, error);
                return null;
            })
            .finally(() => {
                delete translationRequests[normalized];
            });
    }

    return translationRequests[normalized];
};

const getTranslation = async (language) => {
    const normalized = normalizeLanguage(language);

    const primary = await loadLanguageFile(normalized);
    if (primary) {
        return primary;
    }

    if (normalized !== 'en') {
        const fallback = await loadLanguageFile('en');
        if (fallback) {
            return fallback;
        }
    }

    return emptyTranslation;
};

let languageUpdateToken = 0;

const applyLanguage = async (language) => {
    const normalized = normalizeLanguage(language);
    const token = ++languageUpdateToken;
    const translation = await getTranslation(normalized);

    if (token !== languageUpdateToken) {
        return;
    }

    document.documentElement.lang = translation.documentLang || 'en';
    document.title = translation.pageTitle || document.title;

    Object.entries(translation.text || {}).forEach(([selector, value]) => {
        setText(selector, value);
    });

    Object.entries(translation.html || {}).forEach(([selector, value]) => {
        setHtml(selector, value);
    });

    (translation.listText || []).forEach(({ selector, values }) => {
        setTextList(selector, values);
    });

    (translation.listHtml || []).forEach(({ selector, values }) => {
        setHtmlList(selector, values);
    });

    const languageCode = translation.langCode || (normalized === 'es' ? 'ES' : 'US');
    document.querySelectorAll('.lang-code').forEach((label) => {
        label.textContent = languageCode;
    });

    const ariaLabel = normalized === 'en' ? 'Switch language to Spanish' : 'Cambiar idioma a ingles';
    document.querySelectorAll('.lang-toggle').forEach((toggle) => {
        toggle.setAttribute('aria-label', ariaLabel);
    });

    localStorage.setItem(LANG_STORAGE_KEY, normalized);
};

let currentLanguage = normalizeLanguage(localStorage.getItem(LANG_STORAGE_KEY));

applyLanguage(currentLanguage);

document.querySelectorAll('.lang-toggle').forEach((toggle) => {
    toggle.addEventListener('click', async (event) => {
        event.preventDefault();
        currentLanguage = currentLanguage === 'en' ? 'es' : 'en';
        await applyLanguage(currentLanguage);
    });
});
