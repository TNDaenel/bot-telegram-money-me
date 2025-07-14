require('dotenv').config();

// Helper function to get translation from environment variables
function getTranslation(lang, key) {
  const envKey = `${lang.toUpperCase()}_${key.toUpperCase()}`;
  return process.env[envKey] || key;
}

// Get all translations for a language
function getAllTranslations(lang) {
  const translations = {};
  const langPrefix = `${lang.toUpperCase()}_`;
  
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith(langPrefix)) {
      const translationKey = key.replace(langPrefix, '').toLowerCase();
      translations[translationKey] = value;
    }
  }
  
  return translations;
}

// Get supported languages
function getSupportedLanguages() {
  const languages = ['vi', 'en', 'zh', 'ja', 'ko'];
  return languages.map(code => ({
    code,
    name: getTranslation(code, 'LANGUAGE_NAME') || code.toUpperCase()
  }));
}

// Get language name
function getLanguageName(lang) {
  const names = {
    vi: 'Tiếng Việt',
    en: 'English', 
    zh: '中文',
    ja: '日本語',
    ko: '한국어'
  };
  return names[lang] || lang;
}

module.exports = {
  getTranslation,
  getAllTranslations,
  getSupportedLanguages,
  getLanguageName
}; 