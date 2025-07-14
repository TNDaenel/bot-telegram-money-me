const { PrismaClient } = require('@prisma/client');
const translations = require('../config/translations');

class LanguageService {
  constructor() {
    this.prisma = new PrismaClient();
    this.defaultLanguage = 'vi';
    this.supportedLanguages = ['vi', 'en'];
  }

  // Get user's language preference
  async getUserLanguage(userId) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });
      return user?.language || this.defaultLanguage;
    } catch (error) {
      console.error('❌ Error getting user language:', error);
      return this.defaultLanguage;
    }
  }

  // Set user's language preference
  async setUserLanguage(userId, language) {
    try {
      if (!this.supportedLanguages.includes(language)) {
        throw new Error('Unsupported language');
      }

      await this.prisma.user.upsert({
        where: { id: userId },
        update: { language },
        create: { id: userId, language }
      });

      return true;
    } catch (error) {
      console.error('❌ Error setting user language:', error);
      return false;
    }
  }

  // Get translation for a key
  async getTranslation(language, key) {
    try {
      // Fallback to default language if translation not found
      const lang = this.supportedLanguages.includes(language) ? language : this.defaultLanguage;
      return translations[lang][key] || translations[this.defaultLanguage][key] || key;
    } catch (error) {
      console.error(`❌ Error getting translation for ${key}:`, error);
      return key;
    }
  }

  // Get all translations for a language
  async getAllTranslations(language) {
    try {
      const lang = this.supportedLanguages.includes(language) ? language : this.defaultLanguage;
      return translations[lang];
    } catch (error) {
      console.error('❌ Error getting all translations:', error);
      return translations[this.defaultLanguage];
    }
  }

  // Get supported languages
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  // Get language name
  getLanguageName(language) {
    const languageNames = {
      vi: 'Tiếng Việt',
      en: 'English'
    };
    return languageNames[language] || language;
  }
}

module.exports = new LanguageService(); 