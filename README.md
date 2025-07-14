# 🚀 Expense Bot - Telegram Chatbot Quản Lý Chi Tiêu

## 1. Giới thiệu
Expense Bot là chatbot Telegram giúp bạn quản lý chi tiêu, thu nhập, kết nối email ngân hàng, phân tích tài chính, đa ngôn ngữ... Mọi thao tác đều thực hiện trực tiếp trên giao diện chat Telegram, không cần chỉnh sửa code hay thao tác thủ công trên server.

---

## 2. Cài đặt & Deploy

### Bước 1: Clone & Cài đặt
```bash
# Clone project
https://github.com/your-repo/expense-bot.git
cd expense-bot

# Cài đặt dependencies
npm install
```

### Bước 2: Cấu hình môi trường
- Copy file `.env.example` thành `.env`:
  ```bash
  cp .env.example .env
  ```
- Điền các thông tin cần thiết vào file `.env` (token, database, email...)

### Bước 3: Khởi tạo database
```bash
npx prisma db push
```

### Bước 4: Khởi động bot
```bash
npm start
# hoặc chế độ dev:
npm run dev
```

### Bước 5: (Tùy chọn) Deploy lên server/cloud
- Có thể deploy lên VPS, Heroku, Railway, Render, v.v.
- Đảm bảo biến môi trường `.env` được cấu hình đúng trên server.

---

## 3. Sử dụng bot trên Telegram

1. **Mở Telegram, tìm bot của bạn và nhấn `/start`.**
2. **Tất cả thao tác đều thực hiện qua giao diện chat:**
   - **Kết nối email ngân hàng:**
     - Nhấn nút "🏦 Connect Email/Bank" → Nhập email → Chọn ngân hàng → Xác nhận thành công.
   - **Thêm chi tiêu/thu nhập:**
     - Nhập text tự nhiên, ví dụ: `Ăn sáng 50k`, `Lương tháng 7 15000000`.
   - **Xem thống kê, lịch sử:**
     - Nhấn các nút menu tương ứng.
   - **Đổi ngôn ngữ:**
     - Nhấn nút "🌐 Ngôn ngữ".
   - **Hỗ trợ, hướng dẫn:**
     - Nhấn nút "❓ Hướng dẫn".

3. **Không cần thao tác thủ công trên server sau khi deploy.**

---

## 4. Một số lệnh và thao tác nhanh
- `/start` : Hiển thị menu chính
- Nhập chi tiêu: `Ăn trưa 80k`, `Cafe 30000`
- Nhập thu nhập: `Lương tháng 7 15000000`, `Thưởng 5tr`
- Xem thống kê: Nhấn nút "📊 Thống kê"
- Kết nối email ngân hàng: Nhấn nút "🏦 Connect Email/Bank"
- Đổi ngôn ngữ: Nhấn nút "🌐 Ngôn ngữ"

---

## 5. Lưu ý khi deploy
- **Không commit file `.env` lên git.**
- **Đảm bảo DATABASE_URL trỏ đến PostgreSQL thật khi production.**
- **Nếu dùng chức năng bank monitoring, cần cấu hình đúng email/app password hoặc OAuth2.**
- **Có thể dùng process manager như pm2 để chạy bot ổn định:**
  ```bash
  npm install -g pm2
  pm2 start src/index.js --name expense-bot
  pm2 save
  pm2 startup
  ```

---

## 6. Hỗ trợ
- Nếu gặp lỗi, kiểm tra log server hoặc gửi câu hỏi lên Github Issues.
- Đọc thêm trong file `.env.example` để biết các biến môi trường cần thiết.

---

Chúc bạn sử dụng bot hiệu quả và quản lý chi tiêu thông minh! 🎉 