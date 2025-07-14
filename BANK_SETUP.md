# 🏦 Hướng dẫn thiết lập tính năng Ngân hàng

## 1. Cấu hình Email Gmail

### Bước 1: Bật 2-Step Verification
1. Vào Google Account → Security
2. Bật "2-Step Verification"

### Bước 2: Tạo App Password
1. Vào Google Account → Security → App passwords
2. Chọn app: "Mail"
3. Chọn device: "Other" → nhập "Expense Bot"
4. Copy password được tạo (16 ký tự)

### Bước 3: Cập nhật .env
```env
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_char_app_password
EMAIL_TLS=true
```

## 2. Thiết lập Auto-forward từ ngân hàng

### Cho Gmail:
1. Vào Settings → Filters and Blocked Addresses
2. Create filter:
   - From: "noreply@vietcombank.com.vn"
   - Has the words: "giao dịch"
3. Forward to: email account đã cấu hình

### Filter cho các ngân hàng:
- VCB: `noreply@vcb.com.vn`, `noreply@vietcombank.com.vn`
- TCB: `noreply@techcombank.com.vn`
- TPBank: `noreply@tpbank.com.vn`
- MBBank: `noreply@mbbank.com.vn`
- ACB: `noreply@acb.com.vn`

## 3. Test hệ thống

```bash
# Test bank service
node test-bank.js

# Chạy bot với bank monitoring
npm run dev
```

## 4. Cách sử dụng trong Telegram

```
/bank_help - Hướng dẫn
/bank_start - Thiết lập
/bank_transactions - Xem giao dịch
/stats - Thống kê chi tiêu
```

## 5. Luồng hoạt động

1. **Nhận email** từ ngân hàng về giao dịch
2. **Parse thông tin**: số tiền, mô tả, loại giao dịch
3. **AI phân loại**: xác định danh mục chi tiêu
4. **Tự động tạo expense**: lưu vào database
5. **Thông báo Telegram**: (tùy chọn)

## 6. Bảo mật

- ✅ Bot chỉ **đọc email**, không truy cập tài khoản ngân hàng
- ✅ Sử dụng **App Password**, không phải mật khẩu chính
- ✅ Kết nối **TLS encrypted**
- ✅ Chỉ đọc email từ **sender được whitelist**

## 7. Troubleshooting

### Email connection failed:
- Kiểm tra App Password
- Đảm bảo 2-Step Verification đã bật
- Kiểm tra EMAIL_HOST và EMAIL_PORT

### Không parse được giao dịch:
- Kiểm tra format email ngân hàng
- Cập nhật regex pattern trong bankService.js
- Sử dụng OpenAI fallback

### Database error:
- Chạy `npx prisma db push`
- Kiểm tra DATABASE_URL
