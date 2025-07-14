const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { PrismaClient } = require('@prisma/client');
const bankService = require('./bankService');

class EmailService {
  constructor() {
    this.prisma = new PrismaClient();
    this.imap = null;
    this.isConnected = false;
    this.isMonitoring = false;
    this.lastCheckTime = null;
    this.checkInterval = null;
    this.adaptiveInterval = 5000; // Start with 5 seconds
    this.maxInterval = 30000; // Max 30 seconds
    this.minInterval = 2000; // Min 2 seconds
    this.consecutiveNoEmails = 0;
    this.consecutiveEmails = 0;
    
    // Supported email patterns
    this.supportedPatterns = {
      banks: [
        { domain: 'vcb.com.vn', name: 'Vietcombank' },
        { domain: 'techcombank.com.vn', name: 'Techcombank' },
        { domain: 'tpbank.com.vn', name: 'TPBank' },
        { domain: 'mbbank.com.vn', name: 'MBBank' },
        { domain: 'acb.com.vn', name: 'ACB' }
      ],
      utilities: [
        { domain: 'evnhcmc.vn', name: 'EVN HCMC' },
        { domain: 'evnhanoi.vn', name: 'EVN Hanoi' }
      ],
      ecommerce: [
        { domain: 'tiki.vn', name: 'Tiki' },
        { domain: 'shopee.vn', name: 'Shopee' },
        { domain: 'lazada.vn', name: 'Lazada' }
      ]
    };
  }

  // Connect to IMAP
  async connect() {
    try {
      this.imap = new Imap({
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        host: process.env.EMAIL_HOST || 'imap.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 993,
        tls: process.env.EMAIL_TLS !== 'false',
        tlsOptions: { rejectUnauthorized: false }
      });

      return new Promise((resolve, reject) => {
        this.imap.once('ready', () => {
          console.log('✅ Email service connected successfully');
          this.isConnected = true;
          resolve();
        });

        this.imap.once('error', (err) => {
          console.error('❌ Email connection error:', err);
          this.isConnected = false;
          reject(err);
        });

        this.imap.connect();
      });
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      throw error;
    }
  }

  // Check new emails with detailed info
  async checkNewEmails() {
    if (!this.isConnected) return false;

    return new Promise((resolve, reject) => {
      this.imap.openBox('INBOX', false, async (err, box) => {
        if (err) {
          console.error('❌ Error opening inbox:', err);
          reject(err);
          return;
        }

        // Build search criteria for all supported patterns
        const searchCriteria = ['UNSEEN'];
        const fromCriteria = [];

        // Add bank email patterns
        this.supportedPatterns.banks.forEach(bank => {
          fromCriteria.push(['FROM', `*@${bank.domain}`]);
        });

        // Add utility bill patterns
        this.supportedPatterns.utilities.forEach(utility => {
          fromCriteria.push(['FROM', `*@${utility.domain}`]);
        });

        // Add e-commerce patterns
        this.supportedPatterns.ecommerce.forEach(shop => {
          fromCriteria.push(['FROM', `*@${shop.domain}`]);
        });

        // Add subject patterns
        const subjectPatterns = [
          'GD:', 'Giao dich:', 'Transaction:', 
          'Hoa don:', 'Invoice:', 'Bill:',
          'Order:', 'Don hang:', 'Thanh toan:'
        ];

        subjectPatterns.forEach(pattern => {
          fromCriteria.push(['SUBJECT', pattern]);
        });

        // Combine all criteria
        const finalCriteria = [...searchCriteria, ['OR', ...fromCriteria]];

        this.imap.search(finalCriteria, async (err, results) => {
          if (err) {
            console.error('❌ Error searching emails:', err);
            reject(err);
            return;
          }

          if (results.length === 0) {
            console.log('📧 No new relevant emails found');
            resolve(false);
            return;
          }

          console.log(`📧 Found ${results.length} new relevant emails`);
          await this.processEmails(results);
          resolve(true);
        });
      });
    });
  }

  // Process list of emails with real-time notification
  async processEmails(emailIds) {
    console.log(`🔄 Processing ${emailIds.length} emails...`);
    
    for (const id of emailIds) {
      try {
        const email = await this.fetchEmail(id);
        console.log(`📧 Processing email: ${email.subject} from ${email.from}`);
        
        // Determine email type and extract info
        const emailInfo = await this.analyzeEmailType(email);
        
        if (!emailInfo) {
          console.log('⚠️ Could not analyze email type');
          await this.markAsRead(id);
          continue;
        }

        // Process based on email type
        switch (emailInfo.type) {
          case 'bank':
            await this.processBankEmail(email, emailInfo);
            break;
          case 'utility':
            await this.processUtilityBill(email, emailInfo);
            break;
          case 'ecommerce':
            await this.processEcommerceOrder(email, emailInfo);
            break;
          default:
            console.log(`⚠️ Unsupported email type: ${emailInfo.type}`);
        }
        
        // Mark as read
        await this.markAsRead(id);
        
        console.log(`✅ Processed email from: ${emailInfo.sender}`);
        
        // Send real-time notification
        await this.sendRealTimeNotification(emailInfo);
        
      } catch (error) {
        console.error(`❌ Error processing email ${id}:`, error);
      }
    }
  }

  // Analyze email type and extract basic info
  async analyzeEmailType(email) {
    try {
      const from = email.from.toLowerCase();
      const subject = email.subject.toLowerCase();
      const text = email.text.toLowerCase();

      // Check bank emails
      for (const bank of this.supportedPatterns.banks) {
        if (from.includes(bank.domain)) {
          return {
            type: 'bank',
            sender: bank.name,
            ...this.extractBankInfo(text, bank)
          };
        }
      }

      // Check utility bills
      for (const utility of this.supportedPatterns.utilities) {
        if (from.includes(utility.domain)) {
          return {
            type: 'utility',
            sender: utility.name,
            ...this.extractUtilityInfo(text, utility)
          };
        }
      }

      // Check e-commerce orders
      for (const shop of this.supportedPatterns.ecommerce) {
        if (from.includes(shop.domain)) {
          return {
            type: 'ecommerce',
            sender: shop.name,
            ...this.extractEcommerceInfo(text, shop)
          };
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error analyzing email type:', error);
      return null;
    }
  }

  // Extract bank transaction info
  extractBankInfo(text, bank) {
    try {
      // Common patterns for bank emails
      const amountPattern = /(?:số tiền|amount|giá trị)[\s:]*([0-9,.]+)/i;
      const typePattern = /(?:loại giao dịch|type|hình thức)[\s:]*(\w+)/i;
      const descPattern = /(?:nội dung|content|mô tả)[\s:]*(.*?)(?:\n|$)/i;
      const refPattern = /(?:mã giao dịch|ref|reference)[\s:]*([\w\d]+)/i;

      const amount = this.extractAmount(text, amountPattern);
      const type = (typePattern.exec(text) || [])[1];
      const description = (descPattern.exec(text) || [])[1];
      const reference = (refPattern.exec(text) || [])[1];

      return {
        amount,
        type: type || 'unknown',
        description: description || '',
        reference: reference || `${bank.name}_${Date.now()}`,
        rawEmail: text
      };
          } catch (error) {
      console.error('❌ Error extracting bank info:', error);
      return null;
    }
  }

  // Extract utility bill info
  extractUtilityInfo(text, utility) {
    try {
      // Common patterns for utility bills
      const amountPattern = /(?:số tiền|amount|tổng tiền)[\s:]*([0-9,.]+)/i;
      const periodPattern = /(?:kỳ|period|thời gian)[\s:]*(\d{2}\/\d{4})/i;
      const customerPattern = /(?:mã khách hàng|customer id)[\s:]*([\w\d]+)/i;

      const amount = this.extractAmount(text, amountPattern);
      const period = (periodPattern.exec(text) || [])[1];
      const customerId = (customerPattern.exec(text) || [])[1];

      return {
        amount,
        type: 'utility_bill',
        description: `Hóa đơn ${utility.name} - ${period || 'Kỳ mới'}`,
        reference: customerId || `${utility.name}_${Date.now()}`,
        category: 'Utilities',
        rawEmail: text
      };
    } catch (error) {
      console.error('❌ Error extracting utility info:', error);
      return null;
    }
  }

  // Extract e-commerce order info
  extractEcommerceInfo(text, shop) {
    try {
      // Common patterns for e-commerce orders
      const amountPattern = /(?:tổng tiền|total|thanh toán)[\s:]*([0-9,.]+)/i;
      const orderPattern = /(?:mã đơn hàng|order id)[\s:]*([\w\d-]+)/i;
      const itemPattern = /(?:sản phẩm|items)[\s:]*(.*?)(?:\n|$)/i;

      const amount = this.extractAmount(text, amountPattern);
      const orderId = (orderPattern.exec(text) || [])[1];
      const items = (itemPattern.exec(text) || [])[1];

      return {
        amount,
        type: 'ecommerce_order',
        description: `Đơn hàng ${shop.name}${items ? ': ' + items : ''}`,
        reference: orderId || `${shop.name}_${Date.now()}`,
        category: 'Shopping',
        rawEmail: text
      };
    } catch (error) {
      console.error('❌ Error extracting e-commerce info:', error);
      return null;
    }
  }

  // Extract amount from text with pattern
  extractAmount(text, pattern) {
    try {
      const match = pattern.exec(text);
      if (!match) return null;

      const amountStr = match[1].replace(/[,.]/g, '');
      return parseInt(amountStr, 10);
    } catch (error) {
      console.error('❌ Error extracting amount:', error);
      return null;
    }
  }

  // Process bank email
  async processBankEmail(email, info) {
    try {
      // Save bank transaction
      const transaction = await this.prisma.bankTransaction.create({
        data: {
          bankName: info.sender,
          amount: info.amount,
          type: info.type,
          description: info.description,
          reference: info.reference,
          date: email.date,
          rawEmail: info.rawEmail
        }
      });

      // Process with AI
      await this.processWithAI(transaction);

      console.log(`✅ Processed bank transaction: ${info.amount}đ from ${info.sender}`);
    } catch (error) {
      console.error('❌ Error processing bank email:', error);
    }
  }

  // Process utility bill
  async processUtilityBill(email, info) {
    try {
      // Create expense directly
      const expense = await this.prisma.expense.create({
        data: {
          userId: null, // Will be linked when user confirms
          category: info.category,
          amount: info.amount,
          note: info.description,
          source: 'email',
          bankRef: info.reference
        }
      });

      console.log(`✅ Created utility expense: ${info.amount}đ for ${info.sender}`);
    } catch (error) {
      console.error('❌ Error processing utility bill:', error);
    }
  }

  // Process e-commerce order
  async processEcommerceOrder(email, info) {
    try {
      // Create expense directly
      const expense = await this.prisma.expense.create({
        data: {
          userId: null, // Will be linked when user confirms
          category: info.category,
          amount: info.amount,
          note: info.description,
          source: 'email',
          bankRef: info.reference
        }
      });

      console.log(`✅ Created e-commerce expense: ${info.amount}đ from ${info.sender}`);
    } catch (error) {
      console.error('❌ Error processing e-commerce order:', error);
    }
  }

  // Send real-time notification
  async sendRealTimeNotification(info) {
    try {
      const message = `🔔 **New Transaction Detected!**

💰 **Amount:** ${info.amount.toLocaleString('vi-VN')}đ
🏢 **From:** ${info.sender}
📝 **Type:** ${this.getTypeEmoji(info.type)} ${info.type}
📄 **Description:** ${info.description}
📅 **Time:** ${new Date().toLocaleString('vi-VN')}

🤖 **AI is analyzing the transaction...**`;

      console.log('📢 Real-time notification:', message);
      
      // TODO: Send notification via Telegram bot
      // await bot.telegram.sendMessage(userId, message, { parse_mode: 'Markdown' });
      
    } catch (error) {
      console.error('❌ Error sending real-time notification:', error);
    }
  }

  // Get emoji for transaction type
  getTypeEmoji(type) {
    const emojiMap = {
      'bank': '🏦',
      'utility_bill': '⚡',
      'ecommerce_order': '🛍️',
      'credit': '💳',
      'debit': '💸',
      'transfer': '↔️',
      'unknown': '❓'
    };
    return emojiMap[type] || '💰';
  }

  // Process with AI
  async processWithAI(transaction) {
    try {
      // AI analysis of transaction
      const aiAnalysis = await this.analyzeTransactionWithAI(transaction);
      
      // Update AI info
      await this.prisma.bankTransaction.update({
        where: { id: transaction.id },
        data: {
          aiProcessed: true,
          aiCategory: aiAnalysis.category,
          aiConfidence: aiAnalysis.confidence
        }
      });

      // Create corresponding transaction
      await this.createCorrespondingTransaction(transaction, aiAnalysis);
      
    } catch (error) {
      console.error('❌ Error processing with AI:', error);
    }
  }

  // Analyze transaction with AI
  async analyzeTransactionWithAI(transaction) {
    try {
      // TODO: Implement AI analysis
      // This is a placeholder that returns basic categorization
      const description = transaction.description.toLowerCase();
      
      if (description.includes('lương') || description.includes('salary')) {
        return { category: 'Income', confidence: 0.9 };
      }
      
      if (description.includes('điện') || description.includes('nước')) {
        return { category: 'Utilities', confidence: 0.8 };
      }
      
      if (description.includes('mua') || description.includes('shop')) {
        return { category: 'Shopping', confidence: 0.7 };
      }
      
      return { category: 'Other', confidence: 0.5 };
    } catch (error) {
      console.error('❌ Error in AI analysis:', error);
      return { category: 'Unknown', confidence: 0 };
    }
  }

  // Create corresponding transaction
  async createCorrespondingTransaction(transaction, aiAnalysis) {
    try {
      if (aiAnalysis.category === 'Income') {
        await this.prisma.income.create({
          data: {
            userId: transaction.userId,
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
            userId: transaction.userId,
            category: aiAnalysis.category,
            amount: transaction.amount,
            note: transaction.description,
            source: 'bank',
            bankRef: transaction.reference
          }
        });
      }
    } catch (error) {
      console.error('❌ Error creating corresponding transaction:', error);
    }
  }

  // Mark email as read
  async markAsRead(emailId) {
    return new Promise((resolve, reject) => {
      this.imap.addFlags(emailId, '\\Seen', (err) => {
        if (err) {
          console.error('❌ Error marking email as read:', err);
          reject(err);
        } else {
          console.log(`📧 Marked email ${emailId} as read`);
          resolve();
        }
      });
    });
  }

  // Get email stats
  async getEmailStats() {
    try {
      const totalEmails = await this.prisma.bankTransaction.count();
      const processedEmails = await this.prisma.bankTransaction.count({
        where: { processed: true }
      });
      const aiProcessed = await this.prisma.bankTransaction.count({
        where: { aiProcessed: true }
      });

      return {
        total: totalEmails,
        processed: processedEmails,
        aiProcessed: aiProcessed,
        pending: totalEmails - processedEmails,
        currentInterval: this.adaptiveInterval,
        consecutiveEmails: this.consecutiveEmails,
        consecutiveNoEmails: this.consecutiveNoEmails
      };
    } catch (error) {
      console.error('❌ Error getting email stats:', error);
      return null;
    }
  }
}

module.exports = EmailService; 