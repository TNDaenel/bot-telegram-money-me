const bankMessageHandler = require('./bankMessageHandler');
const expenseService = require('../services/expenseService');
const incomeAnalysisService = require('../services/incomeAnalysisService');
const balanceService = require('../services/balanceService');
const jarService = require('../services/jarService');
const goalHandler = require('./goalHandler');
const languageService = require('../services/languageService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Thêm Map lưu trạng thái chờ nhập ngôn ngữ
const waitingForLanguageInput = new Map();

// Handler tổng hợp cho tất cả tin nhắn text
async function unifiedMessageHandler(ctx, next) {
  const text = ctx.message.text;
  const userId = String(ctx.from.id);
  
  // Nếu user đang ở trạng thái chờ nhập ngôn ngữ
  if (waitingForLanguageInput.get(userId)) {
    // Nhận diện ngôn ngữ từ text
    const languages = require('../config/languages');
    const input = text.trim().toLowerCase();
    let detectedLang = null;
    // So khớp mã ISO
    for (const code of Object.keys(languages)) {
      if (input === code.toLowerCase()) detectedLang = code;
    }
    // So khớp tên tiếng Việt, tiếng Anh, tên bản địa (không phân biệt hoa thường)
    if (!detectedLang) {
      for (const [code, lang] of Object.entries(languages)) {
        if (
          input === lang.name.toLowerCase() ||
          (lang.translations.languageChanged && input === lang.translations.languageChanged.toLowerCase())
        ) {
          detectedLang = code;
        }
      }
    }
    // Nếu input chứa tên ngôn ngữ (không phân biệt hoa thường)
    if (!detectedLang) {
      for (const [code, lang] of Object.entries(languages)) {
        if (
          input.includes(lang.name.toLowerCase()) ||
          (lang.translations.languageChanged && input.includes(lang.translations.languageChanged.toLowerCase()))
        ) {
          detectedLang = code;
        }
      }
    }
    // Một số từ khóa phổ biến
    if (!detectedLang) {
      if (input.includes('việt') || input.includes('vietnam')) detectedLang = 'vi';
      else if (input.includes('english') || input.includes('anh')) detectedLang = 'en';
      else if (input.includes('trung') || input.includes('chinese') || input.includes('中文')) detectedLang = 'zh';
      else if (input.includes('nhật') || input.includes('japan') || input.includes('日本')) detectedLang = 'ja';
      else if (input.includes('hàn') || input.includes('korea') || input.includes('한국')) detectedLang = 'ko';
    }
    if (detectedLang && languages[detectedLang]) {
      const languageService = require('../services/languageService');
      await languageService.setUserLanguage(userId, detectedLang);
      waitingForLanguageInput.delete(userId);
      await ctx.reply(languages[detectedLang].translations.languageChanged || 'Đã đổi ngôn ngữ thành công!');
      // Hiển thị lại menu chính
      if (typeof handleMainMenu === 'function') await handleMainMenu(ctx, detectedLang);
      return;
    } else {
      console.log('[LANG DETECT FAIL]', { input, userId });
      await ctx.reply('❌ Không nhận diện được ngôn ngữ. Vui lòng nhập lại tên ngôn ngữ hoặc mã ISO (vi, en, zh, ja, ko)...');
      return;
    }
  }
  
  try {
    // Bỏ qua commands (bắt đầu bằng /)
    if (text.startsWith('/')) {
      if (text === '/language' || text === '/lang') {
        return await handleLanguageSelection(ctx);
      }
      return next();
    }

    // Kiểm tra xem có phải là lựa chọn ngôn ngữ không
    if (text.toLowerCase().includes('ngôn ngữ') || text.toLowerCase().includes('language')) {
      return await handleLanguageSelection(ctx);
    }
    
    // Thêm hàm lấy tất cả hũ (kể cả đã xóa) cho debug
    if (text.trim().toLowerCase() === 'debug all jars') {
      return await handleAllJarsDebug(ctx);
    }

    // Thêm hàm hướng dẫn xóa và tạo lại hũ tiền
    if (text.trim().toLowerCase() === 'huong dan xoa hu') {
      return await handleGuideDeleteAndCreateJar(ctx);
    }
    
    // 1. Kiểm tra xem có phải là yêu cầu hũ tiền không
    if (isJarRequest(text)) {
      console.log(`🏺 Jar request from user ${userId}: ${text}`);
      return await handleJarRequest(ctx, text);
    }
    
    // 2. Kiểm tra xem có phải là yêu cầu số dư không
    if (isBalanceRequest(text)) {
      console.log(`💰 Balance request from user ${userId}: ${text}`);
      return await handleBalanceRequest(ctx, text);
    }
    
    // 3. Kiểm tra xem có phải là yêu cầu thống kê tùy chỉnh không
    if (isCustomStatsRequest(text)) {
      console.log(`📊 Custom stats request from user ${userId}: ${text}`);
      return await handleCustomStatsRequest(ctx, text);
    }
    
    // 4. Kiểm tra xem có phải là yêu cầu mục tiêu không
    if (isGoalRequest(text)) {
      console.log(`🎯 Goal request from user ${userId}: ${text}`);
      return await handleGoalRequest(ctx, text);
    }
    
    // 5. Kiểm tra xem có phải là JSON input cho mục tiêu không
    if (isJSONGoalInput(text)) {
      console.log(`📝 JSON goal input from user ${userId}: ${text}`);
      return await handleJSONGoalInput(ctx, text);
    }
    
    // 6. AI phân tích input để xác định loại giao dịch
    const aiAnalysis = await analyzeInputWithAI(text);
    console.log(`🤖 AI analysis for user ${userId}:`, aiAnalysis);
    
    if (aiAnalysis.type === 'income' && aiAnalysis.confidence > 0.6) {
      console.log(`💰 AI detected income from user ${userId}: ${text}`);
      return await handleIncomeInput(ctx, text);
    } else if (aiAnalysis.type === 'expense' && aiAnalysis.confidence > 0.6) {
      console.log(`💸 AI detected expense from user ${userId}: ${text}`);
      return await handleManualExpense(ctx, text);
    }
    
    // 7. Fallback: Kiểm tra các pattern cũ
    if (isIncomeInput(text)) {
      console.log(`💰 Income input from user ${userId}: ${text}`);
      return await handleIncomeInput(ctx, text);
    }
    
    if (isManualExpense(text)) {
      console.log(`💸 Manual expense from user ${userId}: ${text}`);
      return await handleManualExpense(ctx, text);
    }
    
    // 8. Xử lý tin nhắn ngân hàng
    if (text.toLowerCase().includes('bank') || text.toLowerCase().includes('email') || 
        text.toLowerCase().includes('ngân hàng') || text.toLowerCase().includes('gmail') ||
        text.includes('VCB') || text.includes('TCB') || text.includes('TPBank') || 
        text.includes('MBBank') || text.includes('ACB') || text.includes('Techcombank') ||
        text.includes('GD:') || text.includes('So du:') || text.includes('Balance:')) {
      console.log(`🏦 Bank message from user ${userId}`);
      return await bankMessageHandler.handleBankMessage(ctx);
    }
    
    // 9. Tin nhắn thông thường - đưa ra gợi ý sử dụng với kết quả AI
    return await handleGeneralMessageWithAI(ctx, text, aiAnalysis);
    
  } catch (error) {
    console.error('❌ Error in unified message handler:', error);
    const lang = await languageService.getUserLanguage(userId);
    await ctx.reply(languageService.getTranslation(lang, 'error'), { parse_mode: 'Markdown' });
  }
}

// Hàm xử lý chọn ngôn ngữ
async function handleLanguageSelection(ctx) {
  const userId = String(ctx.from.id);
  waitingForLanguageInput.set(userId, true);
  await ctx.reply('🌐 Vui lòng nhập tên ngôn ngữ bạn muốn sử dụng (ví dụ: tiếng Việt, English, 中文, 日本語, 한국어, vi, en, zh, ja, ko, ...)');
  return true;
}

// Thêm hàm xử lý callback cho việc chọn ngôn ngữ
async function handleLanguageCallback(ctx, langCode) {
  const userId = String(ctx.from.id);
  
  const result = await languageService.setUserLanguage(userId, langCode);
  if (result.success) {
    const translations = languageService.getAllTranslations(langCode);
    await ctx.answerCbQuery(translations.success);
    await ctx.reply(translations.languageChanged || 'Language updated successfully!');
    // Hiển thị lại menu chính với ngôn ngữ mới
    await handleMainMenu(ctx);
  } else {
    await ctx.answerCbQuery(result.message);
  }
}

// Cập nhật hàm handleMainMenu để sử dụng ngôn ngữ
async function handleMainMenu(ctx, langOverride) {
  const userId = String(ctx.from.id);
  let lang = langOverride;
  if (!lang) {
    lang = await languageService.getUserLanguage(userId);
  }
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
  return true;
}

// ===== JAR HANDLING FUNCTIONS =====

// Kiểm tra xem có phải là yêu cầu hũ tiền không
function isJarRequest(text) {
  const normalizedText = text.toLowerCase().trim();
  
  const jarKeywords = [
    'hũ', 'jar', 'tạo hũ', 'xóa hũ', 'sửa hũ', 'cập nhật hũ',
    'báo cáo hũ', 'xem hũ', 'hũ tiền'
  ];
  
  return jarKeywords.some(keyword => normalizedText.includes(keyword));
}

// Xử lý yêu cầu hũ tiền
async function handleJarRequest(ctx, text) {
  const userId = String(ctx.from.id);
  
  try {
    const normalizedText = text.toLowerCase();
    
    // Tạo hũ mới
    if (normalizedText.includes('tạo hũ')) {
      return await handleCreateJar(ctx, text);
    }
    
    // Xóa hũ
    if (normalizedText.includes('xóa hũ')) {
      return await handleDeleteJar(ctx, text);
    }
    
    // Cập nhật hũ
    if (normalizedText.includes('sửa hũ') || normalizedText.includes('cập nhật hũ')) {
      return await handleUpdateJar(ctx, text);
    }
    
    // Báo cáo hũ tiền
    if (normalizedText.includes('báo cáo hũ') || normalizedText.includes('xem hũ')) {
      return await handleJarReport(ctx);
    }
    
    // Menu hũ tiền mặc định
    return await handleJarMenu(ctx);
    
  } catch (error) {
    console.error('❌ Error handling jar request:', error);
    return await ctx.reply(`❌ **Lỗi khi xử lý yêu cầu hũ tiền:** ${error.message}

💡 **Cách sử dụng:**
• \`"Tạo hũ: Tên hũ - Mô tả - Tỷ lệ%"\` - Tạo hũ mới
• \`"Xóa hũ: Tên hũ"\` - Xóa hũ cụ thể
• \`"Sửa hũ Tên hũ: tên mới"\` - Cập nhật hũ
• \`"Báo cáo hũ"\` - Xem báo cáo tổng quan`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '❓ Hướng dẫn', callback_data: 'help' }],
            [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
          ]
        },
        parse_mode: 'Markdown'
      });
  }
}

// Hàm AI phân tích input tạo hũ tự do
function aiParseJarInput(text) {
  // Loại bỏ "tạo hũ" đầu câu, lấy phần còn lại
  let raw = text.replace(/tạo hũ[:\s]*/i, '').trim();
  
  // Tách các phần bằng dấu '-'
  let parts = raw.split('-').map(s => s.trim());
  
  // Phân tích tên hũ và mã
  let name = parts[0] || '';
  let code = '';
  const codeMatch = name.match(/\((.*?)\)/);
  if (codeMatch) {
    code = codeMatch[1];
  }
  
  // Mô tả từ phần thứ 2
  let description = parts[1] || '';
  
  // Tìm số cuối cùng trong chuỗi làm tỷ lệ
  let percentage = 10;
  for (let i = parts.length - 1; i >= 0; i--) {
    let num = parseInt(parts[i]);
    if (!isNaN(num) && num > 0 && num <= 100) {
      percentage = num;
      if (i === 2) description = parts[1] || '';
      break;
    }
  }

  // Xác định icon và màu dựa trên mã
  let icon = '🏺';
  let color = '#3498db';
  
  const jarTypes = {
    'NEC': { icon: '🏠', color: '#e74c3c' },
    'LTSS': { icon: '💰', color: '#3498db' },
    'EDUC': { icon: '📚', color: '#f39c12' },
    'PLAY': { icon: '🎮', color: '#9b59b6' },
    'FFA': { icon: '📈', color: '#27ae60' },
    'GIVE': { icon: '❤️', color: '#1abc9c' }
  };

  if (code && jarTypes[code]) {
    icon = jarTypes[code].icon;
    color = jarTypes[code].color;
  }

  return { 
    name, 
    description, 
    percentage,
    icon,
    color
  };
}

// Sửa lại handleCreateJar để dùng AI phân tích input
async function handleCreateJar(ctx, text) {
  const userId = String(ctx.from.id);
  
  // Nếu là lệnh tạo hũ mặc định
  if (text.toLowerCase().includes('tạo hũ mặc định')) {
    const result = await jarService.setupDefaultJars(userId);
    if (result.success) {
      await ctx.reply('✅ Đã tạo các hũ mặc định thành công!');
      await handleJarReport(ctx);
    } else {
      await ctx.reply('❌ Lỗi khi tạo hũ mặc định: ' + result.message);
    }
    return true;
  }

  // Dùng AI phân tích input
  const aiResult = aiParseJarInput(text);
  const { name, description, percentage, icon, color } = aiResult;

  if (!name) {
    await ctx.reply('❌ AI không nhận diện được tên hũ. Vui lòng nhập lại rõ ràng hơn!\n\n💡 Định dạng: Tạo hũ: Tên hũ (MÃ) - Mô tả - Tỷ lệ%\n\nVí dụ:\n• Tạo hũ: Chi tiêu cần thiết (NEC) - Chi phí sinh hoạt - 55\n• Tạo hũ: Quỹ giáo dục (EDUC) - Học tập phát triển - 10');
    return true;
  }

  try {
    const result = await jarService.createJar(userId, {
      name,
      description,
      percentage,
      icon,
      color
    });

    console.log('Kết quả tạo hũ:', result);

    if (result.success) {
      await ctx.reply(`✅ Đã tạo hũ thành công: ${name}`);
      await handleJarReport(ctx);
    } else {
      if (result.message && result.message.includes('đã tồn tại')) {
        await ctx.reply(`❌ Tên hũ "${name}" đã tồn tại. Vui lòng chọn tên khác!`);
      } else {
        await ctx.reply(`❌ Lỗi: ${result.message}`);
      }
    }
  } catch (error) {
    console.error('Lỗi khi tạo hũ:', error);
    await ctx.reply('❌ Lỗi khi tạo hũ tiền');
  }
  return true;
}

// Xóa hũ
async function handleDeleteJar(ctx, text) {
  const userId = String(ctx.from.id);

  // Parse input: "Xóa hũ: Tên hũ"
  const deleteMatch = text.match(/xóa hũ[:\s]+(.+)/i);
  if (deleteMatch) {
    const jarName = deleteMatch[1].trim();
    
    try {
      const result = await jarService.getJars(userId);
      if (result.success) {
        const jar = result.jars.find(j => j.name.toLowerCase().includes(jarName.toLowerCase()));
        
        if (jar) {
          const deleteResult = await jarService.deleteJar(userId, jar.id);
          await ctx.reply(`✅ ${deleteResult.message}`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: '📊 Xem báo cáo hũ', callback_data: 'jar_report' }],
                [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
              ]
            }
          });
        } else {
          await ctx.reply(`❌ Không tìm thấy hũ "${jarName}"`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🗑️ Xem danh sách xóa', callback_data: 'jar_delete' }],
                [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
              ]
            }
          });
        }
      }
    } catch (error) {
      await ctx.reply('❌ Lỗi khi xóa hũ tiền');
    }
    return true;
  }

  // Hiển thị danh sách hũ để xóa
  try {
    const result = await jarService.getJars(userId);
    
    if (!result.success || result.jars.length === 0) {
      await ctx.reply('📝 **Chưa có hũ tiền nào để xóa!**', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '➕ Tạo hũ mới', callback_data: 'jar_create' }],
            [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
          ]
        },
        parse_mode: 'Markdown'
      });
      return true;
    }

    let message = `🗑️ **XÓA HŨ TIỀN**\n\n`;
    message += `💡 **Chọn hũ để xóa:**\n\n`;

    const keyboard = [];
    
    result.jars.forEach(jar => {
      const canDelete = jar.currentAmount === 0;
      const status = canDelete ? '✅' : '⚠️';
      const amountText = jar.currentAmount > 0 ? ` (${jar.currentAmount.toLocaleString('vi-VN')}đ)` : '';
      
      message += `${status} **${jar.name}**${amountText}\n`;
      
      if (canDelete) {
        keyboard.push([{ 
          text: `🗑️ Xóa ${jar.name}`, 
          callback_data: `delete_jar_${jar.id}` 
        }]);
      }
    });

    message += `\n⚠️ **Lưu ý:** Chỉ có thể xóa hũ khi không còn tiền bên trong`;

    keyboard.push(
      [{ text: '📊 Xem báo cáo hũ', callback_data: 'jar_report' }],
      [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
    );

    await ctx.reply(message, {
      reply_markup: { inline_keyboard: keyboard },
      parse_mode: 'Markdown'
    });
    
  } catch (error) {
    await ctx.reply('❌ Lỗi khi hiển thị danh sách xóa hũ');
  }

  return true;
}

// Cập nhật hũ
async function handleUpdateJar(ctx, text) {
  const userId = String(ctx.from.id);

  // Kiểm tra xem có phải là JSON input không
  try {
    if (text.trim().startsWith('{')) {
      const jsonData = JSON.parse(text);
      // Hiển thị menu chọn hũ để áp dụng thông tin JSON
      return await handleJarUpdateWithJSON(ctx, jsonData);
    }
  } catch (error) {
    console.log('Not a valid JSON input');
  }

  // Parse input: "Sửa hũ Tên hũ: tên/số tiền/mục tiêu/biểu tượng giá trị"
  const updateMatch = text.match(/sửa hũ\s+(.+?):\s*(.+)/i);
  if (updateMatch) {
    const jarName = updateMatch[1].trim();
    const updateText = updateMatch[2].trim().toLowerCase();
    
    try {
      const result = await jarService.getJars(userId);
      if (result.success) {
        const jar = result.jars.find(j => j.name.toLowerCase().includes(jarName.toLowerCase()));
        
        if (jar) {
          let updates = {};
          
          // Parse loại cập nhật
          if (updateText.startsWith('tên ')) {
            updates.name = updateText.replace('tên ', '').trim();
          } else if (updateText.startsWith('số tiền ') || updateText.startsWith('tiền ')) {
            const amount = parseFloat(updateText.replace(/số tiền |tiền /, '').replace(/[^\d]/g, ''));
            if (!isNaN(amount)) updates.currentAmount = amount;
          } else if (updateText.startsWith('mục tiêu ')) {
            const target = parseFloat(updateText.replace('mục tiêu ', '').replace(/[^\d]/g, ''));
            if (!isNaN(target)) updates.targetAmount = target;
          } else if (updateText.startsWith('tỷ lệ ')) {
            const percentage = parseInt(updateText.replace('tỷ lệ ', ''));
            if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
              updates.percentage = percentage;
            }
          } else if (updateText.startsWith('biểu tượng ')) {
            updates.icon = updateText.replace('biểu tượng ', '').trim();
          } else if (updateText.startsWith('ghi chú ')) {
            updates.description = updateText.replace('ghi chú ', '').trim();
          } else {
            // Thử parse số tiền trực tiếp
            const amount = parseFloat(updateText.replace(/[^\d]/g, ''));
            if (!isNaN(amount)) {
              updates.currentAmount = amount;
            } else {
              updates.name = updateText;
            }
          }
          
          const updateResult = await jarService.updateJar(userId, jar.id, updates);
          let message = `✅ ${updateResult.message}\n\n`;
          message += `Thông tin cập nhật:\n`;
          
          if (updates.name) message += `• Tên mới: ${updates.name}\n`;
          if (updates.currentAmount) message += `• Số tiền: ${updates.currentAmount.toLocaleString('vi-VN')}đ\n`;
          if (updates.targetAmount) message += `• Mục tiêu: ${updates.targetAmount.toLocaleString('vi-VN')}đ\n`;
          if (updates.percentage) message += `• Tỷ lệ: ${updates.percentage}%\n`;
          if (updates.icon) message += `• Biểu tượng: ${updates.icon}\n`;
          if (updates.description) message += `• Ghi chú: ${updates.description}\n`;
          
          await ctx.reply(message, {
            reply_markup: {
              inline_keyboard: [
                [{ text: '📊 Xem báo cáo hũ', callback_data: 'jar_report' }],
                [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
              ]
            }
          });
        } else {
          await ctx.reply(`❌ Không tìm thấy hũ "${jarName}"

💡 Cách cập nhật:
• Sửa tên: "Sửa hũ Tên hũ: tên Tên mới"
• Sửa số tiền: "Sửa hũ Tên hũ: số tiền 1000000"
• Sửa mục tiêu: "Sửa hũ Tên hũ: mục tiêu 5000000"
• Sửa tỷ lệ: "Sửa hũ Tên hũ: tỷ lệ 20"
• Sửa biểu tượng: "Sửa hũ Tên hũ: biểu tượng 💰"
• Sửa ghi chú: "Sửa hũ Tên hũ: ghi chú Nội dung mới"

Hoặc gửi thông tin dạng JSON:
{
  "name": "Tên hũ",
  "amount": 1000000,
  "currency": "VND",
  "icon": "💰",
  "goal": 5000000
}`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: '✏️ Xem danh sách cập nhật', callback_data: 'jar_update' }],
                [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
              ]
            },
            parse_mode: 'Markdown'
          });
        }
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật hũ:', error);
      await ctx.reply('❌ Lỗi khi cập nhật hũ tiền');
    }
    return true;
  }

  // Hiển thị danh sách hũ để cập nhật
  try {
    const result = await jarService.getJars(userId);
    
    if (!result.success || result.jars.length === 0) {
      await ctx.reply('📝 **Chưa có hũ tiền nào để cập nhật!**', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '➕ Tạo hũ mới', callback_data: 'jar_create' }],
            [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
          ]
        },
        parse_mode: 'Markdown'
      });
      return true;
    }

    let message = `✏️ **CẬP NHẬT HŨ TIỀN**\n\n`;
    message += `💡 **Chọn hũ để cập nhật:**\n\n`;

    const keyboard = [];
    
    result.jars.forEach(jar => {
      message += `${jar.icon || '🏺'} **${jar.name}**\n`;
      message += `   💰 Số dư: ${jar.currentAmount.toLocaleString('vi-VN')}đ\n`;
      if (jar.targetAmount > 0) {
        message += `   🎯 Mục tiêu: ${jar.targetAmount.toLocaleString('vi-VN')}đ\n`;
      }
      message += `   📊 Tỷ lệ: ${jar.percentage || 0}%\n\n`;
      
      keyboard.push([{ 
        text: `✏️ Sửa ${jar.name}`, 
        callback_data: `update_jar_${jar.id}` 
      }]);
    });

    message += `💡 **Cách cập nhật:**\n`;
    message += `• \`"Sửa hũ Tên hũ: tên Tên mới"\`\n`;
    message += `• \`"Sửa hũ Tên hũ: số tiền 1000000"\`\n`;
    message += `• \`"Sửa hũ Tên hũ: mục tiêu 5000000"\`\n`;
    message += `• \`"Sửa hũ Tên hũ: tỷ lệ 20"\`\n`;
    message += `• \`"Sửa hũ Tên hũ: biểu tượng 💰"\`\n`;
    message += `• \`"Sửa hũ Tên hũ: ghi chú Nội dung mới"\`\n\n`;
    
    message += `Hoặc gửi thông tin dạng JSON:\n`;
    message += `\`\`\`json
{
  "name": "Tên hũ",
  "amount": 1000000,
  "currency": "VND",
  "icon": "💰",
  "goal": 5000000
}\`\`\``;

    keyboard.push(
      [{ text: '📊 Xem báo cáo hũ', callback_data: 'jar_report' }],
      [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
    );

    await ctx.reply(message, {
      reply_markup: { inline_keyboard: keyboard },
      parse_mode: 'Markdown'
    });
    
  } catch (error) {
    console.error('Lỗi khi hiển thị danh sách cập nhật hũ:', error);
    await ctx.reply('❌ Lỗi khi hiển thị danh sách cập nhật hũ');
  }

  return true;
}

// Hàm xử lý cập nhật hũ với dữ liệu JSON
async function handleJarUpdateWithJSON(ctx, jsonData) {
  const userId = String(ctx.from.id);
  
  try {
    const result = await jarService.getJars(userId);
    if (!result.success) {
      await ctx.reply('❌ Không lấy được danh sách hũ');
      return true;
    }

    let message = `📝 **Chọn hũ để áp dụng thông tin sau:**\n\n`;
    message += `• Tên: ${jsonData.name || '-'}\n`;
    message += `• Số tiền: ${(jsonData.amount || 0).toLocaleString('vi-VN')}đ\n`;
    message += `• Đơn vị: ${jsonData.currency || 'VND'}\n`;
    message += `• Biểu tượng: ${jsonData.icon || '🏺'}\n`;
    message += `• Mục tiêu: ${(jsonData.goal || 0).toLocaleString('vi-VN')}đ\n\n`;
    
    const keyboard = [];
    result.jars.forEach(jar => {
      keyboard.push([{
        text: `${jar.icon || '🏺'} Cập nhật "${jar.name}"`,
        callback_data: `update_jar_json_${jar.id}_${Buffer.from(JSON.stringify(jsonData)).toString('base64')}`
      }]);
    });

    keyboard.push([{ text: '🔙 Quay lại', callback_data: 'jar_update' }]);

    await ctx.reply(message, {
      reply_markup: { inline_keyboard: keyboard },
      parse_mode: 'Markdown'
    });

  } catch (error) {
    console.error('Lỗi khi xử lý cập nhật JSON:', error);
    await ctx.reply('❌ Lỗi khi xử lý thông tin cập nhật');
  }

  return true;
}

// Báo cáo hũ tiền
async function handleJarReport(ctx) {
  const userId = String(ctx.from.id);
  
  try {
    const result = await jarService.getJars(userId);
    console.log('Danh sách hũ lấy được:', result);
    
    if (!result.success || result.jars.length === 0) {
      await ctx.reply('Chưa có hũ tiền nào! Hãy tạo hũ đầu tiên.');
      return true;
    }

    const totalAmount = result.jars.reduce((sum, jar) => sum + jar.currentAmount, 0);
    let report = 'BÁO CÁO HŨ TIỀN\n\n';
    
    // Thông tin cơ bản
    report += `Tổng số dư: ${totalAmount}\n`;
    report += `Số hũ: ${result.jars.length}\n\n`;
    
    // Liệt kê hũ
    result.jars.forEach(jar => {
      report += `${jar.name}\n`;
      report += `Số dư: ${jar.currentAmount}\n`;
      if (jar.targetAmount > 0) {
        report += `Mục tiêu: ${jar.targetAmount}\n`;
      }
      report += `Tỷ lệ: ${jar.percentage || 0}%\n`;
      if (jar.description) {
        report += `Ghi chú: ${jar.description}\n`;
      }
      report += '\n';
    });

    const keyboard = [
      [
        { text: 'Tạo hũ mới', callback_data: 'jar_create' },
        { text: 'Xóa hũ', callback_data: 'jar_delete' }
      ],
      [
        { text: 'Cập nhật hũ', callback_data: 'jar_update' },
        { text: 'Menu chính', callback_data: 'main_menu' }
      ]
    ];

    await ctx.reply(report, {
      reply_markup: { inline_keyboard: keyboard }
    });
  } catch (error) {
    console.error('Lỗi khi tạo báo cáo hũ tiền:', error);
    await ctx.reply('Lỗi khi tạo báo cáo hũ tiền');
  }
  return true;
}

// Menu hũ tiền
async function handleJarMenu(ctx) {
  let message = `🏺 **QUẢN LÝ HŨ TIỀN**\n\n`;
  message += `💡 **Chọn chức năng:**\n\n`;
  
  message += `➕ **Tạo hũ mới:**\n`;
  message += `• \`"Tạo hũ mặc định"\` - Tạo bộ 6 hũ mặc định\n`;
  message += `• \`"Tạo hũ: Tên hũ (MÃ) - Mô tả - Tỷ lệ%"\`\n\n`;
  
  message += `📝 **Mã hũ tiền:**\n`;
  message += `• NEC - Chi tiêu cần thiết (55%)\n`;
  message += `• LTSS - Tiết kiệm dài hạn (10%)\n`;
  message += `• EDUC - Quỹ giáo dục (10%)\n`;
  message += `• PLAY - Hưởng thụ (10%)\n`;
  message += `• FFA - Tự do tài chính (10%)\n`;
  message += `• GIVE - Quỹ cho đi (5%)\n\n`;
  
  message += `🗑️ **Xóa hũ:**\n`;
  message += `• \`"Xóa hũ: Tên hũ"\`\n\n`;
  
  message += `✏️ **Cập nhật hũ:**\n`;
  message += `• \`"Sửa hũ Tên hũ: tên mới"\`\n`;
  message += `• \`"Sửa hũ Tên hũ: tỷ lệ 15"\`\n\n`;
  
  message += `📊 **Xem báo cáo:**\n`;
  message += `• \`"Báo cáo hũ"\` hoặc \`"Xem hũ"\``;

  const keyboard = [
    [
      { text: '➕ Tạo hũ mặc định', callback_data: 'jar_create_default' },
      { text: '➕ Tạo hũ mới', callback_data: 'jar_create' }
    ],
    [
      { text: '🗑️ Xóa hũ', callback_data: 'jar_delete' },
      { text: '✏️ Cập nhật hũ', callback_data: 'jar_update' }
    ],
    [
      { text: '📊 Báo cáo hũ', callback_data: 'jar_report' },
      { text: '🏠 Menu chính', callback_data: 'main_menu' }
    ]
  ];

  await ctx.reply(message, {
    reply_markup: { inline_keyboard: keyboard },
    parse_mode: 'Markdown'
  });

  return true;
}

// Thêm hàm lấy tất cả hũ (kể cả đã xóa) cho debug
async function handleAllJarsDebug(ctx) {
  const userId = String(ctx.from.id);
  try {
    const result = await jarService.getAllJars(userId);
    console.log('DEBUG - Tất cả hũ:', result);
    if (!result.success || result.jars.length === 0) {
      await ctx.reply('📝 **Chưa có hũ tiền nào!**', { parse_mode: 'Markdown' });
      return true;
    }
    let message = `🛠️ **DANH SÁCH TẤT CẢ HŨ (kể cả đã xóa)**\n\n`;
    result.jars.forEach(jar => {
      message += `${jar.isActive ? '🟢' : '🔴'} ${jar.icon || '🏺'} **${jar.name}** (isActive: ${jar.isActive})\n`;
    });
    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    await ctx.reply('❌ Lỗi khi lấy danh sách tất cả hũ');
  }
  return true;
}

// Thêm hàm hướng dẫn xóa và tạo lại hũ tiền
async function handleGuideDeleteAndCreateJar(ctx) {
  let message = 'HUONG DAN XOA VA TAO LAI HU TIEN\n\n';
  message += '1. Xoa hu: \n';
  message += '   - Gui: Xoa hu: Ten hu\n';
  message += '   - Vi du: Xoa hu: Du lich\n';
  message += '2. Tao lai hu: \n';
  message += '   - Gui: Tao hu: Ten hu - Mo ta - Ty le%\n';
  message += '   - Vi du: Tao hu: Du lich - Tien di du lich - 15\n';
  message += '\nLuu y: Chi xoa duoc hu khi so du = 0.';
  await ctx.reply(message);
  return true;
}

// Hàm parse và lưu sub-items vào description (dạng JSON text)
async function handleAddSubItem(ctx, text) {
  const userId = String(ctx.from.id);
  // Cú pháp: Them thanh phan: Ten hu - Ten thanh phan
  let raw = text.replace(/thêm thành phần[:\s]*/i, '').trim();
  let parts = raw.split('-').map(s => s.trim());
  let jarName = parts[0] || '';
  let subItem = parts[1] || '';
  if (!jarName || !subItem) {
    await ctx.reply('Vui lòng nhập: Thêm thành phần: Tên hũ - Tên thành phần');
    return true;
  }
  // Lấy hũ
  const result = await jarService.getJars(userId);
  if (!result.success) {
    await ctx.reply('Không lấy được danh sách hũ!');
    return true;
  }
  const jar = result.jars.find(j => j.name.toLowerCase() === jarName.toLowerCase());
  if (!jar) {
    await ctx.reply('Không tìm thấy hũ!');
    return true;
  }
  // Parse description thành JSON nếu có
  let descObj = {};
  try {
    descObj = jar.description ? JSON.parse(jar.description) : {};
  } catch { descObj = { note: jar.description } }
  if (!descObj.subItems) descObj.subItems = [];
  descObj.subItems.push(subItem);
  // Update lại description
  await jarService.updateJar(userId, jar.id, { description: JSON.stringify(descObj) });
  await ctx.reply(`Đã thêm thành phần "${subItem}" vào hũ "${jarName}".`);
  return true;
}

// Hàm liệt kê các thành phần con
async function handleListSubItems(ctx, text) {
  const userId = String(ctx.from.id);
  // Cú pháp: Danh sách thành phần: Tên hũ
  let raw = text.replace(/danh sách thành phần[:\s]*/i, '').trim();
  let jarName = raw;
  if (!jarName) {
    await ctx.reply('Vui lòng nhập: Danh sách thành phần: Tên hũ');
    return true;
  }
  const result = await jarService.getJars(userId);
  if (!result.success) {
    await ctx.reply('Không lấy được danh sách hũ!');
    return true;
  }
  const jar = result.jars.find(j => j.name.toLowerCase() === jarName.toLowerCase());
  if (!jar) {
    await ctx.reply('Không tìm thấy hũ!');
    return true;
  }
  let descObj = {};
  try {
    descObj = jar.description ? JSON.parse(jar.description) : {};
  } catch { descObj = { note: jar.description } }
  if (!descObj.subItems || descObj.subItems.length === 0) {
    await ctx.reply('Hũ này chưa có thành phần con nào!');
    return true;
  }
  let msg = `Các thành phần trong hũ "${jarName}":\n`;
  descObj.subItems.forEach((item, idx) => {
    msg += `${idx + 1}. ${item}\n`;
  });
  await ctx.reply(msg);
  return true;
}

// Hàm xóa thành phần con
async function handleDeleteSubItem(ctx, text) {
  const userId = String(ctx.from.id);
  // Cú pháp: Xóa thành phần: Tên hũ - Tên thành phần
  let raw = text.replace(/xóa thành phần[:\s]*/i, '').trim();
  let parts = raw.split('-').map(s => s.trim());
  let jarName = parts[0] || '';
  let subItem = parts[1] || '';
  if (!jarName || !subItem) {
    await ctx.reply('Vui lòng nhập: Xóa thành phần: Tên hũ - Tên thành phần');
    return true;
  }
  const result = await jarService.getJars(userId);
  if (!result.success) {
    await ctx.reply('Không lấy được danh sách hũ!');
    return true;
  }
  const jar = result.jars.find(j => j.name.toLowerCase() === jarName.toLowerCase());
  if (!jar) {
    await ctx.reply('Không tìm thấy hũ!');
    return true;
  }
  let descObj = {};
  try {
    descObj = jar.description ? JSON.parse(jar.description) : {};
  } catch { descObj = { note: jar.description } }
  if (!descObj.subItems) descObj.subItems = [];
  descObj.subItems = descObj.subItems.filter(item => item !== subItem);
  await jarService.updateJar(userId, jar.id, { description: JSON.stringify(descObj) });
  await ctx.reply(`Đã xóa thành phần "${subItem}" khỏi hũ "${jarName}".`);
  return true;
}

// ===== OTHER FUNCTIONS =====

// Kiểm tra xem có phải là chi tiêu thủ công không
function isManualExpense(text) {
  const normalizedText = text.toLowerCase().trim();
  
  // Patterns để tìm số tiền
  const amountPatterns = [
    /(\d+)k/i,                           // 50k
    /(\d+)\.(\d+)k/i,                    // 15.5k  
    /(\d+),(\d+)k/i,                     // 15,5k
    /(\d{4,})/,                          // 50000
    /(\d+)\s*(đồng|vnd|d|dong)/i,        // 50000 đồng
    /(\d+)\s*nghìn/i,                    // 50 nghìn
    /(\d+)\s*triệu/i                     // 1 triệu
  ];
  
  return amountPatterns.some(pattern => pattern.test(normalizedText));
}

// Xử lý chi tiêu thủ công
async function handleManualExpense(ctx, text) {
  const userId = String(ctx.from.id);
  
  try {
    const expense = parseExpenseManually(text);
    
    if (!expense.amount || expense.amount <= 0) {
      return await ctx.reply(`❌ **Không thể xác định số tiền chi tiêu từ:** \`"${text}"\`

💡 **Định dạng hỗ trợ:**
• \`"Ăn sáng 50k"\`
• \`"Cafe 30000"\`  
• \`"200k xăng xe"\`
• \`"Mua sách 150000đ"\``, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '❓ Hướng dẫn', callback_data: 'help' }],
            [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
          ]
        },
        parse_mode: 'Markdown'
      });
    }
    
    // Lưu vào database
    const result = await expenseService.addExpense(userId, {
      amount: expense.amount,
      category: expense.category,
      note: expense.description
    });
    
    // Phản hồi thành công
    let successMessage = `✅ **Đã ghi chi tiêu thành công!**

💸 **Số tiền:** ${expense.amount.toLocaleString('vi-VN')}đ
📂 **Danh mục:** ${expense.category}
📅 **Thời gian:** ${new Date().toLocaleString('vi-VN')}`;
    
    // Quick actions
    const quickActions = [
      [
        { text: '📊 Xem thống kê', callback_data: 'stats_today' },
        { text: '📋 Lịch sử', callback_data: 'history' }
      ]
    ];
    
    return await ctx.reply(successMessage, {
      reply_markup: {
        inline_keyboard: quickActions.concat([[{ text: '🏠 Menu chính', callback_data: 'main_menu' }]])
      },
      parse_mode: 'Markdown'
    });
    
  } catch (error) {
    console.error('❌ Error handling manual expense:', error);
    return await ctx.reply('❌ **Lỗi khi lưu chi tiêu. Vui lòng thử lại!**', { parse_mode: 'Markdown' });
  }
}

// Parse chi tiêu từ text
function parseExpenseManually(text) {
  const normalizedText = text.toLowerCase().trim();
  
  // Patterns để tìm số tiền
  const amountPatterns = [
    /(\d+)k/i,                           // 50k
    /(\d+)\.(\d+)k/i,                    // 15.5k  
    /(\d+),(\d+)k/i,                     // 15,5k
    /(\d{4,})/,                          // 50000
    /(\d+)\s*(đồng|vnd|d|dong)/i,        // 50000 đồng
    /(\d+)\s*nghìn/i,                    // 50 nghìn
    /(\d+)\s*triệu/i                     // 1 triệu
  ];
  
  let amount = 0;
  let matchedText = '';
  
  // Tìm số tiền
  for (const pattern of amountPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      if (pattern.source.includes('k')) {
        amount = parseInt(match[1]) * 1000;
        if (match[2]) {
          amount += parseInt(match[2]) * 100;
        }
      } else if (pattern.source.includes('tr')) {
        amount = parseInt(match[1]) * 1000000;
      } else {
        amount = parseInt(match[1]);
      }
      matchedText = match[0];
      break;
    }
  }
  
  // Xác định danh mục
  let category = 'other';
  const categoryKeywords = {
    'food': ['ăn', 'cơm', 'bữa', 'sáng', 'trưa', 'tối', 'cafe', 'trà', 'nước', 'bánh', 'kẹo', 'snack'],
    'transport': ['xăng', 'xe', 'taxi', 'grab', 'bus', 'xe buýt', 'đi lại', 'vận chuyển'],
    'shopping': ['mua', 'sắm', 'quần áo', 'giày', 'túi', 'đồ', 'hàng'],
    'entertainment': ['xem phim', 'game', 'chơi', 'giải trí', 'karaoke', 'bar', 'pub'],
    'health': ['thuốc', 'khám', 'bệnh viện', 'sức khỏe', 'y tế'],
    'education': ['sách', 'học', 'khóa học', 'giáo dục', 'đào tạo'],
    'utilities': ['điện', 'nước', 'internet', 'wifi', 'tiện ích', 'hóa đơn']
  };
  
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => normalizedText.includes(keyword))) {
      category = cat;
      break;
    }
  }
  
  // Tạo mô tả
  const description = text.replace(matchedText, '').trim();
  
  return {
    amount,
    category,
    description: description || 'Chi tiêu'
  };
}

// Kiểm tra xem có phải là thu nhập không
function isIncomeInput(text) {
  const normalizedText = text.toLowerCase().trim();
  
  const incomeKeywords = [
    'lương', 'salary', 'thưởng', 'bonus', 'freelance', 'đầu tư', 'investment',
    'cho thuê', 'rent', 'bán', 'sell', 'nhận', 'receive', 'tiền', 'money'
  ];
  
  return incomeKeywords.some(keyword => normalizedText.includes(keyword));
}

// Xử lý thu nhập
async function handleIncomeInput(ctx, text) {
  const userId = String(ctx.from.id);
  
  try {
    const income = parseIncomeManually(text);
    
    if (!income.amount || income.amount <= 0) {
      return await ctx.reply(`❌ **Không thể xác định số tiền thu nhập từ:** \`"${text}"\`

💡 **Định dạng hỗ trợ:**
• \`"Lương tháng 7 15000000"\`
• \`"Thưởng 5tr"\`
• \`"Freelance 2000000"\`
• \`"Đầu tư 1000000"\``, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '❓ Hướng dẫn', callback_data: 'help' }],
            [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
          ]
        },
        parse_mode: 'Markdown'
      });
    }
    
    // Lưu vào database
    const result = await incomeAnalysisService.addIncome(userId, {
      amount: income.amount,
      source: income.source,
      note: income.description
    });
    
    // Phản hồi thành công
    let successMessage = `✅ **Đã ghi thu nhập thành công!**

💰 **Số tiền:** ${income.amount.toLocaleString('vi-VN')}đ
📂 **Nguồn:** ${income.source}
📅 **Thời gian:** ${new Date().toLocaleString('vi-VN')}`;
    
    return await ctx.reply(successMessage, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📊 Xem thống kê', callback_data: 'income_stats' },
            { text: '📋 Lịch sử', callback_data: 'history' }
          ],
          [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
        ]
      },
      parse_mode: 'Markdown'
    });
    
  } catch (error) {
    console.error('❌ Error handling income input:', error);
    return await ctx.reply('❌ **Lỗi khi lưu thu nhập. Vui lòng thử lại!**', { parse_mode: 'Markdown' });
  }
}

// Parse thu nhập từ text
function parseIncomeManually(text) {
  const normalizedText = text.toLowerCase().trim();
  
  // Tìm số tiền (tương tự như parseExpenseManually)
  let amount = 0;
  const amountPatterns = [
    /(\d+)k/i,
    /(\d+)\.(\d+)k/i,
    /(\d+),(\d+)k/i,
    /(\d{4,})/,
    /(\d+)\s*(đồng|vnd|d|dong)/i,
    /(\d+)\s*nghìn/i,
    /(\d+)\s*triệu/i
  ];
  
  for (const pattern of amountPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      if (pattern.source.includes('k')) {
        amount = parseInt(match[1]) * 1000;
        if (match[2]) {
          amount += parseInt(match[2]) * 100;
        }
      } else if (pattern.source.includes('tr')) {
        amount = parseInt(match[1]) * 1000000;
      } else {
        amount = parseInt(match[1]);
      }
      break;
    }
  }
  
  // Xác định nguồn thu nhập
  let source = 'other';
  const sourceKeywords = {
    'salary': ['lương', 'salary'],
    'bonus': ['thưởng', 'bonus'],
    'freelance': ['freelance', 'tự do', 'dự án'],
    'investment': ['đầu tư', 'investment', 'chứng khoán', 'crypto'],
    'rent': ['cho thuê', 'rent', 'thuê'],
    'business': ['kinh doanh', 'business', 'bán hàng']
  };
  
  for (const [src, keywords] of Object.entries(sourceKeywords)) {
    if (keywords.some(keyword => normalizedText.includes(keyword))) {
      source = src;
      break;
    }
  }
  
  // Tạo mô tả
  const description = text.replace(amount.toString(), '').trim();
  
  return {
    amount,
    source,
    description: description || 'Thu nhập'
  };
}

// AI phân tích input
async function analyzeInputWithAI(text) {
  const normalizedText = text.toLowerCase().trim();
  
  // Đơn giản hóa AI analysis
  let type = 'unknown';
  let confidence = 0;
  let category = 'other';
  let amount = 0;
  let reason = '';
  
  // Tìm số tiền
  const amountMatch = normalizedText.match(/(\d+(?:k|tr|m)?)/i);
  if (amountMatch) {
    let amountText = amountMatch[1];
    amount = parseInt(amountText.replace(/[k|tr|m]/i, ''));
    if (amountText.toLowerCase().includes('k')) {
      amount *= 1000;
    } else if (amountText.toLowerCase().includes('tr')) {
      amount *= 1000000;
    } else if (amountText.toLowerCase().includes('m')) {
      amount *= 1000000;
    }
  }
  
  // Phân tích loại giao dịch
  const incomeKeywords = ['lương', 'thưởng', 'freelance', 'đầu tư', 'cho thuê', 'nhận'];
  const expenseKeywords = ['ăn', 'mua', 'xăng', 'cafe', 'xem phim', 'thuốc', 'điện', 'nước'];
  
  const incomeScore = incomeKeywords.filter(keyword => normalizedText.includes(keyword)).length;
  const expenseScore = expenseKeywords.filter(keyword => normalizedText.includes(keyword)).length;
  
  if (incomeScore > expenseScore && amount > 0) {
    type = 'income';
    confidence = Math.min(0.8, incomeScore * 0.2);
    reason = `Phát hiện từ khóa thu nhập: ${incomeKeywords.filter(k => normalizedText.includes(k)).join(', ')}`;
  } else if (expenseScore > 0 && amount > 0) {
    type = 'expense';
    confidence = Math.min(0.8, expenseScore * 0.2);
    reason = `Phát hiện từ khóa chi tiêu: ${expenseKeywords.filter(k => normalizedText.includes(k)).join(', ')}`;
  } else if (amount > 0) {
    type = 'expense';
    confidence = 0.3;
    reason = 'Phát hiện số tiền nhưng không xác định rõ loại giao dịch';
  } else {
    reason = 'Không tìm thấy số tiền';
  }
  
  return {
    type,
    confidence,
    category,
    amount,
    incomeScore,
    expenseScore,
    contextScore: 0,
    reason
  };
}

// Xử lý tin nhắn chung với AI
async function handleGeneralMessageWithAI(ctx, text, aiAnalysis) {
  let message = `🤖 **AI Phân tích:** ${aiAnalysis.reason}

💡 **Gợi ý sử dụng:**
• \`"Cafe 30k"\` - Ghi chi tiêu
• \`"Lương tháng 7 15000000"\` - Ghi thu nhập
• \`"Tạo hũ: Tiết kiệm - Tiền tiết kiệm - 20"\` - Tạo hũ tiền
• \`"Báo cáo hũ"\` - Xem báo cáo hũ tiền
• \`"Số dư"\` - Xem tình hình tài chính`;

  const keyboard = [
    [
      { text: '📊 Thống kê', callback_data: 'stats_menu' },
      { text: '🏺 Hũ tiền', callback_data: 'jars' }
    ],
    [
      { text: '💰 Thu nhập', callback_data: 'income_stats' },
      { text: '💳 Số dư', callback_data: 'balance' }
    ],
    [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
  ];

  return await ctx.reply(message, {
    reply_markup: { inline_keyboard: keyboard },
    parse_mode: 'Markdown'
  });
}

// Các hàm khác (giữ nguyên)
function isBalanceRequest(text) {
  const normalizedText = text.toLowerCase().trim();
  const balanceKeywords = ['số dư', 'balance', 'dư', 'còn lại', 'tình hình tài chính'];
  return balanceKeywords.some(keyword => normalizedText.includes(keyword));
}

async function handleBalanceRequest(ctx, text) {
  const userId = String(ctx.from.id);
  try {
    const report = await balanceService.generateBalanceReport(userId, 'monthly');
    const keyboard = [
      [{ text: '📊 Thống kê chi tiết', callback_data: 'detailed_stats' }],
      [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
    ];
    return await ctx.reply(report, {
      reply_markup: { inline_keyboard: keyboard },
      parse_mode: 'Markdown'
    });
  } catch (error) {
    return await ctx.reply('❌ **Lỗi khi tạo báo cáo số dư**', { parse_mode: 'Markdown' });
  }
}

function isCustomStatsRequest(text) {
  const normalizedText = text.toLowerCase().trim();
  return normalizedText.includes('thống kê') || normalizedText.includes('stats');
}

async function handleCustomStatsRequest(ctx, text) {
  const userId = String(ctx.from.id);
  try {
    const stats = await expenseService.getExpenseStats(userId, 'month');
    let message = `📊 **Thống kê tháng này**\n\n`;
    message += `💰 **Tổng:** ${stats.totalAmount.toLocaleString('vi-VN')}đ\n`;
    message += `📝 **Giao dịch:** ${stats.totalTransactions}\n\n`;
    
    if (stats.categories && stats.categories.length > 0) {
      message += `📂 **Danh mục:**\n`;
      stats.categories.forEach(cat => {
        const percentage = ((cat.amount / stats.totalAmount) * 100).toFixed(1);
        message += `• ${cat.category}: ${cat.amount.toLocaleString('vi-VN')}đ (${percentage}%)\n`;
      });
    }
    
    const keyboard = [
      [{ text: '📅 Tùy chỉnh', callback_data: 'stats_custom' }],
      [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
    ];
    
    return await ctx.reply(message, {
      reply_markup: { inline_keyboard: keyboard },
      parse_mode: 'Markdown'
    });
  } catch (error) {
    return await ctx.reply('❌ **Lỗi khi tạo thống kê**', { parse_mode: 'Markdown' });
  }
}

function isGoalRequest(text) {
  const normalizedText = text.toLowerCase().trim();
  const goalKeywords = ['mục tiêu', 'goal', 'target', 'tiết kiệm', 'tiêu tiền'];
  return goalKeywords.some(keyword => normalizedText.includes(keyword));
}

async function handleGoalRequest(ctx, text) {
  return await goalHandler.handleGoalRequest(ctx, text);
}

function isJSONGoalInput(text) {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

async function handleJSONGoalInput(ctx, text) {
  return await goalHandler.handleJSONGoalInput(ctx, text);
}

module.exports = unifiedMessageHandler;
module.exports.handleLanguageSelection = handleLanguageSelection;

