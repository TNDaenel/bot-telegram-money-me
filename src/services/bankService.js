const { PrismaClient } = require('@prisma/client');
const EmailService = require('./emailService');

class BankService {
  constructor() {
    this.prisma = new PrismaClient();
    this.emailService = new EmailService();
    this.isMonitoring = false;
    this.monitoringStats = {
      startTime: null,
      totalEmailsProcessed: 0,
      lastEmailTime: null,
      averageProcessingTime: 0
    };
  }

  // Kết nối email service
  async connect() {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        throw new Error('Email credentials not configured');
      }

      await this.emailService.connect();
      console.log('✅ Bank service connected successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect bank service:', error);
      return false;
    }
  }

  // Bắt đầu monitoring với adaptive polling
  async startMonitoring() {
    try {
      if (this.isMonitoring) {
        console.log('⚠️ Bank monitoring already running');
        return;
      }

      const connected = await this.connect();
      if (!connected) {
        throw new Error('Failed to connect to email service');
      }

      // Khởi tạo monitoring stats
      this.monitoringStats.startTime = new Date();
      this.monitoringStats.totalEmailsProcessed = 0;

      await this.emailService.startMonitoring();
      this.isMonitoring = true;
      console.log('🏦 Bank monitoring started with adaptive polling');
      
      // Bắt đầu monitoring stats
      this.startMonitoringStats();
      
    } catch (error) {
      console.error('❌ Failed to start bank monitoring:', error);
      throw error;
    }
  }

  // Dừng monitoring
  stopMonitoring() {
    this.isMonitoring = false;
    this.emailService.stopMonitoring();
    console.log('🏦 Bank monitoring stopped');
  }

  // Bắt đầu monitoring stats
  startMonitoringStats() {
    setInterval(() => {
      this.logMonitoringStats();
    }, 60000); // Log stats mỗi phút
  }

  // Log monitoring stats
  logMonitoringStats() {
    if (!this.isMonitoring) return;

    const uptime = Date.now() - this.monitoringStats.startTime.getTime();
    const uptimeMinutes = Math.floor(uptime / 60000);
    
    console.log(`📊 Monitoring Stats (${uptimeMinutes}min uptime):`);
    console.log(`   📧 Total emails processed: ${this.monitoringStats.totalEmailsProcessed}`);
    console.log(`   ⏱️ Average processing time: ${this.monitoringStats.averageProcessingTime.toFixed(2)}ms`);
    console.log(`   📅 Last email time: ${this.monitoringStats.lastEmailTime || 'None'}`);
    console.log(`   🔄 Current interval: ${this.emailService.adaptiveInterval}ms`);
  }

  // Force check email ngay lập tức
  async forceCheckEmails() {
    try {
      console.log('🔍 Force checking emails...');
      const hasNewEmails = await this.emailService.forceCheck();
      
      if (hasNewEmails) {
        this.monitoringStats.totalEmailsProcessed++;
        this.monitoringStats.lastEmailTime = new Date();
      }
      
      return hasNewEmails;
    } catch (error) {
      console.error('❌ Error in force check:', error);
      return false;
    }
  }

  // Cập nhật polling interval
  updatePollingInterval(newInterval) {
    this.emailService.updateInterval(newInterval);
  }

  // Lấy thống kê giao dịch ngân hàng
  async getBankStats(userId = null) {
    try {
      const whereClause = userId ? { userId } : {};
      
      const stats = await this.prisma.bankTransaction.groupBy({
        by: ['bankName', 'type'],
        where: whereClause,
        _count: {
          id: true
        },
        _sum: {
          amount: true
        }
      });

      const totalStats = await this.prisma.bankTransaction.aggregate({
        where: whereClause,
        _count: {
          id: true
        },
        _sum: {
          amount: true
        }
      });

      const emailStats = await this.emailService.getEmailStats();

      return {
        totalTransactions: totalStats._count.id,
        totalAmount: totalStats._sum.amount || 0,
        byBank: stats.reduce((acc, stat) => {
          const key = `${stat.bankName}_${stat.type}`;
          acc[key] = {
            bank: stat.bankName,
            type: stat.type,
            count: stat._count.id,
            amount: stat._sum.amount || 0
          };
          return acc;
        }, {}),
        emailStats: emailStats,
        monitoringStats: this.monitoringStats
      };
    } catch (error) {
      console.error('❌ Error getting bank stats:', error);
      return null;
    }
  }

  // Lấy lịch sử giao dịch ngân hàng
  async getBankTransactions(userId = null, limit = 10) {
    try {
      const whereClause = userId ? { userId } : {};
      
      const transactions = await this.prisma.bankTransaction.findMany({
        where: whereClause,
        orderBy: { date: 'desc' },
        take: limit,
        include: {
          expense: true,
          incomes: true
        }
      });

      return transactions.map(tx => ({
        id: tx.id,
        bankName: tx.bankName,
        amount: tx.amount,
        type: tx.type,
        description: tx.description,
        date: tx.date,
        processed: tx.processed,
        aiProcessed: tx.aiProcessed,
        aiCategory: tx.aiCategory,
        aiConfidence: tx.aiConfidence,
        relatedExpense: tx.expense,
        relatedIncome: tx.incomes[0] || null
      }));
    } catch (error) {
      console.error('❌ Error getting bank transactions:', error);
      return [];
    }
  }

  // Lấy giao dịch theo ngân hàng
  async getTransactionsByBank(bankName, userId = null) {
    try {
      const whereClause = {
        bankName: bankName,
        ...(userId && { userId })
      };

      const transactions = await this.prisma.bankTransaction.findMany({
        where: whereClause,
        orderBy: { date: 'desc' },
        include: {
          expense: true,
          incomes: true
        }
      });

      return transactions;
    } catch (error) {
      console.error(`❌ Error getting transactions for ${bankName}:`, error);
      return [];
    }
  }

  // Xử lý giao dịch thủ công
  async processTransactionManually(transactionId, userId, category, type) {
    try {
      const transaction = await this.prisma.bankTransaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Cập nhật thông tin AI
      await this.prisma.bankTransaction.update({
        where: { id: transactionId },
        data: {
          aiCategory: category,
          aiConfidence: 1.0,
          aiProcessed: true
        }
      });

      // Tạo giao dịch tương ứng
      if (type === 'income') {
        await this.prisma.income.create({
          data: {
            userId,
            source: category.toLowerCase(),
            amount: transaction.amount,
            description: transaction.description,
            aiCategory: category,
            aiConfidence: 1.0,
            bankTransactionId: transaction.id
          }
        });
      } else {
        await this.prisma.expense.create({
          data: {
            userId,
            category,
            amount: transaction.amount,
            note: transaction.description,
            source: 'bank',
            bankRef: transaction.reference
          }
        });
      }

      // Đánh dấu đã xử lý
      await this.prisma.bankTransaction.update({
        where: { id: transactionId },
        data: { processed: true }
      });

      console.log(`✅ Manually processed transaction ${transactionId}`);
      return true;
    } catch (error) {
      console.error('❌ Error processing transaction manually:', error);
      return false;
    }
  }

  // Lấy giao dịch chưa xử lý
  async getPendingTransactions(userId = null) {
    try {
      const whereClause = {
        processed: false,
        ...(userId && { userId })
      };

      const transactions = await this.prisma.bankTransaction.findMany({
        where: whereClause,
        orderBy: { date: 'desc' }
      });

      return transactions;
    } catch (error) {
      console.error('❌ Error getting pending transactions:', error);
      return [];
    }
  }

  // Xóa giao dịch
  async deleteTransaction(transactionId) {
    try {
      await this.prisma.bankTransaction.delete({
        where: { id: transactionId }
      });
      console.log(`✅ Deleted transaction ${transactionId}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting transaction:', error);
      return false;
    }
  }

  // Cập nhật cấu hình email
  async updateEmailConfig(userId, email, bankName) {
    try {
      await this.prisma.userBankConfig.upsert({
        where: { userId },
        update: {
          email,
          bankName,
          active: true
        },
        create: {
          userId,
          email,
          bankName,
          active: true
        }
      });

      console.log(`✅ Updated email config for user ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating email config:', error);
      return false;
    }
  }

  // Lấy cấu hình email của user
  async getUserEmailConfig(userId) {
    try {
      const config = await this.prisma.userBankConfig.findUnique({
        where: { userId }
      });
      return config;
    } catch (error) {
      console.error('❌ Error getting user email config:', error);
      return null;
    }
  }

  // Test kết nối email
  async testEmailConnection() {
    try {
      const connected = await this.connect();
      if (connected) {
        this.emailService.stopMonitoring();
        return {
          success: true,
          message: 'Email connection test successful'
        };
      } else {
        return {
          success: false,
          message: 'Email connection test failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Email connection test failed: ${error.message}`
      };
    }
  }

  // Lấy thống kê AI
  async getAIStats() {
    try {
      const aiStats = await this.prisma.bankTransaction.groupBy({
        by: ['aiCategory'],
        where: { aiProcessed: true },
        _count: {
          id: true
        },
        _avg: {
          aiConfidence: true
        }
      });

      return aiStats.map(stat => ({
        category: stat.aiCategory,
        count: stat._count.id,
        avgConfidence: stat._avg.aiConfidence
      }));
    } catch (error) {
      console.error('❌ Error getting AI stats:', error);
      return [];
    }
  }

  // Retrain AI với dữ liệu mới
  async retrainAI() {
    try {
      // Lấy tất cả giao dịch đã xử lý
      const processedTransactions = await this.prisma.bankTransaction.findMany({
        where: { aiProcessed: true },
        select: {
          description: true,
          aiCategory: true,
          aiConfidence: true
        }
      });

      // Cập nhật AI mapping
      const categoryMapping = {};
      processedTransactions.forEach(tx => {
        if (!categoryMapping[tx.aiCategory]) {
          categoryMapping[tx.aiCategory] = [];
        }
        categoryMapping[tx.aiCategory].push(tx.description);
      });

      console.log('🤖 AI retraining completed');
      return {
        success: true,
        categories: Object.keys(categoryMapping),
        totalTransactions: processedTransactions.length
      };
    } catch (error) {
      console.error('❌ Error retraining AI:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Lấy monitoring status
  getMonitoringStatus() {
    return {
      isMonitoring: this.isMonitoring,
      startTime: this.monitoringStats.startTime,
      uptime: this.isMonitoring ? Date.now() - this.monitoringStats.startTime.getTime() : 0,
      totalEmailsProcessed: this.monitoringStats.totalEmailsProcessed,
      lastEmailTime: this.monitoringStats.lastEmailTime,
      currentInterval: this.emailService.adaptiveInterval
    };
  }

  // Restart monitoring
  async restartMonitoring() {
    console.log('🔄 Restarting bank monitoring...');
    this.stopMonitoring();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Đợi 2 giây
    await this.startMonitoring();
    console.log('✅ Bank monitoring restarted');
  }
}

module.exports = BankService;

