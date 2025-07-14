const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import jar service để tích hợp
const jarService = require('./jarService');

class GoalService {
  // 1. Tạo mục tiêu tài chính mới
  async createGoal(userId, goalData) {
    try {
      // Kiểm tra mục tiêu không trùng tên
      const existingGoal = await prisma.financialGoal.findFirst({
        where: { 
          userId, 
          goal: goalData.goal,
          isActive: true 
        }
      });

      if (existingGoal) {
        throw new Error('Mục tiêu này đã tồn tại');
      }

      // Tạo mục tiêu mới
      const newGoal = await prisma.financialGoal.create({
        data: {
          userId,
          goal: goalData.goal,
          category: goalData.category,
          targetAmount: goalData.amount,
          currentAmount: 0,
          targetDate: new Date(goalData.date),
          priority: goalData.priority || 'medium',
          description: goalData.description || '',
          isActive: true,
          createdAt: new Date()
        }
      });

      // Tự động tạo hũ tiền cho mục tiêu nếu chưa có
      await jarService.createJarForGoal(userId, goalData);

      return {
        success: true,
        goal: newGoal,
        message: `Đã tạo mục tiêu "${goalData.goal}" thành công!`
      };
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  }



  // 3. Cập nhật tiến độ mục tiêu
  async updateGoalProgress(userId, goalId, amount) {
    try {
      const goal = await prisma.financialGoal.findFirst({
        where: { id: goalId, userId }
      });

      if (!goal) {
        throw new Error('Không tìm thấy mục tiêu');
      }

      const newAmount = goal.currentAmount + amount;
      const progress = (newAmount / goal.targetAmount) * 100;

      const updatedGoal = await prisma.financialGoal.update({
        where: { id: goalId },
        data: { 
          currentAmount: newAmount,
          progress: Math.min(100, progress),
          lastUpdated: new Date()
        }
      });

      // Tạo giao dịch mục tiêu
      await prisma.goalTransaction.create({
        data: {
          userId,
          goalId,
          amount,
          type: 'deposit',
          description: `Cập nhật tiến độ mục tiêu: ${goal.goal}`,
          createdAt: new Date()
        }
      });

      // Tự động cập nhật hũ tiền liên quan
      try {
        const relatedJar = await prisma.jar.findFirst({
          where: {
            userId,
            name: goal.category,
            isActive: true
          }
        });

        if (relatedJar) {
          await jarService.updateGoalProgressFromJar(userId, relatedJar.id, amount, `Từ mục tiêu: ${goal.goal}`);
        }
      } catch (error) {
        console.error('Error updating related jar:', error);
      }

      return {
        success: true,
        goal: updatedGoal,
        progress: progress,
        message: `Đã cập nhật tiến độ mục tiêu "${goal.goal}": ${progress.toFixed(1)}%`
      };
    } catch (error) {
      console.error('Error updating goal progress:', error);
      throw error;
    }
  }

  // 4. Lấy danh sách mục tiêu của người dùng
  async getUserGoals(userId) {
    try {
      const goals = await prisma.financialGoal.findMany({
        where: { userId, isActive: true },
        orderBy: [
          { priority: 'desc' },
          { targetDate: 'asc' }
        ]
      });

      return goals.map(goal => ({
        ...goal,
        daysRemaining: this.calculateDaysRemaining(goal.targetDate),
        progress: (goal.currentAmount / goal.targetAmount) * 100,
        status: this.getGoalStatus(goal)
      }));
    } catch (error) {
      console.error('Error getting user goals:', error);
      throw error;
    }
  }

  // 5. Tạo mục tiêu từ mẫu động
  async createGoalsFromTemplate(userId, templateData) {
    try {
      const createdGoals = [];
      
      for (const item of templateData) {
        const goalData = {
          goal: item.goal,
          category: item.category,
          amount: item.amount,
          date: item.date,
          priority: this.getPriorityFromCategory(item.category),
          description: `Mục tiêu tự động từ template: ${item.goal}`
        };

        const result = await this.createGoal(userId, goalData);
        createdGoals.push(result.goal);
      }

      return {
        success: true,
        goals: createdGoals,
        message: `Đã tạo ${createdGoals.length} mục tiêu từ template thành công!`
      };
    } catch (error) {
      console.error('Error creating goals from template:', error);
      throw error;
    }
  }

  // 6. Tạo báo cáo mục tiêu
  async generateGoalReport(userId) {
    try {
      const goals = await this.getUserGoals(userId);
      
      if (goals.length === 0) {
        return {
          success: true,
          message: 'Chưa có mục tiêu tài chính nào!',
          goals: []
        };
      }

      let report = `🎯 **BÁO CÁO MỤC TIÊU TÀI CHÍNH**\n\n`;
      
      const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
      const totalCurrent = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
      const overallProgress = (totalCurrent / totalTarget) * 100;

      report += `💰 **Tổng mục tiêu:** ${totalTarget.toLocaleString('vi-VN')}đ\n`;
      report += `📊 **Đã tiết kiệm:** ${totalCurrent.toLocaleString('vi-VN')}đ\n`;
      report += `📈 **Tiến độ tổng thể:** ${overallProgress.toFixed(1)}%\n\n`;

      // Nhóm theo trạng thái
      const urgentGoals = goals.filter(g => g.daysRemaining <= 30);
      const activeGoals = goals.filter(g => g.daysRemaining > 30 && g.progress < 100);
      const completedGoals = goals.filter(g => g.progress >= 100);

      if (urgentGoals.length > 0) {
        report += `🚨 **MỤC TIÊU KHẨN CẤP (≤30 ngày):**\n`;
        urgentGoals.forEach(goal => {
          report += `${goal.icon} **${goal.goal}**\n`;
          report += `   💰 ${goal.currentAmount.toLocaleString('vi-VN')}đ / ${goal.targetAmount.toLocaleString('vi-VN')}đ (${goal.progress.toFixed(1)}%)\n`;
          report += `   📅 Còn ${goal.daysRemaining} ngày\n\n`;
        });
      }

      if (activeGoals.length > 0) {
        report += `📋 **MỤC TIÊU ĐANG THỰC HIỆN:**\n`;
        activeGoals.forEach(goal => {
          report += `${goal.icon} **${goal.goal}**\n`;
          report += `   💰 ${goal.currentAmount.toLocaleString('vi-VN')}đ / ${goal.targetAmount.toLocaleString('vi-VN')}đ (${goal.progress.toFixed(1)}%)\n`;
          report += `   📅 Còn ${goal.daysRemaining} ngày\n\n`;
        });
      }

      if (completedGoals.length > 0) {
        report += `✅ **MỤC TIÊU HOÀN THÀNH:**\n`;
        completedGoals.forEach(goal => {
          report += `${goal.icon} **${goal.goal}** - ${goal.progress.toFixed(1)}%\n`;
        });
      }

      return {
        success: true,
        message: report,
        goals: goals,
        stats: {
          total: goals.length,
          urgent: urgentGoals.length,
          active: activeGoals.length,
          completed: completedGoals.length,
          overallProgress: overallProgress
        }
      };
    } catch (error) {
      console.error('Error generating goal report:', error);
      throw error;
    }
  }

  // 7. Kiểm tra cảnh báo mục tiêu
  async checkGoalWarnings(userId) {
    try {
      const goals = await this.getUserGoals(userId);
      const warnings = [];

      goals.forEach(goal => {
        const daysRemaining = goal.daysRemaining;
        const progress = goal.progress;
        const requiredProgress = ((30 - daysRemaining) / 30) * 100;

        if (daysRemaining <= 7 && progress < 80) {
          warnings.push({
            type: 'critical',
            goal: goal.goal,
            message: `Mục tiêu "${goal.goal}" sắp đến hạn (${daysRemaining} ngày) nhưng chỉ hoàn thành ${progress.toFixed(1)}%`
          });
        } else if (daysRemaining <= 30 && progress < requiredProgress) {
          warnings.push({
            type: 'warning',
            goal: goal.goal,
            message: `Mục tiêu "${goal.goal}" cần tăng tốc để đạt mục tiêu đúng hạn`
          });
        }
      });

      return warnings;
    } catch (error) {
      console.error('Error checking goal warnings:', error);
      throw error;
    }
  }

  // Helper methods
  calculateDaysRemaining(targetDate) {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  getGoalStatus(goal) {
    if (goal.progress >= 100) return 'completed';
    if (goal.daysRemaining <= 7) return 'urgent';
    if (goal.daysRemaining <= 30) return 'warning';
    return 'normal';
  }

  getPriorityFromCategory(category) {
    const priorityMap = {
      'Đặt cọc/Góp mua': 'high',
      'Tiền mua xe': 'high',
      'Du lịch nước ngoài': 'medium',
      'Nội thất/Sửa chữa nhà': 'medium',
      'Mua vàng': 'low',
      'Đi xuyên Việt': 'low'
    };
    return priorityMap[category] || 'medium';
  }

  getGoalColor(category) {
    const colorMap = {
      'Đặt cọc/Góp mua': '#e74c3c',
      'Tiền mua xe': '#3498db',
      'Du lịch nước ngoài': '#9b59b6',
      'Nội thất/Sửa chữa nhà': '#f39c12',
      'Mua vàng': '#f1c40f',
      'Đi xuyên Việt': '#2ecc71'
    };
    return colorMap[category] || '#95a5a6';
  }

  getGoalIcon(category) {
    const iconMap = {
      'Đặt cọc/Góp mua': '🏠',
      'Tiền mua xe': '🚗',
      'Du lịch nước ngoài': '✈️',
      'Nội thất/Sửa chữa nhà': '🔨',
      'Mua vàng': '💰',
      'Đi xuyên Việt': '🏍️'
    };
    return iconMap[category] || '🎯';
  }

  // Tạo báo cáo tích hợp mục tiêu và hũ tiền
  async generateIntegratedGoalReport(userId) {
    try {
      const goals = await this.getUserGoals(userId);
      const integratedReport = await jarService.generateIntegratedReport(userId);

      let report = `🎯 **BÁO CÁO TÍCH HỢP MỤC TIÊU & HŨ TIỀN**\n\n`;

      // Thống kê tổng quan
      const totalGoalAmount = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
      const totalGoalProgress = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
      const overallProgress = totalGoalAmount > 0 ? (totalGoalProgress / totalGoalAmount) * 100 : 0;

      report += `📊 **THỐNG KÊ TỔNG QUAN:**\n`;
      report += `• 🎯 Tổng mục tiêu: ${goals.length} mục tiêu\n`;
      report += `• 💰 Tổng số tiền: ${totalGoalAmount.toLocaleString('vi-VN')}đ\n`;
      report += `• 📈 Tiến độ tổng thể: ${overallProgress.toFixed(1)}%\n`;
      report += `• 🏺 Hũ có mục tiêu: ${integratedReport.integrationStats.jarsWithGoals}/${integratedReport.integrationStats.totalJars}\n\n`;

      // Mục tiêu theo hũ tiền
      if (integratedReport.goalJars.length > 0) {
        report += `🏺 **MỤC TIÊU THEO HŨ TIỀN:**\n\n`;
        
        for (const goalJar of integratedReport.goalJars) {
          report += `${goalJar.jar.icon} **${goalJar.jar.name}**\n`;
          report += `   💰 Hũ: ${goalJar.jar.currentAmount.toLocaleString('vi-VN')}đ\n`;
          report += `   🎯 Mục tiêu: ${goalJar.totalGoalAmount.toLocaleString('vi-VN')}đ\n`;
          report += `   📊 Tiến độ: ${goalJar.totalCurrentAmount.toLocaleString('vi-VN')}đ\n\n`;

          // Chi tiết từng mục tiêu
          for (const goal of goalJar.goals) {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const daysRemaining = this.calculateDaysRemaining(goal.targetDate);
            
            report += `   🎯 ${goal.goal}\n`;
            report += `      💰 ${goal.currentAmount.toLocaleString('vi-VN')}đ / ${goal.targetAmount.toLocaleString('vi-VN')}đ (${progress.toFixed(1)}%)\n`;
            report += `      📅 Còn ${daysRemaining} ngày\n\n`;
          }
        }
      }

      // Cảnh báo tích hợp
      const warnings = await jarService.checkIntegratedWarnings(userId);
      if (warnings.length > 0) {
        report += `🚨 **CẢNH BÁO TÍCH HỢP:**\n\n`;
        
        warnings.forEach((warning, index) => {
          const icon = warning.severity === 'critical' ? '🔴' : '🟡';
          const typeIcon = warning.type === 'goal' ? '🎯' : warning.type === 'jar' ? '🏺' : '🔗';
          
          report += `${icon} ${typeIcon} **${warning.goal || warning.jarName}**\n`;
          report += `   ${warning.message}\n\n`;
        });
      }

      return {
        success: true,
        message: report,
        goals: goals,
        integratedReport: integratedReport,
        warnings: warnings
      };
    } catch (error) {
      console.error('Error generating integrated goal report:', error);
      throw error;
    }
  }
}

module.exports = new GoalService(); 