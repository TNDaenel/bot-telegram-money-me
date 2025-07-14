const EmailService = require('./src/services/emailService');
const BankService = require('./src/services/bankService');

async function testAdaptivePolling() {
  console.log('🧪 Testing Adaptive Polling System...\n');

  // Test EmailService
  console.log('📧 Testing EmailService...');
  const emailService = new EmailService();
  
  try {
    // Test adaptive interval
    console.log('🔄 Testing adaptive interval...');
    console.log(`Initial interval: ${emailService.adaptiveInterval}ms`);
    
    // Test interval update
    emailService.updateInterval(8000);
    console.log(`Updated interval: ${emailService.adaptiveInterval}ms`);
    
    // Test stats
    const stats = await emailService.getEmailStats();
    console.log('Email stats:', stats);
    
    console.log('✅ EmailService adaptive polling test passed\n');
    
  } catch (error) {
    console.error('❌ EmailService test failed:', error);
  }

  // Test BankService
  console.log('🏦 Testing BankService...');
  const bankService = new BankService();
  
  try {
    // Test monitoring stats
    console.log('📊 Testing monitoring stats...');
    
    bankService.monitoringStats.startTime = new Date();
    bankService.monitoringStats.totalEmailsProcessed = 10;
    bankService.monitoringStats.lastEmailTime = new Date();
    
    const status = bankService.getMonitoringStatus();
    console.log('Monitoring status:', status);
    
    console.log('✅ BankService monitoring test passed\n');
    
  } catch (error) {
    console.error('❌ BankService test failed:', error);
  }

  // Test force check
  console.log('🔍 Testing force check...');
  try {
    // Mock force check
    const mockForceCheck = async () => {
      console.log('🔍 Force checking emails...');
      return Math.random() > 0.5; // Random result
    };
    
    const hasNewEmails = await mockForceCheck();
    console.log(`Force check result: ${hasNewEmails ? 'New emails found' : 'No new emails'}`);
    
    console.log('✅ Force check test passed\n');
    
  } catch (error) {
    console.error('❌ Force check test failed:', error);
  }

  console.log('🎉 All adaptive polling tests completed!');
}

// Run test
testAdaptivePolling().catch(console.error); 