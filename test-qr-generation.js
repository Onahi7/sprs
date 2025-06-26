// Test script to verify QR code generation works
const QRCode = require('qrcode');

async function testQRCodeGeneration() {
  try {
    console.log('Testing QR code generation...');
    
    const testData = JSON.stringify({
      regNumber: 'TEST123456',
      student: 'John Doe',
      totalScore: 450,
      grade: 'A',
      verifyUrl: 'https://portal.nappsnasarawa.com/verify/TEST123456'
    });
    
    const qrCodeDataUrl = await QRCode.toDataURL(testData, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    console.log('✅ QR code generated successfully!');
    console.log('Data URL length:', qrCodeDataUrl.length);
    console.log('Starts with:', qrCodeDataUrl.substring(0, 50) + '...');
    
    return true;
  } catch (error) {
    console.error('❌ QR code generation failed:', error);
    return false;
  }
}

testQRCodeGeneration().then(success => {
  if (success) {
    console.log('\n✅ All tests passed! QR code generation is working properly.');
  } else {
    console.log('\n❌ Tests failed! Please check the QR code library installation.');
  }
  process.exit(success ? 0 : 1);
});
