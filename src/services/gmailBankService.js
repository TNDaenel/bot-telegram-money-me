const { google } = require('googleapis');
const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
require('dotenv').config();

class GmailBankService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
    this.oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });
  }

  async getAccessToken() {
    const { token } = await this.oauth2Client.getAccessToken();
    return token;
  }

  async connect() {
    const accessToken = await this.getAccessToken();
    const config = {
      imap: {
        user: process.env.GMAIL_USER,
        xoauth2: accessToken,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        authTimeout: 3000
      }
    };
    this.connection = await imaps.connect(config);
    await this.connection.openBox('INBOX');
    console.log('✅ Đã kết nối Gmail bằng OAuth2');
  }

  async fetchBankEmails() {
    // Lọc email từ các ngân hàng
    const searchCriteria = [
      'UNSEEN',
      ['OR',
        ['FROM', 'noreply@vcb.com.vn'],
        ['FROM', 'noreply@acb.com.vn'],
        ['FROM', 'internetbanking@sacombank.com']
      ]
    ];
    const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };
    const results = await this.connection.search(searchCriteria, fetchOptions);

    for (const res of results) {
      const all = res.parts.find(part => part.which === 'TEXT');
      const parsed = await simpleParser(all.body);

      // Trích xuất thông tin giao dịch
      const info = this.extractTransactionInfo(parsed);
      if (info) {
        // Tạo expense/income trong hệ thống
        await this.createTransaction(info);
      }
    }
  }

  extractTransactionInfo(email) {
    // Ví dụ: dùng regex để lấy số tiền, loại giao dịch, thời gian, mô tả
    const body = email.text;
    const amountMatch = body.match(/Số tiền[:\s]+([\d.,]+)/i);
    const typeMatch = body.match(/(Ghi nợ|Ghi có|Debit|Credit)/i);
    const dateMatch = body.match(/Ngày[:\s]+([\d\/: ]+)/i);
    const descMatch = body.match(/Nội dung[:\s]+(.+)/i);

    if (amountMatch && typeMatch && dateMatch) {
      return {
        amount: amountMatch[1].replace(/[.,]/g, ''),
        type: /nợ|debit/i.test(typeMatch[1]) ? 'expense' : 'income',
        date: dateMatch[1],
        description: descMatch ? descMatch[1] : email.subject
      };
    }
    return null;
  }

  async createTransaction(info) {
    // Gọi service tạo expense/income, ví dụ:
    console.log('Tạo giao dịch:', info);
    // await ExpenseService.create({ ...info });
    // hoặc lưu vào DB
  }
}

module.exports = GmailBankService;

// --- Sử dụng thử ---
if (require.main === module) {
  (async () => {
    const service = new GmailBankService();
    await service.connect();
    await service.fetchBankEmails();
  })();
} 