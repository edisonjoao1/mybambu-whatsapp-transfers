#!/bin/bash

# WhatsApp Bot Deployment Script
# Run this after: railway login

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

# Set environment variables
echo "🔧 Setting environment variables..."

railway variables set WHATSAPP_ACCESS_TOKEN="EAAc7PlLT7ZBABPZBkpt8DWKFL6izg98ZBsdYZAb5N5GdH84Q2J3Bp3HUtiZB0ie64aquqZB0tpJEdRZAoRVZBjTsIAfFteLiG39RTpWM39ncmZB3jUjFtPW5NLSeLfKQYjNmzHyLPQ216N0IV5NkX9ZCuxypiQDRQ8P7dCGNKFyizqsI8kMeMs8OHQuXmF3j99ZCLukvxIofPsQDipKTJEuzG3ZBlDWrNix7KTtCZAVsexU5jmC1HAcKbfQZBvnxM3dUgwGNFNZBotaVPdmk1gRBuoYojcZD"

railway variables set WHATSAPP_PHONE_NUMBER_ID="826251713912705"

railway variables set WEBHOOK_VERIFY_TOKEN="bambusend_secure_2024"

railway variables set MODE="DEMO"

railway variables set WISE_API_KEY="1624cba2-cdfa-424f-91d8-787a5225d52e"

railway variables set WISE_PROFILE_ID="29182377"

railway variables set WISE_API_URL="https://api.sandbox.transferwise.tech"

railway variables set PORT="3000"

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
echo "   Verify Token: bambusend_secure_2024"
echo "   Subscribe to: messages"
echo ""
echo "3. Test by sending WhatsApp message to: +1 555 159 4893"
echo "   Message: Hello"
echo ""
echo "4. View logs:"
echo "   railway logs --follow"
echo ""
echo "🚀 You're ready to go!"
