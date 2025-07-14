# 🎯 HƯỚNG DẪN TÍNH NĂNG MỤC TIÊU TÀI CHÍNH

## 📋 Tổng quan

Tính năng **Mục tiêu Tài chính** giúp bạn:
- ✅ **Thiết lập mục tiêu tiết kiệm** với thời hạn cụ thể
- 📊 **Theo dõi tiến độ** theo thời gian thực
- 🚨 **Nhận cảnh báo** khi mục tiêu sắp đến hạn
- 🏺 **Tự động tạo hũ tiền** cho từng mục tiêu
- 🤖 **AI phân tích** và đưa ra gợi ý tối ưu

## 🚀 Cách sử dụng

### 1. Tạo mục tiêu từ mẫu có sẵn

**Lệnh:** `/muctieutemplate` hoặc nhập "mục tiêu template"

**Kết quả:** Tạo 6 mục tiêu mẫu:
- 🏠 **Tiết kiệm mua nhà** (400,000đ - 01/07/2025)
- 🔨 **Tiết kiệm nội thất** (100,000đ - 05/07/2025)
- 🚗 **Tiết kiệm mua xe** (200,000đ - 10/07/2025)
- ✈️ **Tiết kiệm du lịch** (150,000đ - 12/07/2025)
- 🏍️ **Trải nghiệm cá nhân** (50,000đ - 18/07/2025)
- 💰 **Đầu tư dài hạn** (100,000đ - 25/07/2025)

### 1.1. Tạo mục tiêu từ JSON format

**Cách sử dụng:** Copy và paste JSON format vào chat

**Ví dụ JSON:**
```json
[
  {
    "date": "2025-07-01",
    "goal": "Tiết kiệm mua nhà",
    "category": "Đặt cọc/Góp mua",
    "amount": 400000
  },
  {
    "date": "2025-07-05",
    "goal": "Tiết kiệm nội thất",
    "category": "Nội thất/Sửa chữa nhà",
    "amount": 100000
  }
]
```

**Lưu ý:**
- Định dạng ngày: `YYYY-MM-DD`
- Số tiền: số nguyên (không có đơn vị)
- Tất cả field đều bắt buộc: `date`, `goal`, `category`, `amount`

### 2. Tạo mục tiêu mới

**Cú pháp:** `/taomuctieu <tên> - <danh mục> - <số tiền> - <ngày>`

**Ví dụ:**
```
/taomuctieu Mua xe máy - Tiền mua xe - 50tr - 2025-12-31
/taomuctieu Du lịch Nhật - Du lịch nước ngoài - 20tr - 2025-06-15
/taomuctieu Khám bệnh - Y tế - 5tr - 2025-03-30
```

**Đơn vị tiền hỗ trợ:**
- `k` = nghìn (1k = 1,000đ)
- `tr` = triệu (1tr = 1,000,000đ)
- `m` = triệu (1m = 1,000,000đ)
- `t` = tỷ (1t = 1,000,000,000đ)

### 3. Cập nhật tiến độ mục tiêu

**Cú pháp:** `/capnhatmuctieu <id> <số tiền>`

**Ví dụ:**
```
/capnhatmuctieu 1 500k
/capnhatmuctieu 2 2tr
/capnhatmuctieu 3 1000000
```

### 4. Xem báo cáo mục tiêu

**Lệnh:** `/muctieu` hoặc nhập "mục tiêu"

**Thông tin hiển thị:**
- 📊 **Tiến độ tổng thể** của tất cả mục tiêu
- 🚨 **Mục tiêu khẩn cấp** (≤30 ngày)
- 📋 **Mục tiêu đang thực hiện**
- ✅ **Mục tiêu hoàn thành**

### 5. Kiểm tra cảnh báo

**Lệnh:** `/muctieu cảnh báo` hoặc nhập "cảnh báo mục tiêu"

**Cảnh báo được kích hoạt khi:**
- ⚠️ **Còn ≤7 ngày** nhưng tiến độ <80%
- 🟡 **Còn ≤30 ngày** nhưng tiến độ chậm hơn dự kiến

## 🎯 Tính năng nâng cao

### Tự động tạo hũ tiền

Khi tạo mục tiêu, bot sẽ **tự động tạo hũ tiền** tương ứng:
- 🏠 **Đặt cọc/Góp mua** → Hũ "Đặt cọc/Góp mua"
- 🚗 **Tiền mua xe** → Hũ "Tiền mua xe"
- ✈️ **Du lịch nước ngoài** → Hũ "Du lịch nước ngoài"
- 🔨 **Nội thất/Sửa chữa nhà** → Hũ "Nội thất/Sửa chữa nhà"
- 💰 **Mua vàng** → Hũ "Mua vàng"
- 🏍️ **Đi xuyên Việt** → Hũ "Đi xuyên Việt"

### Phân loại ưu tiên

Bot tự động phân loại mục tiêu theo độ ưu tiên:

**🔴 Cao (High):**
- Đặt cọc/Góp mua
- Tiền mua xe

**🟡 Trung bình (Medium):**
- Du lịch nước ngoài
- Nội thất/Sửa chữa nhà

**🟢 Thấp (Low):**
- Mua vàng
- Đi xuyên Việt

### AI Phân tích

Bot sử dụng AI để:
- 🎯 **Đề xuất mục tiêu** phù hợp với thu nhập
- 📈 **Dự đoán khả năng** hoàn thành mục tiêu
- 💡 **Đưa ra gợi ý** tối ưu hóa tiết kiệm
- ⚠️ **Cảnh báo sớm** khi có rủi ro

## 📱 Giao diện Bot

### Menu chính
```
🎉 Bot Quản lý Tài chính

📊 Thống kê    📋 Lịch sử
💰 Thu nhập    💳 Số dư
🏺 Hũ tiền     🎯 Mục tiêu
❓ Hướng dẫn
```

### Menu mục tiêu
```
🎯 BÁO CÁO MỤC TIÊU TÀI CHÍNH

📊 Cập nhật tiến độ    ➕ Tạo mục tiêu mới
🚨 Cảnh báo           📋 Xem chi tiết
🎯 Tạo từ mẫu        🏠 Menu chính
```

## 🔧 Lệnh nhanh

| Lệnh | Mô tả |
|------|-------|
| `/muctieu` | Xem báo cáo mục tiêu |
| `/muctieutemplate` | Tạo mục tiêu từ mẫu |
| `/taomuctieu` | Tạo mục tiêu mới |
| `/capnhatmuctieu` | Cập nhật tiến độ |

## 📝 Cách sử dụng JSON format

**Copy và paste JSON vào chat:**
```json
[
  {
    "date": "2025-07-01",
    "goal": "Tiết kiệm mua nhà",
    "category": "Đặt cọc/Góp mua",
    "amount": 400000
  }
]
```

**Bot sẽ tự động:**
- ✅ Parse JSON format
- 🎯 Tạo mục tiêu từ dữ liệu
- 🏺 Tạo hũ tiền tương ứng
- 📊 Hiển thị báo cáo kết quả

## 💡 Mẹo sử dụng

### 1. Thiết lập mục tiêu SMART
- **S**pecific (Cụ thể): "Mua xe máy Honda Vision"
- **M**easurable (Đo lường được): "50 triệu đồng"
- **A**chievable (Khả thi): Phù hợp với thu nhập
- **R**elevant (Liên quan): Quan trọng với cuộc sống
- **T**ime-bound (Có thời hạn): "31/12/2025"

### 2. Ưu tiên mục tiêu
- 🔴 **Cao**: Mục tiêu quan trọng, ảnh hưởng lớn
- 🟡 **Trung bình**: Mục tiêu cần thiết nhưng không gấp
- 🟢 **Thấp**: Mục tiêu mong muốn, có thể hoãn

### 3. Cập nhật thường xuyên
- 📅 **Hàng tuần**: Cập nhật tiến độ tiết kiệm
- 📊 **Hàng tháng**: Đánh giá và điều chỉnh mục tiêu
- 🚨 **Ngay lập tức**: Khi nhận cảnh báo

### 4. Kết hợp với hũ tiền
- 🏺 **Tự động phân bổ** thu nhập vào hũ mục tiêu
- 💸 **Tự động trừ tiền** khi chi tiêu liên quan
- 🔄 **Chuyển tiền** giữa các hũ khi cần thiết

## 🚨 Xử lý sự cố

### Lỗi thường gặp

**1. "Mục tiêu này đã tồn tại"**
- ✅ Giải pháp: Đổi tên mục tiêu hoặc xóa mục tiêu cũ

**2. "Số tiền không hợp lệ"**
- ✅ Giải pháp: Kiểm tra định dạng (VD: 50tr, 1000k, 5000000)

**3. "Ngày không hợp lệ"**
- ✅ Giải pháp: Sử dụng định dạng YYYY-MM-DD (VD: 2025-12-31)

**4. "Không tìm thấy mục tiêu"**
- ✅ Giải pháp: Kiểm tra ID mục tiêu bằng lệnh `/muctieu`

### Liên hệ hỗ trợ

Nếu gặp vấn đề, hãy:
1. 📝 **Kiểm tra lỗi** trong tin nhắn bot
2. 🔄 **Thử lại** lệnh
3. 📋 **Ghi lại** thông tin lỗi
4. 💬 **Liên hệ** admin để được hỗ trợ

## 🎉 Kết luận

Tính năng **Mục tiêu Tài chính** giúp bạn:
- 🎯 **Có định hướng rõ ràng** trong việc tiết kiệm
- 📊 **Theo dõi tiến độ** một cách trực quan
- 🚨 **Nhận cảnh báo sớm** để kịp thời điều chỉnh
- 🤖 **Tận dụng AI** để tối ưu hóa kế hoạch tài chính

**Bắt đầu ngay hôm nay** để xây dựng tương lai tài chính vững chắc! 🚀 