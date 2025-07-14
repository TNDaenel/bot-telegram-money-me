const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class BalanceService {
  // 1. Tính toán số dư hiện tại
  async calculateCurrentBalance(userId, period = 'monthly') {
    try {
      const now = new Date();
      let periodStart, periodEnd;

      switch (period) {
        case 'monthly':
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'quarterly':
          const quarter = Math.floor(now.getMonth() / 3);
          periodStart = new Date(now.getFullYear(), quarter * 3, 1);
          periodEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
          break;
        case 'yearly':
          periodStart = new Date(now.getFullYear(), 0, 1);
          periodEnd = new Date(now.getFullYear(), 11, 31);
          break;
        default:
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      // Lấy tổng thu nhập
      const totalIncome = await prisma.income.aggregate({
        where: {
          userId,
          createdAt: {
            gte: periodStart,
            lte: periodEnd
          }
        },
        _sum: {
          amount: true
        }
      });

      // Lấy tổng chi tiêu
      const totalExpense = await prisma.expense.aggregate({
        where: {
          userId,
          createdAt: {
            gte: periodStart,
            lte: periodEnd
          }
        },
        _sum: {
          amount: true
        }
      });

      const income = totalIncome._sum.amount || 0;
      const expense = totalExpense._sum.amount || 0;
      const balance = income - expense;

      return {
        period,
        periodStart,
        periodEnd,
        totalIncome: income,
        totalExpense: expense,
        balance,
        status: this.getBalanceStatus(balance),
        percentage: income > 0 ? ((expense / income) * 100).toFixed(1) : 0
      };
    } catch (error) {
      console.error('Error calculating current balance:', error);
      throw error;
    }
  }

  // 2. Phân tích trạng thái số dư
  getBalanceStatus(balance) {
    if (balance > 0) {
      return {
        type: 'positive',
        emoji: '👍',
        status: 'Số Dư Dương',
        description: 'Tổng Thu Nhập > Tổng Chi Tiêu. Bạn đang kiểm soát tốt dòng tiền!'
      };
    } else if (balance < 0) {
      return {
        type: 'negative',
        emoji: '👎',
        status: 'Số Dư Âm',
        description: 'Tổng Thu Nhập < Tổng Chi Tiêu. Cần điều chỉnh chi tiêu ngay!'
      };
    } else {
      return {
        type: 'neutral',
        emoji: '😐',
        status: 'Số Dư Bằng Không',
        description: 'Tổng Thu Nhập ≈ Tổng Chi Tiêu. Cần tạo khoản thặng dư!'
      };
    }
  }

  // 3. Dự báo số dư cuối kỳ
  async predictEndOfPeriodBalance(userId, period = 'monthly') {
    try {
      const currentBalance = await this.calculateCurrentBalance(userId, period);
      const now = new Date();
      let periodEnd, daysRemaining, daysElapsed;

      switch (period) {
        case 'monthly':
          periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          daysElapsed = now.getDate();
          daysRemaining = periodEnd.getDate() - daysElapsed;
          break;
        case 'quarterly':
          const quarter = Math.floor(now.getMonth() / 3);
          periodEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
          daysElapsed = Math.floor((now - new Date(now.getFullYear(), quarter * 3, 1)) / (1000 * 60 * 60 * 24));
          daysRemaining = Math.floor((periodEnd - now) / (1000 * 60 * 60 * 24));
          break;
        default:
          periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          daysElapsed = now.getDate();
          daysRemaining = periodEnd.getDate() - daysElapsed;
      }

      // Tính tốc độ chi tiêu trung bình
      const avgDailyExpense = currentBalance.totalExpense / daysElapsed;
      const predictedExpense = avgDailyExpense * daysRemaining;
      const predictedBalance = currentBalance.balance - predictedExpense;

      return {
        currentBalance: currentBalance.balance,
        predictedBalance,
        avgDailyExpense: Math.round(avgDailyExpense),
        daysRemaining,
        warning: predictedBalance < 0 ? '⚠️ Cảnh báo: Dự báo số dư âm!' : null
      };
    } catch (error) {
      console.error('Error predicting balance:', error);
      throw error;
    }
  }

  // 4. Phân tích nguyên nhân số dư âm
  async analyzeNegativeBalanceCauses(userId, period = 'monthly') {
    try {
      const balance = await this.calculateCurrentBalance(userId, period);
      
      if (balance.balance >= 0) {
        return null; // Không cần phân tích nếu số dư không âm
      }

      // Lấy top 5 danh mục chi tiêu lớn nhất
      const topExpenses = await prisma.expense.groupBy({
        by: ['category'],
        where: {
          userId,
          createdAt: {
            gte: balance.periodStart,
            lte: balance.periodEnd
          }
        },
        _sum: {
          amount: true
        },
        _count: {
          category: true
        },
        orderBy: {
          _sum: {
            amount: 'desc'
          }
        },
        take: 5
      });

      const causes = topExpenses.map(expense => ({
        category: expense.category,
        amount: expense._sum.amount,
        count: expense._count.category,
        percentage: ((expense._sum.amount / balance.totalExpense) * 100).toFixed(1)
      }));

      return {
        totalDeficit: Math.abs(balance.balance),
        mainCauses: causes,
        recommendation: this.generateDeficitRecommendation(causes, balance)
      };
    } catch (error) {
      console.error('Error analyzing negative balance causes:', error);
      throw error;
    }
  }

  // 5. Gợi ý hành động cho số dư dương
  async generatePositiveBalanceActions(userId, balance) {
    try {
      const actions = [];
      
      // Kiểm tra quỹ khẩn cấp
      const emergencyFund = await this.checkEmergencyFund(userId);
      if (!emergencyFund.hasFund) {
        actions.push({
          type: 'emergency_fund',
          title: '🏦 Xây dựng Quỹ Khẩn Cấp',
          description: `Chuyển ${(balance.balance * 0.5).toLocaleString('vi-VN')}đ vào quỹ khẩn cấp`,
          amount: Math.round(balance.balance * 0.5),
          priority: 'high'
        });
      }

      // Kiểm tra mục tiêu tiết kiệm
      const savingsGoals = await this.getActiveSavingsGoals(userId);
      if (savingsGoals.length > 0) {
        const goal = savingsGoals[0]; // Lấy mục tiêu ưu tiên cao nhất
        const suggestedAmount = Math.round(balance.balance * 0.3);
        actions.push({
          type: 'savings_goal',
          title: `🎯 Tiết kiệm cho: ${goal.name}`,
          description: `Chuyển ${suggestedAmount.toLocaleString('vi-VN')}đ vào mục tiêu`,
          amount: suggestedAmount,
          goalId: goal.id,
          priority: 'medium'
        });
      }

      // Gợi ý đầu tư
      if (balance.balance > 5000000) { // > 5 triệu
        actions.push({
          type: 'investment',
          title: '💰 Đầu tư',
          description: 'Cân nhắc đầu tư vào các kênh sinh lời',
          amount: Math.round(balance.balance * 0.2),
          priority: 'low'
        });
      }

      return actions;
    } catch (error) {
      console.error('Error generating positive balance actions:', error);
      return [];
    }
  }

  // 6. Tạo báo cáo số dư chi tiết
  async generateBalanceReport(userId, period = 'monthly') {
    try {
      const balance = await this.calculateCurrentBalance(userId, period);
      const prediction = await this.predictEndOfPeriodBalance(userId, period);
      const negativeAnalysis = await this.analyzeNegativeBalanceCauses(userId, period);
      const positiveActions = balance.balance > 0 ? 
        await this.generatePositiveBalanceActions(userId, balance) : [];

      let report = `📊 **BÁO CÁO SỐ DƯ ${period.toUpperCase()}**\n\n`;
      
      // Thông tin cơ bản
      report += `${balance.status.emoji} **${balance.status.status}**\n`;
      report += `💰 Tổng thu nhập: ${balance.totalIncome.toLocaleString('vi-VN')}đ\n`;
      report += `💸 Tổng chi tiêu: ${balance.totalExpense.toLocaleString('vi-VN')}đ\n`;
      report += `📈 Số dư: **${balance.balance.toLocaleString('vi-VN')}đ**\n`;
      report += `📊 Tỷ lệ chi/ thu: ${balance.percentage}%\n\n`;

      // Dự báo
      if (prediction.warning) {
        report += `🔮 **DỰ BÁO:** ${prediction.warning}\n`;
        report += `📅 Số dư dự kiến cuối kỳ: ${prediction.predictedBalance.toLocaleString('vi-VN')}đ\n`;
        report += `📊 Chi tiêu trung bình/ngày: ${prediction.avgDailyExpense.toLocaleString('vi-VN')}đ\n\n`;
      }

      // Phân tích nguyên nhân số dư âm
      if (negativeAnalysis) {
        report += `🔍 **NGUYÊN NHÂN CHÍNH:**\n`;
        negativeAnalysis.mainCauses.forEach((cause, index) => {
          report += `${index + 1}. ${cause.category}: ${cause.amount.toLocaleString('vi-VN')}đ (${cause.percentage}%)\n`;
        });
        report += `\n💡 **GỢI Ý:** ${negativeAnalysis.recommendation}\n\n`;
      }

      // Hành động cho số dư dương
      if (positiveActions.length > 0) {
        report += `✅ **HÀNH ĐỘNG ĐỀ XUẤT:**\n`;
        positiveActions.forEach((action, index) => {
          report += `${index + 1}. ${action.title}\n`;
          report += `   💰 ${action.amount.toLocaleString('vi-VN')}đ\n`;
          report += `   📝 ${action.description}\n\n`;
        });
      }

      return report;
    } catch (error) {
      console.error('Error generating balance report:', error);
      throw error;
    }
  }

  // Helper methods
  async checkEmergencyFund(userId) {
    try {
      const emergencyJar = await prisma.jar.findFirst({
        where: {
          userId,
          name: { contains: 'Khẩn cấp' }
        }
      });

      if (!emergencyJar) {
        return { hasFund: false, amount: 0 };
      }

      // Tính 3-6 tháng chi phí sinh hoạt
      const monthlyExpense = await prisma.expense.aggregate({
        where: {
          userId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { amount: true }
      });

      const targetAmount = (monthlyExpense._sum.amount || 0) * 3;
      const isAdequate = emergencyJar.currentAmount >= targetAmount;

      return {
        hasFund: true,
        amount: emergencyJar.currentAmount,
        targetAmount,
        isAdequate
      };
    } catch (error) {
      console.error('Error checking emergency fund:', error);
      return { hasFund: false, amount: 0 };
    }
  }

  async getActiveSavingsGoals(userId) {
    try {
      return await prisma.incomeGoal.findMany({
        where: {
          userId,
          isActive: true
        },
        orderBy: [
          { targetAmount: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 3
      });
    } catch (error) {
      console.error('Error getting savings goals:', error);
      return [];
    }
  }

  generateDeficitRecommendation(causes, balance) {
    const topCause = causes[0];
    const recommendations = [];

    if (topCause.percentage > 50) {
      recommendations.push(`Tập trung cắt giảm chi tiêu cho ${topCause.category}`);
    }

    if (balance.percentage > 100) {
      recommendations.push('Cần tăng thu nhập hoặc giảm chi tiêu đáng kể');
    }

    if (causes.length > 3) {
      recommendations.push('Rà soát tất cả danh mục chi tiêu, không chỉ top 3');
    }

    return recommendations.join('. ') + '.';
  }
}

module.exports = new BalanceService(); 