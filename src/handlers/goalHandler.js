const goalService = require('../services/goalService');

class GoalHandler {
  // Xử lý tạo mục tiêu từ template
  async handleCreateGoalsFromTemplate(msg, bot) {
    const userId = msg.from.id.toString();
    const chatId = msg.chat.id;
    
    try {
      // Kiểm tra xem có phải là JSON input không
      const text = msg.text || '';
      let templateData;
      
      if (text.includes('[') && text.includes(']') && text.includes('"date"')) {
        // Người dùng nhập JSON trực tiếp
        try {
          templateData = JSON.parse(text);
          console.log('📝 Parsed JSON template:', templateData);
        } catch (parseError) {
          console.error('❌ Error parsing JSON:', parseError);
          await bot.sendMessage(chatId, '❌ **Lỗi định dạng JSON!** Vui lòng kiểm tra lại cú pháp.', { parse_mode: 'Markdown' });
          return;
        }
      } else {
        // Sử dụng mẫu mặc định
        templateData = [
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
          },
          {
            "date": "2025-07-10",
            "goal": "Tiết kiệm mua xe",
            "category": "Tiền mua xe",
            "amount": 200000
          },
          {
            "date": "2025-07-12",
            "goal": "Tiết kiệm du lịch",
            "category": "Du lịch nước ngoài",
            "amount": 150000
          },
          {
            "date": "2025-07-18",
            "goal": "Trải nghiệm cá nhân",
            "category": "Đi xuyên Việt",
            "amount": 50000
          },
          {
            "date": "2025-07-25",
            "goal": "Đầu tư dài hạn",
            "category": "Mua vàng",
            "amount": 100000
          }
        ];
      }

      const result = await goalService.createGoalsFromTemplate(userId, templateData);
      
      let message = `🎯 **Đã tạo mục tiêu từ template thành công!**\n\n`;
      message += `📋 **Danh sách mục tiêu đã tạo:**\n\n`;
      
      result.goals.forEach((goal, index) => {
        message += `${index + 1}. ${goal.icon || '🎯'} **${goal.goal}**\n`;
        message += `   💰 ${goal.targetAmount.toLocaleString('vi-VN')}đ\n`;
        message += `   📅 ${new Date(goal.targetDate).toLocaleDateString('vi-VN')}\n`;
        message += `   🏷️ ${goal.category}\n\n`;
      });

      message += `\n💡 **Lệnh hữu ích:**\n`;
      message += `• /muctieu - Xem báo cáo mục tiêu\n`;
      message += `• /capnhatmuctieu <id> <số tiền> - Cập nhật tiến độ\n`;
      message += `• /taomuctieu <tên> - <danh mục> - <số tiền> - <ngày> - Tạo mục tiêu mới`;

      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error creating goals from template:', error);
      await bot.sendMessage(chatId, `❌ Lỗi: ${error.message}`);
    }
  }

  // Xử lý tạo mục tiêu mới
  async handleCreateGoal(msg, bot) {
    const userId = msg.from.id.toString();
    const chatId = msg.chat.id;
    const text = msg.text;

    try {
      // Parse input: /taomuctieu Tên mục tiêu - Danh mục - Số tiền - Ngày
      const match = text.match(/\/taomuctieu\s+(.+?)\s*-\s*(.+?)\s*-\s*(\d+[kmt]?)\s*-\s*(\d{4}-\d{2}-\d{2})/i);
      
      if (!match) {
        const helpMessage = `📝 **Cách tạo mục tiêu mới:**\n\n`;
        helpMessage += `**Cú pháp:** /taomuctieu <tên> - <danh mục> - <số tiền> - <ngày>\n\n`;
        helpMessage += `**Ví dụ:**\n`;
        helpMessage += `• /taomuctieu Mua xe máy - Tiền mua xe - 50tr - 2025-12-31\n`;
        helpMessage += `• /taomuctieu Du lịch Nhật - Du lịch nước ngoài - 20tr - 2025-06-15\n\n`;
        helpMessage += `**Đơn vị tiền:**\n`;
        helpMessage += `• k = nghìn (1k = 1,000đ)\n`;
        helpMessage += `• tr = triệu (1tr = 1,000,000đ)\n`;
        helpMessage += `• m = triệu (1m = 1,000,000đ)\n`;
        helpMessage += `• t = tỷ (1t = 1,000,000,000đ)`;

        await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
        return;
      }

      const [, goalName, category, amountStr, dateStr] = match;
      
      // Convert amount
      const amount = this.parseAmount(amountStr);
      if (!amount) {
        await bot.sendMessage(chatId, '❌ Số tiền không hợp lệ!');
        return;
      }

      const goalData = {
        goal: goalName.trim(),
        category: category.trim(),
        amount: amount,
        date: dateStr,
        priority: goalService.getPriorityFromCategory(category.trim())
      };

      const result = await goalService.createGoal(userId, goalData);
      
      let message = `🎯 **Đã tạo mục tiêu thành công!**\n\n`;
      message += `📋 **Thông tin mục tiêu:**\n`;
      message += `• **Tên:** ${result.goal.goal}\n`;
      message += `• **Danh mục:** ${result.goal.category}\n`;
      message += `• **Số tiền:** ${result.goal.targetAmount.toLocaleString('vi-VN')}đ\n`;
      message += `• **Ngày mục tiêu:** ${new Date(result.goal.targetDate).toLocaleDateString('vi-VN')}\n`;
      message += `• **Độ ưu tiên:** ${this.getPriorityText(result.goal.priority)}\n\n`;
      message += `💡 **Lệnh tiếp theo:**\n`;
      message += `• /capnhatmuctieu ${result.goal.id} <số tiền> - Cập nhật tiến độ\n`;
      message += `• /muctieu - Xem báo cáo mục tiêu`;

      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error creating goal:', error);
      await bot.sendMessage(chatId, `❌ Lỗi: ${error.message}`);
    }
  }

  // Xử lý cập nhật tiến độ mục tiêu
  async handleUpdateGoalProgress(msg, bot) {
    const userId = msg.from.id.toString();
    const chatId = msg.chat.id;
    const text = msg.text;

    try {
      // Parse input: /capnhatmuctieu <id> <số tiền>
      const match = text.match(/\/capnhatmuctieu\s+(\d+)\s+(\d+[kmt]?)/i);
      
      if (!match) {
        const helpMessage = `📝 **Cách cập nhật tiến độ mục tiêu:**\n\n`;
        helpMessage += `**Cú pháp:** /capnhatmuctieu <id> <số tiền>\n\n`;
        helpMessage += `**Ví dụ:**\n`;
        helpMessage += `• /capnhatmuctieu 1 500k\n`;
        helpMessage += `• /capnhatmuctieu 2 2tr\n\n`;
        helpMessage += `💡 **Để xem ID mục tiêu:** /muctieu`;

        await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
        return;
      }

      const [, goalId, amountStr] = match;
      const amount = this.parseAmount(amountStr);
      
      if (!amount) {
        await bot.sendMessage(chatId, '❌ Số tiền không hợp lệ!');
        return;
      }

      const result = await goalService.updateGoalProgress(userId, parseInt(goalId), amount);
      
      let message = `✅ **Đã cập nhật tiến độ thành công!**\n\n`;
      message += `🎯 **Mục tiêu:** ${result.goal.goal}\n`;
      message += `💰 **Số tiền thêm:** ${amount.toLocaleString('vi-VN')}đ\n`;
      message += `📊 **Tiến độ hiện tại:** ${result.progress.toFixed(1)}%\n`;
      message += `💵 **Đã tiết kiệm:** ${result.goal.currentAmount.toLocaleString('vi-VN')}đ / ${result.goal.targetAmount.toLocaleString('vi-VN')}đ\n\n`;

      if (result.progress >= 100) {
        message += `🎉 **Chúc mừng! Bạn đã hoàn thành mục tiêu này!**`;
      } else if (result.progress >= 80) {
        message += `🔥 **Gần hoàn thành rồi! Cố gắng thêm chút nữa!**`;
      }

      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error updating goal progress:', error);
      await bot.sendMessage(chatId, `❌ Lỗi: ${error.message}`);
    }
  }

  // Xử lý xem báo cáo mục tiêu
  async handleGoalReport(msg, bot) {
    const userId = msg.from.id.toString();
    const chatId = msg.chat.id;

    try {
      const result = await goalService.generateGoalReport(userId);
      
      if (result.goals.length === 0) {
        const message = `🎯 **Chưa có mục tiêu tài chính nào!**\n\n`;
        message += `💡 **Tạo mục tiêu ngay:**\n`;
        message += `• /taomuctieu <tên> - <danh mục> - <số tiền> - <ngày>\n`;
        message += `• /taomuctieutemplate - Tạo từ mẫu có sẵn`;

        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        return;
      }

      // Tạo keyboard cho các hành động
      const keyboard = {
        inline_keyboard: [
          [
            { text: '📊 Cập nhật tiến độ', callback_data: 'goal_update_progress' },
            { text: '➕ Tạo mục tiêu mới', callback_data: 'goal_create_new' }
          ],
          [
            { text: '🚨 Cảnh báo', callback_data: 'goal_warnings' },
            { text: '📋 Xem chi tiết', callback_data: 'goal_details' }
          ]
        ]
      };

      await bot.sendMessage(chatId, result.message, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Error generating goal report:', error);
      await bot.sendMessage(chatId, `❌ Lỗi: ${error.message}`);
    }
  }

  // Xử lý kiểm tra cảnh báo mục tiêu
  async handleGoalWarnings(msg, bot) {
    const userId = msg.from.id.toString();
    const chatId = msg.chat.id;

    try {
      const warnings = await goalService.checkGoalWarnings(userId);
      
      if (warnings.length === 0) {
        await bot.sendMessage(chatId, '✅ **Tất cả mục tiêu đều đang tiến triển tốt!**');
        return;
      }

      let message = `🚨 **CẢNH BÁO MỤC TIÊU**\n\n`;
      
      warnings.forEach((warning, index) => {
        const icon = warning.type === 'critical' ? '🔴' : '🟡';
        message += `${icon} **${warning.goal}**\n`;
        message += `   ${warning.message}\n\n`;
      });

      message += `💡 **Gợi ý:**\n`;
      message += `• Tăng cường tiết kiệm cho mục tiêu khẩn cấp\n`;
      message += `• Điều chỉnh kế hoạch nếu cần thiết\n`;
      message += `• Sử dụng /capnhatmuctieu để cập nhật tiến độ`;

      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error checking goal warnings:', error);
      await bot.sendMessage(chatId, `❌ Lỗi: ${error.message}`);
    }
  }

  // Helper methods
  parseAmount(amountStr) {
    const match = amountStr.match(/^(\d+)([kmt])?$/i);
    if (!match) return null;

    const [, number, unit] = match;
    const num = parseInt(number);

    switch (unit?.toLowerCase()) {
      case 'k': return num * 1000;
      case 'tr':
      case 'm': return num * 1000000;
      case 't': return num * 1000000000;
      default: return num;
    }
  }

  getPriorityText(priority) {
    const priorityMap = {
      'high': '🔴 Cao',
      'medium': '🟡 Trung bình',
      'low': '🟢 Thấp'
    };
    return priorityMap[priority] || '🟡 Trung bình';
  }

  // Xử lý tạo mục tiêu từ JSON input
  async handleCreateGoalsFromJSON(msg, bot) {
    const userId = msg.from.id.toString();
    const chatId = msg.chat.id;
    const text = msg.text;

    try {
      // Tìm JSON trong tin nhắn
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        await bot.sendMessage(chatId, `❌ **Không tìm thấy JSON hợp lệ!**

💡 **Cách sử dụng:**
• Copy và paste JSON format vào chat
• Hoặc sử dụng lệnh: /muctieutemplate

📝 **Ví dụ JSON format:**
\`\`\`json
[
  {
    "date": "2025-07-01",
    "goal": "Tiết kiệm mua nhà",
    "category": "Đặt cọc/Góp mua",
    "amount": 400000
  }
]
\`\`\``, { parse_mode: 'Markdown' });
        return;
      }

      const jsonString = jsonMatch[0];
      let templateData;

      try {
        templateData = JSON.parse(jsonString);
        console.log('📝 Parsed JSON template:', templateData);
      } catch (parseError) {
        console.error('❌ Error parsing JSON:', parseError);
        await bot.sendMessage(chatId, `❌ **Lỗi định dạng JSON!**

🔍 **Lỗi:** ${parseError.message}

💡 **Kiểm tra:**
• Dấu ngoặc kép đúng chưa?
• Dấu phẩy giữa các object?
• Định dạng ngày YYYY-MM-DD?`, { parse_mode: 'Markdown' });
        return;
      }

      // Validate JSON structure
      if (!Array.isArray(templateData)) {
        await bot.sendMessage(chatId, '❌ **JSON phải là một mảng (array)!**', { parse_mode: 'Markdown' });
        return;
      }

      // Validate each goal object
      for (let i = 0; i < templateData.length; i++) {
        const goal = templateData[i];
        if (!goal.date || !goal.goal || !goal.category || !goal.amount) {
          await bot.sendMessage(chatId, `❌ **Lỗi ở mục tiêu thứ ${i + 1}!**

📋 **Yêu cầu:** date, goal, category, amount

🔍 **Kiểm tra:** ${JSON.stringify(goal)}`, { parse_mode: 'Markdown' });
          return;
        }
      }

      const result = await goalService.createGoalsFromTemplate(userId, templateData);
      
      let message = `🎯 **Đã tạo mục tiêu từ JSON thành công!**\n\n`;
      message += `📋 **Danh sách mục tiêu đã tạo:**\n\n`;
      
      result.goals.forEach((goal, index) => {
        message += `${index + 1}. ${goal.icon || '🎯'} **${goal.goal}**\n`;
        message += `   💰 ${goal.targetAmount.toLocaleString('vi-VN')}đ\n`;
        message += `   📅 ${new Date(goal.targetDate).toLocaleDateString('vi-VN')}\n`;
        message += `   🏷️ ${goal.category}\n\n`;
      });

      message += `\n💡 **Lệnh hữu ích:**\n`;
      message += `• /muctieu - Xem báo cáo mục tiêu\n`;
      message += `• /capnhatmuctieu <id> <số tiền> - Cập nhật tiến độ\n`;
      message += `• /taomuctieu <tên> - <danh mục> - <số tiền> - <ngày> - Tạo mục tiêu mới`;

      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error creating goals from JSON:', error);
      await bot.sendMessage(chatId, `❌ Lỗi: ${error.message}`);
    }
  }
}

module.exports = new GoalHandler(); 