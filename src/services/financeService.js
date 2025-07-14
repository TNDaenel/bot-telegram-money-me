const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class FinanceService {
  
  // ========== INCOME MANAGEMENT ==========
  
  async addIncome(userId, { source, amount, description, note }) {
    const income = await prisma.income.create({
      data: { userId, source, amount, description, note }
    });
    
    // Update user balance
    await this.updateUserBalance(userId);
    
    return income;
  }
  
  async getIncomesByUser(userId, startDate, endDate) {
    const whereClause = { userId };
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }
    
    return await prisma.income.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
  }
  
  async getTotalIncome(userId, startDate, endDate) {
    const whereClause = { userId };
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }
    
    const result = await prisma.income.aggregate({
      where: whereClause,
      _sum: { amount: true },
      _count: { id: true }
    });
    
    return {
      total: result._sum.amount || 0,
      count: result._count.id || 0
    };
  }
  
  // ========== JAR MANAGEMENT ==========
  
  async createJar(userId, { name, description, targetAmount, color, icon }) {
    return await prisma.jar.create({
      data: {
        userId,
        name,
        description,
        targetAmount,
        color: color || '#3498db',
        icon: icon || '💰'
      }
    });
  }
  
  async getUserJars(userId) {
    return await prisma.jar.findMany({
      where: { userId, isActive: true },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }
  
  async depositToJar(userId, jarId, amount, description) {
    const transaction = await prisma.jarTransaction.create({
      data: {
        userId,
        jarId,
        type: 'deposit',
        amount,
        description
      }
    });
    
    // Update jar balance
    await prisma.jar.update({
      where: { id: jarId },
      data: {
        currentAmount: {
          increment: amount
        }
      }
    });
    
    await this.updateUserBalance(userId);
    return transaction;
  }
  
  async withdrawFromJar(userId, jarId, amount, description) {
    const jar = await prisma.jar.findFirst({
      where: { id: jarId, userId }
    });
    
    if (!jar || jar.currentAmount < amount) {
      throw new Error('Insufficient balance in jar');
    }
    
    const transaction = await prisma.jarTransaction.create({
      data: {
        userId,
        jarId,
        type: 'withdraw',
        amount,
        description
      }
    });
    
    await prisma.jar.update({
      where: { id: jarId },
      data: {
        currentAmount: {
          decrement: amount
        }
      }
    });
    
    await this.updateUserBalance(userId);
    return transaction;
  }
  
  async transferBetweenJars(userId, fromJarId, toJarId, amount, description) {
    const fromJar = await prisma.jar.findFirst({
      where: { id: fromJarId, userId }
    });
    
    if (!fromJar || fromJar.currentAmount < amount) {
      throw new Error('Insufficient balance in source jar');
    }
    
    // Create transfer transactions
    await prisma.jarTransaction.createMany({
      data: [
        {
          userId,
          jarId: fromJarId,
          type: 'transfer',
          amount: -amount,
          description: `Transfer to jar ${toJarId}: ${description}`,
          toJarId
        },
        {
          userId,
          jarId: toJarId,
          type: 'transfer',
          amount: amount,
          description: `Transfer from jar ${fromJarId}: ${description}`,
          fromJarId
        }
      ]
    });
    
    // Update jar balances
    await prisma.jar.update({
      where: { id: fromJarId },
      data: { currentAmount: { decrement: amount } }
    });
    
    await prisma.jar.update({
      where: { id: toJarId },
      data: { currentAmount: { increment: amount } }
    });
    
    return { success: true, amount, fromJarId, toJarId };
  }
  
  // ========== STATISTICS ==========
  
  async getExpenseStats(userId, period = 'all', customDate = null) {
    const now = new Date();
    let startDate, endDate;
    
    // Nếu có customDate, sử dụng ngày cụ thể
    if (customDate) {
      const targetDate = new Date(customDate);
      startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
    } else {
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          startDate = weekStart;
          endDate = new Date(weekStart);
          endDate.setDate(weekStart.getDate() + 7);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear() + 1, 0, 1);
          break;
        case 'custom_month':
          // Tháng cụ thể (format: YYYY-MM)
          const [year, month] = period.split('-');
          startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          endDate = new Date(parseInt(year), parseInt(month), 1);
          break;
        case 'custom_year':
          // Năm cụ thể
          startDate = new Date(parseInt(period), 0, 1);
          endDate = new Date(parseInt(period) + 1, 0, 1);
          break;
        default:
          startDate = null;
          endDate = null;
      }
    }
    
    const whereClause = { userId };
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: startDate,
        lt: endDate
      };
    }
    
    // Get total expenses
    const totalExpenses = await prisma.expense.aggregate({
      where: whereClause,
      _sum: { amount: true },
      _count: { id: true }
    });
    
    // Get expenses by category
    const expensesByCategory = await prisma.expense.groupBy({
      where: whereClause,
      by: ['category'],
      _sum: { amount: true },
      _count: { id: true }
    });
    
    return {
      period,
      totalAmount: totalExpenses._sum.amount || 0,
      totalTransactions: totalExpenses._count.id || 0,
      categories: expensesByCategory.map(cat => ({
        category: cat.category,
        amount: cat._sum.amount,
        count: cat._count.id
      }))
    };
  }

  // Thống kê chi tiêu theo danh mục cụ thể
  async getExpenseStatsByCategory(userId, period, category) {
    const now = new Date();
    let startDate, endDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        startDate = weekStart;
        endDate = new Date(weekStart);
        endDate.setDate(weekStart.getDate() + 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 1);
        break;
      default:
        startDate = null;
        endDate = null;
    }
    
    const whereClause = { 
      userId,
      category: category
    };
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: startDate,
        lt: endDate
      };
    }
    
    // Get total expenses for this category
    const totalExpenses = await prisma.expense.aggregate({
      where: whereClause,
      _sum: { amount: true },
      _count: { id: true }
    });
    
    // Get detailed transactions for this category
    const transactions = await prisma.expense.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    return {
      period,
      category,
      totalAmount: totalExpenses._sum.amount || 0,
      totalTransactions: totalExpenses._count.id || 0,
      transactions: transactions
    };
  }

  // Thống kê chi tiêu theo khoảng thời gian tùy chỉnh
  async getExpenseStatsCustomRange(userId, startDate, endDate) {
    try {
      const whereClause = { 
        userId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };

      // Get total expenses
      const totalExpenses = await prisma.expense.aggregate({
        where: whereClause,
        _sum: { amount: true },
        _count: { id: true }
      });

      // Get expenses by category
      const expensesByCategory = await prisma.expense.groupBy({
        where: whereClause,
        by: ['category'],
        _sum: { amount: true },
        _count: { id: true }
      });

      return {
        period: 'custom_range',
        startDate,
        endDate,
        totalAmount: totalExpenses._sum.amount || 0,
        totalTransactions: totalExpenses._count.id || 0,
        categories: expensesByCategory.map(cat => ({
          category: cat.category,
          amount: cat._sum.amount,
          count: cat._count.id
        }))
      };
    } catch (error) {
      console.error('Error getting custom range expense stats:', error);
      throw error;
    }
  }
  
  async getIncomeStats(userId, period = 'all') {
    const now = new Date();
    let startDate, endDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        startDate = weekStart;
        endDate = new Date(weekStart);
        endDate.setDate(weekStart.getDate() + 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 1);
        break;
      default:
        startDate = null;
        endDate = null;
    }
    
    return await this.getTotalIncome(userId, startDate, endDate);
  }
  
  async getUserBalance(userId) {
    let userBalance = await prisma.userBalance.findUnique({
      where: { userId }
    });
    
    if (!userBalance) {
      userBalance = await this.updateUserBalance(userId);
    }
    
    return userBalance;
  }
  
  async updateUserBalance(userId) {
    // Calculate total income
    const totalIncome = await prisma.income.aggregate({
      where: { userId },
      _sum: { amount: true }
    });
    
    // Calculate total expenses
    const totalExpenses = await prisma.expense.aggregate({
      where: { userId },
      _sum: { amount: true }
    });
    
    // Calculate total in jars
    const totalInJars = await prisma.jar.aggregate({
      where: { userId, isActive: true },
      _sum: { currentAmount: true }
    });
    
    const income = totalIncome._sum.amount || 0;
    const expenses = totalExpenses._sum.amount || 0;
    const inJars = totalInJars._sum.currentAmount || 0;
    const balance = income - expenses;
    
    return await prisma.userBalance.upsert({
      where: { userId },
      create: {
        userId,
        totalBalance: balance,
        totalIncome: income,
        totalExpense: expenses
      },
      update: {
        totalBalance: balance,
        totalIncome: income,
        totalExpense: expenses
      }
    });
  }
  
  // ========== TRANSACTION HISTORY ==========
  
  async getTransactionHistory(userId, limit = 20, type = 'all') {
    const transactions = [];
    
    if (type === 'all' || type === 'expense') {
      const expenses = await prisma.expense.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          amount: true,
          category: true,
          note: true,
          createdAt: true,
          source: true
        }
      });
      
      expenses.forEach(exp => {
        transactions.push({
          type: 'expense',
          id: exp.id,
          amount: -exp.amount,
          category: exp.category,
          description: exp.note,
          date: exp.createdAt,
          source: exp.source
        });
      });
    }
    
    if (type === 'all' || type === 'income') {
      const incomes = await prisma.income.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          amount: true,
          source: true,
          description: true,
          createdAt: true
        }
      });
      
      incomes.forEach(inc => {
        transactions.push({
          type: 'income',
          id: inc.id,
          amount: inc.amount,
          category: inc.source,
          description: inc.description,
          date: inc.createdAt,
          source: 'manual'
        });
      });
    }
    
    if (type === 'all' || type === 'jar') {
      const jarTransactions = await prisma.jarTransaction.findMany({
        where: { userId },
        include: { jar: true },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
      
      jarTransactions.forEach(jt => {
        transactions.push({
          type: 'jar',
          id: jt.id,
          amount: jt.type === 'withdraw' ? -jt.amount : jt.amount,
          category: `${jt.type}: ${jt.jar.name}`,
          description: jt.description,
          date: jt.createdAt,
          source: 'jar'
        });
      });
    }
    
    return transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  }
  
  // ========== DEFAULT JARS SETUP ==========
  
  async setupDefaultJars(userId) {
    const defaultJars = [
      {
        name: 'Necessities',
        description: 'Chi phí thiết yếu (55%)',
        color: '#e74c3c',
        icon: '🏠'
      },
      {
        name: 'Education',
        description: 'Học tập & phát triển (10%)',
        color: '#3498db',
        icon: '📚'
      },
      {
        name: 'Entertainment',
        description: 'Giải trí & sở thích (10%)',
        color: '#f39c12',
        icon: '🎮'
      },
      {
        name: 'Emergency',
        description: 'Quỹ dự phòng (10%)',
        color: '#27ae60',
        icon: '🚨'
      },
      {
        name: 'Investment',
        description: 'Đầu tư dài hạn (10%)',
        color: '#9b59b6',
        icon: '📈'
      },
      {
        name: 'Charity',
        description: 'Từ thiện & chia sẻ (5%)',
        color: '#1abc9c',
        icon: '❤️'
      }
    ];
    
    const jars = [];
    for (const jarData of defaultJars) {
      const jar = await prisma.jar.create({
        data: {
          userId,
          ...jarData
        }
      });
      jars.push(jar);
    }
    
    return jars;
  }
}

module.exports = new FinanceService();
