const languages = {
  vi: {
    name: 'Tiếng Việt',
    translations: {
      // Chung
      success: '✅ Thành công',
      error: '❌ Lỗi',
      back: '🔙 Quay lại',
      mainMenu: '🏠 Menu chính',
      language: '🌐 Ngôn ngữ',
      languageChanged: '✅ Đã thay đổi ngôn ngữ thành Tiếng Việt',
      
      // Menu và tiêu đề
      jarReport: '📊 BÁO CÁO HŨ TIỀN',
      createJar: '➕ Tạo hũ mới',
      deleteJar: '🗑️ Xóa hũ',
      updateJar: '✏️ Cập nhật hũ',
      
      // Thông tin chung
      financialPeriod: '🗓️ Kỳ tài chính',
      totalIncome: '💰 Tổng thu nhập',
      currency: '💱 Đơn vị tiền tệ',
      lastUpdate: '🕒 Cập nhật',
      
      // Chi tiết hũ
      balance: 'Số dư',
      target: 'Mục tiêu',
      spent: 'Đã chi',
      percentage: 'Tỷ lệ phân bổ',
      note: 'Ghi chú',
      
      // Mã hũ
      validJarCodes: '💡 Mã hũ hợp lệ',
      necessities: 'Chi tiêu cần thiết',
      longTermSavings: 'Tiết kiệm dài hạn',
      education: 'Quỹ giáo dục',
      play: 'Hưởng thụ',
      financialFreedom: 'Tự do tài chính',
      give: 'Quỹ cho đi'
    }
  },
  
  en: {
    name: 'English',
    translations: {
      // Common
      success: '✅ Success',
      error: '❌ Error',
      back: '🔙 Back',
      mainMenu: '🏠 Main Menu',
      language: '🌐 Language',
      languageChanged: '✅ Language changed to English',
      
      // Menus and titles
      jarReport: '📊 JAR REPORT',
      createJar: '➕ Create New Jar',
      deleteJar: '🗑️ Delete Jar',
      updateJar: '✏️ Update Jar',
      
      // General information
      financialPeriod: '🗓️ Financial Period',
      totalIncome: '💰 Total Income',
      currency: '💱 Currency',
      lastUpdate: '🕒 Last Update',
      
      // Jar details
      balance: 'Balance',
      target: 'Target',
      spent: 'Spent',
      percentage: 'Allocation Percentage',
      note: 'Note',
      
      // Jar codes
      validJarCodes: '💡 Valid Jar Codes',
      necessities: 'Necessities',
      longTermSavings: 'Long Term Savings',
      education: 'Education Fund',
      play: 'Play',
      financialFreedom: 'Financial Freedom',
      give: 'Give'
    }
  },

  zh: {
    name: '中文',
    translations: {
      // 通用
      success: '✅ 成功',
      error: '❌ 错误',
      back: '🔙 返回',
      mainMenu: '🏠 主菜单',
      language: '🌐 语言',
      languageChanged: '✅ 已将语言更改为中文',
      
      // 菜单和标题
      jarReport: '📊 储蓄罐报告',
      createJar: '➕ 创建新储蓄罐',
      deleteJar: '🗑️ 删除储蓄罐',
      updateJar: '✏️ 更新储蓄罐',
      
      // 一般信息
      financialPeriod: '🗓️ 财务期间',
      totalIncome: '💰 总收入',
      currency: '💱 货币',
      lastUpdate: '🕒 最后更新',
      
      // 储蓄罐详情
      balance: '余额',
      target: '目标',
      spent: '已支出',
      percentage: '分配百分比',
      note: '备注',
      
      // 储蓄罐代码
      validJarCodes: '💡 有效的储蓄罐代码',
      necessities: '必需品',
      longTermSavings: '长期储蓄',
      education: '教育基金',
      play: '娱乐',
      financialFreedom: '财务自由',
      give: '捐赠'
    }
  },

  ja: {
    name: '日本語',
    translations: {
      // 共通
      success: '✅ 成功',
      error: '❌ エラー',
      back: '🔙 戻る',
      mainMenu: '🏠 メインメニュー',
      language: '🌐 言語',
      languageChanged: '✅ 言語を日本語に変更しました',
      
      // メニューとタイトル
      jarReport: '📊 貯金箱レポート',
      createJar: '➕ 新規貯金箱作成',
      deleteJar: '🗑️ 貯金箱削除',
      updateJar: '✏️ 貯金箱更新',
      
      // 一般情報
      financialPeriod: '🗓️ 会計期間',
      totalIncome: '💰 総収入',
      currency: '💱 通貨',
      lastUpdate: '🕒 最終更新',
      
      // 貯金箱詳細
      balance: '残高',
      target: '目標',
      spent: '支出済み',
      percentage: '配分率',
      note: 'メモ',
      
      // 貯金箱コード
      validJarCodes: '💡 有効な貯金箱コード',
      necessities: '必需品',
      longTermSavings: '長期貯金',
      education: '教育資金',
      play: '娯楽',
      financialFreedom: '経済的自由',
      give: '寄付'
    }
  },

  ko: {
    name: '한국어',
    translations: {
      // 공통
      success: '✅ 성공',
      error: '❌ 오류',
      back: '🔙 뒤로',
      mainMenu: '🏠 메인 메뉴',
      language: '🌐 언어',
      languageChanged: '✅ 언어가 한국어로 변경되었습니다',
      
      // 메뉴 및 제목
      jarReport: '📊 저금통 보고서',
      createJar: '➕ 새 저금통 만들기',
      deleteJar: '🗑️ 저금통 삭제',
      updateJar: '✏️ 저금통 업데이트',
      
      // 일반 정보
      financialPeriod: '🗓️ 재무 기간',
      totalIncome: '💰 총 수입',
      currency: '💱 통화',
      lastUpdate: '🕒 마지막 업데이트',
      
      // 저금통 상세
      balance: '잔액',
      target: '목표',
      spent: '지출',
      percentage: '할당 비율',
      note: '메모',
      
      // 저금통 코드
      validJarCodes: '💡 유효한 저금통 코드',
      necessities: '필수품',
      longTermSavings: '장기 저축',
      education: '교육 기금',
      play: '여가',
      financialFreedom: '재정적 자유',
      give: '기부'
    }
  }
};

module.exports = languages; 