require('dotenv').config();
const { Telegraf } = require('telegraf');
const unifiedMessageHandler = require('./handlers/unifiedMessageHandler');
const bankService = require('./services/bankService');
const expenseService = require('./services/expenseService');
const financeService = require('./services/financeService');
const incomeAnalysisService = require('./services/incomeAnalysisService');
const { handleJarCallbacks } = require('./handlers/callbackHandler');
const jarService = require('./services/jarService');


const bot = new Telegraf(process.env.BOT_TOKEN);

// Error handling
bot.catch((err, ctx) => {
  console.error('❌ Bot error:', err);
  if (ctx) {
    ctx.reply('❌ Đã xảy ra lỗi, vui lòng thử lại!');
  }
});

// Import finance handler
const { handleFinanceCommands } = require('./handlers/financeHandler');

// Message handlers - Unified handler for smart processing
bot.on('text', unifiedMessageHandler);

// Start command with main menu
bot.start(async (ctx) => {
  const userId = String(ctx.from.id);
  const languageService = require('./services/languageService');
  const lang = await languageService.getUserLanguage(userId);
  const t = async (key) => await languageService.getTranslation(lang, key);
  
  const mainMenuKeyboard = {
    inline_keyboard: [
      [
        { text: await t('STATS_MENU'), callback_data: 'stats_menu' },
        { text: await t('INCOME_STATS'), callback_data: 'income_stats' }
      ],
      [
        { text: await t('BALANCE'), callback_data: 'balance' },
        { text: await t('JARS'), callback_data: 'jars' }
      ],
      [
        { text: await t('HISTORY'), callback_data: 'history' },
        { text: await t('BANK_SETUP'), callback_data: 'bank_setup' }
      ],
      [
        { text: await t('HELP'), callback_data: 'help' }
      ]
    ]
  };

  ctx.reply(`${await t('WELCOME_MESSAGE')}

${await t('WELCOME_DESCRIPTION')}

${await t('SELECT_FUNCTION')}`,
    {
      reply_markup: mainMenuKeyboard,
      parse_mode: 'Markdown'
    }
  );
});

// Handle callback queries from inline keyboard
bot.on('callback_query', async (ctx) => {
  const callbackData = ctx.callbackQuery.data;
  const userId = String(ctx.from.id);
  const languageService = require('./services/languageService');
  
  // Answer callback query to remove loading state
  await ctx.answerCbQuery();
  
  try {
    // Xử lý callback hũ tiền trước
    const jarCallbackHandled = await handleJarCallbacks(ctx);
    if (jarCallbackHandled) {
      return; // Đã xử lý callback hũ tiền
    }
    

    
    switch (callbackData) {

        
      case 'stats_menu':
        const statsLang = await languageService.getUserLanguage(userId);
        const statsT = async (key) => await languageService.getTranslation(statsLang, key);
        
        await ctx.editMessageText(`📊 **${await statsT('STATS_TITLE')}**

📅 **${await statsT('SELECT_TIME')}:**`, 
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: `📅 ${await statsT('TODAY')}`, callback_data: 'stats_today' },
                  { text: `📅 ${await statsT('THIS_WEEK')}`, callback_data: 'stats_week' }
                ],
                [
                  { text: `📅 ${await statsT('THIS_MONTH')}`, callback_data: 'stats_month' },
                  { text: `📅 ${await statsT('THIS_YEAR')}`, callback_data: 'stats_year' }
                ],
                [
                  { text: `🎯 ${await statsT('CUSTOM')}`, callback_data: 'stats_custom' },
                  { text: await statsT('BACK'), callback_data: 'main_menu' }
                ]
              ]
            },
            parse_mode: 'Markdown'
          }
        );
        break;
        
      case 'stats_today':
      case 'stats_week':
      case 'stats_month':
      case 'stats_year':
        const period = callbackData.replace('stats_', '');
        const stats = await financeService.getExpenseStats(userId, period);
        
        let message = `📊 **Thống kê ${getPeriodText(period)}**\n`;
        message += `📅 **${getCurrentDateText(period)}**\n\n`;
        message += `💰 **Tổng:** ${stats.totalAmount.toLocaleString('vi-VN')}đ\n`;
        message += `📝 **Giao dịch:** ${stats.totalTransactions}\n\n`;
        
        if (stats.categories && stats.categories.length > 0) {
          message += `📂 **Danh mục:**\n`;
          stats.categories.forEach(cat => {
            const percentage = ((cat.amount / stats.totalAmount) * 100).toFixed(1);
            message += `• ${cat.category}: ${cat.amount.toLocaleString('vi-VN')}đ (${percentage}%)\n`;
          });
        }
        
        // Tạo buttons cho từng danh mục
        const categoryButtons = [];
        if (stats.categories && stats.categories.length > 0) {
          const categoryRow = [];
          stats.categories.slice(0, 3).forEach(cat => {
            categoryRow.push({ 
              text: `📂 ${cat.category}`, 
              callback_data: `stats_category_${period}_${cat.category}` 
            });
          });
          categoryButtons.push(categoryRow);
        }
        
        await ctx.editMessageText(message, {
          reply_markup: {
            inline_keyboard: [
              ...categoryButtons,
              [
                { text: '📅 Tùy chỉnh', callback_data: 'stats_custom' },
                { text: '🔙 Thống kê', callback_data: 'stats_menu' }
              ],
              [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
            ]
          },
          parse_mode: 'Markdown'
        });
        break;
        
      case (callbackData.match(/^stats_category_/) ? callbackData : null):
        const categoryMatch = callbackData.match(/^stats_category_(.+)_(.+)$/);
        if (categoryMatch) {
          const [, period, category] = categoryMatch;
          const categoryStats = await financeService.getExpenseStatsByCategory(userId, period, category);
          
          let categoryMessage = `📂 **Thống kê ${category}**\n`;
          categoryMessage += `📅 **${getCurrentDateText(period)}**\n\n`;
          categoryMessage += `💰 **Tổng:** ${categoryStats.totalAmount.toLocaleString('vi-VN')}đ\n`;
          categoryMessage += `📝 **Giao dịch:** ${categoryStats.totalTransactions}\n\n`;
          
          if (categoryStats.transactions && categoryStats.transactions.length > 0) {
            categoryMessage += `📋 **Chi tiết giao dịch:**\n`;
            categoryStats.transactions.slice(0, 5).forEach((transaction, index) => {
              const date = new Date(transaction.date).toLocaleDateString('vi-VN');
              categoryMessage += `${index + 1}. ${transaction.amount.toLocaleString('vi-VN')}đ\n`;
              categoryMessage += `   📅 ${date}\n`;
              if (transaction.description) {
                categoryMessage += `   📝 ${transaction.description}\n`;
              }
              categoryMessage += `\n`;
            });
          }
          
          await ctx.editMessageText(categoryMessage, {
            reply_markup: {
              inline_keyboard: [
                [{ text: `🔙 Thống kê ${getPeriodText(period)}`, callback_data: `stats_${period}` }],
                [{ text: '🔙 Thống kê', callback_data: 'stats_menu' }],
                [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
              ]
            },
            parse_mode: 'Markdown'
          });
        }
        break;
        
      case (callbackData.match(/^stats_category_custom_/) ? callbackData : null):
        const customCategoryMatch = callbackData.match(/^stats_category_custom_(.+)$/);
        if (customCategoryMatch) {
          const [, category] = customCategoryMatch;
          // Lấy thống kê từ unifiedMessageHandler đã xử lý
          const customStats = await financeService.getExpenseStatsByCategory(userId, 'custom', category);
          
          let categoryMessage = `📂 **Thống kê ${category}**\n`;
          categoryMessage += `📅 **Thời gian tùy chỉnh**\n\n`;
          categoryMessage += `💰 **Tổng:** ${customStats.totalAmount.toLocaleString('vi-VN')}đ\n`;
          categoryMessage += `📝 **Giao dịch:** ${customStats.totalTransactions}\n\n`;
          
          if (customStats.transactions && customStats.transactions.length > 0) {
            categoryMessage += `📋 **Chi tiết giao dịch:**\n`;
            customStats.transactions.slice(0, 5).forEach((transaction, index) => {
              const date = new Date(transaction.createdAt).toLocaleDateString('vi-VN');
              categoryMessage += `${index + 1}. ${transaction.amount.toLocaleString('vi-VN')}đ\n`;
              categoryMessage += `   📅 ${date}\n`;
              if (transaction.note) {
                categoryMessage += `   📝 ${transaction.note}\n`;
              }
              categoryMessage += `\n`;
            });
          }
          
          await ctx.editMessageText(categoryMessage, {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Thống kê tùy chỉnh', callback_data: 'stats_custom' }],
                [{ text: '🔙 Thống kê', callback_data: 'stats_menu' }],
                [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
              ]
            },
            parse_mode: 'Markdown'
          });
        }
        break;
        
      case 'stats_custom':
        await ctx.editMessageText(`🎯 **Thống kê Tùy chỉnh**

💡 **Gửi tin nhắn:**
• \`thống kê 15/12/2024\` (ngày)
• \`thống kê 12/2024\` (tháng)
• \`thống kê 2024\` (năm)
• \`thống kê từ 01/12/2024 đến 31/12/2024\` (khoảng)

📱 **Gửi tin nhắn ngay!**`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Thống kê', callback_data: 'stats_menu' }],
              [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
            ]
          },
          parse_mode: 'Markdown'
        });
        break;
        
      case 'main_menu':
        const lang = await languageService.getUserLanguage(userId);
        const t = async (key) => await languageService.getTranslation(lang, key);
        
        await ctx.editMessageText(`${await t('WELCOME_MESSAGE')}

${await t('WELCOME_DESCRIPTION')}

${await t('SELECT_FUNCTION')}`, 
          { 
            reply_markup: {
              inline_keyboard: [
                [
                  { text: await t('STATS_MENU'), callback_data: 'stats_menu' },
                  { text: await t('INCOME_STATS'), callback_data: 'income_stats' }
                ],
                [
                  { text: await t('BALANCE'), callback_data: 'balance' },
                  { text: await t('JARS'), callback_data: 'jars' }
                ],
                [
                  { text: await t('HISTORY'), callback_data: 'history' },
                  { text: await t('BANK_SETUP'), callback_data: 'bank_setup' }
                ],
                [
                  { text: await t('HELP'), callback_data: 'help' }
                ]
              ]
            },
            parse_mode: 'Markdown'
          }
        );
        break;
        
      // AI Confirmation handlers
      case (callbackData.match(/^confirm_income_/) ? callbackData : null):
        try {
          const amount = parseInt(callbackData.replace('confirm_income_', ''));
          const result = await incomeAnalysisService.processIncomeInput(userId, `Thu nhập ${amount}`);
          
          await ctx.editMessageText(`✅ **Đã xác nhận thu nhập!**

${result.message}

🤖 **AI đã tự động phân loại và lưu giao dịch.**`, {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📊 Phân tích thu nhập', callback_data: 'income_analysis' },
                  { text: '📋 Lịch sử thu nhập', callback_data: 'income_history' }
                ],
                [
                  { text: '🎯 Mục tiêu thu nhập', callback_data: 'income_goals' },
                  { text: '🏠 Menu chính', callback_data: 'main_menu' }
                ]
              ]
            },
            parse_mode: 'Markdown'
          });
        } catch (error) {
          console.error('Error confirming income:', error);
          await ctx.editMessageText('❌ Lỗi khi xác nhận thu nhập. Vui lòng thử lại!', {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
              ]
            }
          });
        }
        break;
        
      case (callbackData.match(/^confirm_expense_/) ? callbackData : null):
        try {
          const amount = parseInt(callbackData.replace('confirm_expense_', ''));
          await expenseService.addExpense(userId, {
            amount: amount,
            category: 'Khác',
            note: 'Xác nhận từ AI'
          });
          
          await ctx.editMessageText(`✅ **Đã xác nhận chi tiêu!**

💸 **Số tiền:** ${amount.toLocaleString('vi-VN')}đ
📂 **Danh mục:** Khác
📅 **Thời gian:** ${new Date().toLocaleString('vi-VN')}

🤖 **AI đã tự động lưu giao dịch.**`, {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📊 Xem thống kê', callback_data: 'stats_today' },
                  { text: '📋 Lịch sử', callback_data: 'history' }
                ],
                [
                  { text: '🏠 Menu chính', callback_data: 'main_menu' }
                ]
              ]
            },
            parse_mode: 'Markdown'
          });
        } catch (error) {
          console.error('Error confirming expense:', error);
          await ctx.editMessageText('❌ Lỗi khi xác nhận chi tiêu. Vui lòng thử lại!', {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
              ]
            }
          });
        }
        break;
        
      case 'income_stats':
        await ctx.editMessageText(`💰 **Phân tích Thu nhập**

📊 **Chọn loại phân tích:**`, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📈 Phân tích hiệu suất', callback_data: 'income_analysis' },
                { text: '📋 Lịch sử thu nhập', callback_data: 'income_history' }
              ],
              [
                { text: '🎯 Mục tiêu thu nhập', callback_data: 'income_goals' },
                { text: '🤖 AI phân loại', callback_data: 'income_ai' }
              ],
              [
                { text: '📅 Thống kê theo thời gian', callback_data: 'income_stats_time' },
                { text: '🔙 Menu chính', callback_data: 'main_menu' }
              ]
            ]
          },
          parse_mode: 'Markdown'
        });
        break;
        
      case 'income_analysis':
        try {
          const analysis = await incomeAnalysisService.analyzeIncomePerformance(userId, 'monthly');
          
          let message = `📈 **Phân tích Thu nhập Tháng này**\n\n`;
          message += `💰 **Tổng thu nhập:** ${analysis.totalIncome.toLocaleString('vi-VN')}đ\n`;
          message += `📝 **Số giao dịch:** ${analysis.transactionCount}\n`;
          
          if (analysis.growthRate !== null) {
            const growthEmoji = analysis.growthRate > 0 ? '🚀' : analysis.growthRate < 0 ? '⚠️' : '📊';
            message += `${growthEmoji} **Tăng trưởng:** ${analysis.growthRate.toFixed(1)}% so với tháng trước\n\n`;
          }
          
          // Phân tích theo nguồn
          const sources = Object.entries(analysis.sourceBreakdown);
          if (sources.length > 0) {
            message += `📂 **Phân bổ theo nguồn:**\n`;
            sources.forEach(([source, data]) => {
              const percentage = ((data.amount / analysis.totalIncome) * 100).toFixed(1);
              message += `• ${incomeAnalysisService.getSourceText(source)}: ${data.amount.toLocaleString('vi-VN')}đ (${percentage}%)\n`;
            });
            message += `\n`;
          }
          
          // Insights
          if (analysis.insights) {
            message += `💡 **Nhận xét:**\n${analysis.insights}\n\n`;
          }
          
          // Recommendations
          if (analysis.recommendations) {
            message += `🎯 **Gợi ý:**\n${analysis.recommendations}`;
          }
          
          await ctx.editMessageText(message, {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📅 Tháng này', callback_data: 'income_analysis_monthly' },
                  { text: '📅 Quý này', callback_data: 'income_analysis_quarterly' },
                  { text: '📅 Năm này', callback_data: 'income_analysis_yearly' }
                ],
                [
                  { text: '📊 Phân tích khác', callback_data: 'income_stats' },
                  { text: '🔙 Menu chính', callback_data: 'main_menu' }
                ]
              ]
            },
            parse_mode: 'Markdown'
          });
        } catch (error) {
          console.error('Error in income analysis:', error);
          await ctx.editMessageText('❌ Lỗi khi phân tích thu nhập. Vui lòng thử lại!', {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Thu nhập', callback_data: 'income_stats' }],
                [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
              ]
            }
          });
        }
        break;
        
      case 'income_analysis_monthly':
      case 'income_analysis_quarterly':
      case 'income_analysis_yearly':
        try {
          const period = callbackData.replace('income_analysis_', '');
          const analysis = await incomeAnalysisService.analyzeIncomePerformance(userId, period);
          
          let message = `📈 **Phân tích Thu nhập ${getPeriodText(period)}**\n\n`;
          message += `💰 **Tổng thu nhập:** ${analysis.totalIncome.toLocaleString('vi-VN')}đ\n`;
          message += `📝 **Số giao dịch:** ${analysis.transactionCount}\n`;
          
          if (analysis.growthRate !== null) {
            const growthEmoji = analysis.growthRate > 0 ? '🚀' : analysis.growthRate < 0 ? '⚠️' : '📊';
            message += `${growthEmoji} **Tăng trưởng:** ${analysis.growthRate.toFixed(1)}% so với ${getPeriodText(period)} trước\n\n`;
          }
          
          // Phân tích theo nguồn
          const sources = Object.entries(analysis.sourceBreakdown);
          if (sources.length > 0) {
            message += `📂 **Phân bổ theo nguồn:**\n`;
            sources.forEach(([source, data]) => {
              const percentage = ((data.amount / analysis.totalIncome) * 100).toFixed(1);
              message += `• ${incomeAnalysisService.getSourceText(source)}: ${data.amount.toLocaleString('vi-VN')}đ (${percentage}%)\n`;
            });
            message += `\n`;
          }
          
          // Insights và recommendations
          if (analysis.insights) {
            message += `💡 **Nhận xét:**\n${analysis.insights}\n\n`;
          }
          
          if (analysis.recommendations) {
            message += `🎯 **Gợi ý:**\n${analysis.recommendations}`;
          }
          
          await ctx.editMessageText(message, {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📅 Tháng này', callback_data: 'income_analysis_monthly' },
                  { text: '📅 Quý này', callback_data: 'income_analysis_quarterly' },
                  { text: '📅 Năm này', callback_data: 'income_analysis_yearly' }
                ],
                [
                  { text: '📊 Phân tích khác', callback_data: 'income_stats' },
                  { text: '🔙 Menu chính', callback_data: 'main_menu' }
                ]
              ]
            },
            parse_mode: 'Markdown'
          });
        } catch (error) {
          console.error('Error in income analysis:', error);
          await ctx.editMessageText('❌ Lỗi khi phân tích thu nhập. Vui lòng thử lại!', {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Thu nhập', callback_data: 'income_stats' }],
                [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
              ]
            }
          });
        }
        break;
        
      case 'income_history':
        try {
          const { PrismaClient } = require('@prisma/client');
          const prisma = new PrismaClient();
          
          const incomes = await prisma.income.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10
          });
          
          let message = `📋 **Lịch sử Thu nhập (10 gần nhất)**\n\n`;
          
          if (incomes.length === 0) {
            message += `📝 **Chưa có thu nhập nào!**\n\n`;
            message += `💡 **Cách thêm thu nhập:**\n`;
            message += `• Nhập: \`"Lương tháng 7 15000000"\`\n`;
            message += `• Nhập: \`"Thưởng dự án 5000000"\`\n`;
            message += `• Nhập: \`"Freelance website 3000000"\``;
          } else {
            incomes.forEach((income, index) => {
              message += `${index + 1}. 💰 **${income.amount.toLocaleString('vi-VN')}đ**\n`;
              message += `   📂 ${incomeAnalysisService.getSourceText(income.source)}\n`;
              message += `   📅 ${formatDate(income.createdAt)}\n`;
              if (income.description) {
                message += `   📝 ${income.description}\n`;
              }
                             // TODO: Uncomment after migration
               // if (income.aiCategory && income.aiConfidence) {
               //   message += `   🤖 AI: ${incomeAnalysisService.getSourceText(income.aiCategory)} (${(income.aiConfidence * 100).toFixed(0)}%)\n`;
               // }
              message += `\n`;
            });
          }
          
          await ctx.editMessageText(message, {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📊 Phân tích thu nhập', callback_data: 'income_analysis' },
                  { text: '🎯 Mục tiêu thu nhập', callback_data: 'income_goals' }
                ],
                [
                  { text: '🔙 Thu nhập', callback_data: 'income_stats' },
                  { text: '🏠 Menu chính', callback_data: 'main_menu' }
                ]
              ]
            },
            parse_mode: 'Markdown'
          });
        } catch (error) {
          console.error('Error getting income history:', error);
          await ctx.editMessageText('❌ Lỗi khi lấy lịch sử thu nhập. Vui lòng thử lại!', {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Thu nhập', callback_data: 'income_stats' }],
                [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
              ]
            }
          });
        }
        break;
        
      case 'income_goals':
        try {
          const goals = await incomeAnalysisService.getIncomeGoals(userId);
          
          let message = `🎯 **Mục tiêu Thu nhập**\n\n`;
          
          if (goals.length === 0) {
            message += `📝 **Chưa có mục tiêu nào!**\n\n`;
            message += `💡 **Cách tạo mục tiêu:**\n`;
            message += `• Nhập: \`"Mục tiêu lương 50 triệu năm 2024"\`\n`;
            message += `• Nhập: \`"Mục tiêu freelance 10 triệu tháng"\`\n`;
            message += `• Nhập: \`"Mục tiêu đầu tư 20 triệu quý"\``;
          } else {
            for (const goal of goals) {
              const updatedGoal = await incomeAnalysisService.updateGoalProgress(userId, goal.id);
              
              message += `🎯 **${goal.name}**\n`;
              message += `💰 **Mục tiêu:** ${goal.targetAmount.toLocaleString('vi-VN')}đ\n`;
              message += `📊 **Hiện tại:** ${updatedGoal.currentAmount.toLocaleString('vi-VN')}đ\n`;
              message += `📈 **Tiến độ:** ${updatedGoal.progress.toFixed(1)}%\n`;
              message += `⏰ **Thời gian:** ${getPeriodText(goal.period)}\n`;
              message += `📅 **Từ:** ${formatDate(goal.startDate)}\n`;
              if (goal.endDate) {
                message += `📅 **Đến:** ${formatDate(goal.endDate)}\n`;
              }
              message += `\n`;
            }
          }
          
          await ctx.editMessageText(message, {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📊 Phân tích thu nhập', callback_data: 'income_analysis' },
                  { text: '📋 Lịch sử thu nhập', callback_data: 'income_history' }
                ],
                [
                  { text: '🔙 Thu nhập', callback_data: 'income_stats' },
                  { text: '🏠 Menu chính', callback_data: 'main_menu' }
                ]
              ]
            },
            parse_mode: 'Markdown'
          });
        } catch (error) {
          console.error('Error getting income goals:', error);
          await ctx.editMessageText('❌ Lỗi khi lấy mục tiêu thu nhập. Vui lòng thử lại!', {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Thu nhập', callback_data: 'income_stats' }],
                [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
              ]
            }
          });
        }
        break;
        
      case 'income_ai':
        try {
          const { PrismaClient } = require('@prisma/client');
          const prisma = new PrismaClient();
          
          const mappings = await prisma.aICategoryMapping.findMany({
            where: { userId },
            orderBy: { usageCount: 'desc' },
            take: 10
          });
          
          let message = `🤖 **AI Phân loại Thu nhập**\n\n`;
          
          if (mappings.length === 0) {
            message += `📝 **Chưa có dữ liệu AI!**\n\n`;
            message += `💡 **Cách sử dụng:**\n`;
            message += `• Thêm thu nhập: \`"Lương tháng 7 15000000"\`\n`;
            message += `• AI sẽ tự động phân loại và học từ mô tả\n`;
            message += `• Càng nhiều dữ liệu, AI càng chính xác`;
          } else {
            message += `📊 **Top 10 từ khóa được sử dụng:**\n\n`;
            mappings.forEach((mapping, index) => {
              message += `${index + 1}. **${mapping.keyword}**\n`;
              message += `   📂 → ${incomeAnalysisService.getSourceText(mapping.category)}\n`;
              message += `   📊 Sử dụng: ${mapping.usageCount} lần\n`;
              message += `   🎯 Độ tin cậy: ${(mapping.confidence * 100).toFixed(0)}%\n\n`;
            });
          }
          
          await ctx.editMessageText(message, {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📊 Phân tích thu nhập', callback_data: 'income_analysis' },
                  { text: '📋 Lịch sử thu nhập', callback_data: 'income_history' }
                ],
                [
                  { text: '🔙 Thu nhập', callback_data: 'income_stats' },
                  { text: '🏠 Menu chính', callback_data: 'main_menu' }
                ]
              ]
            },
            parse_mode: 'Markdown'
          });
        } catch (error) {
          console.error('Error getting AI mappings:', error);
          await ctx.editMessageText('❌ Lỗi khi lấy dữ liệu AI. Vui lòng thử lại!', {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Thu nhập', callback_data: 'income_stats' }],
                [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
              ]
            }
          });
        }
        break;
        
      case 'income_stats_time':
        await ctx.editMessageText(`📅 **Thống kê Thu nhập theo Thời gian**

📊 **Chọn thời gian:**`, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📅 Hôm nay', callback_data: 'income_stats_today' },
                { text: '📅 Tuần này', callback_data: 'income_stats_week' }
              ],
              [
                { text: '📅 Tháng này', callback_data: 'income_stats_month' },
                { text: '📅 Năm này', callback_data: 'income_stats_year' }
              ],
              [
                { text: '🔙 Thu nhập', callback_data: 'income_stats' },
                { text: '🏠 Menu chính', callback_data: 'main_menu' }
              ]
            ]
          },
          parse_mode: 'Markdown'
        });
        break;
        
      case 'income_stats_today':
      case 'income_stats_week':
      case 'income_stats_month':
      case 'income_stats_year':
        try {
          const period = callbackData.replace('income_stats_', '');
          const analysis = await incomeAnalysisService.analyzeIncomePerformance(userId, period);
          
          let message = `💰 **Thu nhập ${getPeriodText(period)}**\n`;
          message += `📅 **${getCurrentDateText(period)}**\n\n`;
          message += `💵 **Tổng:** ${analysis.totalIncome.toLocaleString('vi-VN')}đ\n`;
          message += `📝 **Giao dịch:** ${analysis.transactionCount}\n\n`;
          
          // Phân tích theo nguồn
          const sources = Object.entries(analysis.sourceBreakdown);
          if (sources.length > 0) {
            message += `📂 **Phân bổ theo nguồn:**\n`;
            sources.forEach(([source, data]) => {
              const percentage = ((data.amount / analysis.totalIncome) * 100).toFixed(1);
              message += `• ${incomeAnalysisService.getSourceText(source)}: ${data.amount.toLocaleString('vi-VN')}đ (${percentage}%)\n`;
            });
          }
          
          await ctx.editMessageText(message, {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📊 Phân tích chi tiết', callback_data: 'income_analysis' },
                  { text: '📋 Lịch sử thu nhập', callback_data: 'income_history' }
                ],
                [
                  { text: '🔙 Thống kê thời gian', callback_data: 'income_stats_time' },
                  { text: '🔙 Thu nhập', callback_data: 'income_stats' }
                ],
                [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
              ]
            },
            parse_mode: 'Markdown'
          });
        } catch (error) {
          console.error('Error getting income stats:', error);
          await ctx.editMessageText('❌ Lỗi khi lấy thống kê thu nhập. Vui lòng thử lại!', {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Thu nhập', callback_data: 'income_stats' }],
                [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
              ]
            }
          });
        }
        break;
        
      case 'balance':
        const balance = await financeService.getUserBalance(userId);
        let balanceMessage = `💳 **Tài chính**\n\n`;
        balanceMessage += `💵 **Thu nhập:** ${balance.totalIncome.toLocaleString('vi-VN')}đ\n`;
        balanceMessage += `💸 **Chi tiêu:** ${balance.totalExpense.toLocaleString('vi-VN')}đ\n`;
        balanceMessage += `💰 **Số dư:** ${balance.totalBalance.toLocaleString('vi-VN')}đ`;
        
        await ctx.editMessageText(balanceMessage, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🏺 Hũ tiền', callback_data: 'jars' }],
              [{ text: '🔙 Menu chính', callback_data: 'main_menu' }]
            ]
          },
          parse_mode: 'Markdown'
        });
        break;
        
      case 'jars':
        // Chuyển đến callbackHandler để xử lý
        const jarCallbackHandled = await handleJarCallbacks(ctx);
        if (!jarCallbackHandled) {
          // Nếu không xử lý được, hiển thị báo cáo mặc định
          try {
            const report = await jarService.generateJarReport(userId);
            const keyboard = [
              [
                { text: '➕ Tạo hũ mới', callback_data: 'jar_create' },
                { text: '🗑️ Xóa hũ', callback_data: 'jar_delete' }
              ],
              [
                { text: '✏️ Cập nhật hũ', callback_data: 'jar_update' },
                { text: '📊 Báo cáo hũ', callback_data: 'jar_report' }
              ],
              [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
            ];
            
            await ctx.editMessageText(report, {
              reply_markup: { inline_keyboard: keyboard },
              parse_mode: 'Markdown'
            });
          } catch (error) {
            console.error('Error generating jar report:', error);
            await ctx.editMessageText('❌ **Lỗi khi tạo báo cáo hũ tiền**', {
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
                ]
              },
              parse_mode: 'Markdown'
            });
          }
        }
        break;
        
      case 'goals':
        try {
          const goalService = require('./services/goalService');
          const result = await goalService.generateGoalReport(userId);
          
          const keyboard = [
            [
              { text: '📊 Cập nhật tiến độ', callback_data: 'goal_update_progress' },
              { text: '➕ Tạo mục tiêu mới', callback_data: 'goal_create_new' }
            ],
            [
              { text: '🚨 Cảnh báo', callback_data: 'goal_warnings' },
              { text: '📋 Xem chi tiết', callback_data: 'goal_details' }
            ],
            [
              { text: '🎯 Tạo từ mẫu', callback_data: 'goal_template' },
              { text: '🏠 Menu chính', callback_data: 'main_menu' }
            ]
          ];
          
          await ctx.editMessageText(result.message, {
            reply_markup: { inline_keyboard: keyboard },
            parse_mode: 'Markdown'
          });
        } catch (error) {
          console.error('Error generating goal report:', error);
          await ctx.editMessageText('❌ **Lỗi khi tạo báo cáo mục tiêu. Vui lòng thử lại!**', {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
              ]
            },
            parse_mode: 'Markdown'
          });
        }
        break;
        
      case 'goal_template':
        try {
          const goalHandler = require('./handlers/goalHandler');
          await goalHandler.handleCreateGoalsFromTemplate(ctx.message, ctx.telegram);
        } catch (error) {
          console.error('Error creating goals from template:', error);
          await ctx.editMessageText('❌ **Lỗi khi tạo mục tiêu từ mẫu. Vui lòng thử lại!**', {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
              ]
            },
            parse_mode: 'Markdown'
          });
        }
        break;
        
      case 'goal_warnings':
        try {
          const goalHandler = require('./handlers/goalHandler');
          await goalHandler.handleGoalWarnings(ctx.message, ctx.telegram);
        } catch (error) {
          console.error('Error checking goal warnings:', error);
          await ctx.editMessageText('❌ **Lỗi khi kiểm tra cảnh báo mục tiêu. Vui lòng thử lại!**', {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
              ]
            },
            parse_mode: 'Markdown'
          });
        }
        break;
        
      case 'goal_integrated_report':
        try {
          const goalService = require('./services/goalService');
          const result = await goalService.generateIntegratedGoalReport(userId);
          
          const keyboard = [
            [
              { text: '🚨 Cảnh báo tích hợp', callback_data: 'goal_integrated_warnings' },
              { text: '📊 Cập nhật tiến độ', callback_data: 'goal_update_progress' }
            ],
            [
              { text: '➕ Tạo mục tiêu mới', callback_data: 'goal_create_new' },
              { text: '📋 Xem chi tiết', callback_data: 'goal_details' }
            ],
            [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
          ];
          
          await ctx.editMessageText(result.message, {
            reply_markup: { inline_keyboard: keyboard },
            parse_mode: 'Markdown'
          });
        } catch (error) {
          console.error('Error generating integrated goal report:', error);
          await ctx.editMessageText('❌ **Lỗi khi tạo báo cáo tích hợp. Vui lòng thử lại!**', {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
              ]
            },
            parse_mode: 'Markdown'
          });
        }
        break;
        
      case 'history':
        const history = await financeService.getTransactionHistory(userId, 5);
        let historyMessage = `📋 **Lịch sử (5 gần nhất)**\n\n`;
        
        if (history.length === 0) {
          historyMessage += `📝 **Chưa có giao dịch!**`;
        } else {
          history.forEach((transaction, index) => {
            historyMessage += `${index + 1}. ${getTransactionEmoji(transaction.type)} `;
            historyMessage += `**${transaction.amount.toLocaleString('vi-VN')}đ**\n`;
            historyMessage += `   📂 ${transaction.category || transaction.source || 'N/A'}\n`;
            historyMessage += `   📅 ${formatDate(transaction.date)}\n`;
            if (transaction.description) {
              historyMessage += `   📝 ${transaction.description}\n`;
            }
            historyMessage += `\n`;
          });
        }
        
        await ctx.editMessageText(historyMessage, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Menu chính', callback_data: 'main_menu' }]
            ]
          },
          parse_mode: 'Markdown'
        });
        break;
        
      // Hũ tiền callbacks
      case 'jar_report':
        try {
          const jarService = require('./services/jarService');
          const report = await jarService.generateJarReport(userId);
          
          const keyboard = [
            [
              { text: '⚙️ Quản lý hũ', callback_data: 'jar_manage' },
              { text: '🔄 Cập nhật tỷ lệ', callback_data: 'jar_update_ratios' }
            ],
            [
              { text: '📈 Lịch sử giao dịch', callback_data: 'jar_history' },
              { text: '🔄 Chuyển tiền', callback_data: 'jar_transfer' }
            ],
            [
              { text: '⚠️ Cảnh báo', callback_data: 'jar_warnings' },
              { text: '💡 Tối ưu hóa', callback_data: 'jar_optimize' }
            ],
            [
              { text: '🗑️ Xóa hũ', callback_data: 'jar_delete' },
              { text: '➕ Tạo hũ mới', callback_data: 'jar_create' }
            ],
            [
              { text: '🏠 Menu chính', callback_data: 'main_menu' }
            ]
          ];
          
          await ctx.editMessageText(report, {
            reply_markup: { inline_keyboard: keyboard },
            parse_mode: 'Markdown'
          });
        } catch (error) {
          console.error('Error generating jar report:', error);
          await ctx.editMessageText('❌ **Lỗi khi tạo báo cáo hũ tiền. Vui lòng thử lại!**', {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🏠 Menu chính', callback_data: 'main_menu' }]
              ]
            },
            parse_mode: 'Markdown'
          });
        }
        break;
        

        
      case 'open_app':
        await ctx.editMessageText(`📱 Open App

🔗 Truy cập ứng dụng web của bạn:
${process.env.WEB_APP_URL || 'https://your-expense-app.com'}

💡 Hoặc sử dụng mini app trong Telegram`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🌐 Mở Web App', url: process.env.WEB_APP_URL || 'https://your-expense-app.com' }],
              [{ text: '🔙 Về menu chính', callback_data: 'main_menu' }]
            ]
          }
        });
        break;
        
      case 'bank_setup':
        await require('./handlers/bankMessageHandler').showBankSetup(ctx);
        break;
        
      case 'bank_help':
        await require('./handlers/bankMessageHandler').showBankSetup(ctx);
        break;
        
      case 'bank_start':
        await require('./handlers/bankMessageHandler').testBankConnection(ctx);
        break;
        
      case 'help':
        const helpLang = await languageService.getUserLanguage(userId);
        const helpT = async (key) => await languageService.getTranslation(helpLang, key);
        
        await ctx.editMessageText(`${await helpT('HELP_TITLE')}

${await helpT('HELP_EXPENSE_TITLE')}
${await helpT('HELP_EXPENSE_EXAMPLES')}

${await helpT('HELP_ADVICE_TITLE')}
${await helpT('HELP_ADVICE_EXAMPLES')}

${await helpT('HELP_SHOPPING_TITLE')}
${await helpT('HELP_SHOPPING_EXAMPLES')}

${await helpT('HELP_STATS_TITLE')}
${await helpT('HELP_STATS_COMMANDS')}

${await helpT('HELP_FINANCE_TITLE')}
${await helpT('HELP_FINANCE_COMMANDS')}

${await helpT('HELP_BANK_TITLE')}
${await helpT('HELP_BANK_COMMANDS')}

${await helpT('HELP_LANGUAGE_TITLE')}
${await helpT('HELP_LANGUAGE_COMMANDS')}`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: await helpT('BACK'), callback_data: 'main_menu' }]
            ]
          },
          parse_mode: 'Markdown'
        });
        break;
    }

// Register all finance commands
[
  'stats_today', 'stats_week', 'stats_month', 'stats_year', 'stats_menu', 'stats_custom',
  'add_income', 'income_stats', 'balance', 'setup_jars', 'jars', 'jar_deposit', 'jar_withdraw',
  'history', 'history_income', 'history_expense', 'history_jar',
  'bank_help', 'bank_start', 'bank_transactions',
  'muctieu', 'taomuctieu', 'capnhatmuctieu', 'muctieutemplate',
  'language'
].forEach(command => {
  bot.command(command, async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    await handleFinanceCommands(ctx, `/${command}`, args);
  });
});

// Stats command (legacy compatibility)
bot.command('stats', async (ctx) => {
  try {
    const userId = String(ctx.from.id);
    const stats = await expenseService.getTotalExpensesByUser(userId);
    
    ctx.reply(`📊 Thống kê chi tiêu của bạn:

💰 Tổng chi tiêu: ${stats.total.toLocaleString()}đ
📝 Số giao dịch: ${stats.count}
📅 Tất cả thời gian

🏦 Sử dụng /bank_help để tự động hóa chi tiêu!`);
  } catch (error) {
    ctx.reply('❌ Lỗi khi lấy thống kê.');
  }
});

  } catch (error) {
    console.error('❌ Callback query error:', error);
    await ctx.editMessageText('❌ Đã xảy ra lỗi, vui lòng thử lại!');
  }
});

// Start bank monitoring if email is configured
async function initializeBankService() {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    try {
      console.log('🏦 Initializing bank email monitoring...');
      const bankServiceInstance = new (require('./services/bankService'))();
      await bankServiceInstance.startMonitoring();
      console.log('✅ Bank monitoring started successfully');
    } catch (error) {
      console.error('❌ Failed to initialize bank service:', error.message);
      console.log('💡 Configure email settings in .env to enable bank monitoring');
    }
  } else {
    console.log('📧 Email not configured - bank monitoring disabled');
  }
}

// Launch bot
bot.launch({
  polling: {
    timeout: 10,
    limit: 100
  }
}).then(async () => {
  console.log("🤖 Bot đang hoạt động thành công!");
  
  // Initialize bank service after bot starts
  await initializeBankService();
}).catch((error) => {
  console.error("❌ Lỗi khởi động bot:", error);
  
  if (error.response?.error_code === 404) {
    console.error("🔑 Lỗi 404: Bot token không hợp lệ!");
    console.error("📝 Hãy kiểm tra BOT_TOKEN trong file .env");
    console.error("🔄 Hoặc tạo bot mới với @BotFather");
  }
  
  if (error.response?.error_code === 409) {
    console.error("⚠️ Lỗi 409: Bot đang chạy ở nơi khác hoặc webhook đang active");
    console.error("🔄 Hãy dừng bot khác hoặc xóa webhook");
  }
});

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('🛑 Đang dừng bot...');
  bankService.stopMonitoring();
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('🛑 Đang dừng bot...');
  bankService.stopMonitoring();
  bot.stop('SIGTERM');
});

// Helper functions
function getPeriodText(period) {
  switch (period) {
    case 'today': return 'hôm nay';
    case 'week': return 'tuần này';
    case 'month': return 'tháng này';
    case 'year': return 'năm này';
    default: return period;
  }
}

function getCurrentDateText(period) {
  const now = new Date();
  
  switch (period) {
    case 'today':
      return now.toLocaleDateString('vi-VN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.toLocaleDateString('vi-VN')} - ${weekEnd.toLocaleDateString('vi-VN')}`;
    case 'month':
      return now.toLocaleDateString('vi-VN', { 
        year: 'numeric', 
        month: 'long' 
      });
    case 'year':
      return now.getFullYear().toString();
    default:
      return now.toLocaleDateString('vi-VN');
  }
}

function getPriorityText(priority) {
  switch (priority) {
    case 'high': return '🟢 Cao (Có thể mua)';
    case 'medium': return '🟡 Trung bình (Cân nhắc)';
    case 'low': return '🔴 Thấp (Nên hoãn)';
    default: return priority;
  }
}

function getSourceText(source) {
  const sourceMap = {
    'salary': 'Lương',
    'bonus': 'Thưởng',
    'freelance': 'Freelance',
    'investment': 'Đầu tư',
    'other': 'Khác'
  };
  return sourceMap[source] || source;
}

function getJarEmoji(jarName) {
  const jarEmojiMap = {
    'Necessities': '🏠',
    'Education': '📚',
    'Entertainment': '🎮',
    'Emergency': '🚨',
    'Investment': '📈',
    'Charity': '❤️'
  };
  return jarEmojiMap[jarName] || '🏺';
}

function getTransactionEmoji(type) {
  const typeEmojiMap = {
    'income': '💵',
    'expense': '💸',
    'jar_deposit': '🏺⬆️',
    'jar_withdraw': '🏺⬇️'
  };
  return typeEmojiMap[type] || '💰';
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Traditional command handlers for backward compatibility
bot.help(async (ctx) => {
  const userId = String(ctx.from.id);
  const languageService = require('./services/languageService');
  const lang = await languageService.getUserLanguage(userId);
  const t = async (key) => await languageService.getTranslation(lang, key);
  
  const helpMessage = `${await t('HELP_BOT_TITLE')}

${await t('HELP_EXPENSE_TITLE')}
${await t('HELP_EXPENSE_EXAMPLES')}

${await t('HELP_ADVICE_TITLE')}
${await t('HELP_ADVICE_EXAMPLES')}

${await t('HELP_SHOPPING_TITLE')}
${await t('HELP_SHOPPING_EXAMPLES')}

${await t('HELP_STATS_TITLE')}
${await t('HELP_STATS_COMMANDS')}

${await t('HELP_FINANCE_TITLE')}
${await t('HELP_FINANCE_COMMANDS')}

${await t('HELP_BANK_TITLE')}
${await t('HELP_BANK_COMMANDS')}

${await t('HELP_LANGUAGE_TITLE')}
${await t('HELP_LANGUAGE_COMMANDS')}`;

  return ctx.reply(helpMessage, {
    reply_markup: {
      inline_keyboard: [
        [{ text: await t('BACK'), callback_data: 'main_menu' }]
      ]
    }
  });
});

// Export bot for testing
module.exports = bot;
