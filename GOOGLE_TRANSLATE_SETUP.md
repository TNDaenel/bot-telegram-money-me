# Cấu hình Google Translate API cho Bot

## Bước 1: Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Bật Google Translate API:
   - Vào "APIs & Services" > "Library"
   - Tìm "Cloud Translation API"
   - Click "Enable"

## Bước 2: Tạo Service Account (Khuyến nghị)

### Cách 1: Sử dụng Service Account Key
1. Vào "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Đặt tên: `bot-translate-service`
4. Gán role: "Cloud Translation API User"
5. Tạo key JSON:
   - Click vào service account
   - Tab "Keys" > "Add Key" > "Create new key"
   - Chọn JSON format
   - Download file JSON

### Cách 2: Sử dụng API Key
1. Vào "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy API key

## Bước 3: Cấu hình Environment Variables

Thêm vào file `.env`:

```env
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEY_FILE=path/to/service-account-key.json
# HOẶC sử dụng API Key:
GOOGLE_TRANSLATE_API_KEY=your-api-key-here

# Bot Configuration
BOT_TOKEN=your_bot_token_here
DATABASE_URL="postgresql://username:password@localhost:5432/expense_bot"
```

## Bước 4: Cách sử dụng

### Tự động dịch
```javascript
const languageService = require('./services/languageService');

// Lấy ngôn ngữ user
const lang = await languageService.getUserLanguage(userId);

// Dịch text
const welcomeText = await languageService.getTranslation(lang, 'WELCOME_MESSAGE');
```

### Thêm key mới
```javascript
// Thêm key mới vào base translations
languageService.addTranslationKey('NEW_FEATURE', '🆕 New Feature');

// Sử dụng
const newFeatureText = await languageService.getTranslation(lang, 'NEW_FEATURE');
```

### Dịch text tùy chỉnh
```javascript
const GoogleTranslateService = require('./services/googleTranslateService');
const translator = new GoogleTranslateService();

// Dịch text bất kỳ
const translatedText = await translator.translateText(
  'Hello world', 
  'vi', 
  'en'
);
```

## Bước 5: Quản lý Cache

```javascript
// Xóa cache
languageService.clearTranslationCache();

// Xem thống kê cache
const stats = languageService.getCacheStats();
console.log('Cache size:', stats.size);
```

## Lợi ích của Google Translate:

1. **Tự động dịch**: Không cần hardcode bản dịch
2. **Hỗ trợ 100+ ngôn ngữ**: Tự động detect và dịch
3. **Cache thông minh**: Tránh dịch lại text đã dịch
4. **Chất lượng cao**: Sử dụng AI của Google
5. **Dễ mở rộng**: Thêm ngôn ngữ mới dễ dàng

## Chi phí:
- Google Translate API: $20/1M ký tự
- Với bot nhỏ: ~$1-5/tháng
- Có free tier: 500k ký tự/tháng

## Troubleshooting:

### Lỗi "Invalid API Key"
- Kiểm tra API key trong .env
- Đảm bảo API key có quyền truy cập Translate API

### Lỗi "Project not found"
- Kiểm tra GOOGLE_CLOUD_PROJECT_ID
- Đảm bảo project ID đúng

### Lỗi "Service account key not found"
- Kiểm tra đường dẫn file JSON
- Đảm bảo file có quyền đọc

### Lỗi "Quota exceeded"
- Kiểm tra billing
- Tăng quota hoặc optimize cache 