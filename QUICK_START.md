# 🚀 Quick Start Guide

## 📋 Khởi động Bot

### Option 1: Command Line
```bash
cd "g:\bot telegram\expense-bot"
npm run dev
```

### Option 2: Batch File
Double-click file `start-dev.bat`

### Option 3: Manual
```bash
cd "g:\bot telegram\expense-bot"
node --watch src/index.js
```

## ✅ Pre-flight Check

Chạy file kiểm tra trước khi start:
```bash
node dev-check.js
```

## 📱 Test Menu Inline Keyboard

1. **Start bot** bằng một trong các cách trên
2. **Mở Telegram** và tìm bot của bạn  
3. **Gửi `/start`** - sẽ thấy menu với 8 nút:

```
[📊 Xem tổng thu chi] [💰 Xem tổng thu nhập]
[💳 Số tiền hiện tại]  [🏺 Chi tiết các hũ]
[📋 Lịch sử thu/chi]   [📱 Open App]
[🏦 Connect Email/Bank] [❓ Hướng dẫn]
```

4. **Click vào từng nút** để test chức năng
5. **Sử dụng nút Back** để navigation

## 🔧 Environment Variables

Đảm bảo file `.env` có các biến sau:

### Required:
```env
BOT_TOKEN=your_telegram_bot_token
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_postgresql_url
```

### Optional (for bank integration):
```env
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_TLS=true
WEB_APP_URL=https://your-app.com
```

## 📊 Test Data

### Thêm test data:
```
Gửi tin nhắn: "Ăn sáng 50k"
Lệnh: /add_income salary 15000000 Lương tháng này
Lệnh: /setup_jars
```

### Xem kết quả:
- Click "💳 Số tiền hiện tại"
- Click "🏺 Chi tiết các hũ"  
- Click "📋 Lịch sử thu/chi"

## 🐛 Troubleshooting

### Bot không khởi động:
- Kiểm tra `BOT_TOKEN` trong .env
- Chạy `node dev-check.js` để kiểm tra

### Menu không hiển thị:
- Kiểm tra `src/index.js` đã được update
- Restart bot và thử lại `/start`

### Database error:
```bash
npx prisma db push
npx prisma generate
```

### OpenAI error:
- Kiểm tra `OPENAI_API_KEY` 
- Kiểm tra quota/billing của OpenAI account

## 📈 Monitoring

Bot sẽ hiển thị log trong console:
- ✅ Bot khởi động thành công
- 📧 Email monitoring (nếu được cấu hình)
- 💬 Xử lý tin nhắn từ user
- ❌ Các lỗi và cách xử lý

## 💡 Tips

1. **Development mode**: Bot sẽ restart tự động khi có thay đổi file
2. **Ctrl+C**: Dừng bot
3. **Log output**: Theo dõi console để debug
4. **Test thoroughly**: Click vào tất cả nút menu để đảm bảo hoạt động

Enjoy your new interactive expense bot! 🎉
