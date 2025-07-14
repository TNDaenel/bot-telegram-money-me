require('dotenv').config();

// Helper function to get translation from environment variables
function getTranslation(lang, key) {
  const envKey = `${lang.toUpperCase()}_${key.toUpperCase()}`;
  return process.env[envKey] || key;
}

// Get all translations for a language
function getAllTranslations(lang) {
  const translations = {};
  const langPrefix = `${lang.toUpperCase()}_`;
  
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith(langPrefix)) {
      const translationKey = key.replace(langPrefix, '').toLowerCase();
      translations[translationKey] = value;
    }
  }
  
  return translations;
}

// Get supported languages
function getSupportedLanguages() {
  const languages = ['vi', 'en', 'zh', 'ja', 'ko'];
  return languages.map(code => ({
    code,
    name: getTranslation(code, 'LANGUAGE_NAME') || code.toUpperCase()
  }));
}

// Get language name
function getLanguageName(lang) {
  const names = {
    vi: 'Tiếng Việt',
    en: 'English', 
    zh: '中文',
    ja: '日本語',
    ko: '한국어'
  };
  return names[lang] || lang;
}

module.exports = {
  vi: {
    // Common
    ERROR: '❌ Đã xảy ra lỗi',
    BACK: '🔙 Quay lại',
    BACK_MAIN: '🏠 Menu chính',
    SUCCESS: '✅ Thành công',
    LOADING: '⏳ Đang xử lý...',
    NO_DATA: '📝 Chưa có dữ liệu',
    
    // Welcome & Main Menu
    WELCOME_MESSAGE: '👋 Chào mừng bạn đến với Bot Quản lý Chi tiêu Thông minh!',
    WELCOME_DESCRIPTION: 'Tôi có thể giúp bạn:\n• 📝 Ghi chi tiêu: "Ăn sáng 50k"\n• 📊 Thống kê chi tiết theo thời gian\n• 💰 Quản lý thu nhập và hũ tiền\n• 💬 Tư vấn tài chính thông minh\n• 🛍️ Tư vấn mua sắm dựa trên dữ liệu\n• 🏦 Tích hợp ngân hàng tự động\n• 📋 Theo dõi lịch sử giao dịch',
    SELECT_FUNCTION: '👇 Chọn chức năng bạn muốn sử dụng:',
    STATS_MENU: '📊 Thống kê',
    INCOME_STATS: '💰 Thu nhập',
    BALANCE: '💳 Số dư',
    JARS: '🏺 Hũ tiền',
    HISTORY: '📋 Lịch sử',
    BANK_SETUP: '🏦 Ngân hàng',
    HELP: '❓ Hướng dẫn',
    
    // Bank Menu
    BANK_MENU: '🏦 Quản lý Ngân hàng & Email',
    BANK_STATS: '📊 Thống kê',
    TOTAL_TRANSACTIONS: 'Tổng giao dịch',
    PROCESSED_TRANSACTIONS: 'Đã xử lý',
    PENDING_TRANSACTIONS: 'Chờ xử lý',
    TOTAL_AMOUNT: 'Tổng tiền',
    MONITORING_STATUS: '📡 Trạng thái Giám sát',
    STATUS: 'Trạng thái',
    UPTIME: 'Thời gian hoạt động',
    EMAILS_PROCESSED: 'Email đã xử lý',
    LAST_EMAIL: 'Email cuối cùng',
    
    // Bank Setup
    BANK_SETUP_TITLE: '⚙️ Thiết lập Kết nối Ngân hàng & Email',
    STEP_1: 'Bước 1: Bật xác thực 2 lớp',
    STEP_2: 'Bước 2: Tạo mật khẩu ứng dụng',
    STEP_3: 'Bước 3: Thiết lập chuyển tiếp email',
    STEP_4: 'Bước 4: Kiểm tra kết nối',
    SETUP_GMAIL_2FA: 'Vào Google Account → Security → 2-Step Verification',
    CREATE_APP_PASSWORD: 'Vào Google Account → Security → App passwords → Chọn "Mail" → "Other" → Nhập "Expense Bot"',
    SETUP_EMAIL_FORWARD: 'Thiết lập chuyển tiếp email từ ngân hàng đến email đã cấu hình',
    TEST_CONNECTION: '🔍 Kiểm tra kết nối',
    SUPPORTED_BANKS: '🏦 Ngân hàng được hỗ trợ',
    SUPPORTED_SERVICES: '📧 Dịch vụ được hỗ trợ',
    UTILITY_BILLS: '⚡ Hóa đơn tiện ích (điện, nước)',
    ECOMMERCE: '🛍️ Mua sắm trực tuyến (Tiki, Shopee, Lazada)',
    BANK_TRANSACTIONS: '💳 Giao dịch ngân hàng',
    START_SETUP: '➡️ Bắt đầu thiết lập',
    
    // Bank Actions
    SETUP_BANK: '⚙️ Thiết lập',
    VIEW_TRANSACTIONS: '📋 Xem giao dịch',
    VIEW_PENDING: '⏳ Chờ xử lý',
    CHECK_NOW: '🔍 Kiểm tra ngay',
    VIEW_STATUS: '📊 Trạng thái',
    START_MONITORING: '▶️ Bắt đầu giám sát',
    STOP_MONITORING: '⏹️ Dừng giám sát',
    SETUP_AGAIN: '🔄 Thiết lập lại',
    
    // Bank Transactions
    RECENT_TRANSACTIONS: '📋 Giao dịch Gần đây',
    NO_TRANSACTIONS: '📝 Chưa có giao dịch nào',
    VIEW_MORE: '📋 Xem thêm',
    LAST_TRANSACTION: 'Giao dịch cuối',
    
    // Pending Transactions
    PENDING_TRANSACTIONS: '⏳ Giao dịch Chờ Xử lý',
    NO_PENDING_TRANSACTIONS: '✅ Không có giao dịch chờ xử lý',
    APPROVE_ALL: '✅ Duyệt tất cả',
    REJECT_ALL: '❌ Từ chối tất cả',
    
    // Email Stats
    EMAIL_STATS: '📊 Thống kê Email',
    TOTAL_EMAILS: 'Tổng email',
    PROCESSED_EMAILS: 'Email đã xử lý',
    AI_PROCESSED: 'AI đã phân tích',
    PENDING_EMAILS: 'Email chờ xử lý',
    AVG_PROCESSING_TIME: 'Thời gian xử lý TB',
    CURRENT_INTERVAL: 'Chu kỳ kiểm tra',
    
    // Status Messages
    TESTING_CONNECTION: '🔄 Đang kiểm tra kết nối...',
    TEST_SUCCESS: '✅ Kết nối thành công!',
    TEST_FAILED: '❌ Kết nối thất bại',
    TEST_ERROR: '❌ Lỗi kiểm tra kết nối',
    CHECKING_EMAILS: '🔍 Đang kiểm tra email...',
    NEW_EMAILS_FOUND: '✅ Phát hiện email mới và đã xử lý!',
    NO_NEW_EMAILS: '📭 Không có email mới',
    NO_STATUS_AVAILABLE: '❌ Không có thông tin trạng thái',
    NO_STATS_AVAILABLE: '❌ Chưa có thống kê',
    
    // Error Messages
    ERROR_GETTING_STATS: '❌ Lỗi khi lấy thống kê',
    ERROR_GETTING_TRANSACTIONS: '❌ Lỗi khi lấy giao dịch',
    ERROR_GETTING_PENDING: '❌ Lỗi khi lấy giao dịch chờ xử lý',
    ERROR_CHECKING_EMAILS: '❌ Lỗi khi kiểm tra email',
    ERROR_GETTING_STATUS: '❌ Lỗi khi lấy trạng thái',
    
    // Stats
    STATS_TITLE: '📊 Thống kê Chi tiêu',
    SELECT_TIME: 'Chọn khoảng thời gian',
    TODAY: 'Hôm nay',
    THIS_WEEK: 'Tuần này',
    THIS_MONTH: 'Tháng này',
    THIS_YEAR: 'Năm này',
    CUSTOM: 'Tùy chỉnh',
    
    // Help
    HELP_TITLE: '❓ **Hướng dẫn Sử dụng**',
    HELP_BOT_TITLE: '🤖 Bot quản lý chi tiêu thông minh',
    HELP_EXPENSE_TITLE: '📝 **Ghi chi tiêu:**',
    HELP_EXPENSE_EXAMPLES: '• "Ăn trưa 80k"\n• "Cà phê 30000 với bạn"\n• "Xăng 200k"',
    HELP_ADVICE_TITLE: '💬 **Tư vấn chat:**',
    HELP_ADVICE_EXAMPLES: '• "Tư vấn tiết kiệm"\n• "Làm sao giảm chi tiêu?"\n• "Gợi ý kế hoạch tài chính"',
    HELP_SHOPPING_TITLE: '🛍️ **Tư vấn mua sắm:**',
    HELP_SHOPPING_EXAMPLES: '• "Tư vấn mua điện thoại"\n• "Có nên mua laptop?"\n• "Có nên mua quần áo?"',
    HELP_STATS_TITLE: '📊 **Thống kê chi tiêu:**',
    HELP_STATS_COMMANDS: '• /stats_menu - Menu thống kê\n• /stats_today - Hôm nay\n• /stats_week - Tuần này\n• /stats_month - Tháng này\n• /stats_year - Năm này',
    HELP_FINANCE_TITLE: '💰 **Quản lý tài chính:**',
    HELP_FINANCE_COMMANDS: '• /balance - Số dư hiện tại\n• /add_income - Thêm thu nhập\n• /income_stats - Thống kê thu nhập\n• /jars - Quản lý hũ\n• /history - Lịch sử giao dịch',
    HELP_BANK_TITLE: '🏦 **Tích hợp ngân hàng:**',
    HELP_BANK_COMMANDS: '• /bank_help - Hướng dẫn\n• /bank_start - Thiết lập\n• /bank_transactions - Xem giao dịch',
    HELP_LANGUAGE_TITLE: '🌐 **Ngôn ngữ:**',
    HELP_LANGUAGE_COMMANDS: '• /language - Đổi ngôn ngữ'
  },
  
  en: {
    // Common
    ERROR: '❌ An error occurred',
    BACK: '🔙 Back',
    BACK_MAIN: '🏠 Main Menu',
    SUCCESS: '✅ Success',
    LOADING: '⏳ Processing...',
    NO_DATA: '📝 No data available',
    
    // Welcome & Main Menu
    WELCOME_MESSAGE: '👋 Welcome to the Smart Expense Management Bot!',
    WELCOME_DESCRIPTION: 'I can help you with:\n• 📝 Record expenses: "Breakfast 50k"\n• 📊 Detailed statistics by time period\n• 💰 Manage income and money jars\n• 💬 Smart financial advice\n• 🛍️ Shopping advice based on data\n• 🏦 Automatic bank integration\n• 📋 Track transaction history',
    SELECT_FUNCTION: '👇 Choose the function you want to use:',
    STATS_MENU: '📊 Statistics',
    INCOME_STATS: '💰 Income',
    BALANCE: '💳 Balance',
    JARS: '🏺 Money Jars',
    HISTORY: '📋 History',
    BANK_SETUP: '🏦 Bank',
    HELP: '❓ Help',
    
    // Bank Menu
    BANK_MENU: '🏦 Bank & Email Management',
    BANK_STATS: '📊 Statistics',
    TOTAL_TRANSACTIONS: 'Total transactions',
    PROCESSED_TRANSACTIONS: 'Processed',
    PENDING_TRANSACTIONS: 'Pending',
    TOTAL_AMOUNT: 'Total amount',
    MONITORING_STATUS: '📡 Monitoring Status',
    STATUS: 'Status',
    UPTIME: 'Uptime',
    EMAILS_PROCESSED: 'Emails processed',
    LAST_EMAIL: 'Last email',
    
    // Bank Setup
    BANK_SETUP_TITLE: '⚙️ Bank & Email Connection Setup',
    STEP_1: 'Step 1: Enable 2-Step Verification',
    STEP_2: 'Step 2: Create App Password',
    STEP_3: 'Step 3: Setup Email Forwarding',
    STEP_4: 'Step 4: Test Connection',
    SETUP_GMAIL_2FA: 'Go to Google Account → Security → 2-Step Verification',
    CREATE_APP_PASSWORD: 'Go to Google Account → Security → App passwords → Select "Mail" → "Other" → Enter "Expense Bot"',
    SETUP_EMAIL_FORWARD: 'Setup email forwarding from your bank to the configured email',
    TEST_CONNECTION: '🔍 Test connection',
    SUPPORTED_BANKS: '🏦 Supported Banks',
    SUPPORTED_SERVICES: '📧 Supported Services',
    UTILITY_BILLS: '⚡ Utility bills (electricity, water)',
    ECOMMERCE: '🛍️ Online shopping (Tiki, Shopee, Lazada)',
    BANK_TRANSACTIONS: '💳 Bank transactions',
    START_SETUP: '➡️ Start Setup',
    
    // Bank Actions
    SETUP_BANK: '⚙️ Setup',
    VIEW_TRANSACTIONS: '📋 View transactions',
    VIEW_PENDING: '⏳ Pending',
    CHECK_NOW: '🔍 Check now',
    VIEW_STATUS: '📊 Status',
    START_MONITORING: '▶️ Start monitoring',
    STOP_MONITORING: '⏹️ Stop monitoring',
    SETUP_AGAIN: '🔄 Setup again',
    
    // Bank Transactions
    RECENT_TRANSACTIONS: '📋 Recent Transactions',
    NO_TRANSACTIONS: '📝 No transactions yet',
    VIEW_MORE: '📋 View more',
    LAST_TRANSACTION: 'Last transaction',
    
    // Pending Transactions
    PENDING_TRANSACTIONS: '⏳ Pending Transactions',
    NO_PENDING_TRANSACTIONS: '✅ No pending transactions',
    APPROVE_ALL: '✅ Approve all',
    REJECT_ALL: '❌ Reject all',
    
    // Email Stats
    EMAIL_STATS: '📊 Email Statistics',
    TOTAL_EMAILS: 'Total emails',
    PROCESSED_EMAILS: 'Processed emails',
    AI_PROCESSED: 'AI analyzed',
    PENDING_EMAILS: 'Pending emails',
    AVG_PROCESSING_TIME: 'Avg. processing time',
    CURRENT_INTERVAL: 'Check interval',
    
    // Status Messages
    TESTING_CONNECTION: '🔄 Testing connection...',
    TEST_SUCCESS: '✅ Connection successful!',
    TEST_FAILED: '❌ Connection failed',
    TEST_ERROR: '❌ Connection test error',
    CHECKING_EMAILS: '🔍 Checking emails...',
    NEW_EMAILS_FOUND: '✅ New emails found and processed!',
    NO_NEW_EMAILS: '📭 No new emails',
    NO_STATUS_AVAILABLE: '❌ No status information available',
    NO_STATS_AVAILABLE: '❌ No statistics available',
    
    // Error Messages
    ERROR_GETTING_STATS: '❌ Error getting statistics',
    ERROR_GETTING_TRANSACTIONS: '❌ Error getting transactions',
    ERROR_GETTING_PENDING: '❌ Error getting pending transactions',
    ERROR_CHECKING_EMAILS: '❌ Error checking emails',
    ERROR_GETTING_STATUS: '❌ Error getting status',
    
    // Stats
    STATS_TITLE: '📊 Expense Statistics',
    SELECT_TIME: 'Select time period',
    TODAY: 'Today',
    THIS_WEEK: 'This week',
    THIS_MONTH: 'This month',
    THIS_YEAR: 'This year',
    CUSTOM: 'Custom',
    
    // Help
    HELP_TITLE: '❓ **Usage Guide**',
    HELP_BOT_TITLE: '🤖 Smart expense management bot',
    HELP_EXPENSE_TITLE: '📝 **Record expenses:**',
    HELP_EXPENSE_EXAMPLES: '• "Lunch 80k"\n• "Coffee 30000 with friend"\n• "Gas 200k"',
    HELP_ADVICE_TITLE: '💬 **Chat advice:**',
    HELP_ADVICE_EXAMPLES: '• "Savings advice"\n• "How to reduce expenses?"\n• "Financial planning suggestions"',
    HELP_SHOPPING_TITLE: '🛍️ **Shopping advice:**',
    HELP_SHOPPING_EXAMPLES: '• "Phone buying advice"\n• "Should I buy a laptop?"\n• "Should I buy clothes?"',
    HELP_STATS_TITLE: '📊 **Expense statistics:**',
    HELP_STATS_COMMANDS: '• /stats_menu - Statistics menu\n• /stats_today - Today\n• /stats_week - This week\n• /stats_month - This month\n• /stats_year - This year',
    HELP_FINANCE_TITLE: '💰 **Financial management:**',
    HELP_FINANCE_COMMANDS: '• /balance - Current balance\n• /add_income - Add income\n• /income_stats - Income statistics\n• /jars - Manage jars\n• /history - Transaction history',
    HELP_BANK_TITLE: '🏦 **Bank integration:**',
    HELP_BANK_COMMANDS: '• /bank_help - Help\n• /bank_start - Setup\n• /bank_transactions - View transactions',
    HELP_LANGUAGE_TITLE: '🌐 **Language:**',
    HELP_LANGUAGE_COMMANDS: '• /language - Change language'
  }
}; 