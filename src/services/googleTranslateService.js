const { Translate } = require('@google-cloud/translate').v2;

class GoogleTranslateService {
  constructor() {
    // Khởi tạo Google Translate client
    // Sẽ sử dụng credentials từ environment variables hoặc service account key
    this.translate = new Translate({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE || undefined,
      // Nếu không có key file, sẽ sử dụng API key
      key: process.env.GOOGLE_TRANSLATE_API_KEY || undefined
    });
    
    // Cache để tránh dịch lại những text đã dịch
    this.translationCache = new Map();
  }

  // Dịch text sang ngôn ngữ đích
  async translateText(text, targetLanguage, sourceLanguage = 'en') {
    try {
      // Kiểm tra cache trước
      const cacheKey = `${text}_${sourceLanguage}_${targetLanguage}`;
      if (this.translationCache.has(cacheKey)) {
        return this.translationCache.get(cacheKey);
      }

      // Dịch text
      const [translation] = await this.translate.translate(text, {
        from: sourceLanguage,
        to: targetLanguage
      });

      // Lưu vào cache
      this.translationCache.set(cacheKey, translation);
      
      return translation;
    } catch (error) {
      console.error('Lỗi khi dịch text:', error);
      // Trả về text gốc nếu có lỗi
      return text;
    }
  }

  // Dịch object chứa nhiều key
  async translateObject(obj, targetLanguage, sourceLanguage = 'en') {
    const translatedObj = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        translatedObj[key] = await this.translateText(value, targetLanguage, sourceLanguage);
      } else if (typeof value === 'object' && value !== null) {
        translatedObj[key] = await this.translateObject(value, targetLanguage, sourceLanguage);
      } else {
        translatedObj[key] = value;
      }
    }
    
    return translatedObj;
  }

  // Dịch template string với các placeholder
  async translateTemplate(template, targetLanguage, placeholders = {}, sourceLanguage = 'en') {
    try {
      // Thay thế placeholder bằng giá trị thực
      let text = template;
      for (const [key, value] of Object.entries(placeholders)) {
        text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }
      
      // Dịch text
      return await this.translateText(text, targetLanguage, sourceLanguage);
    } catch (error) {
      console.error('Lỗi khi dịch template:', error);
      return template;
    }
  }

  // Lấy danh sách ngôn ngữ được hỗ trợ
  async getSupportedLanguages() {
    try {
      const [languages] = await this.translate.getLanguages();
      return languages;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách ngôn ngữ:', error);
      return [];
    }
  }

  // Detect ngôn ngữ của text
  async detectLanguage(text) {
    try {
      const [detection] = await this.translate.detect(text);
      return detection.language;
    } catch (error) {
      console.error('Lỗi khi detect ngôn ngữ:', error);
      return 'en';
    }
  }

  // Xóa cache
  clearCache() {
    this.translationCache.clear();
  }

  // Lấy thống kê cache
  getCacheStats() {
    return {
      size: this.translationCache.size,
      keys: Array.from(this.translationCache.keys())
    };
  }
}

module.exports = GoogleTranslateService; 