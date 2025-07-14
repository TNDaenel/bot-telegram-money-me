const financeService = require('../services/financeService');
const expenseService = require('../services/expenseService');

// Format number with thousand separators
function formatMoney(amount) {
  return amount.toLocaleString('vi-VN') + 'đ';
}

// Format date to Vietnamese
function formatDate(date) {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Handle finance-related commands
async function handleFinanceCommands(ctx, command, args) {
  const userId = String(ctx.from.id);
  
  try {
    switch (command) {
      // ========== STATISTICS ==========
      case '/stats_today':
        return await showExpenseStats(ctx, userId, 'today');
        
      case '/stats_week':
        return await showExpenseStats(ctx, userId, 'week');
        
      case '/stats_month':
        return await showExpenseStats(ctx, userId, 'month');
        
      case '/stats_year':
        return await showExpenseStats(ctx, userId, 'year');
        
      case '/stats_menu':
        return ctx.reply(`📊 Menu Thống kê

📅 Thống kê chi tiêu:
/stats_today - Hôm nay
/stats_week - Tuần này
/stats_month - Tháng này  
/stats_year - Năm này

💰 Quản lý tài chính:
/income_stats - Thống kê thu nhập
/balance - Số dư hiện tại
/jars - Xem các hũ tiền
/history - Lịch sử giao dịch

➕ Thêm dữ liệu:
/add_income - Thêm thu nhập
/setup_jars - Thiết lập hũ tiền`);

      // ========== INCOME MANAGEMENT ==========
      case '/add_income':
        if (!args || args.length < 2) {
          return ctx.reply(`💰 Thêm thu nhập

Cú pháp: /add_income <nguồn> <số_tiền> [mô tả]

Ví dụ:
/add_income salary 15000000 Lương tháng 7
/add_income freelance 3000000 Dự án web
/add_income bonus 5000000

Nguồn thu nhập: salary, bonus, freelance, investment, other`);
        }
        
        return await addIncome(ctx, userId, args);
        
      case '/income_stats':
        return await showIncomeStats(ctx, userId);
        
      // ========== BALANCE & JARS ==========
      case '/balance':
        return await showUserBalance(ctx, userId);
        
      case '/jars':
        return await showUserJars(ctx, userId);
        
      case '/setup_jars':
        return await setupDefaultJars(ctx, userId);
        
      case '/jar_deposit':
        if (!args || args.length < 2) {
          return ctx.reply(`🏺 Nạp tiền vào hũ

Cú pháp: /jar_deposit <jar_id> <số_tiền> [mô tả]

Ví dụ: /jar_deposit 1 500000 Tiết kiệm

Dùng /jars để xem ID các hũ`);
        }
        
        return await depositToJar(ctx, userId, args);
        
      case '/jar_withdraw':
        if (!args || args.length < 2) {
          return ctx.reply(`🏺 Rút tiền từ hũ

Cú pháp: /jar_withdraw <jar_id> <số_tiền> [mô tả]

Ví dụ: /jar_withdraw 1 200000 Mua sách

Dùng /jars để xem ID các hũ`);
        }
        
        return await withdrawFromJar(ctx, userId, args);
        
      // ========== TRANSACTION HISTORY ==========
      case '/history':
        return await showTransactionHistory(ctx, userId, 'all');
        
      case '/history_income':
        return await showTransactionHistory(ctx, userId, 'income');
        
      case '/history_expense':
        return await showTransactionHistory(ctx, userId, 'expense');
        
      case '/history_jar':
        return await showTransactionHistory(ctx, userId, 'jar');
        
      default:
        return false;
    }
  } catch (error) {
    console.error('Finance command error:', error);
    return ctx.reply('❌ Lỗi xử lý lệnh tài chính. Vui lòng thử lại!');
  }
}

// Show expense statistics
async function showExpenseStats(ctx, userId, period) {
  const stats = await financeService.getExpenseStats(userId, period);
  
  let periodText;
  switch (period) {
    case 'today': periodText = 'Hôm nay'; break;
    case 'week': periodText = 'Tuần này'; break;
    case 'month': periodText = 'Tháng này'; break;
    case 'year': periodText = 'Năm này'; break;
    default: periodText = 'Tổng cộng';
  }
  
  let message = `📊 Chi tiêu ${periodText}\n\n`;
  message += `💸 Tổng chi: ${formatMoney(stats.totalAmount)}\n`;
  message += `📝 Số giao dịch: ${stats.totalTransactions}\n\n`;
  
  if (stats.categories.length > 0) {
    message += `📋 Theo danh mục:\n`;
    stats.categories
      .sort((a, b) => b.amount - a.amount)
      .forEach(cat => {
        const percentage = stats.totalAmount > 0 ? 
          ((cat.amount / stats.totalAmount) * 100).toFixed(1) : 0;
        message += `• ${cat.category}: ${formatMoney(cat.amount)} (${percentage}%)\n`;
      });
  } else {
    message += `😊 Chưa có chi tiêu nào trong ${periodText.toLowerCase()}`;
  }
  
  return ctx.reply(message);
}

// Add income
async function addIncome(ctx, userId, args) {
  const [source, amountStr, ...descParts] = args;
  const amount = parseInt(amountStr.replace(/[,.]/g, ''));
  const description = descParts.join(' ') || '';
  
  if (isNaN(amount) || amount <= 0) {
    return ctx.reply('❌ Số tiền không hợp lệ!');
  }
  
  const validSources = ['salary', 'bonus', 'freelance', 'investment', 'other'];
  if (!validSources.includes(source)) {
    return ctx.reply(`❌ Nguồn thu nhập không hợp lệ!\n\nCác nguồn hợp lệ: ${validSources.join(', ')}`);
  }
  
  const income = await financeService.addIncome(userId, {
    source,
    amount,
    description,
    note: description
  });
  
  return ctx.reply(`✅ Đã thêm thu nhập:
💰 Số tiền: ${formatMoney(amount)}
📂 Nguồn: ${source}
📝 Mô tả: ${description || 'Không có'}
📅 Ngày: ${formatDate(income.createdAt)}`);
}

// Show income statistics
async function showIncomeStats(ctx, userId) {
  const todayStats = await financeService.getIncomeStats(userId, 'today');
  const monthStats = await financeService.getIncomeStats(userId, 'month');
  const yearStats = await financeService.getIncomeStats(userId, 'year');
  const allTimeStats = await financeService.getIncomeStats(userId, 'all');
  
  const message = `💰 Thống kê thu nhập

📅 Hôm nay: ${formatMoney(todayStats.total)} (${todayStats.count} giao dịch)
📅 Tháng này: ${formatMoney(monthStats.total)} (${monthStats.count} giao dịch)
📅 Năm này: ${formatMoney(yearStats.total)} (${yearStats.count} giao dịch)
📅 Tổng cộng: ${formatMoney(allTimeStats.total)} (${allTimeStats.count} giao dịch)`;
  
  return ctx.reply(message);
}

// Show user balance
async function showUserBalance(ctx, userId) {
  const balance = await financeService.getUserBalance(userId);
  const jars = await financeService.getUserJars(userId);
  
  const totalInJars = jars.reduce((sum, jar) => sum + jar.currentAmount, 0);
  const availableBalance = balance.totalBalance - totalInJars;
  
  const message = `💳 Tình hình tài chính

💰 Tổng thu nhập: ${formatMoney(balance.totalIncome)}
💸 Tổng chi tiêu: ${formatMoney(balance.totalExpense)}
📊 Số dư: ${formatMoney(balance.totalBalance)}

🏺 Tiền trong hũ: ${formatMoney(totalInJars)}
💵 Tiền khả dụng: ${formatMoney(availableBalance)}

📅 Cập nhật: ${formatDate(balance.updatedAt)}`;
  
  return ctx.reply(message);
}

// Show user jars
async function showUserJars(ctx, userId) {
  const jars = await financeService.getUserJars(userId);
  
  if (jars.length === 0) {
    return ctx.reply(`🏺 Bạn chưa có hũ tiền nào.

Sử dụng /setup_jars để tạo các hũ tiền mặc định theo phương pháp 6 JAR.`);
  }
  
  let message = `🏺 Các hũ tiền của bạn:\n\n`;
  
  jars.forEach(jar => {
    const percentage = jar.targetAmount > 0 ? 
      ((jar.currentAmount / jar.targetAmount) * 100).toFixed(1) : 0;
    
    message += `${jar.icon} ${jar.name} (ID: ${jar.id})\n`;
    message += `💰 Số dư: ${formatMoney(jar.currentAmount)}`;
    
    if (jar.targetAmount) {
      message += ` / ${formatMoney(jar.targetAmount)} (${percentage}%)`;
    }
    
    message += `\n📝 ${jar.description}\n\n`;
  });
  
  message += `💡 Lệnh:\n`;
  message += `/jar_deposit <ID> <số_tiền> - Nạp tiền\n`;
  message += `/jar_withdraw <ID> <số_tiền> - Rút tiền`;
  
  return ctx.reply(message);
}

// Setup default jars
async function setupDefaultJars(ctx, userId) {
  const existingJars = await financeService.getUserJars(userId);
  
  if (existingJars.length > 0) {
    return ctx.reply(`🏺 Bạn đã có ${existingJars.length} hũ tiền.

Sử dụng /jars để xem chi tiết.`);
  }
  
  const jars = await financeService.setupDefaultJars(userId);
  
  let message = `🏺 Đã tạo ${jars.length} hũ tiền theo phương pháp 6 JAR:\n\n`;
  
  jars.forEach(jar => {
    message += `${jar.icon} ${jar.name}\n📝 ${jar.description}\n\n`;
  });
  
  message += `💡 Sử dụng /jars để xem chi tiết và quản lý hũ tiền.`;
  
  return ctx.reply(message);
}

// Deposit to jar
async function depositToJar(ctx, userId, args) {
  const [jarIdStr, amountStr, ...descParts] = args;
  const jarId = parseInt(jarIdStr);
  const amount = parseInt(amountStr.replace(/[,.]/g, ''));
  const description = descParts.join(' ') || 'Nạp tiền vào hũ';
  
  if (isNaN(jarId) || isNaN(amount) || amount <= 0) {
    return ctx.reply('❌ Thông tin không hợp lệ!');
  }
  
  try {
    const transaction = await financeService.depositToJar(userId, jarId, amount, description);
    
    return ctx.reply(`✅ Đã nạp tiền vào hũ:
💰 Số tiền: ${formatMoney(amount)}
🏺 Hũ: ID ${jarId}
📝 Mô tả: ${description}
📅 Ngày: ${formatDate(transaction.createdAt)}`);
  } catch (error) {
    return ctx.reply(`❌ Lỗi: ${error.message}`);
  }
}

// Withdraw from jar
async function withdrawFromJar(ctx, userId, args) {
  const [jarIdStr, amountStr, ...descParts] = args;
  const jarId = parseInt(jarIdStr);
  const amount = parseInt(amountStr.replace(/[,.]/g, ''));
  const description = descParts.join(' ') || 'Rút tiền từ hũ';
  
  if (isNaN(jarId) || isNaN(amount) || amount <= 0) {
    return ctx.reply('❌ Thông tin không hợp lệ!');
  }
  
  try {
    const transaction = await financeService.withdrawFromJar(userId, jarId, amount, description);
    
    return ctx.reply(`✅ Đã rút tiền từ hũ:
💰 Số tiền: ${formatMoney(amount)}
🏺 Hũ: ID ${jarId}
📝 Mô tả: ${description}
📅 Ngày: ${formatDate(transaction.createdAt)}`);
  } catch (error) {
    return ctx.reply(`❌ Lỗi: ${error.message}`);
  }
}

// Show transaction history
async function showTransactionHistory(ctx, userId, type) {
  const transactions = await financeService.getTransactionHistory(userId, 10, type);
  
  if (transactions.length === 0) {
    return ctx.reply('📋 Chưa có giao dịch nào.');
  }
  
  let typeText;
  switch (type) {
    case 'income': typeText = 'thu nhập'; break;
    case 'expense': typeText = 'chi tiêu'; break;
    case 'jar': typeText = 'hũ tiền'; break;
    default: typeText = 'tổng hợp';
  }
  
  let message = `📋 Lịch sử ${typeText} (10 gần nhất):\n\n`;
  
  transactions.forEach(tx => {
    const icon = tx.amount > 0 ? '💰' : '💸';
    const amountStr = tx.amount > 0 ? 
      `+${formatMoney(tx.amount)}` : 
      formatMoney(tx.amount);
    
    message += `${icon} ${amountStr}\n`;
    message += `📂 ${tx.category}\n`;
    if (tx.description) {
      message += `📝 ${tx.description}\n`;
    }
    message += `📅 ${formatDate(tx.date)}\n\n`;
  });
  
  message += `💡 Xem thêm:\n`;
  message += `/history_income - Thu nhập\n`;
  message += `/history_expense - Chi tiêu\n`;
  message += `/history_jar - Hũ tiền`;
  
  return ctx.reply(message);
}

module.exports = {
  handleFinanceCommands
};
