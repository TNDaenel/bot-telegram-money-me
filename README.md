# 🚀 Expense Bot – Telegram Chatbot for Personal Finance Management

> A smart, multilingual Telegram bot to track expenses, analyze income, and connect bank email alerts — all from your chat.


---

## 📦 Features

- 💸 Add income/expenses using natural language
- 📊 Real-time statistics and reports
- 🏦 Connect email to read bank transaction alerts
- 🌐 Multilingual interface (VN/EN/...)
- 🔐 Each user stores their own API keys securely
- ⚙️ Deployable to Railway, Render, VPS, etc.

---

## ⚙️ Setup & Deployment

### 1️⃣ Clone & Install
```bash
git clone https://github.com/your-repo/expense-bot.git
cd expense-bot
npm install
```

### 2️⃣ Configure Environment
```bash
cp .env.example .env
# Edit .env with your own keys (Telegram, OpenAI, DB, Email, ...)
```

### 3️⃣ Initialize Database (Prisma)
```bash
npx prisma db push
```

### 4️⃣ Start the Bot
```bash
npm start       # Production mode
npm run dev     # Development mode (nodemon)
```

### 5️⃣ Optional: Deploy to Cloud
- Railway (recommended)
- Render, Fly.io, VPS, Heroku, etc.

> Ensure `.env` variables are set properly in the cloud environment.

---

## 💬 Using the Bot

- 🔹 `/start` — Start and open main menu
- 🔹 Send messages like:
  - `Breakfast 50k`
  - `Salary July 15tr`
- 🔹 Use menu buttons:
  - 📊 Statistics
  - 🏦 Connect Email/Bank
  - 🌐 Change Language
  - ❓ Help

No manual editing or CLI access needed.

---

## 🛠 Commands Summary

| Command                | Description                         |
|------------------------|-------------------------------------|
| `/start`              | Launch main menu                    |
| `Lunch 80k`           | Log expense                         |
| `Bonus 3tr`           | Log income                          |
| `📊 Statistics`        | View charts                         |
| `🏦 Connect Email`      | Link your bank email                |
| `🌐 Language`          | Change bot language                 |

---

## 📌 Deployment Tips

- ❌ Never commit `.env` to Git
- ✅ Point `DATABASE_URL` to a real PostgreSQL (use Railway/NeonDB)
- ✉️ For email parsing, provide valid credentials or use Gmail OAuth
- 🛡 Use `pm2` to keep your bot running in production:
```bash
npm install -g pm2
pm2 start src/index.js --name expense-bot
pm2 save
pm2 startup
```

---

## 📚 Resources

- [Telegram Bot API Docs](https://core.telegram.org/bots/api)
- [Prisma ORM](https://www.prisma.io/)
- [Railway Hosting](https://railway.app)
- [OpenAI API](https://platform.openai.com/docs)

---

## 🤝 Contributing & Support

- Pull requests are welcome!
- Found a bug? Open an [issue](https://github.com/your-repo/expense-bot/issues)
- Need help? Reach out via Telegram or GitHub

---

> Made with ❤️ by [Tran Nguyen Daenel](https://github.com/TNDaenel)
