# Email Setup Guide

This guide will help you set up email functionality for the Student Project Registration System (SPRS).

## 📧 Overview

The system sends automated emails for:
- Registration confirmations
- Payment confirmations  
- Coordinator notifications
- Slot purchase confirmations

## 🎯 Recommended: Resend (Current Implementation)

We now use Resend for reliable email delivery with React email templates.

### Setup Steps

1. **Create a Resend Account**
   - Visit https://resend.com and sign up
   - Verify your email address

2. **Get API Key**
   - Go to https://resend.com/api-keys
   - Click "Create API Key"
   - Give it a name like "NAPPS SPRS"
   - Copy the API key (starts with `re_`)

3. **Add to Environment Variables**
   ```env
   # Resend (for email notifications)
   RESEND_API_KEY=re_your_api_key_here
   ```

4. **Verify Domain (Optional but Recommended)**
   - Go to https://resend.com/domains
   - Add your domain (e.g., napps.org.ng)
   - Follow DNS setup instructions
   - Update the "from" email in `lib/email-resend.ts`

### Testing
Run the test script to verify your setup:
```bash
npx ts-node scripts/test-email-resend.ts
```

## 🔧 Legacy SMTP Configuration (Alternative)

### Environment Variables

Add these variables to your `.env.local` file:

```env
# Email Configuration (SMTP)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_SECURE="false"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="NAPPS SPRS <your-email@gmail.com>"
```

### Gmail (Recommended)

1. **Enable 2-Step Verification**
   - Navigate to https://myaccount.google.com/security
   - Under "Signing in to Google", click **2-Step Verification** and follow prompts to set up 2FA.

2. **Generate an App Password**
   - Return to https://myaccount.google.com/security
   - Under "Signing in to Google", click **App passwords** (re-enter your password if prompted).
   - In the **Select app** dropdown choose **Mail**.
   - In the **Select device** dropdown choose your device or select **Other (Custom name)** and enter a name like "SPRS App".
   - Click **Generate** and copy the 16-character password.

3. **Configuration**
   ```env
   EMAIL_SERVER_HOST="smtp.gmail.com"
   EMAIL_SERVER_PORT="587"
   EMAIL_SERVER_SECURE="false"
   EMAIL_SERVER_USER="your-gmail@gmail.com"
   EMAIL_SERVER_PASSWORD="your-16-char-app-password"
   ```

### Outlook/Hotmail

```env
EMAIL_SERVER_HOST="smtp-mail.outlook.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_SECURE="false"
EMAIL_SERVER_USER="your-email@outlook.com"
EMAIL_SERVER_PASSWORD="your-password"
```

### Yahoo

```env
EMAIL_SERVER_HOST="smtp.mail.yahoo.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_SECURE="false"
EMAIL_SERVER_USER="your-email@yahoo.com"
EMAIL_SERVER_PASSWORD="your-app-password"
```

### SendGrid

```env
EMAIL_SERVER_HOST="smtp.sendgrid.net"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_SECURE="false"
EMAIL_SERVER_USER="apikey"
EMAIL_SERVER_PASSWORD="your-sendgrid-api-key"
```

### Mailgun

```env
EMAIL_SERVER_HOST="smtp.mailgun.org"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_SECURE="false"
EMAIL_SERVER_USER="your-mailgun-username"
EMAIL_SERVER_PASSWORD="your-mailgun-password"
```

## 🧪 Testing

1. **Admin Email Test Page**
   - Go to `/admin/email-test`
   - Click "Test Connection" to verify SMTP settings
   - Send a test email to verify functionality

2. **API Testing**
   ```bash
   # Test connection
   curl http://localhost:3000/api/test-email
   
   # Send test email
   curl -X POST http://localhost:3000/api/test-email \
     -H "Content-Type: application/json" \
     -d '{"testEmail":"test@example.com"}'
   ```

## 🔍 Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify app password is correct (not regular password)
   - Check username format (full email address)

2. **Connection Timeout**
   - Verify SMTP host and port
   - Check firewall/network restrictions

3. **SSL/TLS Errors**
   - For port 587, use `EMAIL_SERVER_SECURE="false"`
   - For port 465, use `EMAIL_SERVER_SECURE="true"`

4. **Gmail "Less Secure Apps"**
   - Use App Passwords instead of enabling less secure apps
   - Ensure 2FA is enabled

### Debug Information

Check the console logs for detailed error messages:
- Connection errors
- Authentication failures
- Email sending status

### Environment Variable Precedence

The system checks variables in this order:
1. `EMAIL_SERVER_*` (preferred)
2. `EMAIL_*` (legacy fallback)

## 📋 Email Templates

The system uses React Email templates located in `/emails/`:
- `registration-confirmation.tsx`
- `payment-confirmation.tsx`
- `coordinator-notification.tsx`

## 🔒 Security Notes

- Never commit credentials to version control
- Use environment variables for all sensitive data
- Consider using dedicated email service accounts
- Enable 2FA where possible
- Use app passwords instead of account passwords

## 🚀 Production Considerations

1. **Email Service**
   - Consider dedicated email services (SendGrid, Mailgun)
   - Higher reliability and delivery rates
   - Better analytics and tracking

2. **Rate Limiting**
   - Implement rate limiting for email sending
   - Batch large email operations

3. **Monitoring**
   - Monitor email delivery success rates
   - Set up alerts for email failures

4. **Domain Authentication**
   - Configure SPF, DKIM, and DMARC records
   - Improve email deliverability

## 📞 Support

If you need help setting up emails:
1. Check the admin email test page first
2. Review console logs for error details
3. Verify your email provider's SMTP settings
4. Test with a simple email client first

## 🔄 Updates

This documentation is current as of June 2025. Check for updates to email providers' SMTP settings and security requirements.
