#!/bin/bash

# Test script for phone verification API
# Tests all endpoints and edge cases locally

BASE_URL="http://localhost:3000"
PHONE="+15555551234"
PHONE2="+15555559999"

echo "🧪 MyBambu Phone Verification API - Local Test Suite"
echo "=================================================="
echo ""

# Check if server is running
echo "Checking if server is running on port 3000..."
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "❌ Server is not running. Please start it with: npm start"
    exit 1
fi
echo "✅ Server is running"
echo ""

# Test 1: Send verification code (English)
echo "📝 Test 1: Send verification code (English)"
echo "Phone: $PHONE"
RESPONSE=$(curl -s -X POST $BASE_URL/api/send-verification \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\": \"$PHONE\", \"language\": \"en\"}")
echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Test 1 PASSED"
else
    echo "❌ Test 1 FAILED"
fi
echo ""

# Get code from user
echo "👀 Check the server console logs for the 6-digit verification code"
echo "Enter the code: "
read CODE

# Test 2: Verify correct code
echo ""
echo "📝 Test 2: Verify correct code"
RESPONSE=$(curl -s -X POST $BASE_URL/api/verify-code \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\": \"$PHONE\", \"code\": \"$CODE\"}")
echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Test 2 PASSED"
else
    echo "❌ Test 2 FAILED"
fi
echo ""

# Test 3: Check verification status
echo "📝 Test 3: Check verification status"
ENCODED_PHONE=$(echo -n "$PHONE" | jq -sRr @uri)
RESPONSE=$(curl -s "$BASE_URL/api/verification-status/$ENCODED_PHONE")
echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q '"verified":true'; then
    echo "✅ Test 3 PASSED"
else
    echo "❌ Test 3 FAILED"
fi
echo ""

# Test 4: Rate limiting (60s cooldown)
echo "📝 Test 4: Rate limiting - 60s cooldown"
echo "Sending 2nd code immediately (should fail)..."
RESPONSE=$(curl -s -X POST $BASE_URL/api/send-verification \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\": \"$PHONE\", \"language\": \"en\"}")
echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q '"retryAfter"'; then
    echo "✅ Test 4 PASSED - Rate limit enforced"
else
    echo "❌ Test 4 FAILED - Rate limit not working"
fi
echo ""

# Test 5: Wrong code attempts
echo "📝 Test 5: Wrong code attempts (3 max)"
echo "Sending new code to different phone..."
RESPONSE=$(curl -s -X POST $BASE_URL/api/send-verification \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\": \"$PHONE2\", \"language\": \"en\"}")
echo "Response: $RESPONSE"
echo ""

echo "Attempt 1: Wrong code (000000)"
RESPONSE=$(curl -s -X POST $BASE_URL/api/verify-code \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\": \"$PHONE2\", \"code\": \"000000\"}")
echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "2 attempt"; then
    echo "✅ Attempt 1 - 2 attempts remaining"
else
    echo "❌ Attempt 1 failed"
fi
echo ""

echo "Attempt 2: Wrong code (000000)"
RESPONSE=$(curl -s -X POST $BASE_URL/api/verify-code \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\": \"$PHONE2\", \"code\": \"000000\"}")
echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "1 attempt"; then
    echo "✅ Attempt 2 - 1 attempt remaining"
else
    echo "❌ Attempt 2 failed"
fi
echo ""

echo "Attempt 3: Wrong code (000000)"
RESPONSE=$(curl -s -X POST $BASE_URL/api/verify-code \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\": \"$PHONE2\", \"code\": \"000000\"}")
echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "Too many failed attempts"; then
    echo "✅ Test 5 PASSED - Max attempts enforced"
else
    echo "❌ Test 5 FAILED - Max attempts not working"
fi
echo ""

# Test 6: Spanish language
echo "📝 Test 6: Spanish language support"
PHONE3="+15555558888"
echo "Waiting 61 seconds for rate limit to reset..."
sleep 61

RESPONSE=$(curl -s -X POST $BASE_URL/api/send-verification \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\": \"$PHONE3\", \"language\": \"es\"}")
echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Test 6 PASSED - Spanish language works"
else
    echo "❌ Test 6 FAILED"
fi
echo ""

# Test 7: Phone number normalization
echo "📝 Test 7: Phone number normalization"
echo "Testing different formats of same number..."

# Wait for rate limit
echo "Waiting 61 seconds..."
sleep 61

PHONE_FORMATS=(
    "+19999999999"
    "19999999999"
    "+1 999-999-9999"
    "+1 (999) 999-9999"
)

echo "Sending code to: ${PHONE_FORMATS[0]}"
curl -s -X POST $BASE_URL/api/send-verification \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\": \"${PHONE_FORMATS[0]}\", \"language\": \"en\"}" > /dev/null

echo "Waiting 5 seconds..."
sleep 5

echo "Trying different format: ${PHONE_FORMATS[2]}"
RESPONSE=$(curl -s -X POST $BASE_URL/api/send-verification \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\": \"${PHONE_FORMATS[2]}\", \"language\": \"en\"}")

if echo "$RESPONSE" | grep -q '"retryAfter"'; then
    echo "✅ Test 7 PASSED - Phone normalization working (rate limit enforced)"
else
    echo "❌ Test 7 FAILED - Different formats not normalized"
fi
echo ""

# Summary
echo "=================================================="
echo "✅ Test Suite Complete!"
echo ""
echo "Manual verification needed:"
echo "1. Check server logs for verification codes"
echo "2. Verify WhatsApp messages are formatted correctly"
echo "3. Test full conversation flow with WhatsApp"
echo ""
echo "Next steps:"
echo "1. Add OPENAI_API_KEY to .env"
echo "2. Test money transfer flow for all 9 countries"
echo "3. Deploy to Railway for production testing"
