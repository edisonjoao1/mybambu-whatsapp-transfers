#!/bin/bash

# Railway Environment Setup Script
# Run this AFTER: railway login && railway link

echo "🚀 Setting up Railway environment variables..."
echo ""

# Set all variables at once
railway variables set \
  WHATSAPP_ACCESS_TOKEN="EAAc7PlLT7ZBABP4maDZCJKvxJNIETbNdg0628j2HIJx4wTPtZBAGT2fAu6VUotY7uriJqfhY2rVBNZBSkoT7nHESfv1SN8z5umtYOLJZBbt8YZAYMY4XumggR8oRDu8mjgOI72ZAb2AQ5ZCljIxqnUYFY7nTTLqzHEAFJ9at8OrFLyjffWyw5FXxXf3dMarJSpso4EPkgL3ZCCBb1zgEOCyb3bYRPpKZCdOJWGtBUsZAGBBawTXaagSC2xWWZAc38R77hwSiS5uA2224qUClxP2cCgZDZD" \
  WHATSAPP_PHONE_NUMBER_ID="826251713912705" \
  WEBHOOK_VERIFY_TOKEN="bambusend_secure_2024" \
  MODE="DEMO" \
  WISE_API_KEY="1624cba2-cdfa-424f-91d8-787a5225d52e" \
  WISE_PROFILE_ID="29182377" \
  WISE_API_URL="https://api.sandbox.transferwise.tech" \
  PORT="3000"

echo ""
echo "✅ All environment variables set!"
echo ""
echo "Next steps:"
echo "1. railway up         # Deploy your code"
echo "2. railway domain     # Get your URL"
echo "3. Configure webhook on Facebook"
echo ""
