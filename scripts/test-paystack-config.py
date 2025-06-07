# Paystack Configuration Test Script
# Run this to verify your Paystack environment variables are set correctly

# Required environment variables for Paystack integration:
# NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_... (for frontend)
# PAYSTACK_SECRET_KEY=sk_test_... (for backend) 
# PAYSTACK_WEBHOOK_SECRET=your_webhook_secret (for webhook verification)
# NEXT_PUBLIC_APP_URL=http://localhost:3000 (for callbacks)

import os
from dotenv import load_dotenv

# Load .env file if available
load_dotenv()

def check_env_var(name, description):
    value = os.getenv(name)
    if value:
        if 'SECRET' in name:
            print(f"✅ {name}: {'*' * 20} (hidden)")
        else:
            print(f"✅ {name}: {value}")
        return True
    else:
        print(f"❌ {name}: Not set - {description}")
        return False

print("🔧 Paystack Environment Configuration Check")
print("=" * 50)

all_good = True

all_good &= check_env_var("NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY", "Paystack public key for frontend")
all_good &= check_env_var("PAYSTACK_SECRET_KEY", "Paystack secret key for backend")
all_good &= check_env_var("PAYSTACK_WEBHOOK_SECRET", "Webhook secret for verification")
all_good &= check_env_var("NEXT_PUBLIC_APP_URL", "App URL for payment callbacks")

print("=" * 50)

if all_good:
    print("🎉 All Paystack environment variables are configured!")
    print("\n📋 Next steps:")
    print("1. Ensure your Paystack account is set up")
    print("2. Configure split codes for each chapter")
    print("3. Set up webhook URL in Paystack dashboard:")
    print(f"   {os.getenv('NEXT_PUBLIC_APP_URL', 'YOUR_APP_URL')}/api/webhooks/paystack")
    print("4. Test payment flow with small amounts")
else:
    print("⚠️  Please set the missing environment variables in your .env file")
    print("\n📝 Example .env configuration:")
    print("NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_key_here")
    print("PAYSTACK_SECRET_KEY=sk_test_your_secret_here") 
    print("PAYSTACK_WEBHOOK_SECRET=your_webhook_secret_here")
    print("NEXT_PUBLIC_APP_URL=http://localhost:3000")
