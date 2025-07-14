
const expenseService = require('../services/expenseService');
const languageService = require('../services/languageService');

// Simple expense parser as fallback
function parseExpenseManually(text) {
  // Pattern: category amount [note]
  // Examples: "ăn sáng 50k", "cafe 30000", "xăng xe 200k hôm nay"
  
  const patterns = [
    /(\w+)\s*(\d+\.?\d*)[k|K]?\s*(.*)?/,  // "cafe 30k note"
    /(\d+\.?\d*)[k|K]?\s+(\w+)\s*(.*)?/   // "30k cafe note"
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let category, amount, note;
      
      if (isNaN(match[1])) {
        // First pattern: category amount note
        category = match[1];
        amount = parseFloat(match[2]);
        note = match[3] || '';
      } else {
        // Second pattern: amount category note
        amount = parseFloat(match[1]);
        category = match[2];
        note = match[3] || '';
      }
      
      // Convert 'k' to thousands
      if (text.toLowerCase().includes('k')) {
        amount = amount * 1000;
      }
      
      if (amount > 0) {
        return {
          category: category.trim(),
          amount: Math.round(amount),
          note: note.trim()
        };
      }
    }
  }
  
  return null;
}

async function handleMainMenu(ctx) {
  const userId = String(ctx.from.id);
  const lang = await languageService.getUserLanguage(userId);
  const t = (key) => languageService.getTranslation(lang, key);

  const message = `${t('mainMenu') || '👋 Chào mừng bạn đến với Bot Quản lý Chi tiêu Thông minh!'}\n\n`;

  const keyboard = [
    [
      { text: '📊 Xem tổng thu chi', callback_data: 'stats_menu' },
      { text: '💰 Xem tổng thu nhập', callback_data: 'income_stats' }
    ],
    [
      { text: '💳 Số tiền hiện tại', callback_data: 'balance' },
      { text: '🏺 Chi tiết các hũ', callback_data: 'jars' }
    ],
    [
      { text: '📋 Lịch sử thu/chi', callback_data: 'history' },
      { text: '🏦 Connect Email/Bank', callback_data: 'bank_setup' }
    ],
    [
      { text: '🌐 Ngôn ngữ', callback_data: 'language_menu' },
      { text: '❓ Hướng dẫn', callback_data: 'help' }
    ]
  ];

  await ctx.reply(message, {
    reply_markup: { inline_keyboard: keyboard },
    parse_mode: 'Markdown'
  });
}

module.exports = {
  handleMainMenu
};
