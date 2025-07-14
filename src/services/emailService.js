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
    this.adaptiveInterval = 5000; // Bắt đầu với 5 giây
    this.maxInterval = 30000; // Tối đa 30 giây
    this.minInterval = 2000; // Tối thiểu 2 giây
    this.consecutiveNoEmails = 0;
    this.consecutiveEmails = 0;
  }

  // Kết nối IMAP
  async connect() {
    try {
      this.imap = new Imap({
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
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

  // Bắt đầu monitoring với adaptive polling
  async startMonitoring() {
    if (!this.isConnected) {
      await this.connect();
    }

    if (this.isMonitoring) {
      console.log('⚠️ Email monitoring already running');
      return;
    }

    this.isMonitoring = true;
    console.log('📧 Starting adaptive email monitoring...');

    // Kiểm tra ngay lập tức
    await this.checkNewEmails();

    // Bắt đầu adaptive polling
    this.startAdaptivePolling();
  }

  // Adaptive polling - điều chỉnh interval dựa trên hoạt động
  startAdaptivePolling() {
    const poll = async () => {
      if (!this.isMonitoring) return;

      try {
        const hasNewEmails = await this.checkNewEmails();
        
        if (hasNewEmails) {
          // Có email mới - giảm interval để kiểm tra nhanh hơn
          this.consecutiveEmails++;
          this.consecutiveNoEmails = 0;
          
          if (this.consecutiveEmails >= 3) {
            this.adaptiveInterval = Math.max(this.minInterval, this.adaptiveInterval / 2);
            console.log(`📧 High email activity - reducing interval to ${this.adaptiveInterval}ms`);
          }
        } else {
          // Không có email mới - tăng interval để tiết kiệm tài nguyên
          this.consecutiveNoEmails++;
          this.consecutiveEmails = 0;
          
          if (this.consecutiveNoEmails >= 5) {
            this.adaptiveInterval = Math.min(this.maxInterval, this.adaptiveInterval * 1.5);
            console.log(`📧 Low email activity - increasing interval to ${this.adaptiveInterval}ms`);
          }
        }

        // Lên lịch kiểm tra tiếp theo
        this.checkInterval = setTimeout(poll, this.adaptiveInterval);
        
      } catch (error) {
        console.error('❌ Error in adaptive polling:', error);
        // Nếu có lỗi, thử lại sau 10 giây
        this.checkInterval = setTimeout(poll, 10000);
      }
    };

    // Bắt đầu polling
    poll();
  }

  // Dừng monitoring
  stopMonitoring() {
    this.isMonitoring = false;
    if (this.checkInterval) {
      clearTimeout(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.imap) {
      this.imap.end();
    }
    console.log('📧 Email monitoring stopped');
  }

  // Kiểm tra email mới với thông tin chi tiết
  async checkNewEmails() {
    if (!this.isConnected) return false;

    return new Promise((resolve, reject) => {
      this.imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          console.error('❌ Error opening inbox:', err);
          reject(err);
          return;
        }

        // Tìm email chưa đọc từ ngân hàng
        const searchCriteria = [
          ['UNSEEN'],
          ['FROM', 'noreply@vcb.com.vn'],
          ['FROM', 'noreply@tcb.com.vn'],
          ['FROM', 'noreply@tpb.com.vn'],
          ['FROM', 'noreply@mbbank.com.vn'],
          ['FROM', 'noreply@acb.com.vn'],
          ['FROM', 'noreply@techcombank.com.vn'],
          ['OR'],
          ['SUBJECT', 'GD:'],
          ['SUBJECT', 'Giao dich:'],
          ['SUBJECT', 'Transaction:'],
          ['BODY', 'So du:'],
          ['BODY', 'Balance:']
        ];

        this.imap.search(searchCriteria, (err, results) => {
          if (err) {
            console.error('❌ Error searching emails:', err);
            reject(err);
            return;
          }

          if (results.length === 0) {
            console.log('📧 No new bank emails found');
            resolve(false);
            return;
          }

          console.log(`📧 Found ${results.length} new bank emails`);
          this.processEmails(results);
          resolve(true);
        });
      });
    });
  }

  // Xử lý danh sách email với thông báo real-time
  async processEmails(emailIds) {
    console.log(`🔄 Processing ${emailIds.length} emails...`);
    
    for (const id of emailIds) {
      try {
        const email = await this.fetchEmail(id);
        console.log(`📧 Processing email: ${email.subject} from ${email.from}`);
        
        const transactionInfo = this.extractTransactionInfo(email);
        
        if (!transactionInfo) {
          console.log('⚠️ Could not extract transaction info from email');
          await this.markAsRead(id);
          continue;
        }

        // Lưu vào database
        const bankTransaction = await this.saveBankTransaction(transactionInfo);
        
        // AI phân tích và tạo giao dịch
        await this.processWithAI(bankTransaction);
        
        // Đánh dấu đã đọc
        await this.markAsRead(id);
        
        console.log(`✅ Processed transaction: ${transactionInfo.amount}đ from ${transactionInfo.bankName}`);
        
        // Thông báo real-time (có thể gửi notification)
        await this.sendRealTimeNotification(transactionInfo);
        
      } catch (error) {
        console.error(`❌ Error processing email ${id}:`, error);
      }
    }
  }

  // Gửi thông báo real-time
  async sendRealTimeNotification(transactionInfo) {
    try {
      // Có thể tích hợp với Telegram bot để gửi notification
      const message = `🏦 **Giao dịch mới được phát hiện!**

💰 **Số tiền:** ${transactionInfo.amount.toLocaleString('vi-VN')}đ
🏛️ **Ngân hàng:** ${transactionInfo.bankName}
📝 **Mô tả:** ${transactionInfo.description}
📅 **Thời gian:** ${new Date().toLocaleString('vi-VN')}

🤖 **AI đang phân tích và tạo giao dịch...**`;

      console.log('📢 Real-time notification:', message);
      
      // TODO: Gửi notification qua Telegram bot
      // await bot.telegram.sendMessage(userId, message, { parse_mode: 'Markdown' });
      
    } catch (error) {
      console.error('❌ Error sending real-time notification:', error);
    }
  }

  // Lấy nội dung email
  async fetchEmail(emailId) {
    return new Promise((resolve, reject) => {
      const fetch = this.imap.fetch(emailId, { bodies: '' });

      fetch.on('message', (msg, seqno) => {
        let buffer = '';
        msg.on('body', (stream, info) => {
          stream.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
          });
        });

        msg.once('end', async () => {
          try {
            const parsed = await simpleParser(buffer);
            resolve({
              id: emailId,
              from: parsed.from?.text || '',
              subject: parsed.subject || '',
              text: parsed.text || '',
              html: parsed.html || '',
              date: parsed.date || new Date()
            });
          } catch (error) {
            reject(error);
          }
        });
      });

      fetch.once('error', reject);
    });
  }

  // Xử lý email từ ngân hàng
  async processBankEmail(email) {
    try {
      console.log(`📧 Processing email: ${email.subject}`);

      // Phân tích email để trích xuất thông tin giao dịch
      const transactionInfo = this.extractTransactionInfo(email);
      
      if (!transactionInfo) {
        console.log('⚠️ Could not extract transaction info from email');
        return;
      }

      // Lưu vào database
      const bankTransaction = await this.saveBankTransaction(transactionInfo);
      
      // AI phân tích và tạo giao dịch
      await this.processWithAI(bankTransaction);
      
      console.log(`✅ Processed transaction: ${transactionInfo.amount}đ`);
      
    } catch (error) {
      console.error('❌ Error processing bank email:', error);
    }
  }

  // Trích xuất thông tin giao dịch từ email
  extractTransactionInfo(email) {
    try {
      const text = email.text || email.html || '';
      
      // Detect ngân hàng
      const bankName = this.detectBank(email.from, email.subject, text);
      
      // Trích xuất thông tin giao dịch
      const transactionInfo = {
        bankName,
        amount: this.extractAmount(text),
        type: this.extractTransactionType(text),
        description: this.extractDescription(text),
        reference: this.extractReference(text),
        date: email.date,
        rawEmail: text
      };

      // Validate thông tin
      if (!transactionInfo.amount || !transactionInfo.type) {
        return null;
      }

      return transactionInfo;
    } catch (error) {
      console.error('❌ Error extracting transaction info:', error);
      return null;
    }
  }

  // Detect ngân hàng
  detectBank(from, subject, text) {
    const fromLower = from.toLowerCase();
    const subjectLower = subject.toLowerCase();
    const textLower = text.toLowerCase();

    if (fromLower.includes('vcb') || textLower.includes('vietcombank')) return 'VCB';
    if (fromLower.includes('tcb') || textLower.includes('techcombank')) return 'TCB';
    if (fromLower.includes('tpb') || textLower.includes('tpbank')) return 'TPBank';
    if (fromLower.includes('mbbank') || textLower.includes('mb bank')) return 'MBBank';
    if (fromLower.includes('acb') || textLower.includes('acb bank')) return 'ACB';
    if (fromLower.includes('techcombank')) return 'Techcombank';

    return 'Unknown';
  }

  // Trích xuất số tiền
  extractAmount(text) {
    const amountRegex = /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:VND|đ|dong)/gi;
    const matches = text.match(amountRegex);
    
    if (matches && matches.length > 0) {
      const amount = matches[0].replace(/[^\d]/g, '');
      return parseInt(amount);
    }

    // Tìm số tiền trong format khác
    const numberRegex = /(\d{1,3}(?:,\d{3})*)/g;
    const numbers = text.match(numberRegex);
    
    if (numbers && numbers.length > 0) {
      // Lấy số lớn nhất (thường là số tiền giao dịch)
      const amounts = numbers.map(n => parseInt(n.replace(/,/g, '')));
      return Math.max(...amounts);
    }

    return null;
  }

  // Trích xuất loại giao dịch
  extractTransactionType(text) {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('+') || textLower.includes('credit') || textLower.includes('nhan')) {
      return 'credit';
    }
    
    if (textLower.includes('-') || textLower.includes('debit') || textLower.includes('chi')) {
      return 'debit';
    }

    return 'unknown';
  }

  // Trích xuất mô tả
  extractDescription(text) {
    // Tìm mô tả giao dịch
    const descRegex = /(?:GD|Giao dich|Transaction):\s*(.+?)(?:\n|$)/i;
    const match = text.match(descRegex);
    
    if (match) {
      return match[1].trim();
    }

    // Tìm dòng có chứa thông tin giao dịch
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.includes('GD:') || line.includes('Giao dich:') || line.includes('Transaction:')) {
        return line.replace(/.*?:/, '').trim();
      }
    }

    return 'Bank transaction';
  }

  // Trích xuất mã tham chiếu
  extractReference(text) {
    const refRegex = /(?:Ref|Reference|Ma GD):\s*([A-Z0-9]+)/i;
    const match = text.match(refRegex);
    
    if (match) {
      return match[1];
    }

    // Tạo mã tham chiếu từ timestamp
    return `BANK_${Date.now()}`;
  }

  // Lưu giao dịch ngân hàng vào database
  async saveBankTransaction(transactionInfo) {
    try {
      const bankTransaction = await this.prisma.bankTransaction.create({
        data: {
          bankName: transactionInfo.bankName,
          amount: transactionInfo.amount,
          type: transactionInfo.type,
          description: transactionInfo.description,
          reference: transactionInfo.reference,
          date: transactionInfo.date,
          rawEmail: transactionInfo.rawEmail,
          processed: false
        }
      });

      console.log(`💾 Saved bank transaction: ${bankTransaction.id}`);
      return bankTransaction;
    } catch (error) {
      console.error('❌ Error saving bank transaction:', error);
      throw error;
    }
  }

  // Xử lý với AI
  async processWithAI(bankTransaction) {
    try {
      // AI phân tích giao dịch
      const aiAnalysis = await this.analyzeTransactionWithAI(bankTransaction);
      
      // Cập nhật thông tin AI
      await this.prisma.bankTransaction.update({
        where: { id: bankTransaction.id },
        data: {
          aiProcessed: true,
          aiCategory: aiAnalysis.category,
          aiConfidence: aiAnalysis.confidence
        }
      });

      // Tạo giao dịch tương ứng
      await this.createCorrespondingTransaction(bankTransaction, aiAnalysis);
      
    } catch (error) {
      console.error('❌ Error processing with AI:', error);
    }
  }

  // AI phân tích giao dịch
  async analyzeTransactionWithAI(bankTransaction) {
    try {
      // Sử dụng AI để phân tích mô tả giao dịch
      const analysis = await this.analyzeDescriptionWithAI(bankTransaction.description);
      
      return {
        category: analysis.category,
        confidence: analysis.confidence,
        type: bankTransaction.type === 'credit' ? 'income' : 'expense'
      };
    } catch (error) {
      console.error('❌ Error in AI analysis:', error);
      return {
        category: 'Other',
        confidence: 0.5,
        type: bankTransaction.type === 'credit' ? 'income' : 'expense'
      };
    }
  }

  // AI phân tích mô tả
  async analyzeDescriptionWithAI(description) {
    // Đây là logic AI đơn giản, có thể thay thế bằng OpenAI API
    const descriptionLower = description.toLowerCase();
    
    // Phân loại theo từ khóa
    const categories = {
      'Food': ['an', 'com', 'food', 'restaurant', 'cafe', 'coffee'],
      'Transport': ['xe', 'taxi', 'grab', 'uber', 'transport', 'gas'],
      'Shopping': ['mua', 'buy', 'shop', 'store', 'market'],
      'Entertainment': ['game', 'movie', 'cinema', 'karaoke', 'entertainment'],
      'Bills': ['bill', 'hoa don', 'electricity', 'water', 'internet'],
      'Salary': ['luong', 'salary', 'wage', 'income'],
      'Investment': ['investment', 'stock', 'fund', 'trading']
    };

    let bestCategory = 'Other';
    let bestScore = 0;

    for (const [category, keywords] of Object.entries(categories)) {
      let score = 0;
      for (const keyword of keywords) {
        if (descriptionLower.includes(keyword)) {
          score += 1;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    return {
      category: bestCategory,
      confidence: bestScore > 0 ? Math.min(bestScore / 3, 1) : 0.3
    };
  }

  // Tạo giao dịch tương ứng
  async createCorrespondingTransaction(bankTransaction, aiAnalysis) {
    try {
      if (aiAnalysis.type === 'income') {
        // Tạo income record
        await this.prisma.income.create({
          data: {
            userId: 'system', // Sẽ cập nhật sau khi có user mapping
            source: aiAnalysis.category.toLowerCase(),
            amount: bankTransaction.amount,
            description: bankTransaction.description,
            aiCategory: aiAnalysis.category,
            aiConfidence: aiAnalysis.confidence,
            bankTransactionId: bankTransaction.id
          }
        });
      } else {
        // Tạo expense record
        await this.prisma.expense.create({
          data: {
            userId: 'system', // Sẽ cập nhật sau khi có user mapping
            category: aiAnalysis.category,
            amount: bankTransaction.amount,
            note: bankTransaction.description,
            source: 'bank',
            bankRef: bankTransaction.reference
          }
        });
      }

      // Cập nhật trạng thái đã xử lý
      await this.prisma.bankTransaction.update({
        where: { id: bankTransaction.id },
        data: { processed: true }
      });

      console.log(`✅ Created ${aiAnalysis.type} transaction from bank data`);
      
    } catch (error) {
      console.error('❌ Error creating corresponding transaction:', error);
    }
  }

  // Đánh dấu email đã đọc
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

  // Lấy thống kê email
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

  // Force check ngay lập tức
  async forceCheck() {
    console.log('🔍 Force checking for new emails...');
    return await this.checkNewEmails();
  }

  // Cập nhật interval
  updateInterval(newInterval) {
    this.adaptiveInterval = Math.max(this.minInterval, Math.min(this.maxInterval, newInterval));
    console.log(`📧 Updated polling interval to ${this.adaptiveInterval}ms`);
  }
}

module.exports = EmailService; 