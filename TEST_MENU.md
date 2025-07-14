# 🧪 Hướng dẫn Test Menu Inline Keyboard

## 🚀 Cách khởi động và test bot

### 1. Khởi động bot
```bash
cd "g:\bot telegram\expense-bot"
node src/index.js
```

### 2. Test trong Telegram

#### Bước 1: Bắt đầu với bot
Gửi lệnh: `/start`

**Kết quả mong đợi:**
Bot sẽ hiển thị menu chính với 8 nút bấm được sắp xếp như sau:

```
[📊 Xem tổng thu chi] [💰 Xem tổng thu nhập]
[💳 Số tiền hiện tại]  [🏺 Chi tiết các hũ]
[📋 Lịch sử thu/chi]   [📱 Open App]
[🏦 Connect Email/Bank] [❓ Hướng dẫn]
```

#### Bước 2: Test từng chức năng

##### 📊 Xem tổng thu chi
- Click vào nút "📊 Xem tổng thu chi"
- Sẽ hiển thị submenu với 4 lựa chọn thời gian
- Test click vào từng thời gian để xem thống kê

##### 💰 Xem tổng thu nhập
- Click vào nút "💰 Xem tổng thu nhập"
- Hiển thị thống kê thu nhập tổng quan
- Nút "🔙 Về menu chính" để quay lại

##### 💳 Số tiền hiện tại
- Click vào nút "💳 Số tiền hiện tại"
- Hiển thị tình hình tài chính tổng quan
- Có nút "🏺 Xem chi tiết hũ" để xem hũ tiền

##### 🏺 Chi tiết các hũ
- Click vào nút "🏺 Chi tiết các hũ"
- Nếu chưa có hũ: hiển thị hướng dẫn tạo
- Nếu có hũ: hiển thị danh sách các hũ với số dư

##### 📋 Lịch sử thu/chi
- Click vào nút "📋 Lịch sử thu/chi"
- Hiển thị 5 giao dịch gần nhất
- Mỗi giao dịch có icon, số tiền, danh mục, ngày

##### 📱 Open App
- Click vào nút "📱 Open App"
- Hiển thị thông tin về web app
- Có nút URL để mở ứng dụng web

##### 🏦 Connect Email/Bank
- Click vào nút "🏦 Connect Email/Bank"
- Hiển thị submenu thiết lập ngân hàng
- Có 2 lựa chọn: Hướng dẫn và Bắt đầu thiết lập

##### ❓ Hướng dẫn
- Click vào nút "❓ Hướng dẫn"
- Hiển thị hướng dẫn sử dụng đầy đủ
- Nút "🔙 Về menu chính" để quay lại

### 3. Test Navigation

#### Test nút Back
- Từ bất kỳ submenu nào, click "🔙 Về menu chính"
- Sẽ quay về menu chính ban đầu

#### Test Deep Navigation
- Vào "📊 Xem tổng thu chi" → Click "📅 Hôm nay"
- Sẽ hiển thị kết quả với 2 nút:
  - "🔙 Về menu thống kê" (quay lại submenu)
  - "🏠 Menu chính" (về menu chính)

### 4. Test Error Handling

#### Test với dữ liệu trống
- Nếu chưa có thu nhập/chi tiêu, menu vẫn hoạt động
- Hiển thị thông báo phù hợp

#### Test với lỗi hệ thống
- Nếu có lỗi database, hiển thị thông báo lỗi
- Luôn có nút quay về menu chính

## 🎯 Checklist Test

### ✅ Menu chính
- [ ] Hiển thị đúng 8 nút
- [ ] Layout 4 hàng x 2 cột
- [ ] Text và emoji hiển thị chính xác
- [ ] Click vào từng nút hoạt động

### ✅ Submenu thống kê
- [ ] "📊 Xem tổng thu chi" → 4 lựa chọn thời gian
- [ ] Mỗi thời gian hiển thị data chính xác
- [ ] Navigation back hoạt động

### ✅ Submenu ngân hàng
- [ ] "🏦 Connect Email/Bank" → 2 lựa chọn
- [ ] Hướng dẫn chi tiết hiển thị đúng
- [ ] Thiết lập hiển thị status

### ✅ Dynamic content
- [ ] Số liệu thống kê cập nhật theo dữ liệu thực
- [ ] Danh sách hũ hiển thị đúng (nếu có)
- [ ] Lịch sử giao dịch hiển thị đúng format

### ✅ Error handling
- [ ] Lỗi database không crash bot
- [ ] Invalid callback_data được xử lý
- [ ] Luôn có cách quay về menu chính

### ✅ Performance
- [ ] Menu load nhanh (<2 giây)
- [ ] Click response time tốt
- [ ] Không có memory leak

## 🐛 Common Issues & Solutions

### Issue 1: Menu không hiển thị
**Nguyên nhân:** Lỗi import module
**Giải pháp:** Kiểm tra financeService và financeHandler import đúng

### Issue 2: Callback query timeout
**Nguyên nhân:** Không gọi `answerCbQuery()`
**Giải pháp:** Đã được xử lý trong code

### Issue 3: Navigation loop
**Nguyên nhân:** Callback data bị trùng
**Giải pháp:** Kiểm tra unique callback_data

### Issue 4: Content quá dài
**Nguyên nhân:** Telegram message limit
**Giải pháp:** Truncate content hoặc chia nhỏ

## 📝 Test Scenarios

### Scenario 1: First-time user
1. `/start` → Menu chính
2. "🏺 Chi tiết các hũ" → Thông báo chưa có hũ
3. Back to main menu
4. "❓ Hướng dẫn" → Đọc hướng dẫn

### Scenario 2: Experienced user
1. `/start` → Menu chính
2. "💳 Số tiền hiện tại" → Xem tổng quan
3. "🏺 Xem chi tiết hũ" → Xem các hũ
4. "📊 Xem tổng thu chi" → "📅 Tháng này" → Xem stats

### Scenario 3: Bank setup
1. `/start` → Menu chính
2. "🏦 Connect Email/Bank" → Submenu
3. "📖 Hướng dẫn chi tiết" → Đọc hướng dẫn
4. Back → "⚙️ Bắt đầu thiết lập" → Xem status

## 🎉 Expected Results

Sau khi test thành công, bot sẽ có:

1. **Menu interactivity tốt**: Mọi nút đều hoạt động
2. **Navigation smooth**: Chuyển trang mượt mà
3. **Data accuracy**: Số liệu hiển thị chính xác
4. **Error resilience**: Xử lý lỗi tốt
5. **User experience tuyệt vời**: Dễ sử dụng, trực quan

User có thể truy cập mọi tính năng chỉ với vài click, không cần nhớ command!
