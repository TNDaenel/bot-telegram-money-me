# 🤖 Menu Chính Bot Quản lý Chi tiêu

## 📱 Giao diện Menu sau khi nhập `/start`

Khi người dùng nhập lệnh `/start`, bot sẽ hiển thị menu chính với các nút bấm (inline keyboard) như sau:

```
👋 Chào mừng bạn đến với Bot Quản lý Chi tiêu Thông minh!

🤖 Tôi có thể giúp bạn:
• 📝 Ghi chi tiêu: "Ăn sáng 50k"  
• 📊 Thống kê chi tiết theo thời gian
• 💰 Quản lý thu nhập và hũ tiền
• 🏦 Tích hợp ngân hàng tự động
• 📋 Theo dõi lịch sử giao dịch

👇 Chọn chức năng bạn muốn sử dụng:

[📊 Xem tổng thu chi] [💰 Xem tổng thu nhập]
[💳 Số tiền hiện tại]  [🏺 Chi tiết các hũ]
[📋 Lịch sử thu/chi]   [📱 Open App]
[🏦 Connect Email/Bank] [❓ Hướng dẫn]
```

## 🎯 Chi tiết từng chức năng

### 📊 Xem tổng thu chi
**Callback data:** `stats_menu`
- Hiển thị submenu thống kê theo thời gian
- Lựa chọn: Hôm nay, Tuần này, Tháng này, Năm này
- Mỗi lựa chọn hiển thị:
  - Tổng số tiền chi tiêu
  - Số lượng giao dịch  
  - Phân tích theo danh mục (% và số tiền)

### 💰 Xem tổng thu nhập
**Callback data:** `income_stats`
- Thống kê thu nhập tổng quan
- Hiển thị:
  - Tổng thu nhập
  - Số giao dịch thu nhập
  - Phân tích theo nguồn (lương, thưởng, freelance, đầu tư, khác)

### 💳 Số tiền hiện tại
**Callback data:** `balance`
- Tình hình tài chính tổng quan
- Hiển thị:
  - Tổng thu nhập
  - Tổng chi tiêu
  - Số dư hiện tại
  - Tiền trong các hũ
  - Tiền khả dụng

### 🏺 Chi tiết các hũ
**Callback data:** `jars`
- Hiển thị 6 hũ tiền theo phương pháp T. Harv Eker:
  1. 🏠 Necessities (55%) - Chi phí thiết yếu
  2. 📚 Education (10%) - Học tập & phát triển
  3. 🎮 Entertainment (10%) - Giải trí & sở thích
  4. 🚨 Emergency (10%) - Quỹ dự phòng
  5. 📈 Investment (10%) - Đầu tư dài hạn
  6. ❤️ Charity (5%) - Từ thiện & chia sẻ
- Số dư từng hũ và tỷ lệ phân bổ

### 📋 Lịch sử thu/chi
**Callback data:** `history`
- Hiển thị 5 giao dịch gần nhất
- Bao gồm:
  - Loại giao dịch (thu/chi/hũ)
  - Số tiền
  - Danh mục/nguồn
  - Mô tả
  - Ngày thực hiện

### 📱 Open App
**Callback data:** `open_app`
- Liên kết đến ứng dụng web (nếu có)
- Hướng dẫn sử dụng mini app trong Telegram
- Button URL để mở web app

### 🏦 Connect Email/Bank
**Callback data:** `bank_setup`
- Submenu thiết lập tích hợp ngân hàng
- Lựa chọn:
  - 📖 Hướng dẫn chi tiết
  - ⚙️ Bắt đầu thiết lập
- Hỗ trợ: VCB, TCB, TPBank, MBBank, ACB

### ❓ Hướng dẫn  
**Callback data:** `help`
- Hướng dẫn sử dụng đầy đủ
- Cách ghi chi tiêu
- Quản lý tài chính
- Thống kê
- Tính năng nâng cao

## 🔄 Navigation

Mỗi submenu đều có:
- **🔙 Về menu chính**: Quay lại menu chính
- **🔙 Về menu trước**: Quay lại menu cấp trên
- **🏠 Menu chính**: Shortcut về menu chính

## 💡 Tính năng Interactive

1. **Dynamic Content**: Nội dung menu thay đổi dựa trên dữ liệu thực tế
2. **Error Handling**: Xử lý lỗi và hiển thị thông báo thân thiện
3. **Loading States**: Sử dụng `answerCbQuery()` để loại bỏ loading
4. **Responsive Design**: Menu tối ưu cho cả mobile và desktop Telegram

## 🎨 UI/UX Design Principles

1. **Clarity**: Mỗi button có tên rõ ràng và emoji trực quan
2. **Consistency**: Layout đồng nhất trên tất cả submenu
3. **Accessibility**: Hỗ trợ cả lệnh text và inline keyboard
4. **Efficiency**: Tối đa 2-3 level navigation để tránh phức tạp

## 🔧 Technical Implementation

- **Framework**: Telegraf.js for Node.js
- **Callback Handling**: Event-driven với `bot.on('callback_query')`
- **State Management**: Stateless design, mỗi callback độc lập
- **Error Resilience**: Try-catch với fallback về menu chính

## 📝 Usage Flow

```
/start → Main Menu
   ↓
[User clicks any button]
   ↓
[Bot processes callback_data]
   ↓
[Display relevant content/submenu]
   ↓
[User can navigate back or forward]
```

Thiết kế này cung cấp trải nghiệm người dùng hiện đại và trực quan, giúp người dùng dễ dàng truy cập tất cả tính năng của bot chỉ với một vài cú click!
