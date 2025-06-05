#!/usr/bin/env node

/**
 * Email Setup Helper Script
 * 
 * This script helps you configure email settings for the SPRS system.
 * Run with: node scripts/setup-email.js
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (text) => new Promise((resolve) => {
  rl.question(text, resolve);
});

const emailProviders = {
  gmail: {
    host: 'smtp.gmail.com',
    port: '587',
    secure: 'false',
    instructions: [
      '1. Enable 2-factor authentication on your Gmail account',
      '2. Go to Google Account → Security → 2-step verification',
      '3. Click "App passwords"',
      '4. Select "Mail" and your device',
      '5. Copy the generated 16-character password',
      '6. Use this app password (not your regular password)'
    ]
  },
  outlook: {
    host: 'smtp-mail.outlook.com',
    port: '587',
    secure: 'false',
    instructions: [
      '1. Use your Outlook email and password',
      '2. May require app password if 2FA is enabled'
    ]
  },
  yahoo: {
    host: 'smtp.mail.yahoo.com',
    port: '587',
    secure: 'false',
    instructions: [
      '1. Enable 2-factor authentication',
      '2. Generate an app password',
      '3. Use the app password instead of your regular password'
    ]
  },
  sendgrid: {
    host: 'smtp.sendgrid.net',
    port: '587',
    secure: 'false',
    instructions: [
      '1. Create a SendGrid account',
      '2. Generate an API key',
      '3. Use "apikey" as username',
      '4. Use your API key as password'
    ]
  },
  custom: {
    host: '',
    port: '587',
    secure: 'false',
    instructions: ['Enter your SMTP provider details manually']
  }
};

async function main() {
  console.log('🚀 SPRS Email Setup Helper\n');
  
  console.log('Available email providers:');
  Object.keys(emailProviders).forEach((key, index) => {
    console.log(`${index + 1}. ${key.charAt(0).toUpperCase() + key.slice(1)}`);
  });
  
  const providerChoice = await question('\nSelect your email provider (1-5): ');
  const providerKeys = Object.keys(emailProviders);
  const selectedProvider = providerKeys[parseInt(providerChoice) - 1];
  
  if (!selectedProvider) {
    console.log('❌ Invalid choice. Exiting.');
    rl.close();
    return;
  }
  
  const provider = emailProviders[selectedProvider];
  
  console.log(`\n📧 Setting up ${selectedProvider.toUpperCase()}`);
  console.log('\nInstructions:');
  provider.instructions.forEach(instruction => {
    console.log(`   ${instruction}`);
  });
  
  console.log('\n');
  
  const config = {};
  
  if (selectedProvider === 'custom') {
    config.host = await question('SMTP Host: ');
    config.port = await question('SMTP Port (587): ') || '587';
    config.secure = await question('Use SSL (true/false) [false]: ') || 'false';
  } else {
    config.host = provider.host;
    config.port = provider.port;
    config.secure = provider.secure;
  }
  
  config.user = await question('Email address: ');
  config.password = await question('Password (or app password): ');
  config.from = await question(`From address [${config.user}]: `) || config.user;
  
  // Generate environment variables
  const envVars = `
# Email Configuration (SMTP)
EMAIL_SERVER_HOST="${config.host}"
EMAIL_SERVER_PORT="${config.port}"
EMAIL_SERVER_SECURE="${config.secure}"
EMAIL_SERVER_USER="${config.user}"
EMAIL_SERVER_PASSWORD="${config.password}"
EMAIL_FROM="NAPPS SPRS <${config.from}>"
`;
  
  console.log('\n📋 Generated configuration:');
  console.log(envVars);
  
  const saveToFile = await question('Save to .env.local? (y/n): ');
  
  if (saveToFile.toLowerCase() === 'y') {
    const envPath = path.join(process.cwd(), '.env.local');
    let existingEnv = '';
    
    try {
      existingEnv = fs.readFileSync(envPath, 'utf8');
    } catch (error) {
      // File doesn't exist, that's okay
    }
    
    // Remove existing email configuration
    const cleanedEnv = existingEnv
      .split('\n')
      .filter(line => !line.startsWith('EMAIL_'))
      .join('\n');
    
    const newEnv = cleanedEnv + envVars;
    
    fs.writeFileSync(envPath, newEnv);
    console.log('✅ Configuration saved to .env.local');
    
    console.log('\n🧪 Next steps:');
    console.log('1. Restart your development server');
    console.log('2. Go to /admin/email-test to test the configuration');
    console.log('3. Send a test email to verify everything works');
  }
  
  rl.close();
}

main().catch(console.error);
