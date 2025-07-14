const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

class LanguageService {
  // Chỉ dùng tiếng Việt cố định
  static defaultLanguage = 'vi';
  
  // Bản dịch tiếng Việt cố định
  static translations = {
    // Menu chính
    WELCOME_MESSAGE: '👋 Chào mừng bạn đến với Bot Quản lý Chi tiêu Thông minh!',
    WELCOME_DESCRIPTION: 'Tôi có thể giúp bạn:\n• 📝 Ghi chi tiêu: "Ăn sáng 50k"\n• 📊 Thống kê chi tiết theo thời gian\n• 💰 Quản lý thu nhập và hũ tiền\n• 💬 Tư vấn tài chính thông minh\n• 🛍️ Tư vấn mua sắm dựa trên dữ liệu\n• 🏦 Tích hợp ngân hàng tự động\n• 📋 Theo dõi lịch sử giao dịch',
    SELECT_FUNCTION: '👇 Chọn chức năng bạn muốn sử dụng:',
    STATS_MENU: '📊 Xem tổng thu chi',
    INCOME_STATS: '💰 Xem tổng thu nhập',
    BALANCE: '💳 Số dư hiện tại',
    JARS: '🏺 Chi tiết các hũ',
    HISTORY: '📋 Lịch sử thu/chi',
    BANK_SETUP: '🏦 Kết nối Email/Bank',
    LANGUAGE: '🌐 Ngôn ngữ',
    HELP: '❓ Hướng dẫn',
    BACK: '🔙 Quay lại',
    MAIN_MENU: '🏠 Menu chính',
    SUCCESS: '✅ Thành công',
    ERROR: '❌ Lỗi',
    LANGUAGE_CHANGED: '✅ Đã thay đổi ngôn ngữ thành công!',
    
    // Stats
    STATS_TITLE: 'Thống kê Chi tiêu',
    SELECT_TIME: 'Chọn khoảng thời gian',
    TODAY: 'Hôm nay',
    THIS_WEEK: 'Tuần này',
    THIS_MONTH: 'Tháng này',
    THIS_YEAR: 'Năm này',
    CUSTOM: 'Tùy chỉnh',
    
    // Help
    HELP_TITLE: '❓ **Hướng dẫn**',
    HELP_BOT_TITLE: '🤖 Bot quản lý chi tiêu thông minh',
    HELP_EXPENSE_TITLE: '📝 **Ghi chi tiêu:**',
    HELP_EXPENSE_EXAMPLES: '• "Ăn trưa 80k"\n• "Cà phê 30000 với bạn"\n• "Xăng 200k"',
    HELP_ADVICE_TITLE: '💬 Tư vấn chat:',
    HELP_ADVICE_EXAMPLES: '• "Tư vấn tiết kiệm"\n• "Làm sao giảm chi tiêu?"\n• "Gợi ý kế hoạch tài chính"',
    HELP_SHOPPING_TITLE: '🛍️ Tư vấn mua sắm:',
    HELP_SHOPPING_EXAMPLES: '• "Tư vấn mua điện thoại"\n• "Có nên mua laptop?"\n• "Có nên mua quần áo?"',
    HELP_STATS_TITLE: '📊 Thống kê chi tiêu:',
    HELP_STATS_COMMANDS: '• /stats_menu - Menu thống kê\n• /stats_today - Hôm nay\n• /stats_week - Tuần này\n• /stats_month - Tháng này\n• /stats_year - Năm này',
    HELP_FINANCE_TITLE: '💰 Quản lý tài chính:',
    HELP_FINANCE_COMMANDS: '• /balance - Số dư hiện tại\n• /add_income - Thêm thu nhập\n• /income_stats - Thống kê thu nhập\n• /jars - Quản lý hũ\n• /history - Lịch sử giao dịch',
    HELP_BANK_TITLE: '🏦 Tích hợp ngân hàng:',
    HELP_BANK_COMMANDS: '• /bank_help - Hướng dẫn\n• /bank_start - Thiết lập\n• /bank_transactions - Xem giao dịch',
    HELP_LANGUAGE_TITLE: '🌐 Ngôn ngữ:',
    HELP_LANGUAGE_COMMANDS: '• /language - Đổi ngôn ngữ'
  };

  static async getUserLanguage(userId) {
    // Luôn trả về tiếng Việt
    return 'vi';
  }

  static async setUserLanguage(userId, language) {
    // Không làm gì, luôn dùng tiếng Việt
    return {
      success: true,
      message: 'Đã cập nhật ngôn ngữ thành công!'
    };
  }

  static getSupportedLanguages() {
    // Chỉ trả về tiếng Việt
    return [{ code: 'vi', name: 'Tiếng Việt' }];
  }

  static async getTranslation(languageCode, key) {
    // Luôn trả về bản dịch tiếng Việt
    return this.translations[key] || key;
  }

  static async getAllTranslations(languageCode) {
    // Luôn trả về toàn bộ bản dịch tiếng Việt
    return this.translations;
  }

  static getLanguageName(lang) {
    return 'Tiếng Việt';
  }

  // Các hàm không còn cần thiết
  static addTranslationKey() {}
  static clearTranslationCache() {}
  static getCacheStats() {}
}

module.exports = LanguageService; 