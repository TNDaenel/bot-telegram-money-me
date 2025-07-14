# Cấu hình Đa ngôn ngữ cho Bot

## Bước 1: Tạo file .env

Tạo file `.env` trong thư mục gốc với nội dung sau:

```env
# Bot Configuration
BOT_TOKEN=your_bot_token_here
DATABASE_URL="postgresql://username:password@localhost:5432/expense_bot"

# Email Configuration (for bank integration)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Web App URL
WEB_APP_URL=https://your-expense-app.com

# Language Translation Keys
# Vietnamese (vi)
VI_WELCOME_MESSAGE=👋 Chào mừng bạn đến với Bot Quản lý Chi tiêu Thông minh!
VI_WELCOME_DESCRIPTION=Tôi có thể giúp bạn:\n• 📝 Ghi chi tiêu: "Ăn sáng 50k"\n• 📊 Thống kê chi tiết theo thời gian\n• 💰 Quản lý thu nhập và hũ tiền\n• 💬 Tư vấn tài chính thông minh\n• 🛍️ Tư vấn mua hàng dựa trên dữ liệu\n• 🏦 Tích hợp ngân hàng tự động\n• 📋 Theo dõi lịch sử giao dịch
VI_SELECT_FUNCTION=👇 Chọn chức năng bạn muốn sử dụng:
VI_STATS_MENU=📊 Xem tổng thu chi
VI_INCOME_STATS=💰 Xem tổng thu nhập
VI_BALANCE=💳 Số tiền hiện tại
VI_JARS=🏺 Chi tiết các hũ
VI_HISTORY=📋 Lịch sử thu/chi
VI_BANK_SETUP=🏦 Connect Email/Bank
VI_LANGUAGE=🌐 Ngôn ngữ
VI_HELP=❓ Hướng dẫn
VI_BACK=🔙 Quay lại
VI_MAIN_MENU=🏠 Menu chính
VI_SUCCESS=✅ Thành công
VI_ERROR=❌ Lỗi
VI_LANGUAGE_CHANGED=✅ Đã thay đổi ngôn ngữ thành công!

# Stats keys
VI_STATS_TITLE=Thống kê Chi tiêu
VI_SELECT_TIME=Chọn thời gian
VI_TODAY=Hôm nay
VI_THIS_WEEK=Tuần này
VI_THIS_MONTH=Tháng này
VI_THIS_YEAR=Năm này
VI_CUSTOM=Tùy chỉnh

# Help keys
VI_HELP_TITLE=❓ **Hướng dẫn**
VI_HELP_EXPENSE_TITLE=📝 **Ghi chi tiêu:**
VI_HELP_EXPENSE_EXAMPLES=• "Ăn trưa 80k"\n• "Cafe 30000 với bạn"\n• "Xăng xe 200k"
VI_HELP_ADVICE_TITLE=💬 Chat tư vấn:
VI_HELP_ADVICE_EXAMPLES=• "Tư vấn tiết kiệm cho tôi"\n• "Làm sao giảm chi tiêu?"\n• "Gợi ý lập kế hoạch tài chính"
VI_HELP_SHOPPING_TITLE=🛍️ Tư vấn mua hàng:
VI_HELP_SHOPPING_EXAMPLES=• "Tư vấn mua điện thoại"\n• "Nên mua laptop không?"\n• "Có nên mua quần áo?"
VI_HELP_STATS_TITLE=📊 Thống kê chi tiêu:
VI_HELP_STATS_COMMANDS=• /stats_menu - Menu thống kê\n• /stats_today - Hôm nay\n• /stats_week - Tuần này\n• /stats_month - Tháng này\n• /stats_year - Năm này
VI_HELP_FINANCE_TITLE=💰 Quản lý tài chính:
VI_HELP_FINANCE_COMMANDS=• /balance - Số dư hiện tại\n• /add_income - Thêm thu nhập\n• /income_stats - Thống kê thu nhập\n• /jars - Quản lý hũ tiền\n• /history - Lịch sử giao dịch
VI_HELP_BANK_TITLE=🏦 Tích hợp ngân hàng:
VI_HELP_BANK_COMMANDS=• /bank_help - Hướng dẫn\n• /bank_start - Thiết lập\n• /bank_transactions - Xem giao dịch
VI_HELP_LANGUAGE_TITLE=🌐 Ngôn ngữ:
VI_HELP_LANGUAGE_COMMANDS=• /language - Thay đổi ngôn ngữ
VI_HELP_BOT_TITLE=🤖 Bot quản lý chi tiêu thông minh

# English (en)
EN_WELCOME_MESSAGE=👋 Welcome to the Smart Expense Management Bot!
EN_WELCOME_DESCRIPTION=I can help you:\n• 📝 Record expenses: "Breakfast 50k"\n• 📊 Detailed statistics by time period\n• 💰 Manage income and money jars\n• 💬 Smart financial advice\n• 🛍️ Shopping advice based on data\n• 🏦 Automatic bank integration\n• 📋 Track transaction history
EN_SELECT_FUNCTION=👇 Choose the function you want to use:
EN_STATS_MENU=📊 View total income/expense
EN_INCOME_STATS=💰 View total income
EN_BALANCE=💳 Current balance
EN_JARS=🏺 Jar details
EN_HISTORY=📋 Income/expense history
EN_BANK_SETUP=🏦 Connect Email/Bank
EN_LANGUAGE=🌐 Language
EN_HELP=❓ Help
EN_BACK=🔙 Back
EN_MAIN_MENU=🏠 Main Menu
EN_SUCCESS=✅ Success
EN_ERROR=❌ Error
EN_LANGUAGE_CHANGED=✅ Language changed successfully!

# Stats keys
EN_STATS_TITLE=Expense Statistics
EN_SELECT_TIME=Select time period
EN_TODAY=Today
EN_THIS_WEEK=This week
EN_THIS_MONTH=This month
EN_THIS_YEAR=This year
EN_CUSTOM=Custom

# Help keys
EN_HELP_TITLE=❓ **Help**
EN_HELP_EXPENSE_TITLE=📝 **Record expenses:**
EN_HELP_EXPENSE_EXAMPLES=• "Lunch 80k"\n• "Coffee 30000 with friend"\n• "Gas 200k"
EN_HELP_ADVICE_TITLE=💬 Chat advice:
EN_HELP_ADVICE_EXAMPLES=• "Advise me on saving"\n• "How to reduce expenses?"\n• "Suggest financial planning"
EN_HELP_SHOPPING_TITLE=🛍️ Shopping advice:
EN_HELP_SHOPPING_EXAMPLES=• "Advise me on buying a phone"\n• "Should I buy a laptop?"\n• "Should I buy clothes?"
EN_HELP_STATS_TITLE=📊 Expense statistics:
EN_HELP_STATS_COMMANDS=• /stats_menu - Statistics menu\n• /stats_today - Today\n• /stats_week - This week\n• /stats_month - This month\n• /stats_year - This year
EN_HELP_FINANCE_TITLE=💰 Financial management:
EN_HELP_FINANCE_COMMANDS=• /balance - Current balance\n• /add_income - Add income\n• /income_stats - Income statistics\n• /jars - Manage jars\n• /history - Transaction history
EN_HELP_BANK_TITLE=🏦 Bank integration:
EN_HELP_BANK_COMMANDS=• /bank_help - Instructions\n• /bank_start - Setup\n• /bank_transactions - View transactions
EN_HELP_LANGUAGE_TITLE=🌐 Language:
EN_HELP_LANGUAGE_COMMANDS=• /language - Change language
EN_HELP_BOT_TITLE=🤖 Smart expense management bot

# Chinese (zh)
ZH_WELCOME_MESSAGE=👋 欢迎使用智能支出管理机器人！
ZH_WELCOME_DESCRIPTION=我可以帮助您：\n• 📝 记录支出："早餐 50k"\n• 📊 按时间段详细统计\n• 💰 管理收入和储蓄罐\n• 💬 智能财务建议\n• 🛍️ 基于数据的购物建议\n• 🏦 自动银行集成\n• 📋 跟踪交易历史
ZH_SELECT_FUNCTION=👇 选择您要使用的功能：
ZH_STATS_MENU=📊 查看总收入/支出
ZH_INCOME_STATS=💰 查看总收入
ZH_BALANCE=💳 当前余额
ZH_JARS=🏺 储蓄罐详情
ZH_HISTORY=📋 收入/支出历史
ZH_BANK_SETUP=🏦 连接邮箱/银行
ZH_LANGUAGE=🌐 语言
ZH_HELP=❓ 帮助
ZH_BACK=🔙 返回
ZH_MAIN_MENU=🏠 主菜单
ZH_SUCCESS=✅ 成功
ZH_ERROR=❌ 错误
ZH_LANGUAGE_CHANGED=✅ 语言更改成功！

# Stats keys
ZH_STATS_TITLE=支出统计
ZH_SELECT_TIME=选择时间段
ZH_TODAY=今天
ZH_THIS_WEEK=本周
ZH_THIS_MONTH=本月
ZH_THIS_YEAR=今年
ZH_CUSTOM=自定义

# Help keys
ZH_HELP_TITLE=❓ **帮助**
ZH_HELP_EXPENSE_TITLE=📝 **记录支出：**
ZH_HELP_EXPENSE_EXAMPLES=• "午餐 80k"\n• "和朋友咖啡 30000"\n• "加油 200k"
ZH_HELP_ADVICE_TITLE=💬 聊天建议：
ZH_HELP_ADVICE_EXAMPLES=• "给我储蓄建议"\n• "如何减少支出？"\n• "建议制定财务计划"
ZH_HELP_SHOPPING_TITLE=🛍️ 购物建议：
ZH_HELP_SHOPPING_EXAMPLES=• "建议买手机"\n• "应该买笔记本电脑吗？"\n• "应该买衣服吗？"
ZH_HELP_STATS_TITLE=📊 支出统计：
ZH_HELP_STATS_COMMANDS=• /stats_menu - 统计菜单\n• /stats_today - 今天\n• /stats_week - 本周\n• /stats_month - 本月\n• /stats_year - 今年
ZH_HELP_FINANCE_TITLE=💰 财务管理：
ZH_HELP_FINANCE_COMMANDS=• /balance - 当前余额\n• /add_income - 添加收入\n• /income_stats - 收入统计\n• /jars - 管理储蓄罐\n• /history - 交易历史
ZH_HELP_BANK_TITLE=🏦 银行集成：
ZH_HELP_BANK_COMMANDS=• /bank_help - 说明\n• /bank_start - 设置\n• /bank_transactions - 查看交易
ZH_HELP_LANGUAGE_TITLE=🌐 语言：
ZH_HELP_LANGUAGE_COMMANDS=• /language - 更改语言
ZH_HELP_BOT_TITLE=🤖 智能支出管理机器人

# Japanese (ja)
JA_WELCOME_MESSAGE=👋 スマート支出管理ボットへようこそ！
JA_WELCOME_DESCRIPTION=お手伝いできること：\n• 📝 支出記録：「朝食 50k」\n• 📊 期間別詳細統計\n• 💰 収入と貯金箱の管理\n• 💬 スマートな財務アドバイス\n• 🛍️ データに基づく買い物アドバイス\n• 🏦 自動銀行連携\n• 📋 取引履歴の追跡
JA_SELECT_FUNCTION=👇 使用したい機能を選択してください：
JA_STATS_MENU=📊 総収入/支出を表示
JA_INCOME_STATS=💰 総収入を表示
JA_BALANCE=💳 現在の残高
JA_JARS=🏺 貯金箱の詳細
JA_HISTORY=📋 収入/支出履歴
JA_BANK_SETUP=🏦 メール/銀行を接続
JA_LANGUAGE=🌐 言語
JA_HELP=❓ ヘルプ
JA_BACK=🔙 戻る
JA_MAIN_MENU=🏠 メインメニュー
JA_SUCCESS=✅ 成功
JA_ERROR=❌ エラー
JA_LANGUAGE_CHANGED=✅ 言語が正常に変更されました！

# Stats keys
JA_STATS_TITLE=支出統計
JA_SELECT_TIME=期間を選択
JA_TODAY=今日
JA_THIS_WEEK=今週
JA_THIS_MONTH=今月
JA_THIS_YEAR=今年
JA_CUSTOM=カスタム

# Help keys
JA_HELP_TITLE=❓ **ヘルプ**
JA_HELP_EXPENSE_TITLE=📝 **支出記録：**
JA_HELP_EXPENSE_EXAMPLES=• "昼食 80k"\n• "友達とコーヒー 30000"\n• "ガソリン 200k"
JA_HELP_ADVICE_TITLE=💬 チャットアドバイス：
JA_HELP_ADVICE_EXAMPLES=• "貯蓄のアドバイスをください"\n• "支出を減らす方法は？"\n• "財務計画の提案"
JA_HELP_SHOPPING_TITLE=🛍️ 買い物アドバイス：
JA_HELP_SHOPPING_EXAMPLES=• "携帯電話の購入アドバイス"\n• "ノートパソコンを買うべき？"\n• "服を買うべき？"
JA_HELP_STATS_TITLE=📊 支出統計：
JA_HELP_STATS_COMMANDS=• /stats_menu - 統計メニュー\n• /stats_today - 今日\n• /stats_week - 今週\n• /stats_month - 今月\n• /stats_year - 今年
JA_HELP_FINANCE_TITLE=💰 財務管理：
JA_HELP_FINANCE_COMMANDS=• /balance - 現在の残高\n• /add_income - 収入を追加\n• /income_stats - 収入統計\n• /jars - 貯金箱管理\n• /history - 取引履歴
JA_HELP_BANK_TITLE=🏦 銀行連携：
JA_HELP_BANK_COMMANDS=• /bank_help - 説明\n• /bank_start - 設定\n• /bank_transactions - 取引を表示
JA_HELP_LANGUAGE_TITLE=🌐 言語：
JA_HELP_LANGUAGE_COMMANDS=• /language - 言語を変更
JA_HELP_BOT_TITLE=🤖 スマート支出管理ボット

# Korean (ko)
KO_WELCOME_MESSAGE=👋 스마트 지출 관리 봇에 오신 것을 환영합니다!
KO_WELCOME_DESCRIPTION=도움을 드릴 수 있는 것들：\n• 📝 지출 기록："아침 식사 50k"\n• 📊 기간별 상세 통계\n• 💰 수입과 저금통 관리\n• 💬 스마트한 재무 조언\n• 🛍️ 데이터 기반 쇼핑 조언\n• 🏦 자동 은행 연동\n• 📋 거래 내역 추적
KO_SELECT_FUNCTION=👇 사용하고 싶은 기능을 선택하세요：
KO_STATS_MENU=📊 총 수입/지출 보기
KO_INCOME_STATS=💰 총 수입 보기
KO_BALANCE=💳 현재 잔액
KO_JARS=🏺 저금통 상세
KO_HISTORY=📋 수입/지출 내역
KO_BANK_SETUP=🏦 이메일/은행 연결
KO_LANGUAGE=🌐 언어
KO_HELP=❓ 도움말
KO_BACK=🔙 뒤로
KO_MAIN_MENU=🏠 메인 메뉴
KO_SUCCESS=✅ 성공
KO_ERROR=❌ 오류
KO_LANGUAGE_CHANGED=✅ 언어가 성공적으로 변경되었습니다！

# Stats keys
KO_STATS_TITLE=지출 통계
KO_SELECT_TIME=기간 선택
KO_TODAY=오늘
KO_THIS_WEEK=이번 주
KO_THIS_MONTH=이번 달
KO_THIS_YEAR=올해
KO_CUSTOM=사용자 정의

# Help keys
KO_HELP_TITLE=❓ **도움말**
KO_HELP_EXPENSE_TITLE=📝 **지출 기록：**
KO_HELP_EXPENSE_EXAMPLES=• "점심 80k"\n• "친구와 커피 30000"\n• "주유 200k"
KO_HELP_ADVICE_TITLE=💬 채팅 조언：
KO_HELP_ADVICE_EXAMPLES=• "저축 조언해주세요"\n• "지출을 줄이는 방법은?"\n• "재무 계획 제안"
KO_HELP_SHOPPING_TITLE=🛍️ 쇼핑 조언：
KO_HELP_SHOPPING_EXAMPLES=• "휴대폰 구매 조언"\n• "노트북을 사야 할까?"\n• "옷을 사야 할까?"
KO_HELP_STATS_TITLE=📊 지출 통계：
KO_HELP_STATS_COMMANDS=• /stats_menu - 통계 메뉴\n• /stats_today - 오늘\n• /stats_week - 이번 주\n• /stats_month - 이번 달\n• /stats_year - 올해
KO_HELP_FINANCE_TITLE=💰 재무 관리：
KO_HELP_FINANCE_COMMANDS=• /balance - 현재 잔액\n• /add_income - 수입 추가\n• /income_stats - 수입 통계\n• /jars - 저금통 관리\n• /history - 거래 내역
KO_HELP_BANK_TITLE=🏦 은행 연동：
KO_HELP_BANK_COMMANDS=• /bank_help - 설명\n• /bank_start - 설정\n• /bank_transactions - 거래 보기
KO_HELP_LANGUAGE_TITLE=🌐 언어：
KO_HELP_LANGUAGE_COMMANDS=• /language - 언어 변경
KO_HELP_BOT_TITLE=🤖 스마트 지출 관리 봇
```

## Bước 2: Cách sử dụng trong code

Sau khi cấu hình xong, hệ thống sẽ tự động sử dụng ngôn ngữ từ environment variables:

```javascript
const languageService = require('./services/languageService');

// Lấy ngôn ngữ của user
const lang = await languageService.getUserLanguage(userId);

// Lấy bản dịch
const welcomeMessage = languageService.getTranslation(lang, 'WELCOME_MESSAGE');
const statsMenu = languageService.getTranslation(lang, 'STATS_MENU');

// Sử dụng trong menu
const keyboard = {
  inline_keyboard: [
    [
      { text: languageService.getTranslation(lang, 'STATS_MENU'), callback_data: 'stats_menu' },
      { text: languageService.getTranslation(lang, 'INCOME_STATS'), callback_data: 'income_stats' }
    ]
  ]
};
```

## Bước 3: Thêm key dịch mới

Khi cần thêm text mới, chỉ cần thêm vào file `.env`:

```env
# Vietnamese
VI_NEW_FEATURE=🆕 Tính năng mới

# English  
EN_NEW_FEATURE=🆕 New Feature

# Chinese
ZH_NEW_FEATURE=🆕 新功能

# Japanese
JA_NEW_FEATURE=🆕 新機能

# Korean
KO_NEW_FEATURE=🆕 새 기능
```

Sau đó sử dụng trong code:
```javascript
const newFeatureText = languageService.getTranslation(lang, 'NEW_FEATURE');
```

## Lợi ích của cách này:

1. **Dễ quản lý**: Tất cả text ở một nơi (file .env)
2. **Linh hoạt**: Có thể thay đổi text mà không cần restart bot
3. **Bảo mật**: File .env có thể được ignore trong git
4. **Mở rộng**: Dễ dàng thêm ngôn ngữ mới
5. **Hiệu suất**: Không cần load file JSON lớn 