# 📊 Hướng dẫn sử dụng Bot Quản lý Chi tiêu

## 🚀 Tính năng chính

### 📝 Ghi chi tiêu thủ công
- Gửi tin nhắn mô tả chi tiêu: `"Ăn sáng 50k"`
- Bot tự động phân tích và lưu vào database
- Hỗ trợ các format: `"cafe 30000"`, `"xăng xe 200k hôm nay"`

### 📊 Thống kê chi tiêu theo thời gian

#### Lệnh thống kê:
- `/stats_today` - Chi tiêu hôm nay
- `/stats_week` - Chi tiêu tuần này  
- `/stats_month` - Chi tiêu tháng này
- `/stats_year` - Chi tiêu năm này
- `/stats_menu` - Menu đầy đủ các thống kê

#### Thông tin hiển thị:
- Tổng số tiền chi tiêu
- Số lượng giao dịch
- Phân tích theo danh mục (% và số tiền)

### 💰 Quản lý thu nhập

#### Thêm thu nhập:
```
/add_income <nguồn> <số_tiền> [mô tả]
```

**Ví dụ:**
- `/add_income salary 15000000 Lương tháng 7`
- `/add_income freelance 3000000 Dự án web`
- `/add_income bonus 5000000 Thưởng cuối năm`

**Các nguồn thu nhập hợp lệ:**
- `salary` - Lương
- `bonus` - Thưởng
- `freelance` - Công việc tự do
- `investment` - Đầu tư
- `other` - Khác

#### Thống kê thu nhập:
- `/income_stats` - Xem tổng quan thu nhập theo ngày/tháng/năm

### 🏺 Hệ thống 6 JAR (Quản lý hũ tiền)

#### Thiết lập ban đầu:
- `/setup_jars` - Tạo 6 hũ tiền theo phương pháp T. Harv Eker

#### 6 hũ tiền mặc định:
1. **🏠 Necessities (55%)** - Chi phí thiết yếu
2. **📚 Education (10%)** - Học tập & phát triển
3. **🎮 Entertainment (10%)** - Giải trí & sở thích
4. **🚨 Emergency (10%)** - Quỹ dự phòng
5. **📈 Investment (10%)** - Đầu tư dài hạn
6. **❤️ Charity (5%)** - Từ thiện & chia sẻ

#### Quản lý hũ tiền:
- `/jars` - Xem tất cả hũ tiền và số dư
- `/jar_deposit <ID> <số_tiền> [mô_tả]` - Nạp tiền vào hũ
- `/jar_withdraw <ID> <số_tiền> [mô_tả]` - Rút tiền từ hũ

**Ví dụ:**
- `/jar_deposit 1 500000 Tiết kiệm tháng này`
- `/jar_withdraw 2 200000 Mua sách học lập trình`

### 💳 Quản lý tài chính tổng quan

#### Xem số dư hiện tại:
- `/balance` - Hiển thị:
  - Tổng thu nhập
  - Tổng chi tiêu  
  - Số dư hiện tại
  - Tiền trong các hũ
  - Tiền khả dụng

### 📋 Lịch sử giao dịch

#### Xem lịch sử:
- `/history` - Lịch sử tổng hợp (10 giao dịch gần nhất)
- `/history_income` - Chỉ xem thu nhập
- `/history_expense` - Chỉ xem chi tiêu
- `/history_jar` - Chỉ xem giao dịch hũ tiền

#### Thông tin hiển thị:
- Loại giao dịch (thu/chi)
- Số tiền
- Danh mục/nguồn
- Mô tả chi tiết
- Ngày thực hiện

### 🏦 Tích hợp ngân hàng (Tự động)

#### Thiết lập:
- `/bank_help` - Hướng dẫn thiết lập email
- `/bank_start` - Bắt đầu thiết lập
- `/bank_transactions` - Xem giao dịch từ ngân hàng

#### Tính năng:
- Tự động đọc email thông báo từ ngân hàng
- Phân tích giao dịch và tạo chi tiêu tự động
- Hỗ trợ: VCB, TCB, TPBank, MBBank, ACB
- AI phân loại danh mục chi tiêu

## 📱 Cách sử dụng trong Telegram

### Lệnh cơ bản:
- `/start` - Bắt đầu sử dụng bot
- `/help` - Hướng dẫn đầy đủ
- `/stats_menu` - Menu thống kê

### Workflow khuyến nghị:

1. **Thiết lập ban đầu:**
   ```
   /setup_jars
   /add_income salary 15000000 Lương tháng này
   ```

2. **Hàng ngày:**
   - Gửi tin nhắn chi tiêu: `"Ăn trưa 80k"`
   - Hoặc sử dụng tính năng ngân hàng tự động

3. **Cuối ngày:**
   ```
   /stats_today
   /balance
   ```

4. **Cuối tháng:**
   ```
   /stats_month
   /income_stats
   /history
   ```

5. **Quản lý hũ tiền:**
   ```
   /jars
   /jar_deposit 1 1000000 Tiết kiệm tháng này
   ```

## 💡 Tips sử dụng hiệu quả

### Phương pháp 6 JAR:
1. **Khi có thu nhập mới** → Phân bổ vào các hũ theo tỷ lệ
2. **Chi tiêu hàng ngày** → Rút từ hũ Necessities  
3. **Học tập/phát triển** → Rút từ hũ Education
4. **Giải trí** → Rút từ hũ Entertainment
5. **Đầu tư** → Tích lũy trong hũ Investment
6. **Từ thiện** → Sử dụng hũ Charity

### Ghi chi tiêu hiệu quả:
- Ghi ngay sau khi chi tiêu
- Mô tả rõ ràng: `"Ăn trưa KFC 120k"`
- Sử dụng tính năng ngân hàng để tự động hóa

### Theo dõi định kỳ:
- Hàng ngày: `/stats_today`
- Hàng tuần: `/stats_week` 
- Hàng tháng: `/stats_month` + `/income_stats`

## ⚙️ Thiết lập nâng cao

### Tích hợp email ngân hàng:
Xem file `BANK_SETUP.md` để thiết lập chi tiết.

### Backup dữ liệu:
Tất cả dữ liệu được lưu trong PostgreSQL database, an toàn và bền vững.

## 🆘 Hỗ trợ

### Các lỗi thường gặp:
- **"Số tiền không hợp lệ"** → Kiểm tra format số (sử dụng số nguyên hoặc có 'k')
- **"Nguồn thu nhập không hợp lệ"** → Sử dụng: salary, bonus, freelance, investment, other
- **"Insufficient balance in jar"** → Kiểm tra số dư hũ tiền với `/jars`

### Liên hệ:
Nếu có vấn đề, sử dụng `/help` để xem hướng dẫn hoặc kiểm tra log lỗi.
