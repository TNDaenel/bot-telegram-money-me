# 📧 Hướng dẫn Thiết lập Email cho Bot Ngân hàng

## 🎯 Tổng quan

Bot có thể tự động đọc email thông báo giao dịch từ các ngân hàng và sử dụng AI để phân tích, phân loại và tạo giao dịch chi tiêu/thu nhập tự động.

## 🏦 Ngân hàng được hỗ trợ

- **VCB** (Vietcombank)
- **TCB** (Techcombank) 
- **TPBank**
- **MBBank**
- **ACB**
- **Techcombank**

## ⚙️ Bước 1: Tạo App Password cho Gmail

### 1.1 Bật 2-Factor Authentication
1. Đăng nhập vào [Google Account](https://myaccount.google.com/)
2. Vào **Security** → **2-Step Verification**
3. Bật **2-Step Verification** nếu chưa bật

### 1.2 Tạo App Password
1. Vào **Security** → **App passwords**
2. Chọn **Mail** từ dropdown
3. Click **Generate**
4. Copy password được tạo ra (16 ký tự)

## ⚙️ Bước 2: Cấu hình Environment Variables

Thêm vào file `.env`:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

### Ví dụ:
```env
EMAIL_USER=mybank@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

## ⚙️ Bước 3: Cấu hình Email Forwarding

### 3.1 Thiết lập Email Forwarding từ ngân hàng
1. Đăng nhập vào tài khoản ngân hàng online
2. Vào **Settings** → **Notifications** → **Email**
3. Thêm email đã cấu hình trong `.env`
4. Bật thông báo cho:
   - Giao dịch thẻ
   - Rút tiền
   - Chuyển khoản
   - Thanh toán

### 3.2 Tạo Filter trong Gmail (Tùy chọn)
1. Vào Gmail → **Settings** → **Filters and Blocked Addresses**
2. Tạo filter mới:
   - **From**: `noreply@vcb.com.vn OR noreply@tcb.com.vn OR noreply@tpb.com.vn`
   - **Subject**: `GD: OR Giao dich: OR Transaction:`
3. Đánh dấu **Never send it to Spam**

## ⚙️ Bước 4: Test kết nối

### 4.1 Restart bot
```bash
npm restart
```

### 4.2 Test trong Telegram
Gửi tin nhắn: `test bank` hoặc `kiểm tra bank`

### 4.3 Kiểm tra logs
```bash
# Xem logs để kiểm tra kết nối
tail -f logs/bot.log
```

## 🤖 Cách AI hoạt động

### 5.1 Phân tích Email
Bot sẽ tự động:
1. **Đọc email** từ Gmail mỗi 30 giây
2. **Trích xuất thông tin** giao dịch:
   - Số tiền
   - Loại giao dịch (credit/debit)
   - Mô tả
   - Ngân hàng
3. **AI phân loại** dựa trên mô tả:
   - Food: ăn, cơm, restaurant, cafe
   - Transport: xe, taxi, grab, gas
   - Shopping: mua, shop, store
   - Entertainment: game, movie, karaoke
   - Bills: điện, nước, internet
   - Salary: lương, thưởng
   - Investment: đầu tư, stock

### 5.2 Tạo giao dịch tự động
- **Credit** → Tạo **Income** record
- **Debit** → Tạo **Expense** record
- **AI Category** → Phân loại tự động
- **Confidence Score** → Độ tin cậy AI

## 📊 Monitoring và Quản lý

### 6.1 Xem thống kê
- Gửi: `bank stats` hoặc `thống kê bank`
- Xem số lượng email đã xử lý
- Xem giao dịch theo ngân hàng

### 6.2 Xem giao dịch chờ xử lý
- Gửi: `bank pending` hoặc `giao dịch chờ`
- Xem giao dịch chưa được AI phân loại
- Xử lý thủ công nếu cần

### 6.3 Retrain AI
- Gửi: `bank ai` hoặc `retrain ai`
- Cập nhật AI với dữ liệu mới
- Cải thiện độ chính xác phân loại

## 🔧 Troubleshooting

### 7.1 Lỗi kết nối email
```
❌ Email connection test failed: Invalid credentials
```
**Giải pháp:**
- Kiểm tra lại App Password
- Đảm bảo 2FA đã bật
- Thử tạo App Password mới

### 7.2 Không nhận được email
```
📧 No new bank emails found
```
**Giải pháp:**
- Kiểm tra email forwarding từ ngân hàng
- Tạo filter trong Gmail
- Test bằng cách gửi email thủ công

### 7.3 AI phân loại sai
```
🤖 AI confidence: 0.3
```
**Giải pháp:**
- Xử lý thủ công và retrain AI
- Gửi: `bank ai` để retrain
- Càng nhiều dữ liệu, AI càng chính xác

## 📋 Lệnh Telegram

### 8.1 Lệnh chính
- `bank` - Menu ngân hàng
- `bank setup` - Thiết lập
- `bank test` - Test kết nối
- `bank stats` - Thống kê
- `bank transactions` - Giao dịch
- `bank pending` - Chờ xử lý
- `bank ai` - Retrain AI

### 8.2 Lệnh nâng cao
- `bank configure` - Cấu hình email
- `bank stats details` - Chi tiết thống kê
- `bank ai stats` - Thống kê AI

## 🔒 Bảo mật

### 9.1 Bảo mật Email
- Sử dụng App Password thay vì password chính
- Không chia sẻ App Password
- Bật 2FA cho tài khoản Google

### 9.2 Bảo mật Bot
- Bot chỉ đọc email, không truy cập tài khoản ngân hàng
- Dữ liệu được mã hóa trong database
- Không lưu password ngân hàng

## 📈 Tối ưu hóa

### 10.1 Cải thiện độ chính xác AI
1. **Xử lý thủ công** các giao dịch sai
2. **Retrain AI** thường xuyên
3. **Thêm từ khóa** mới cho categories

### 10.2 Tối ưu hiệu suất
- Kiểm tra email mỗi 30 giây
- Lưu cache để tránh duplicate
- Xử lý batch để tăng tốc

## 🆘 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra logs: `tail -f logs/bot.log`
2. Test kết nối: `bank test`
3. Xem thống kê: `bank stats`
4. Liên hệ support với thông tin lỗi

---

**Lưu ý:** Bot chỉ đọc email thông báo, không truy cập trực tiếp vào tài khoản ngân hàng. Đảm bảo bảo mật thông tin đăng nhập ngân hàng. 