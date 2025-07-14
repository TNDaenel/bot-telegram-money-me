@echo off
echo 🤖 Starting Expense Bot in Development Mode...
echo.

cd /d "g:\bot telegram\expense-bot"

echo 📋 Checking environment...
if not exist .env (
    echo ❌ .env file not found!
    echo 💡 Please create .env with required variables
    pause
    exit /b 1
)

echo 📋 Checking Node.js version...
node --version

echo 📋 Checking dependencies...
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
)

echo 🚀 Starting bot with file watching...
echo 💡 Press Ctrl+C to stop the bot
echo.

npm run dev
