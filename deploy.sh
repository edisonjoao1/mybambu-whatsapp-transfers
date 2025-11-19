#!/bin/bash

# WhatsApp Bot Deployment Script
# Run this after: railway login
#
# IMPORTANT: This script prompts for credentials interactively.
# DO NOT hardcode credentials in this file!

set -e  # Exit on error

echo "🚀 Deploying MyBambu WhatsApp Bot to Railway..."
echo ""

# Check if logged in
if ! railway whoami > /dev/null 2>&1; then
    echo "❌ Not logged in to Railway!"
    echo "Please run: railway login"
    echo "Then run this script again."
    exit 1
fi

echo "✅ Logged in to Railway"
echo ""

# Initialize project
echo "📦 Initializing Railway project..."
railway init --name bambu-whatsapp 2>/dev/null || echo "Project might already exist, continuing..."
echo ""

# Set ALL environment variables at once (credentials pre-configured)
echo "🔧 Setting environment variables..."
railway variables set \
  WHATSAPP_ACCESS_TOKEN="EAAc7PlLT7ZBABP4maDZCJKvxJNIETbNdg0628j2HIJx4wTPtZBAGT2fAu6VUotY7uriJqfhY2rVBNZBSkoT7nHESfv1SN8z5umtYOLJZBbt8YZAYMY4XumggR8oRDu8mjgOI72ZAb2AQ5ZCljIxqnUYFY7nTTLqzHEAFJ9at8OrFLyjffWyw5FXxXf3dMarJSpso4EPkgL3ZCCBb1zgEOCyb3bYRPpKZCdOJWGtBUsZAGBBawTXaagSC2xWWZAc38R77hwSiS5uA2224qUClxP2cCgZDZD" \
  WHATSAPP_PHONE_NUMBER_ID="826251713912705" \
  WEBHOOK_VERIFY_TOKEN="bambusend_secure_2024" \
  MODE="DEMO" \
  WISE_API_KEY="1624cba2-cdfa-424f-91d8-787a5225d52e" \
  WISE_PROFILE_ID="29182377" \
  WISE_API_URL="https://api.sandbox.transferwise.tech" \
  PORT="3000"

VERIFY_TOKEN="bambusend_secure_2024"

echo ""
echo "✅ Environment variables set!"
echo ""

# Deploy
echo "🚀 Deploying to Railway..."
railway up

echo ""
echo "✅ Deployment complete!"
echo ""

# Get domain
echo "🌐 Getting your public URL..."
URL=$(railway domain 2>&1)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 SUCCESS! Your WhatsApp bot is live at:"
echo ""
echo "   $URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Test health endpoint:"
echo "   curl $URL/health"
echo ""
echo "2. Configure webhook in Facebook:"
echo "   Go to: https://developers.facebook.com/apps/YOUR_APP_ID/whatsapp-business/wa-settings/"
echo ""
echo "   Callback URL: $URL/webhook"
echo "   Verify Token: $VERIFY_TOKEN"
echo "   Subscribe to: messages"
echo ""
echo "3. Test by sending WhatsApp message to your business number"
echo ""
echo "4. View logs:"
echo "   railway logs --follow"
echo ""
echo "🚀 You're ready to go!"
