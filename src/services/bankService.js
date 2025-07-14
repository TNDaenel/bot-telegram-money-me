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

  // Connect email service
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

  // Start monitoring
  async startMonitoring() {
    try {
      if (this.isMonitoring) {
        console.log('⚠️ Bank monitoring already running');
        return;
      }

      // Connect if not connected
      if (!this.emailService.isConnected) {
        await this.connect();
      }

      this.isMonitoring = true;
      this.monitoringStats.startTime = new Date();
      console.log('🏦 Starting bank monitoring...');

      // Start adaptive polling
      this.startAdaptivePolling();

      return true;
    } catch (error) {
      console.error('❌ Failed to start bank monitoring:', error);
      return false;
    }
  }

  // Stop monitoring
  stopMonitoring() {
    this.isMonitoring = false;
    if (this.emailService) {
      this.emailService.stopMonitoring();
    }
    console.log('🏦 Bank monitoring stopped');
  }

  // Start adaptive polling
  startAdaptivePolling() {
    const poll = async () => {
      if (!this.isMonitoring) return;

      try {
        const startTime = Date.now();
        const hasNewEmails = await this.emailService.checkNewEmails();
        const endTime = Date.now();

        if (hasNewEmails) {
          this.monitoringStats.totalEmailsProcessed++;
          this.monitoringStats.lastEmailTime = new Date();
          
          // Update average processing time
          const processingTime = endTime - startTime;
          this.monitoringStats.averageProcessingTime = 
            (this.monitoringStats.averageProcessingTime * (this.monitoringStats.totalEmailsProcessed - 1) + processingTime) 
            / this.monitoringStats.totalEmailsProcessed;
        }

        // Schedule next check
        setTimeout(poll, this.emailService.adaptiveInterval);
      } catch (error) {
        console.error('❌ Error in bank polling:', error);
        // Retry after error delay
        setTimeout(poll, 10000);
      }
    };

    // Start polling
    poll();
  }

  // Force check emails immediately
  async forceCheckEmails() {
    try {
      console.log('🔍 Force checking emails...');
      const hasNewEmails = await this.emailService.checkNewEmails();
      
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

  // Get monitoring status
  async getMonitoringStatus() {
    try {
      const uptime = this.monitoringStats.startTime 
        ? Math.floor((Date.now() - this.monitoringStats.startTime) / 1000)
        : 0;

      const emailStats = await this.emailService.getEmailStats();

      return {
        isRunning: this.isMonitoring,
        uptime,
        totalEmailsProcessed: this.monitoringStats.totalEmailsProcessed,
        lastEmailTime: this.monitoringStats.lastEmailTime,
        averageProcessingTime: this.monitoringStats.averageProcessingTime,
        currentInterval: this.emailService.adaptiveInterval,
        emailStats
      };
    } catch (error) {
      console.error('❌ Error getting monitoring status:', error);
      return null;
    }
  }

  // Get bank transactions
  async getBankTransactions(userId, options = {}) {
    try {
      const { skip = 0, take = 10, processed = null } = options;

      const where = { userId };
      if (processed !== null) {
        where.processed = processed;
      }

      const transactions = await this.prisma.bankTransaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take,
        include: {
          incomes: true
        }
      });

      return transactions;
    } catch (error) {
      console.error('❌ Error getting bank transactions:', error);
      return [];
    }
  }

  // Get pending transactions
  async getPendingTransactions(userId) {
    return this.getBankTransactions(userId, { processed: false });
  }

  // Process pending transaction
  async processPendingTransaction(transactionId, userId, action) {
    try {
      const transaction = await this.prisma.bankTransaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.processed) {
        throw new Error('Transaction already processed');
      }

      // Process based on action
      switch (action) {
        case 'approve':
          await this.approveTransaction(transaction, userId);
          break;
        case 'reject':
          await this.rejectTransaction(transaction, userId);
          break;
        default:
          throw new Error('Invalid action');
      }

      return true;
    } catch (error) {
      console.error('❌ Error processing pending transaction:', error);
      throw error;
    }
  }

  // Approve transaction
  async approveTransaction(transaction, userId) {
    try {
      // Re-analyze with AI
      const aiAnalysis = await this.emailService.analyzeTransactionWithAI(transaction);

      // Create corresponding transaction
      if (aiAnalysis.category === 'Income') {
        await this.prisma.income.create({
          data: {
            userId,
            source: 'bank',
            amount: transaction.amount,
            description: transaction.description,
            aiCategory: aiAnalysis.category,
            aiConfidence: aiAnalysis.confidence,
            bankTransactionId: transaction.id
          }
        });
      } else {
        await this.prisma.expense.create({
          data: {
            userId,
            category: aiAnalysis.category,
            amount: transaction.amount,
            note: transaction.description,
            source: 'bank',
            bankRef: transaction.reference
          }
        });
      }

      // Mark as processed
      await this.prisma.bankTransaction.update({
        where: { id: transaction.id },
        data: {
          processed: true,
          userId
        }
      });

      console.log(`✅ Approved transaction ${transaction.id} for user ${userId}`);
    } catch (error) {
      console.error('❌ Error approving transaction:', error);
      throw error;
    }
  }

  // Reject transaction
  async rejectTransaction(transaction, userId) {
    try {
      await this.prisma.bankTransaction.update({
        where: { id: transaction.id },
        data: {
          processed: true,
          userId,
          rejected: true
        }
      });

      console.log(`❌ Rejected transaction ${transaction.id} for user ${userId}`);
    } catch (error) {
      console.error('❌ Error rejecting transaction:', error);
      throw error;
    }
  }

  // Update email config
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

  // Test email connection
  async testEmailConnection() {
    try {
      const connected = await this.connect();
      if (connected) {
        this.stopMonitoring();
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

  // Get bank stats
  async getBankStats(userId) {
    try {
      const [
        totalTransactions,
        processedTransactions,
        totalAmount,
        lastTransaction
      ] = await Promise.all([
        this.prisma.bankTransaction.count({ where: { userId } }),
        this.prisma.bankTransaction.count({ where: { userId, processed: true } }),
        this.prisma.bankTransaction.aggregate({
          where: { userId },
          _sum: { amount: true }
        }),
        this.prisma.bankTransaction.findFirst({
          where: { userId },
          orderBy: { date: 'desc' }
        })
      ]);

      return {
        totalTransactions,
        processedTransactions,
        pendingTransactions: totalTransactions - processedTransactions,
        totalAmount: totalAmount._sum.amount || 0,
        lastTransactionDate: lastTransaction?.date
      };
    } catch (error) {
      console.error('❌ Error getting bank stats:', error);
      return null;
    }
  }
}

module.exports = BankService;

