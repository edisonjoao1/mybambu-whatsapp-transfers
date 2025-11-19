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

# Set environment variables interactively
echo "🔧 Setting environment variables..."
echo ""
echo "⚠️  Please have your credentials ready:"
echo "  - WhatsApp Access Token (from developers.facebook.com)"
echo "  - WhatsApp Phone Number ID"
echo "  - Webhook Verify Token (any secure random string)"
echo "  - Wise API Key (from wise.com sandbox)"
echo "  - Wise Profile ID"
echo ""

read -p "Enter WHATSAPP_ACCESS_TOKEN: " WHATSAPP_TOKEN
railway variables set WHATSAPP_ACCESS_TOKEN="$WHATSAPP_TOKEN"

read -p "Enter WHATSAPP_PHONE_NUMBER_ID: " PHONE_ID
railway variables set WHATSAPP_PHONE_NUMBER_ID="$PHONE_ID"

read -p "Enter WEBHOOK_VERIFY_TOKEN (or press Enter for default): " VERIFY_TOKEN
VERIFY_TOKEN=${VERIFY_TOKEN:-bambusend_secure_2024}
railway variables set WEBHOOK_VERIFY_TOKEN="$VERIFY_TOKEN"

read -p "Enter MODE (DEMO or PRODUCTION, default: DEMO): " MODE
MODE=${MODE:-DEMO}
railway variables set MODE="$MODE"

read -p "Enter WISE_API_KEY: " WISE_KEY
railway variables set WISE_API_KEY="$WISE_KEY"

read -p "Enter WISE_PROFILE_ID: " WISE_PROFILE
railway variables set WISE_PROFILE_ID="$WISE_PROFILE"

read -p "Enter WISE_API_URL (default: https://api.sandbox.transferwise.tech): " WISE_URL
WISE_URL=${WISE_URL:-https://api.sandbox.transferwise.tech}
railway variables set WISE_API_URL="$WISE_URL"

railway variables set PORT="3000"

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
