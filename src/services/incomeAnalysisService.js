const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class IncomeAnalysisService {
  // 1. Tự động nhận diện và phân loại nguồn thu
  async classifyIncomeFromBankTransaction(transaction) {
    try {
      const { description, amount, userId } = transaction;
      
      // Kiểm tra mapping có sẵn
      const existingMapping = await prisma.aICategoryMapping.findFirst({
        where: {
          userId,
          keyword: {
            contains: description.toLowerCase()
          }
        }
      });

      if (existingMapping) {
        // Cập nhật usage count
        await prisma.aICategoryMapping.update({
          where: { id: existingMapping.id },
          data: { usageCount: existingMapping.usageCount + 1 }
        });
        
        return {
          category: existingMapping.category,
          confidence: existingMapping.confidence,
          source: 'mapping'
        };
      }

      // Sử dụng AI để phân loại
      const aiClassification = await this.classifyWithAI(description, amount);
      
      // Lưu mapping mới
      if (aiClassification.confidence > 0.7) {
        await prisma.aICategoryMapping.create({
          data: {
            userId,
            keyword: description.toLowerCase(),
            category: aiClassification.category,
            confidence: aiClassification.confidence
          }
        });
      }

      return aiClassification;
    } catch (error) {
      console.error('Error classifying income:', error);
      return {
        category: 'other',
        confidence: 0.5,
        source: 'fallback'
      };
    }
  }

  // AI classification logic
  async classifyWithAI(description, amount) {
    // Keywords mapping cho các loại thu nhập phổ biến
    const keywordMappings = {
      'salary': ['luong', 'salary', 'lương', 'tiền lương', 'lương tháng', 'lương cơ bản'],
      'bonus': ['thưởng', 'bonus', 'tiền thưởng', 'thưởng tháng', 'thưởng năm'],
      'freelance': ['freelance', 'làm thêm', 'dự án', 'contract', 'hợp đồng'],
      'investment': ['lãi', 'lợi nhuận', 'dividend', 'cổ tức', 'đầu tư', 'investment'],
      'rental': ['thuê', 'rent', 'cho thuê', 'tiền thuê', 'rental'],
      'business': ['kinh doanh', 'business', 'doanh thu', 'lợi nhuận kinh doanh'],
      'other': ['khác', 'other', 'khác']
    };

    const lowerDescription = description.toLowerCase();
    let bestMatch = { category: 'other', confidence: 0.3 };

    for (const [category, keywords] of Object.entries(keywordMappings)) {
      for (const keyword of keywords) {
        if (lowerDescription.includes(keyword)) {
          const confidence = keyword.length / description.length;
          if (confidence > bestMatch.confidence) {
            bestMatch = { category, confidence: Math.min(confidence, 0.9) };
          }
        }
      }
    }

    // Tăng confidence dựa trên amount patterns
    if (amount > 10000000) { // > 10M
      if (bestMatch.category === 'salary') bestMatch.confidence += 0.1;
    } else if (amount > 1000000) { // > 1M
      if (bestMatch.category === 'bonus') bestMatch.confidence += 0.1;
    }

    return bestMatch;
  }

  // 2. Phân tích hiệu suất từng nguồn thu
  async analyzeIncomePerformance(userId, period = 'monthly', startDate = null, endDate = null) {
    try {
      const now = new Date();
      let periodStart, periodEnd;

      if (!startDate || !endDate) {
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
      } else {
        periodStart = new Date(startDate);
        periodEnd = new Date(endDate);
      }

      // Lấy dữ liệu thu nhập
      const incomes = await prisma.income.findMany({
        where: {
          userId,
          createdAt: {
            gte: periodStart,
            lte: periodEnd
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Phân tích theo nguồn
      const sourceBreakdown = {};
      let totalIncome = 0;

      incomes.forEach(income => {
        const source = income.source;
        if (!sourceBreakdown[source]) {
          sourceBreakdown[source] = { amount: 0, count: 0, transactions: [] };
        }
        sourceBreakdown[source].amount += income.amount;
        sourceBreakdown[source].count += 1;
        sourceBreakdown[source].transactions.push(income);
        totalIncome += income.amount;
      });

      // Tính growth rate so với kỳ trước
      const previousPeriodStart = new Date(periodStart);
      const previousPeriodEnd = new Date(periodEnd);
      const periodDays = (periodEnd - periodStart) / (1000 * 60 * 60 * 24);
      
      previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays);
      previousPeriodEnd.setDate(previousPeriodEnd.getDate() - periodDays);

      const previousIncomes = await prisma.income.findMany({
        where: {
          userId,
          createdAt: {
            gte: previousPeriodStart,
            lte: previousPeriodEnd
          }
        }
      });

      const previousTotal = previousIncomes.reduce((sum, income) => sum + income.amount, 0);
      const growthRate = previousTotal > 0 ? ((totalIncome - previousTotal) / previousTotal) * 100 : null;

      // Tạo insights và recommendations
      const insights = await this.generateInsights(sourceBreakdown, totalIncome, growthRate);
      const recommendations = await this.generateRecommendations(sourceBreakdown, totalIncome, growthRate);

      // Lưu phân tích
      await prisma.incomeAnalysis.upsert({
        where: {
          userId_period_periodStart: {
            userId,
            period,
            periodStart
          }
        },
        update: {
          periodEnd,
          totalIncome,
          sourceBreakdown,
          growthRate,
          insights,
          recommendations
        },
        create: {
          userId,
          period,
          periodStart,
          periodEnd,
          totalIncome,
          sourceBreakdown,
          growthRate,
          insights,
          recommendations
        }
      });

      return {
        period,
        periodStart,
        periodEnd,
        totalIncome,
        sourceBreakdown,
        growthRate,
        insights,
        recommendations,
        transactionCount: incomes.length
      };
    } catch (error) {
      console.error('Error analyzing income performance:', error);
      throw error;
    }
  }

  // 3. Tạo insights thông minh
  async generateInsights(sourceBreakdown, totalIncome, growthRate) {
    const insights = [];
    
    // Tìm nguồn thu chính
    const sources = Object.entries(sourceBreakdown);
    sources.sort((a, b) => b[1].amount - a[1].amount);
    
    if (sources.length > 0) {
      const mainSource = sources[0];
      const mainSourcePercentage = ((mainSource[1].amount / totalIncome) * 100).toFixed(1);
      insights.push(`📈 Nguồn thu chính: ${this.getSourceText(mainSource[0])} chiếm ${mainSourcePercentage}% tổng thu nhập`);
    }

    // Phân tích growth
    if (growthRate !== null) {
      if (growthRate > 0) {
        insights.push(`🚀 Thu nhập tăng ${growthRate.toFixed(1)}% so với kỳ trước`);
      } else if (growthRate < 0) {
        insights.push(`⚠️ Thu nhập giảm ${Math.abs(growthRate).toFixed(1)}% so với kỳ trước`);
      } else {
        insights.push(`📊 Thu nhập ổn định so với kỳ trước`);
      }
    }

    // Phân tích đa dạng hóa
    if (sources.length >= 3) {
      insights.push(`🎯 Bạn có ${sources.length} nguồn thu nhập - đa dạng hóa tốt!`);
    } else if (sources.length === 1) {
      insights.push(`💡 Cân nhắc đa dạng hóa nguồn thu nhập để giảm rủi ro`);
    }

    // Phân tích từng nguồn
    sources.forEach(([source, data]) => {
      const percentage = ((data.amount / totalIncome) * 100).toFixed(1);
      if (percentage > 70) {
        insights.push(`⚠️ ${this.getSourceText(source)} chiếm ${percentage}% - phụ thuộc cao`);
      }
    });

    return insights.join('\n');
  }

  // 4. Tạo recommendations
  async generateRecommendations(sourceBreakdown, totalIncome, growthRate) {
    const recommendations = [];
    
    const sources = Object.entries(sourceBreakdown);
    
    // Recommendation dựa trên đa dạng hóa
    if (sources.length < 3) {
      recommendations.push(`💡 **Đa dạng hóa thu nhập:** Xem xét tạo thêm nguồn thu nhập thụ động như đầu tư, cho thuê, hoặc kinh doanh online`);
    }

    // Recommendation dựa trên growth
    if (growthRate !== null && growthRate < 0) {
      recommendations.push(`📈 **Tăng thu nhập:** Tìm cách tăng thu nhập từ nguồn chính hoặc phát triển kỹ năng mới`);
    }

    // Recommendation dựa trên nguồn thu
    sources.forEach(([source, data]) => {
      const percentage = (data.amount / totalIncome) * 100;
      
      if (source === 'salary' && percentage > 80) {
        recommendations.push(`🎯 **Phát triển kỹ năng:** Tăng thu nhập từ freelance hoặc dự án phụ`);
      }
      
      if (source === 'investment' && percentage < 10) {
        recommendations.push(`💰 **Đầu tư:** Tăng tỷ lệ thu nhập từ đầu tư để tạo thu nhập thụ động`);
      }
      
      if (source === 'freelance' && data.count < 3) {
        recommendations.push(`🔧 **Mở rộng freelance:** Tìm thêm dự án để ổn định thu nhập`);
      }
    });

    return recommendations.join('\n');
  }

  // 5. Quản lý mục tiêu thu nhập
  async createIncomeGoal(userId, name, targetAmount, period, startDate, endDate = null) {
    try {
      return await prisma.incomeGoal.create({
        data: {
          userId,
          name,
          targetAmount,
          period,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null
        }
      });
    } catch (error) {
      console.error('Error creating income goal:', error);
      throw error;
    }
  }

  async getIncomeGoals(userId) {
    try {
      return await prisma.incomeGoal.findMany({
        where: {
          userId,
          isActive: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error getting income goals:', error);
      throw error;
    }
  }

  async updateGoalProgress(userId, goalId) {
    try {
      const goal = await prisma.incomeGoal.findFirst({
        where: { id: goalId, userId }
      });

      if (!goal) throw new Error('Goal not found');

      // Tính thu nhập trong khoảng thời gian của goal
      const incomes = await prisma.income.findMany({
        where: {
          userId,
          createdAt: {
            gte: goal.startDate,
            lte: goal.endDate || new Date()
          }
        }
      });

      const currentAmount = incomes.reduce((sum, income) => sum + income.amount, 0);
      const progress = (currentAmount / goal.targetAmount) * 100;

      await prisma.incomeGoal.update({
        where: { id: goalId },
        data: { currentAmount }
      });

      return {
        ...goal,
        currentAmount,
        progress: Math.min(progress, 100),
        remaining: Math.max(goal.targetAmount - currentAmount, 0)
      };
    } catch (error) {
      console.error('Error updating goal progress:', error);
      throw error;
    }
  }

  // Helper methods
  getSourceText(source) {
    const sourceMap = {
      'salary': 'Lương',
      'bonus': 'Thưởng',
      'freelance': 'Freelance',
      'investment': 'Đầu tư',
      'rental': 'Cho thuê',
      'business': 'Kinh doanh',
      'other': 'Khác'
    };
    return sourceMap[source] || source;
  }

  // 6. Xử lý input tự động từ người dùng
  async processIncomeInput(userId, input) {
    try {
        // Parse input để tách amount và description
  const matches = [...input.matchAll(/(\d+(?:,\d+)*)\s*(k|nghìn|đ|vnd|triệu|tr)?/gi)];
  if (!matches.length) throw new Error('Không thể xác định số tiền từ input');
  const lastMatch = matches[matches.length - 1];
  let amount = parseInt(lastMatch[1].replace(/,/g, ''));
  const unit = lastMatch[2] ? lastMatch[2].toLowerCase() : '';
  let description = input.replace(lastMatch[0], '').trim();

  // Xử lý đơn vị tiền tệ
  if (unit.includes('tr') || unit.includes('triệu')) {
    amount = amount * 1000000;
  } else if (unit.includes('k') || unit.includes('nghìn')) {
    amount = amount * 1000;
  }

      // Phân loại bằng AI
      const classification = await this.classifyWithAI(description, amount);

      // Tạo income record
      const income = await prisma.income.create({
        data: {
          userId,
          source: classification.category,
          amount,
          description,
          aiCategory: classification.category,
          aiConfidence: classification.confidence
        }
      });

      // Tự động phân bổ vào hũ tiền nếu có
      let jarDistribution = null;
      try {
        const jarService = require('./jarService');
        jarDistribution = await jarService.autoDistributeIncome(userId, amount, description);
      } catch (error) {
        console.log('No jar system available or error distributing to jars:', error.message);
      }

      // Cập nhật balance
      await this.updateUserBalance(userId, amount);

      // Tạo message phản hồi
      let message = `✅ Đã ghi nhận thu nhập: ${amount.toLocaleString('vi-VN')}đ\n📂 Phân loại: ${this.getSourceText(classification.category)}\n📝 Mô tả: ${description}`;
      
      // Thêm thông tin phân bổ hũ tiền nếu có
      if (jarDistribution && jarDistribution.distribution.length > 0) {
        message += `\n\n🏺 **Tự động phân bổ vào hũ tiền:**\n`;
        jarDistribution.distribution.forEach(item => {
          message += `${item.jarIcon} ${item.jarName}: ${item.amount.toLocaleString('vi-VN')}đ (${item.percentage}%)\n`;
        });
      }

      return {
        income,
        classification,
        jarDistribution,
        message
      };
    } catch (error) {
      console.error('Error processing income input:', error);
      throw error;
    }
  }

  async updateUserBalance(userId, amount) {
    try {
      await prisma.userBalance.upsert({
        where: { userId },
        update: {
          totalIncome: { increment: amount },
          totalBalance: { increment: amount }
        },
        create: {
          userId,
          totalIncome: amount,
          totalBalance: amount
        }
      });
    } catch (error) {
      console.error('Error updating user balance:', error);
    }
  }
}

module.exports = new IncomeAnalysisService(); 