const jarService = require('../services/jarService');
const languageService = require('../services/languageService');

// Xử lý callback queries cho hũ tiền
async function handleJarCallbacks(ctx) {
  const callbackData = ctx.callbackQuery.data;
  const userId = String(ctx.from.id);
  
  try {
    switch (callbackData) {
      case 'jar_report':
        await handleJarReport(ctx);
        return true;
        
      case 'jar_create':
        await handleJarCreate(ctx);
        return true;
        
      case 'jar_delete':
        await handleJarDelete(ctx);
        return true;
        
      case 'jar_update':
        await handleJarUpdate(ctx);
        return true;
        
      default:
        // Xử lý các callback xóa hũ cụ thể
        if (callbackData.startsWith('delete_jar_')) {
          await handleDeleteSpecificJar(ctx);
          return true;
        }
        
        // Xử lý các callback cập nhật hũ cụ thể
        if (callbackData.startsWith('update_jar_')) {
          await handleUpdateSpecificJar(ctx);
          return true;
        }
        
        return false; // Không xử lý callback này
    }
  } catch (error) {
    console.error('❌ Error handling jar callbacks:', error);
    await ctx.editMessageText('❌ **Lỗi khi xử lý yêu cầu. Vui lòng thử lại!**', {
      parse_mode: 'Markdown'
    });
    return true;
  }
}

// Hiển thị báo cáo hũ tiền
async function handleJarReport(ctx) {
  const userId = String(ctx.from.id);
  
  try {
    const report = await jarService.generateJarReport(userId);
    
    const keyboard = [
      [
        { text: '➕ Tạo hũ mới', callback_data: 'jar_create' },
        { text: '🗑️ Xóa hũ', callback_data: 'jar_delete' }
      ],
      [
        { text: '✏️ Cập nhật hũ', callback_data: 'jar_update' },
        { text: '🏠 Menu chính', callback_data: 'main_menu' }
      ]
    ];
    
    await ctx.editMessageText(report, {
      reply_markup: { inline_keyboard: keyboard },
      parse_mode: 'Markdown'
    });
    
  } catch (error) {
    console.error('❌ Error showing jar report:', error);
    await ctx.editMessageText('❌ **Lỗi khi tạo báo cáo hũ tiền**', {
      parse_mode: 'Markdown'
    });
  }
}

// Hiển thị menu tạo hũ
async function handleJarCreate(ctx) {
  let message = `➕ **TẠO HŨ TIỀN MỚI**\n\n`;
  message += `💡 **Cách sử dụng:**\n`;
  message += `• \`"Tạo hũ: Tên hũ - Mô tả - Tỷ lệ%"\`\n`;
  message += `• \`"Tạo hũ: Tiết kiệm - Tiền tiết kiệm - 20"\`\n`;
  message += `• \`"Tạo hũ: Du lịch - Tiền đi du lịch - 15"\`\n\n`;
  message += `📝 **Ví dụ:**\n`;
  message += `• \`"Tạo hũ: Sức khỏe - Khám bệnh, thuốc men - 10"\`\n`;
  message += `• \`"Tạo hũ: Đầu tư - Chứng khoán, crypto - 25"\`\n\n`;
  message += `⚠️ **Lưu ý:** Tỷ lệ sẽ được tự động điều chỉnh để tổng = 100%`;

  const keyboard = [
    [{ text: '📊 Xem báo cáo hũ', callback_data: 'jar_report' }],
    [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
  ];

  await ctx.editMessageText(message, {
    reply_markup: { inline_keyboard: keyboard },
    parse_mode: 'Markdown'
  });
}

// Hiển thị menu xóa hũ
async function handleJarDelete(ctx) {
  const userId = String(ctx.from.id);
  
  try {
    const result = await jarService.getJars(userId);
    
    if (!result.success || result.jars.length === 0) {
      await ctx.editMessageText('📝 **Chưa có hũ tiền nào để xóa!**', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '➕ Tạo hũ mới', callback_data: 'jar_create' }],
            [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
          ]
        },
        parse_mode: 'Markdown'
      });
      return;
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

    await ctx.editMessageText(message, {
      reply_markup: { inline_keyboard: keyboard },
      parse_mode: 'Markdown'
    });
    
  } catch (error) {
    console.error('❌ Error showing delete jars:', error);
    await ctx.editMessageText('❌ **Lỗi khi hiển thị danh sách xóa hũ**', {
      parse_mode: 'Markdown'
    });
  }
}

// Hiển thị menu cập nhật hũ
async function handleJarUpdate(ctx) {
  const userId = String(ctx.from.id);
  
  try {
    const result = await jarService.getJars(userId);
    
    if (!result.success || result.jars.length === 0) {
      await ctx.editMessageText('📝 **Chưa có hũ tiền nào để cập nhật!**', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '➕ Tạo hũ mới', callback_data: 'jar_create' }],
            [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
          ]
        },
        parse_mode: 'Markdown'
      });
      return;
    }

    let message = `✏️ **CẬP NHẬT HŨ TIỀN**\n\n`;
    message += `💡 **Chọn hũ để cập nhật:**\n\n`;

    const keyboard = [];
    
    result.jars.forEach(jar => {
      message += `${jar.icon} **${jar.name}**\n`;
      message += `   💰 ${jar.currentAmount.toLocaleString('vi-VN')}đ\n`;
      message += `   📊 Tỷ lệ: ${jar.percentage || 0}%\n\n`;
      
      keyboard.push([{ 
        text: `✏️ Sửa ${jar.name}`, 
        callback_data: `update_jar_${jar.id}` 
      }]);
    });

    message += `💡 **Cách cập nhật:**\n`;
    message += `• \`"Sửa hũ Tên hũ: tên mới"\`\n`;
    message += `• \`"Sửa hũ Tên hũ: tỷ lệ 15"\`\n`;
    message += `• \`"Sửa hũ Tên hũ: mô tả Mô tả mới"\``;
    
    keyboard.push(
      [{ text: '📊 Xem báo cáo hũ', callback_data: 'jar_report' }],
      [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
    );

    await ctx.editMessageText(message, {
      reply_markup: { inline_keyboard: keyboard },
      parse_mode: 'Markdown'
    });
    
  } catch (error) {
    console.error('❌ Error showing update jars:', error);
    await ctx.editMessageText('❌ **Lỗi khi hiển thị danh sách cập nhật hũ**', {
      parse_mode: 'Markdown'
    });
  }
}

// Xóa hũ cụ thể
async function handleDeleteSpecificJar(ctx) {
  const userId = String(ctx.from.id);
  const jarId = parseInt(ctx.callbackQuery.data.replace('delete_jar_', ''));
  
  try {
    const result = await jarService.deleteJar(userId, jarId);
    
    if (result.success) {
      await ctx.editMessageText(`✅ ${result.message}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 Xem báo cáo hũ', callback_data: 'jar_report' }],
            [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
          ]
        }
      });
    } else {
      await ctx.editMessageText(`❌ ${result.message}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🗑️ Xem danh sách xóa', callback_data: 'jar_delete' }],
            [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
          ]
        }
      });
    }
  } catch (error) {
    console.error('❌ Error deleting specific jar:', error);
    await ctx.editMessageText('❌ **Lỗi khi xóa hũ tiền**', {
      parse_mode: 'Markdown'
    });
  }
}

// Cập nhật hũ cụ thể
async function handleUpdateSpecificJar(ctx) {
  const userId = String(ctx.from.id);
  const jarId = parseInt(ctx.callbackQuery.data.replace('update_jar_', ''));
  
  try {
    const result = await jarService.getJars(userId);
    if (result.success) {
      const targetJar = result.jars.find(j => j.id === jarId);
      if (targetJar) {
        let message = `✏️ **CẬP NHẬT HŨ: ${targetJar.name}**\n\n`;
        message += `💡 **Cách cập nhật:**\n`;
        message += `• \`"Sửa hũ ${targetJar.name}: tên mới"\`\n`;
        message += `• \`"Sửa hũ ${targetJar.name}: tỷ lệ 15"\`\n`;
        message += `• \`"Sửa hũ ${targetJar.name}: mô tả Mô tả mới"\`\n\n`;
        message += `📊 **Thông tin hiện tại:**\n`;
        message += `• Tên: ${targetJar.name}\n`;
        message += `• Tỷ lệ: ${targetJar.percentage || 0}%\n`;
        message += `• Mô tả: ${targetJar.note || 'Chưa có'}\n`;
        message += `• Số dư: ${targetJar.currentAmount.toLocaleString('vi-VN')}đ`;
        
        await ctx.editMessageText(message, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📊 Xem báo cáo hũ', callback_data: 'jar_report' }],
              [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
            ]
          },
          parse_mode: 'Markdown'
        });
      }
    }
  } catch (error) {
    console.error('❌ Error updating specific jar:', error);
    await ctx.editMessageText('❌ **Lỗi khi cập nhật hũ tiền**', {
      parse_mode: 'Markdown'
    });
  }
}

async function handleLanguageCallback(ctx) {
  const userId = String(ctx.from.id);
  const action = ctx.callbackQuery.data;
  
  console.log('🔍 Language callback:', { userId, action });

  try {
    if (action === 'language_menu') {
      console.log('📋 Showing language menu');
      return await showLanguageMenu(ctx);
    }

    if (action.startsWith('set_lang_')) {
      const langCode = action.replace('set_lang_', '');
      console.log('🌐 Setting language:', langCode);
      return await setUserLanguage(ctx, langCode);
    }
    
    console.log('❌ Unknown language action:', action);
  } catch (error) {
    console.error('❌ Error in language callback:', error);
    await ctx.answerCbQuery('❌ Error processing language selection');
  }
}

async function showLanguageMenu(ctx) {
  const userId = String(ctx.from.id);
  const currentLang = await languageService.getUserLanguage(userId);
  const supportedLangs = languageService.getSupportedLanguages();
  
  console.log('🌐 Language menu:', { userId, currentLang, supportedLangs });

  let message = '🌐 *Language Settings / Cài đặt ngôn ngữ*\n\n';
  message += 'Current language / Ngôn ngữ hiện tại: ';
  message += `*${supportedLangs.find(l => l.code === currentLang)?.name}*\n\n`;
  message += 'Select your language / Chọn ngôn ngữ của bạn:';

  const keyboard = [];
  
  // Tạo button cho từng ngôn ngữ
  supportedLangs.forEach(lang => {
    const isSelected = lang.code === currentLang;
    keyboard.push([{
      text: `${isSelected ? '✅ ' : ''}${lang.name} ${getLangEmoji(lang.code)}`,
      callback_data: `set_lang_${lang.code}`
    }]);
  });

  // Thêm các button điều hướng
  keyboard.push([
    { text: '🏠 Menu chính / Main Menu', callback_data: 'main_menu' }
  ]);

  await ctx.editMessageText(message, {
    reply_markup: { inline_keyboard: keyboard },
    parse_mode: 'Markdown'
  });
}

async function setUserLanguage(ctx, langCode) {
  const userId = String(ctx.from.id);
  const result = await languageService.setUserLanguage(userId, langCode);

  if (result.success) {
    // Hiển thị lại menu ngôn ngữ với lựa chọn mới
    await showLanguageMenu(ctx);
    
    // Thông báo thành công
    const successMsg = {
      vi: 'Đã cập nhật ngôn ngữ thành công!',
      en: 'Language updated successfully!',
      zh: '语言更新成功！',
      ja: '言語が正常に更新されました！',
      ko: '언어가 성공적으로 업데이트되었습니다!'
    }[langCode] || 'Language updated successfully!';
    
    await ctx.answerCbQuery(successMsg);
  } else {
    await ctx.answerCbQuery('❌ ' + result.message);
  }
}

// Hàm helper để lấy emoji cho mỗi ngôn ngữ
function getLangEmoji(langCode) {
  const langEmojis = {
    vi: '🇻🇳',
    en: '🇬🇧',
    zh: '🇨🇳',
    ja: '🇯🇵',
    ko: '🇰🇷'
  };
  return langEmojis[langCode] || '🌐';
}

module.exports = {
  handleJarCallbacks,
  handleLanguageCallback
}; 