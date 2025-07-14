# 📝 Hướng dẫn Ghi Chi tiêu Tự động

## ✅ Tính năng mới đã thêm

Bây giờ bot có thể **tự động lưu chi tiêu** khi bạn gửi tin nhắn thường (không phải lệnh)!

## 🎯 Cách sử dụng

### 📝 Ghi chi tiêu bằng tin nhắn thường:

Chỉ cần gửi tin nhắn theo format:

**Format 1: [Danh mục] [Số tiền] [Ghi chú]**
```
Ăn sáng 50k
Cafe 30000 với bạn
Xăng xe 200k đi làm
```

**Format 2: [Số tiền] [Danh mục] [Ghi chú]**
```
50k ăn sáng
30000 cafe
200k xăng xe
```

### 💰 Hỗ trợ định dạng số tiền:

- **Có 'k':** `50k` = 50,000đ
- **Không 'k':** `30000` = 30,000đ
- **Thập phân:** `15.5k` = 15,500đ

### 📊 Thông tin tự động lưu:

- ✅ **Danh mục:** Phân tích từ tin nhắn
- ✅ **Số tiền:** Convert đúng đơn vị
- ✅ **Ghi chú:** Phần còn lại của tin nhắn
- ✅ **Ngày giờ:** Thời điểm gửi tin nhắn
- ✅ **User ID:** Tự động từ Telegram

## 🧪 Test ngay:

### 1. Khởi động bot:
```bash
cd "g:\bot telegram\expense-bot"
node src\index.js
```

### 2. Test trong Telegram:

**Test 1: Ghi chi tiêu**
```
Gửi: "Ăn sáng 50k"
Bot trả lời:
✅ Đã lưu chi tiêu:
📂 Danh mục: Ăn
💰 Số tiền: 50,000đ
📝 Ghi chú: sáng
📅 Ngày giờ: 13/07/2025, 14:30
```

**Test 2: Format khác**
```
Gửi: "30000 cafe với bạn"
Bot trả lời:
✅ Đã lưu chi tiêu:
📂 Danh mục: cafe
💰 Số tiền: 30,000đ
📝 Ghi chú: với bạn
📅 Ngày giờ: 13/07/2025, 14:31
```

**Test 3: Menu vẫn hoạt động**
```
Gửi: "/start"
→ Hiển thị menu 8 nút
→ Click "📊 Xem tổng thu chi"
→ Hiển thị thống kê (nếu có database)
```

## 🔧 Console Output

Khi bot chạy, bạn sẽ thấy log:
```
🤖 Khởi động bot với expense tracking...
📝 BOT_TOKEN: OK
✅ ExpenseService loaded successfully
🚀 Bot đang hoạt động với expense tracking!
📝 Gửi tin nhắn như 'Ăn sáng 50k' để test
📱 Hoặc gửi /start để xem menu

[Khi có tin nhắn:]
📝 Nhận tin nhắn text: Ăn sáng 50k từ user: 123456789
💰 Phân tích chi tiêu thành công: { category: 'Ăn', amount: 50000, note: 'sáng', date: ... }
✅ Đã lưu vào database
```

## 📊 Xem thống kê

- **Gửi `/start`** → Click **"📊 Xem tổng thu chi"**
- Hiển thị tổng chi tiêu và số giao dịch
- Nếu không có database: hiển thị hướng dẫn cấu hình

## 🎯 Ưu điểm

✅ **Đơn giản:** Chỉ cần gửi tin nhắn thông thường
✅ **Thông minh:** Tự động phân tích format khác nhau
✅ **Linh hoạt:** Hỗ trợ cả 'k' và số nguyên
✅ **Đầy đủ:** Lưu cả ngày giờ và user info
✅ **Menu vẫn hoạt động:** Không ảnh hưởng tính năng cũ

## ❌ Error Handling

**Tin nhắn không hiểu:**
```
Gửi: "hello world"
Bot trả lời: Không hiểu nội dung chi tiêu + hướng dẫn
```

**Database lỗi:**
```
Bot trả lời: Lỗi lưu database + hướng dẫn cấu hình
```

## 🚀 Ready to use!

Bot giờ đã có khả năng **ghi chi tiêu tự động** và **menu interactive**. Bạn có thể:

1. **Ghi chi tiêu:** Gửi tin nhắn thường
2. **Xem thống kê:** Dùng menu /start
3. **Hướng dẫn:** Click "❓ Hướng dẫn" trong menu

Hãy test ngay! 🎉
