
const { PrismaClient } = require('@prisma/client');
const BankService = require('../services/bankService');
const languageService = require('../services/languageService');

const bankDomains = {
  VIB: 'vib.com.vn',
  CAKE: 'no-reply@cake.vn',
  VPBank: ['vpbankonline@vpb.com.vn', 'customercare@care.vpb.com.vn'],
  ACB: 'mailalert@acb.com.vn'
};

class BankMessageHandler {
  constructor() {
    this.prisma = new PrismaClient();
    this.bankService = new BankService();
    this.waitingForEmail = new Map(); // userId -> true
    this.pendingEmail = new Map(); // userId -> email
  }

  // Handle bank messages
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

      if (text.includes('force') || text.includes('check') || text.includes('kiểm tra ngay')) {
        return await this.forceCheckEmails(ctx);
      }

      if (text.includes('monitoring') || text.includes('status') || text.includes('trạng thái')) {
        return await this.showMonitoringStatus(ctx);
      }

      // Default to bank menu
      return await this.showBankMenu(ctx);

    } catch (error) {
      console.error('❌ Error in bank message handler:', error);
      await ctx.reply(await t('ERROR'));
    }
  }

  // Handle connect email flow
  async handleConnectEmail(ctx) {
    const userId = String(ctx.from.id);
    this.waitingForEmail.set(userId, true);
    await ctx.reply(
      '🔗 *Kết nối Email Ngân hàng*\n\n' +
      '1️⃣ Vui lòng nhập email bạn dùng để nhận thông báo giao dịch từ ngân hàng (ví dụ: yourmail@gmail.com).\n\n' +
      '2️⃣ Sau đó, chọn ngân hàng bạn muốn kết nối.\n\n' +
      '⛔ Bạn có thể nhấn "Huỷ" bất cứ lúc nào.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '❌ Huỷ', callback_data: 'bank_cancel_connect' }
            ]
          ]
        }
      }
    );
  }

  async handleText(ctx) {
    const userId = String(ctx.from.id);
    const text = ctx.message.text;
    if (this.waitingForEmail.get(userId) && this.isValidEmail(text)) {
      this.pendingEmail.set(userId, text);
      this.waitingForEmail.delete(userId);
      // Gửi prompt chọn ngân hàng
      await ctx.reply('🏦 *Chọn ngân hàng bạn muốn kết nối:*', {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '💚 VIB', callback_data: 'bank_VIB' },
              { text: '🍰 CAKE', callback_data: 'bank_CAKE' }
            ],
            [
              { text: '💳 VPBank', callback_data: 'bank_VPBank' },
              { text: '🏦 ACB', callback_data: 'bank_ACB' }
            ],
            [
              { text: '❌ Huỷ', callback_data: 'bank_cancel_connect' } ]
          ]
        }
      });
      return true;
    }
    return false;
  }

  async handleBankSelect(ctx) {
    const userId = String(ctx.from.id);
    const data = ctx.callbackQuery.data;
    if (data === 'bank_cancel_connect') {
      this.waitingForEmail.delete(userId);
      this.pendingEmail.delete(userId);
      await ctx.reply('❌ Đã huỷ kết nối email ngân hàng.');
      return true;
    }
    if (data.startsWith('bank_')) {
      const bankName = data.replace('bank_', '');
      const email = this.pendingEmail.get(userId);
      if (!email) {
        await ctx.reply('Vui lòng nhập email trước.');
        return true;
      }
      // Lưu vào DB
      await this.prisma.userBankConfig.upsert({
        where: { userId },
        update: { email, bankName, active: true },
        create: { userId, email, bankName, active: true }
      });
      await ctx.reply(
        `✅ *Kết nối thành công!*

` +
        `• Email: *${email}*\n` +
        `• Ngân hàng: *${this.getBankLabel(bankName)}*\n\n` +
        `Bạn đã kết nối thành công email với ngân hàng. Hệ thống sẽ tự động quét giao dịch mới từ email này.`,
        { parse_mode: 'Markdown' }
      );
      this.pendingEmail.delete(userId);
      return true;
    }
    return false;
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  getBankLabel(bankName) {
    switch (bankName) {
      case 'VIB': return '💚 VIB';
      case 'CAKE': return '🍰 CAKE';
      case 'VPBank': return '💳 VPBank';
      case 'ACB': return '🏦 ACB';
      default: return bankName;
    }
  }

  // Show bank menu
  async showBankMenu(ctx) {
    const userId = String(ctx.from.id);
    const lang = await languageService.getUserLanguage(userId);
    const t = async (key) => await languageService.getTranslation(lang, key);

    const stats = await this.bankService.getBankStats(userId);
    const status = await this.bankService.getMonitoringStatus();

    let message = `🏦 **${await t('BANK_MENU')}**\n\n`;

    // Add stats if available
    if (stats) {
      message += `📊 **${await t('BANK_STATS')}:**\n`;
      message += `• ${await t('TOTAL_TRANSACTIONS')}: ${stats.totalTransactions}\n`;
      message += `• ${await t('PROCESSED_TRANSACTIONS')}: ${stats.processedTransactions}\n`;
      message += `• ${await t('PENDING_TRANSACTIONS')}: ${stats.pendingTransactions}\n`;
      message += `• ${await t('TOTAL_AMOUNT')}: ${stats.totalAmount.toLocaleString('vi-VN')}đ\n\n`;
    }

    // Add monitoring status if available
    if (status) {
      message += `📡 **${await t('MONITORING_STATUS')}:**\n`;
      message += `• ${await t('STATUS')}: ${status.isRunning ? '✅ Running' : '❌ Stopped'}\n`;
      message += `• ${await t('UPTIME')}: ${Math.floor(status.uptime / 60)} minutes\n`;
      message += `• ${await t('EMAILS_PROCESSED')}: ${status.totalEmailsProcessed}\n`;
      if (status.lastEmailTime) {
        message += `• ${await t('LAST_EMAIL')}: ${new Date(status.lastEmailTime).toLocaleString('vi-VN')}\n`;
      }
    }

    const keyboard = {
      inline_keyboard: [
        [
          { text: await t('SETUP_BANK'), callback_data: 'bank_setup' },
          { text: await t('TEST_CONNECTION'), callback_data: 'bank_test' }
        ],
        [
          { text: await t('VIEW_TRANSACTIONS'), callback_data: 'bank_transactions' },
          { text: await t('VIEW_PENDING'), callback_data: 'bank_pending' }
        ],
        [
          { text: await t('CHECK_NOW'), callback_data: 'bank_force_check' },
          { text: await t('VIEW_STATUS'), callback_data: 'bank_status' }
        ],
        [{ text: await t('BACK_MAIN'), callback_data: 'main_menu' }]
      ]
    };

    await ctx.reply(message, {
      reply_markup: keyboard,
      parse_mode: 'Markdown'
    });
  }

  // Show bank setup
  async showBankSetup(ctx) {
    const userId = String(ctx.from.id);
    const lang = await languageService.getUserLanguage(userId);
    const t = async (key) => await languageService.getTranslation(lang, key);

    const message = `⚙️ **${await t('BANK_SETUP_TITLE')}**

1️⃣ **${await t('STEP_1')}:**
${await t('SETUP_GMAIL_2FA')}

2️⃣ **${await t('STEP_2')}:**
${await t('CREATE_APP_PASSWORD')}

3️⃣ **${await t('STEP_3')}:**
${await t('SETUP_EMAIL_FORWARD')}

4️⃣ **${await t('STEP_4')}:**
${await t('TEST_CONNECTION')}

📝 **${await t('SUPPORTED_BANKS')}:**
• Vietcombank (VCB)
• Techcombank (TCB)
• TPBank
• MBBank
• ACB

📧 **${await t('SUPPORTED_SERVICES')}:**
• ${await t('UTILITY_BILLS')}
• ${await t('ECOMMERCE')}
• ${await t('BANK_TRANSACTIONS')}`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: await t('START_SETUP'), callback_data: 'bank_start' },
          { text: await t('TEST_CONNECTION'), callback_data: 'bank_test' }
        ],
        [{ text: await t('BACK'), callback_data: 'bank_menu' }]
      ]
    };

    await ctx.reply(message, {
      reply_markup: keyboard,
      parse_mode: 'Markdown'
    });
  }

  // Test bank connection
  async testBankConnection(ctx) {
    const userId = String(ctx.from.id);
    const lang = await languageService.getUserLanguage(userId);
    const t = async (key) => await languageService.getTranslation(lang, key);

    await ctx.reply(await t('TESTING_CONNECTION'));

    try {
      const result = await this.bankService.testEmailConnection();
      
      if (result.success) {
        await ctx.reply(`✅ ${await t('TEST_SUCCESS')}`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: await t('START_MONITORING'), callback_data: 'bank_start' }],
              [{ text: await t('BACK'), callback_data: 'bank_menu' }]
            ]
          }
        });
      } else {
        await ctx.reply(`❌ ${await t('TEST_FAILED')}\n${result.message}`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: await t('SETUP_AGAIN'), callback_data: 'bank_setup' }],
              [{ text: await t('BACK'), callback_data: 'bank_menu' }]
            ]
          }
        });
      }
    } catch (error) {
      console.error('❌ Error testing connection:', error);
      await ctx.reply(`❌ ${await t('TEST_ERROR')}\n${error.message}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: await t('BACK'), callback_data: 'bank_menu' }]
          ]
        }
      });
    }
  }

  // Show bank stats
  async showBankStats(ctx) {
    const userId = String(ctx.from.id);
    const lang = await languageService.getUserLanguage(userId);
    const t = async (key) => await languageService.getTranslation(lang, key);

    try {
      const stats = await this.bankService.getBankStats(userId);
      
      if (!stats) {
        await ctx.reply(await t('NO_STATS_AVAILABLE'), {
          reply_markup: {
            inline_keyboard: [
              [{ text: await t('BACK'), callback_data: 'bank_menu' }]
            ]
          }
        });
        return;
      }

      let message = `📊 **${await t('BANK_STATS')}**\n\n`;
      message += `• ${await t('TOTAL_TRANSACTIONS')}: ${stats.totalTransactions}\n`;
      message += `• ${await t('PROCESSED_TRANSACTIONS')}: ${stats.processedTransactions}\n`;
      message += `• ${await t('PENDING_TRANSACTIONS')}: ${stats.pendingTransactions}\n`;
      message += `• ${await t('TOTAL_AMOUNT')}: ${stats.totalAmount.toLocaleString('vi-VN')}đ\n`;
      
      if (stats.lastTransactionDate) {
        message += `• ${await t('LAST_TRANSACTION')}: ${new Date(stats.lastTransactionDate).toLocaleString('vi-VN')}\n`;
      }

      await ctx.reply(message, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: await t('VIEW_TRANSACTIONS'), callback_data: 'bank_transactions' },
              { text: await t('VIEW_PENDING'), callback_data: 'bank_pending' }
            ],
            [{ text: await t('BACK'), callback_data: 'bank_menu' }]
          ]
        },
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('❌ Error showing bank stats:', error);
      await ctx.reply(await t('ERROR_GETTING_STATS'), {
        reply_markup: {
          inline_keyboard: [
            [{ text: await t('BACK'), callback_data: 'bank_menu' }]
          ]
        }
      });
    }
  }

  // Show bank transactions
  async showBankTransactions(ctx) {
    const userId = String(ctx.from.id);
    const lang = await languageService.getUserLanguage(userId);
    const t = async (key) => await languageService.getTranslation(lang, key);

    try {
      const transactions = await this.bankService.getBankTransactions(userId, { take: 5 });
      
      if (transactions.length === 0) {
        await ctx.reply(await t('NO_TRANSACTIONS'), {
          reply_markup: {
            inline_keyboard: [
              [{ text: await t('BACK'), callback_data: 'bank_menu' }]
            ]
          }
        });
        return;
      }

      let message = `📋 **${await t('RECENT_TRANSACTIONS')}**\n\n`;
      
      transactions.forEach((tx, index) => {
        message += `${index + 1}. ${tx.type === 'credit' ? '💵' : '💸'} `;
        message += `**${tx.amount.toLocaleString('vi-VN')}đ**\n`;
        message += `   🏦 ${tx.bankName}\n`;
        message += `   📝 ${tx.description}\n`;
        message += `   📅 ${new Date(tx.date).toLocaleString('vi-VN')}\n`;
        if (tx.aiCategory) {
          message += `   🤖 ${tx.aiCategory} (${(tx.aiConfidence * 100).toFixed(0)}%)\n`;
        }
        message += `\n`;
      });

      await ctx.reply(message, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: await t('VIEW_MORE'), callback_data: 'bank_transactions_more' },
              { text: await t('VIEW_PENDING'), callback_data: 'bank_pending' }
            ],
            [{ text: await t('BACK'), callback_data: 'bank_menu' }]
          ]
        },
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('❌ Error showing bank transactions:', error);
      await ctx.reply(await t('ERROR_GETTING_TRANSACTIONS'), {
        reply_markup: {
          inline_keyboard: [
            [{ text: await t('BACK'), callback_data: 'bank_menu' }]
          ]
        }
      });
    }
  }

  // Show pending transactions
  async showPendingTransactions(ctx) {
    const userId = String(ctx.from.id);
    const lang = await languageService.getUserLanguage(userId);
    const t = async (key) => await languageService.getTranslation(lang, key);

    try {
      const transactions = await this.bankService.getPendingTransactions(userId);
      
      if (transactions.length === 0) {
        await ctx.reply(await t('NO_PENDING_TRANSACTIONS'), {
          reply_markup: {
            inline_keyboard: [
              [{ text: await t('BACK'), callback_data: 'bank_menu' }]
            ]
          }
        });
        return;
      }

      let message = `⏳ **${await t('PENDING_TRANSACTIONS')}**\n\n`;
      
      transactions.forEach((tx, index) => {
        message += `${index + 1}. ${tx.type === 'credit' ? '💵' : '💸'} `;
        message += `**${tx.amount.toLocaleString('vi-VN')}đ**\n`;
        message += `   🏦 ${tx.bankName}\n`;
        message += `   📝 ${tx.description}\n`;
        message += `   📅 ${new Date(tx.date).toLocaleString('vi-VN')}\n`;
        if (tx.aiCategory) {
          message += `   🤖 ${tx.aiCategory} (${(tx.aiConfidence * 100).toFixed(0)}%)\n`;
        }
        message += `   ➡️ /approve_${tx.id} or /reject_${tx.id}\n\n`;
      });

      await ctx.reply(message, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: await t('APPROVE_ALL'), callback_data: 'bank_approve_all' },
              { text: await t('REJECT_ALL'), callback_data: 'bank_reject_all' }
            ],
            [{ text: await t('BACK'), callback_data: 'bank_menu' }]
          ]
        },
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('❌ Error showing pending transactions:', error);
      await ctx.reply(await t('ERROR_GETTING_PENDING'), {
        reply_markup: {
          inline_keyboard: [
            [{ text: await t('BACK'), callback_data: 'bank_menu' }]
          ]
        }
      });
    }
  }

  // Force check emails
  async forceCheckEmails(ctx) {
    const userId = String(ctx.from.id);
    const lang = await languageService.getUserLanguage(userId);
    const t = async (key) => await languageService.getTranslation(lang, key);

    await ctx.reply(await t('CHECKING_EMAILS'));

    try {
      const hasNewEmails = await this.bankService.forceCheckEmails();
      
      if (hasNewEmails) {
        await ctx.reply(await t('NEW_EMAILS_FOUND'), {
          reply_markup: {
            inline_keyboard: [
              [
                { text: await t('VIEW_PENDING'), callback_data: 'bank_pending' },
                { text: await t('VIEW_TRANSACTIONS'), callback_data: 'bank_transactions' }
              ],
              [{ text: await t('BACK'), callback_data: 'bank_menu' }]
            ]
          }
        });
      } else {
        await ctx.reply(await t('NO_NEW_EMAILS'), {
          reply_markup: {
            inline_keyboard: [
              [{ text: await t('BACK'), callback_data: 'bank_menu' }]
            ]
          }
        });
      }
    } catch (error) {
      console.error('❌ Error force checking emails:', error);
      await ctx.reply(await t('ERROR_CHECKING_EMAILS'), {
        reply_markup: {
          inline_keyboard: [
            [{ text: await t('BACK'), callback_data: 'bank_menu' }]
          ]
        }
      });
    }
  }

  // Show monitoring status
  async showMonitoringStatus(ctx) {
    const userId = String(ctx.from.id);
    const lang = await languageService.getUserLanguage(userId);
    const t = async (key) => await languageService.getTranslation(lang, key);

    try {
      const status = await this.bankService.getMonitoringStatus();
      
      if (!status) {
        await ctx.reply(await t('NO_STATUS_AVAILABLE'), {
          reply_markup: {
            inline_keyboard: [
              [{ text: await t('BACK'), callback_data: 'bank_menu' }]
            ]
          }
        });
        return;
      }

      let message = `📡 **${await t('MONITORING_STATUS')}**\n\n`;
      message += `• ${await t('STATUS')}: ${status.isRunning ? '✅ Running' : '❌ Stopped'}\n`;
      message += `• ${await t('UPTIME')}: ${Math.floor(status.uptime / 60)} minutes\n`;
      message += `• ${await t('EMAILS_PROCESSED')}: ${status.totalEmailsProcessed}\n`;
      message += `• ${await t('AVG_PROCESSING_TIME')}: ${status.averageProcessingTime.toFixed(2)}ms\n`;
      message += `• ${await t('CURRENT_INTERVAL')}: ${status.currentInterval}ms\n`;
      
      if (status.lastEmailTime) {
        message += `• ${await t('LAST_EMAIL')}: ${new Date(status.lastEmailTime).toLocaleString('vi-VN')}\n`;
      }

      if (status.emailStats) {
        message += `\n📊 **${await t('EMAIL_STATS')}:**\n`;
        message += `• ${await t('TOTAL_EMAILS')}: ${status.emailStats.total}\n`;
        message += `• ${await t('PROCESSED_EMAILS')}: ${status.emailStats.processed}\n`;
        message += `• ${await t('AI_PROCESSED')}: ${status.emailStats.aiProcessed}\n`;
        message += `• ${await t('PENDING_EMAILS')}: ${status.emailStats.pending}\n`;
      }

      await ctx.reply(message, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: status.isRunning ? await t('STOP_MONITORING') : await t('START_MONITORING'), 
                callback_data: status.isRunning ? 'bank_stop' : 'bank_start' }
            ],
            [
              { text: await t('CHECK_NOW'), callback_data: 'bank_force_check' },
              { text: await t('VIEW_PENDING'), callback_data: 'bank_pending' }
            ],
            [{ text: await t('BACK'), callback_data: 'bank_menu' }]
          ]
        },
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('❌ Error showing monitoring status:', error);
      await ctx.reply(await t('ERROR_GETTING_STATUS'), {
        reply_markup: {
          inline_keyboard: [
            [{ text: await t('BACK'), callback_data: 'bank_menu' }]
          ]
        }
      });
    }
  }
}

module.exports = new BankMessageHandler();
