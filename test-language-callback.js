const languageService = require('./src/services/languageService');
const callbackHandler = require('./src/handlers/callbackHandler');

async function testLanguageCallback() {
  console.log('🧪 Testing language callback functionality...');
  
  try {
    // Test getSupportedLanguages
    console.log('\n📋 Testing getSupportedLanguages():');
    const supportedLangs = languageService.getSupportedLanguages();
    console.log('Supported languages:', supportedLangs);
    
    // Test getUserLanguage
    console.log('\n👤 Testing getUserLanguage():');
    const testUserId = '123456789';
    const userLang = await languageService.getUserLanguage(testUserId);
    console.log('User language:', userLang);
    
    // Test setUserLanguage
    console.log('\n🌐 Testing setUserLanguage():');
    const result = await languageService.setUserLanguage(testUserId, 'en');
    console.log('Set language result:', result);
    
    // Test getTranslation
    console.log('\n📝 Testing getTranslation():');
    const translation = await languageService.getTranslation('en', 'WELCOME_MESSAGE');
    console.log('Translation:', translation);
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLanguageCallback(); 