// Housefire Arena - Internationalization Module
// Coklu dil destegi

class I18n {
    constructor() {
        this.currentLocale = 'tr';
        this.translations = {};
        this.fallbackLocale = 'en';
    }
    
    // Dil dosyasini yukle
    async loadLocale(locale) {
        try {
            const response = await fetch(`locales/${locale}.json`);
            if (!response.ok) {
                console.warn(`Locale file not found: ${locale}`);
                return false;
            }
            this.translations[locale] = await response.json();
            this.currentLocale = locale;
            this.updateUI();
            return true;
        } catch (error) {
            console.error('Error loading locale:', error);
            return false;
        }
    }
    
    // Ceviri al
    t(key, params = {}) {
        const translation = this.getNestedValue(this.translations[this.currentLocale], key);
        
        if (translation) {
            return this.interpolate(translation, params);
        }
        
        // Fallback dil
        const fallback = this.getNestedValue(this.translations[this.fallbackLocale], key);
        if (fallback) {
            return this.interpolate(fallback, params);
        }
        
        // Key dondur
        return key;
    }
    
    // Ic ice deger al (obje.key.altkey)
    getNestedValue(obj, key) {
        return key.split('.').reduce((o, k) => o?.[k], obj);
    }
    
    // Parametre degistirme ({name} -> value)
    interpolate(text, params) {
        return text.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }
    
    // UI elementlerini guncelle
    updateUI() {
        // data-i18n attribute'u olan elementleri guncelle
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            el.textContent = this.t(key);
        });
        
        // data-i18n-placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            el.placeholder = this.t(key);
        });
        
        // data-i18n-title
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.dataset.i18nTitle;
            el.title = this.t(key);
        });
    }
    
    // Mevcut dili dondur
    getLocale() {
        return this.currentLocale;
    }
    
    // Dilleri listele
    getAvailableLocales() {
        return ['tr', 'en'];
    }
    
    // Dil degistir
    async setLocale(locale) {
        if (this.translations[locale]) {
            this.currentLocale = locale;
            this.updateUI();
            return true;
        }
        return await this.loadLocale(locale);
    }
}

// Global ornek
const i18n = new I18n();