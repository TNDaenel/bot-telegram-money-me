const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class JarService {
  // 1. Tạo hũ tiền mới
  async createJar(userId, jarData) {
    try {
      // Kiểm tra tên hũ không trùng
      const existingJar = await prisma.jar.findFirst({
        where: { userId, name: jarData.name, isActive: true }
      });

      if (existingJar) {
        console.log('Tạo hũ thất bại - trùng tên:', jarData.name);
        return {
          success: false,
          message: 'Tên hũ tiền đã tồn tại'
        };
      }

      // Tạo hũ mới
      const newJar = await prisma.jar.create({
        data: {
          userId,
          name: jarData.name,
          description: jarData.description || '',
          targetAmount: jarData.targetAmount || null,
          currentAmount: jarData.currentAmount || 0,
          color: jarData.color || this.getJarColor(jarData.name),
          icon: jarData.icon || this.getJarIcon(jarData.name),
          percentage: jarData.percentage || 10,
          isActive: true
        }
      });
      console.log('Tạo hũ thành công:', newJar);

      return {
        success: true,
        jar: newJar,
        message: `Đã tạo hũ "${newJar.name}" thành công!`
      };
    } catch (error) {
      console.error('Error creating jar:', error);
      return {
        success: false,
        message: 'Lỗi khi tạo hũ tiền'
      };
    }
  }

  // 2. Tạo các hũ mặc định
  async setupDefaultJars(userId) {
    try {
      const defaultJars = [
        {
          name: 'Chi tiêu cần thiết (NEC)',
          description: 'Chi phí sinh hoạt, ăn uống, đi lại, hóa đơn.',
          percentage: 55,
          icon: '🏠',
          color: '#e74c3c'
        },
        {
          name: 'Tiết kiệm dài hạn (LTSS)',
          description: 'Mua nhà, mua xe, các mục tiêu lớn trong tương lai.',
          percentage: 10,
          icon: '💰',
          color: '#3498db'
        },
        {
          name: 'Quỹ giáo dục (EDUC)',
          description: 'Học thêm, mua sách, tham gia các khóa học phát triển bản thân.',
          percentage: 10,
          icon: '📚',
          color: '#f39c12'
        },
        {
          name: 'Hưởng thụ (PLAY)',
          description: 'Du lịch, giải trí, mua sắm theo sở thích.',
          percentage: 10,
          icon: '🎮',
          color: '#9b59b6'
        },
        {
          name: 'Tự do tài chính (FFA)',
          description: 'Đầu tư, tạo ra các nguồn thu nhập thụ động.',
          percentage: 10,
          icon: '📈',
          color: '#27ae60'
        },
        {
          name: 'Quỹ cho đi (GIVE)',
          description: 'Làm từ thiện, giúp đỡ gia đình, bạn bè.',
          percentage: 5,
          icon: '❤️',
          color: '#1abc9c'
        }
      ];

      const jars = [];
      for (const jarData of defaultJars) {
        const jar = await this.createJar(userId, jarData);
        if (jar.success) {
          jars.push(jar.jar);
        }
      }

      return {
        success: true,
        jars,
        message: 'Đã tạo các hũ mặc định thành công!'
      };
    } catch (error) {
      console.error('Error setting up default jars:', error);
      return {
        success: false,
        message: 'Lỗi khi tạo hũ mặc định'
      };
    }
  }

  // 2. Xóa hũ tiền
  async deleteJar(userId, jarId) {
    try {
      const jar = await prisma.jar.findFirst({
        where: { id: jarId, userId }
      });

      if (!jar) {
        return {
          success: false,
          message: 'Không tìm thấy hũ tiền'
        };
      }

      // Kiểm tra hũ có tiền không
      if (jar.currentAmount > 0) {
        return {
          success: false,
          message: `Hũ "${jar.name}" còn ${jar.currentAmount.toLocaleString('vi-VN')}đ. Vui lòng chuyển tiền trước khi xóa.`
        };
      }

      // Xóa hũ
      await prisma.jar.delete({
        where: { id: jarId }
      });

      return {
        success: true,
        message: `Đã xóa hũ "${jar.name}" thành công!`
      };
    } catch (error) {
      console.error('Error deleting jar:', error);
      return {
        success: false,
        message: 'Lỗi khi xóa hũ tiền'
      };
    }
  }

  // 3. Cập nhật hũ tiền
  async updateJar(userId, jarId, updates) {
    try {
      const jar = await prisma.jar.findFirst({
        where: { id: jarId, userId }
      });

      if (!jar) {
        return {
          success: false,
          message: 'Không tìm thấy hũ tiền'
        };
      }

      // Cập nhật hũ
      const updatedJar = await prisma.jar.update({
        where: { id: jarId },
        data: updates
      });

      return {
        success: true,
        jar: updatedJar,
        message: `Đã cập nhật hũ "${updatedJar.name}" thành công!`
      };
    } catch (error) {
      console.error('Error updating jar:', error);
      return {
        success: false,
        message: 'Lỗi khi cập nhật hũ tiền'
      };
    }
  }

  // 4. Lấy danh sách hũ tiền
  async getJars(userId) {
    try {
      const jars = await prisma.jar.findMany({
        where: { userId, isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        jars: jars
      };
    } catch (error) {
      console.error('Error getting jars:', error);
      return {
        success: false,
        jars: []
      };
    }
  }

  // Lấy tất cả hũ (không lọc isActive) cho debug
  async getAllJars(userId) {
    try {
      const jars = await prisma.jar.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
      return { success: true, jars };
    } catch (error) {
      console.error('Error getAllJars:', error);
      return { success: false, jars: [] };
    }
  }

  // 3. Tạo báo cáo hũ tiền
  async generateJarReport(userId) {
    try {
      const result = await this.getJars(userId);
      
      if (!result.success || result.jars.length === 0) {
        return `🏺 **BÁO CÁO HŨ TIỀN**\n\n📝 **Chưa có hũ tiền nào!**\n\n💡 **Tạo hũ đầu tiên:**\n• \`"Tạo hũ mặc định"\` - Tạo bộ 6 hũ mặc định\n• \`"Tạo hũ: Tên hũ (MÃ) - Mô tả - Tỷ lệ%"\``;
      }

      const totalAmount = result.jars.reduce((sum, jar) => sum + jar.currentAmount, 0);
      const currentDate = new Date().toISOString().split('T')[0];
      
      let report = `🏺 **BÁO CÁO HŨ TIỀN**\n\n`;
      report += `👤 **Thông tin chung:**\n`;
      report += `• Tổng thu nhập: ${totalAmount.toLocaleString('vi-VN')}đ\n`;
      report += `• Đơn vị tiền tệ: VND\n`;
      report += `• Ngày cập nhật: ${currentDate}\n\n`;
      report += `📊 **Chi tiết các hũ:**\n\n`;

      // Thông tin từng hũ
      for (const jar of result.jars) {
        const jarAmount = jar.currentAmount || 0;
        const jarPercentage = jar.percentage || 0;
        const targetAmount = (totalAmount * jarPercentage) / 100;
        const actualPercentage = totalAmount > 0 ? (jarAmount / totalAmount) * 100 : 0;

        const status = actualPercentage < jarPercentage * 0.5 ? '🔴' : 
                       actualPercentage < jarPercentage * 0.8 ? '🟡' : '🟢';
        
        report += `${jar.icon} **${jar.name}** ${status}\n`;
        report += `• Số tiền: ${jarAmount.toLocaleString('vi-VN')}đ\n`;
        report += `• Tỷ lệ: ${jarPercentage}%\n`;
        report += `• Mục tiêu: ${targetAmount.toLocaleString('vi-VN')}đ\n`;
        if (jar.description) {
          report += `• Ghi chú: ${jar.description}\n`;
        }
        report += `\n`;
      }

      // Thêm phần gợi ý
      report += `\n💡 **Gợi ý:**\n`;
      report += `• Sử dụng \`"Tạo hũ mặc định"\` để tạo bộ 6 hũ chuẩn\n`;
      report += `• Hoặc tạo hũ riêng với \`"Tạo hũ: Tên hũ (MÃ) - Mô tả - Tỷ lệ%"\`\n`;
      report += `• Các mã hũ: NEC, LTSS, EDUC, PLAY, FFA, GIVE`;

      return report;
    } catch (error) {
      console.error('Error generating jar report:', error);
      return '❌ **Lỗi khi tạo báo cáo hũ tiền**';
    }
  }

  // Helper methods
  getJarColor(jarName) {
    const colors = {
      'NEC': '#e74c3c',
      'LTSS': '#3498db',
      'EDUC': '#f39c12',
      'PLAY': '#9b59b6',
      'FFA': '#27ae60',
      'GIVE': '#1abc9c'
    };
    
    for (const [key, color] of Object.entries(colors)) {
      if (jarName.includes(key)) {
        return color;
      }
    }
    
    return '#3498db'; // Màu mặc định
  }

  getJarIcon(jarName) {
    const icons = {
      'NEC': '🏠',
      'LTSS': '💰',
      'EDUC': '📚',
      'PLAY': '🎮',
      'FFA': '📈',
      'GIVE': '❤️'
    };
    
    for (const [key, icon] of Object.entries(icons)) {
      if (jarName.includes(key)) {
        return icon;
      }
    }
    
    return '🏺'; // Icon mặc định
  }
}

module.exports = new JarService(); 