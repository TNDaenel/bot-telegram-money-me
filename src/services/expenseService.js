const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Input validation helper
const validateExpenseData = (userId, expenseData) => {
  const { category, amount, note } = expenseData;
  
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId: must be a non-empty string');
  }
  
  if (!category || typeof category !== 'string') {
    throw new Error('Invalid category: must be a non-empty string');
  }
  
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    throw new Error('Invalid amount: must be a positive number');
  } 
  
  if (note && typeof note !== 'string') {
    throw new Error('Invalid note: must be a string');
  }
};

exports.save = async (userId, expenseData) => {
  try {
    validateExpenseData(userId, expenseData);
    
    const { category, amount, note } = expenseData;
    
    return await prisma.expense.create({
      data: { 
        userId, 
        category, 
        amount: parseFloat(amount), 
        note: note || null 
      }
    });
  } catch (error) {
    console.error('Error saving expense:', error);
    throw error;
  }
};

// Alias cho addExpense để tương thích unifiedMessageHandler
exports.addExpense = exports.save;

exports.getExpensesByUser = async (userId) => {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid userId: must be a non-empty string');
    }
    
    return await prisma.expense.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
};

exports.getExpenseById = async (id) => {
  try {
    if (!id || typeof id !== 'number') {
      throw new Error('Invalid id: must be a number');
    }
    
    return await prisma.expense.findUnique({
      where: { id }
    });
  } catch (error) {
    console.error('Error fetching expense by id:', error);
    throw error;
  }
};

exports.deleteExpense = async (id, userId) => {
  try {
    if (!id || typeof id !== 'number') {
      throw new Error('Invalid id: must be a number');
    }
    
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid userId: must be a non-empty string');
    }
    
    // Ensure user can only delete their own expenses
    return await prisma.expense.deleteMany({
      where: { 
        id, 
        userId 
      }
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

exports.getTotalExpensesByUser = async (userId, startDate, endDate) => {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid userId: must be a non-empty string');
    }
    
    const whereClause = { userId };
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }
    
    const result = await prisma.expense.aggregate({
      where: whereClause,
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });
    
    return {
      total: result._sum.amount || 0,
      count: result._count.id || 0
    };
  } catch (error) {
    console.error('Error calculating total expenses:', error);
    throw error;
  }
};

// Thêm chức năng tự động trừ tiền từ hũ
exports.addExpenseWithJarDeduction = async (userId, expenseData) => {
  try {
    // Lưu chi tiêu vào database
    const expense = await exports.addExpense(userId, expenseData);
    
    // Tự động trừ tiền từ hũ phù hợp
    let jarDeduction = null;
    try {
      const jarService = require('./jarService');
      jarDeduction = await jarService.autoDeductFromJar(
        userId, 
        expenseData.amount, 
        expenseData.category, 
        expenseData.note || ''
      );
    } catch (error) {
      console.log('No jar system available or error deducting from jar:', error.message);
    }

    return {
      expense,
      jarDeduction,
      success: true
    };
  } catch (error) {
    console.error('Error adding expense with jar deduction:', error);
    throw error;
  }
};

// Cleanup function for graceful shutdown
exports.disconnect = async () => {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
};

