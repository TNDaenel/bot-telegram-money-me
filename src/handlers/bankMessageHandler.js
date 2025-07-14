
const BankService = require('../services/bankService');
const languageService = require('../services/languageService');

class BankMessageHandler {
  constructor() {
    this.bankService = new BankService();
  }

  // Xử lý tin nhắn bank
  async handleBankMessage(ctx) {
    const text = ctx.message.text.toLowerCase();
    const userId = String(ctx.from.id);
    const lang = await languageService.getUserLanguage(userId);
    const t = async (key) => await languageService.getTranslation(lang, key);

    try {
      if (text.includes('bank') || text.includes('email') || text.includes('ngân hàng')) {
        return await this.showBankMenu(ctx);
      }

      if (text.includes('setup') || text.includes('cấu hình')) {
        return await this.showBankSetup(ctx);
      }

      if (text.includes('test') || text.includes('kiểm tra')) {
        return await this.testBankConnection(ctx);
      }

      if (text.includes('stats') || text.includes('thống kê')) {
        return await this.showBankStats(ctx);
      }

      if (text.includes('transactions') || text.includes('giao dịch')) {
        return await this.showBankTransactions(ctx);
      }

      if (text.includes('pending') || text.includes('chờ xử lý')) {
        return await this.showPendingTransactions(ctx);
      }

      if (text.includes('ai') || text.includes('retrain')) {
        return await this.retrainAI(ctx);
      }

      if (text.includes('force') || text.includes('check') || text.includes('kiểm tra ngay')) {
        return await this.forceCheckEmails(ctx);
      }

      if (text.includes('monitoring') || text.includes('status') || text.includes('trạng thái')) {
        return await this.showMonitoringStatus(ctx);
      }

      if (text.includes('restart') || text.includes('khởi động lại')) {
        return await this.restartMonitoring(ctx);
      }

      // Mặc định hiển thị menu bank
      return await this.showBankMenu(ctx);

    } catch (error) {
      console.error('❌ Error in bank message handler:', error);
      await ctx.reply(await t('ERROR'));
    }
  }

  // Hiển thị menu bank
  async showBankMenu(ctx) {
    const userId = String(ctx.from.id);
    const lang = await languageService.getUserLanguage(userId);
    const t = async (key) => await languageService.getTranslation(lang, key);

    const keyboard = {
      inline_keyboard: [
        [
          { text: await t('BANK_SETUP'), callback_data: 'bank_setup' },
          { text: await t('BANK_TEST'), callback_data: 'bank_test' }
        ],
        [
          { text: await t('BANK_STATS'), callback_data: 'bank_stats' },
          { text: await t('BANK_TRANSACTIONS'), callback_data: 'bank_transactions' }
        ],
        [
          { text: await t('BANK_PENDING'), callback_data: 'bank_pending' },
          { text: await t('BANK_AI'), callback_data: 'bank_ai' }
        ],
        [
          { text: '🔍 Kiểm tra ngay', callback_data: 'bank_force_check' },
          { text: '📊 Trạng thái', callback_data: 'bank_monitoring_status' }
        ],
        [
          { text: await t('BACK'), callback_data: 'main_menu' }
        ]
      ]
    };

    await ctx.reply(`${await t('BANK_MENU_TITLE')}

${await t('BANK_MENU_DESCRIPTION')}

🔄 **Adaptive Polling:** Tự động điều chỉnh tần suất kiểm tra email
📧 **Real-time:** Xử lý ngay khi có email mới
🤖 **AI Analysis:** Phân tích và phân loại tự động`, {
      reply_markup: keyboard,
      parse_mode: 'Markdown'
    });
  }

  // Hiển thị setup bank
  async showBankSetup(ctx) {
    const userId = String(ctx.from.id);
    const lang = await languageService.getUserLanguage(userId);
    const t = async (key) => await languageService.getTranslation(lang, key);

    const config = await this.bankService.getUserEmailConfig(userId);
    
    let message = `${await t('BANK_SETUP_TITLE')}\n\n`;
    
    if (config) {
      message += `${await t('BANK_SETUP_CURRENT')}:\n`;
      message += `📧 Email: ${config.email}\n`;
      message += `🏦 Bank: ${config.bankName}\n`;
      message += `✅ Status: ${config.active ? await t('ACTIVE') : await t('INACTIVE')}\n\n`;
    } else {
      message += `${await t('BANK_SETUP_NOT_CONFIGURED')}\n\n`;
    }

    message += `${await t('BANK_SETUP_INSTRUCTIONS')}:\n`;
    message += `1. ${await t('BANK_SETUP_STEP1')}\n`;
    message += `2. ${await t('BANK_SETUP_STEP2')}\n`;
    message += `3. ${await t('BANK_SETUP_STEP3')}\n\n`;
    message += `${await t('BANK_SETUP_SUPPORTED_BANKS')}: VCB, TCB, TPBank, MBBank, ACB, Techcombank\n\n`;
    message += `🔄 **Adaptive Polling:**\n`;
    message += `• Tự động điều chỉnh tần suất kiểm tra (2-30 giây)\n`;
    message += `• Nhanh hơn khi có nhiều email\n`;
    message += `• Tiết kiệm tài nguyên khi ít email`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: await t('BANK_SETUP_CONFIGURE'), callback_data: 'bank_configure' },
          { text: await t('BANK_SETUP_TEST'), callback_data: 'bank_test' }
        ],
        [
          { text: '🔍 Kiểm tra ngay', callback_data: 'bank_force_check' },
          { text: '📊 Trạng thái', callback_data: 'bank_monitoring_status' }
        ],
        [
          { text: await t('BACK'), callback_data: 'bank_menu' }
        ]
      ]
    };

    await ctx.reply(message, {
      reply_markup: keyboard,
      parse_mode: 'Markdown'
    });
  }

  // Test kết nối bank
  async testBankConnection(ctx) {
    const userId = String(ctx.from.id);
    const lang = await languageService.getUserLanguage(userId);
    const t = async (key) => await languageService.getTranslation(lang, key);

    await ctx.reply(`${await t('BANK_TEST_STARTING')}...`);

    try {
      const result = await this.bankService.testEmailConnection();
      
      if (result.success) {
        await ctx.reply(`✅ ${await t('BANK_TEST_SUCCESS')}\n\n${result.message}`);
      } else {
        await ctx.reply(`❌ ${await t('BANK_TEST_FAILED')}\n\n${result.message}`);
      }
    } catch (error) {
      await ctx.reply(`❌ ${await t('BANK_TEST_ERROR')}: ${error.message}`);
    }
  }

  // Force check emails ngay lập tức
  async forceCheckEmails(ctx) {
    const userId = String(ctx.from.id);
    const lang = await languageService.getUserLanguage(userId);
    const t = async (key) => await languageService.getTranslation(lang, key);

    await ctx.reply('🔍 Đang kiểm tra email ngay lập tức...');

    try {
      const hasNewEmails = await this.bankService.forceCheckEmails();
      
      if (hasNewEmails) {
        await ctx.reply('✅ Phát hiện email mới và đã xử lý!');
      } else {
        await ctx.reply('📧 Không có email mới.');
      }
    } catch (error) {
      await ctx.reply(`❌ Lỗi khi kiểm tra email: ${error.message}`);
    }
  }

  // Hiển thị trạng thái monitoring
  async showMonitoringStatus(ctx) {
    const userId = String(ctx.from.id);
    const lang = await languageService.getUserLanguage(userId);
    const t = async (key) => await languageService.getTranslation(lang, key);

    try {
      const status = this.bankService.getMonitoringStatus();
      
      let message = `📊 **Trạng thái Monitoring**\n\n`;
      
      if (status.isMonitoring) {
        const uptimeMinutes = Math.floor(status.uptime / 60000);
        const uptimeHours = Math.floor(uptimeMinutes / 60);
        const remainingMinutes = uptimeMinutes % 60;
        
        message += `✅ **Đang hoạt động**\n`;
        message += `⏱️ **Thời gian chạy:** ${uptimeHours}h ${remainingMinutes}m\n`;
        message += `📧 **Email đã xử lý:** ${status.totalEmailsProcessed}\n`;
        message += `🔄 **Interval hiện tại:** ${status.currentInterval}ms\n`;
        
        if (status.lastEmailTime) {
          const lastEmailTime = new Date(status.lastEmailTime);
          const timeDiff = Date.now() - lastEmailTime.getTime();
          const minutesAgo = Math.floor(timeDiff / 60000);
          message += `📅 **Email cuối:** ${minutesAgo} phút trước\n`;
        } else {
          message += `📅 **Email cuối:** Chưa có\n`;
        }
      } else {
        message += `❌ **Đã dừng**\n`;
        message += `💡 Gửi "restart monitoring" để khởi động lại`;
      }

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🔍 Kiểm tra ngay', callback_data: 'bank_force_check' },
            { text: '🔄 Khởi động lại', callback_data: 'bank_restart' }
          ],
          [
            { text: await t('BACK'), callback_data: 'bank_menu' }
          ]
        ]
      };

      await ctx.reply(message, {
        reply_markup: keyboard,
        parse_mode: 'Markdown'
      });

    } catch (error) {
      console.error('❌ Error showing monitoring status:', error);
      await ctx.reply(`${await t('ERROR')}: ${error.message}`);
    }
  }

  // Restart monitoring
  async restartMonitoring(ctx) {
    const userId = String(ctx.from.id);
    const lang = await languageService.getUserLanguage(userId);
    const t = async (key) => await languageService.getTranslation(lang, key);

    await ctx.reply('🔄 Đang khởi động lại monitoring...');

    try {
      await this.bankService.restartMonitoring();
      await ctx.reply('✅ Monitoring đã được khởi động lại thành công!');
    } catch (error) {
      await ctx.reply(`❌ Lỗi khi khởi động lại: ${error.message}`);
    }
  }

  // Hiển thị thống kê bank
  async showBankStats(ctx) {
    const userId = String(ctx.from.id);
    const lang = await languageService.getUserLanguage(userId);
    const t = async (key) => await languageService.getTranslation(lang, key);

    try {
      const stats = await this.bankService.getBankStats(userId);
      
      if (!stats) {
        await ctx.reply(await t('BANK_STATS_NO_DATA'));
        return;
      }

      let message = `${await t('BANK_STATS_TITLE')}\n\n`;
      message += `📊 **${await t('BANK_STATS_TOTAL_TRANSACTIONS')}:** ${stats.totalTransactions}\n`;
      message += `💰 **${await t('BANK_STATS_TOTAL_AMOUNT')}:** ${stats.totalAmount.toLocaleString('vi-VN')}đ\n\n`;

      if (stats.emailStats) {
        message += `📧 **Thông tin Email:**\n`;
        message += `📧 Tổng email: ${stats.emailStats.total}\n`;
        message += `✅ Đã xử lý: ${stats.emailStats.processed}\n`;
        message += `🤖 AI xử lý: ${stats.emailStats.aiProcessed}\n`;
        message += `⏳ Chờ xử lý: ${stats.emailStats.pending}\n`;
        message += `🔄 Interval hiện tại: ${stats.emailStats.currentInterval}ms\n\n`;
      }

      if (stats.monitoringStats) {
        const uptime = stats.monitoringStats.uptime;
        const uptimeMinutes = Math.floor(uptime / 60000);
        const uptimeHours = Math.floor(uptimeMinutes / 60);
        const remainingMinutes = uptimeMinutes % 60;
        
        message += `📊 **Monitoring Stats:**\n`;
        message += `⏱️ Thời gian chạy: ${uptimeHours}h ${remainingMinutes}m\n`;
        message += `📧 Email đã xử lý: ${stats.monitoringStats.totalEmailsProcessed}\n`;
        if (stats.monitoringStats.lastEmailTime) {
          const lastEmailTime = new Date(stats.monitoringStats.lastEmailTime);
          const timeDiff = Date.now() - lastEmailTime.getTime();
          const minutesAgo = Math.floor(timeDiff / 60000);
          message += `📅 Email cuối: ${minutesAgo} phút trước\n`;
        }
        message += `\n`;
      }

      if (Object.keys(stats.byBank).length > 0) {
        message += `📂 **Theo ngân hàng:**\n`;
        for (const [key, data] of Object.entries(stats.byBank)) {
          const type = data.type === 'credit' ? '💰' : '💸';
          message += `${type} ${data.bank}: ${data.count} ${await t('TRANSACTIONS')} (${data.amount.toLocaleString('vi-VN')}đ)\n`;
        }
      }

      const keyboard = {
        inline_keyboard: [
          [
            { text: await t('BANK_STATS_DETAILS'), callback_data: 'bank_stats_details' },
            { text: await t('BANK_STATS_AI'), callback_data: 'bank_ai_stats' }
          ],
          [
            { text: '🔍 Kiểm tra ngay', callback_data: 'bank_force_check' },
            { text: '📊 Trạng thái', callback_data: 'bank_monitoring_status' }
          ],
          [
            { text: await t('BACK'), callback_data: 'bank_menu' }
          ]
        ]
      };

      await ctx.reply(message, {
        reply_markup: keyboard,
        parse_mode: 'Markdown'
      });

    } catch (error) {
      console.error('❌ Error showing bank stats:', error);
      await ctx.reply(`${await t('ERROR')}: ${error.message}`);
    }
  }

  // Hiển thị giao dịch bank
  async showBankTransactions(ctx) {
    const userId = String(ctx.from.id);
    const lang = await languageService.getUserLanguage(userId);
    const t = async (key) => await languageService.getTranslation(lang, key);

    try {
      const transactions = await this.bankService.getBankTransactions(userId, 5);
      
      if (transactions.length === 0) {
        await ctx.reply(await t('BANK_TRANSACTIONS_NO_DATA'));
        return;
      }

      let message = `${await t('BANK_TRANSACTIONS_TITLE')} (5 ${await t('LATEST')})\n\n`;

      for (const [index, tx] of transactions.entries()) {
        const type = tx.type === 'credit' ? '💰' : '💸';
        const status = tx.processed ? '✅' : '⏳';
        const aiStatus = tx.aiProcessed ? '🤖' : '❌';
        let aiCategory = tx.aiCategory;
        if (!aiCategory) aiCategory = await t('UNCATEGORIZED');
        message += `${index + 1}. ${type} ${tx.bankName}\n`;
        message += `   💵 ${tx.amount.toLocaleString('vi-VN')}đ\n`;
        message += `   📝 ${tx.description}\n`;
        message += `   📅 ${new Date(tx.date).toLocaleDateString('vi-VN')}\n`;
        message += `   ${status} ${aiStatus} ${aiCategory}\n\n`;
      }

      const keyboard = {
        inline_keyboard: [
          [
            { text: await t('BANK_TRANSACTIONS_VIEW_ALL'), callback_data: 'bank_transactions_all' },
            { text: await t('BANK_TRANSACTIONS_PENDING'), callback_data: 'bank_pending' }
          ],
          [
            { text: '🔍 Kiểm tra ngay', callback_data: 'bank_force_check' },
            { text: await t('BACK'), callback_data: 'bank_menu' }
          ]
        ]
      };

      await ctx.reply(message, {
        reply_markup: keyboard,
        parse_mode: 'Markdown'
      });

    } catch (error) {
      console.error('❌ Error showing bank transactions:', error);
      await ctx.reply(`${await t('ERROR')}: ${error.message}`);
    }
  }

  // Hiển thị giao dịch chờ xử lý
  async showPendingTransactions(ctx) {
    const userId = String(ctx.from.id);
    const lang = await languageService.getUserLanguage(userId);
    const t = async (key) => await languageService.getTranslation(lang, key);

    try {
      const pending = await this.bankService.getPendingTransactions(userId);
      
      if (pending.length === 0) {
        await ctx.reply(await t('BANK_PENDING_NO_DATA'));
        return;
      }

      let message = `${await t('BANK_PENDING_TITLE')} (${pending.length} ${await t('TRANSACTIONS')})\n\n`;

      pending.forEach((tx, index) => {
        const type = tx.type === 'credit' ? '💰' : '💸';
        
        message += `${index + 1}. ${type} ${tx.bankName}\n`;
        message += `   💵 ${tx.amount.toLocaleString('vi-VN')}đ\n`;
        message += `   📝 ${tx.description}\n`;
        message += `   📅 ${new Date(tx.date).toLocaleDateString('vi-VN')}\n`;
        message += `   ID: ${tx.id}\n\n`;
      });

      const keyboard = {
        inline_keyboard: [
          [
            { text: await t('BANK_PENDING_PROCESS_ALL'), callback_data: 'bank_pending_process_all' },
            { text: await t('BANK_PENDING_PROCESS_ONE'), callback_data: 'bank_pending_process_one' }
          ],
          [
            { text: '🔍 Kiểm tra ngay', callback_data: 'bank_force_check' },
            { text: await t('BACK'), callback_data: 'bank_menu' }
          ]
        ]
      };

      await ctx.reply(message, {
        reply_markup: keyboard,
        parse_mode: 'Markdown'
      });

    } catch (error) {
      console.error('❌ Error showing pending transactions:', error);
      await ctx.reply(`${await t('ERROR')}: ${error.message}`);
    }
  }

  // Retrain AI
  async retrainAI(ctx) {
    const userId = String(ctx.from.id);
    const lang = await languageService.getUserLanguage(userId);
    const t = async (key) => await languageService.getTranslation(lang, key);

    await ctx.reply(`${await t('BANK_AI_RETRAINING')}...`);

    try {
      const result = await this.bankService.retrainAI();
      
      if (result.success) {
        await ctx.reply(`✅ ${await t('BANK_AI_RETRAIN_SUCCESS')}\n\n` +
          `${await t('BANK_AI_CATEGORIES')}: ${result.categories.join(', ')}\n` +
          `${await t('BANK_AI_TOTAL_TRANSACTIONS')}: ${result.totalTransactions}`);
      } else {
        await ctx.reply(`❌ ${await t('BANK_AI_RETRAIN_FAILED')}: ${result.error}`);
      }
    } catch (error) {
      await ctx.reply(`❌ ${await t('BANK_AI_RETRAIN_ERROR')}: ${error.message}`);
    }
  }

  // Xử lý callback bank
  async handleBankCallback(ctx) {
    const callbackData = ctx.callbackQuery.data;
    const userId = String(ctx.from.id);
    const lang = await languageService.getUserLanguage(userId);
    const t = async (key) => await languageService.getTranslation(lang, key);

    try {
      switch (callbackData) {
        case 'bank_menu':
          await this.showBankMenu(ctx);
          break;
          
        case 'bank_setup':
          await this.showBankSetup(ctx);
          break;
          
        case 'bank_test':
          await this.testBankConnection(ctx);
          break;
          
        case 'bank_stats':
          await this.showBankStats(ctx);
          break;
          
        case 'bank_transactions':
          await this.showBankTransactions(ctx);
          break;
          
        case 'bank_pending':
          await this.showPendingTransactions(ctx);
          break;
          
        case 'bank_ai':
          await this.retrainAI(ctx);
          break;
          
        case 'bank_force_check':
          await this.forceCheckEmails(ctx);
          break;
          
        case 'bank_monitoring_status':
          await this.showMonitoringStatus(ctx);
          break;
          
        case 'bank_restart':
          await this.restartMonitoring(ctx);
          break;
          
        default:
          const unknownMsg = await t('UNKNOWN_COMMAND');
          await ctx.reply(unknownMsg);
          break;
      }
    } catch (error) {
      console.error('❌ Error in bank callback handler:', error);
      const errorMsg = await t('ERROR');
      await ctx.reply(`${errorMsg}: ${error.message}`);
    }
  }
}

module.exports = new BankMessageHandler();
