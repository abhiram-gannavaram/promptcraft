#!/bin/bash

echo "=========================================="
echo "🔴 MANUAL ACTION REQUIRED"
echo "=========================================="
echo ""
echo "AWS Bedrock requires manual model subscription for Claude 3.7 Sonnet."
echo ""
echo "STEP 1: Go to Bedrock Model Access"
echo "----------------------------------------"
echo "Open this URL in your browser:"
echo "https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess"
echo ""
echo "STEP 2: Enable Model Access"
echo "----------------------------------------"
echo "1. Click 'Manage model access' (orange button)"
echo "2. Scroll down and CHECK these models:"
echo "   ☐ Anthropic"
echo "      ☐ Claude 3.7 Sonnet"
echo "      ☐ Claude 3.5 Haiku"
echo "      ☐ Claude 3 Haiku (backup)"
echo ""
echo "3. Click 'Request model access' at bottom"
echo "4. Wait 1-2 minutes for status to change to 'Access granted'"
echo ""
echo "STEP 3: Accept Marketplace Subscription (if prompted)"
echo "----------------------------------------"
echo "If you see a popup about AWS Marketplace:"
echo "1. Click 'Subscribe'"
echo "2. Accept terms and conditions"
echo "3. Wait for confirmation"
echo ""
echo "=========================================="
echo ""
read -p "Press ENTER after you've enabled model access and subscription is active..."
echo ""

# Test after manual steps
echo "🧪 Testing Bedrock connection..."
echo ""

RESPONSE=$(curl -s -X POST https://njzzp0serg.execute-api.us-east-1.amazonaws.com/prod/generate-prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt":"write a haiku about AI"}')

if echo "$RESPONSE" | jq -e '.enhancedPrompt' > /dev/null 2>&1; then
    echo "=========================================="
    echo "✅ SUCCESS! AWS Bedrock is working!"
    echo "=========================================="
    echo ""
    echo "Response:"
    echo "$RESPONSE" | jq .
    echo ""
    echo "🎉 Your site now uses Claude 3.7 Sonnet!"
    echo ""
    echo "Test it live:"
    echo "https://promtcraft.in"
    echo ""
elif echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    echo "❌ Still getting error:"
    echo "$RESPONSE" | jq .
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure you clicked 'Request model access'"
    echo "2. Wait 2-3 minutes for provisioning"
    echo "3. Check status shows 'Access granted'"
    echo "4. Run this script again"
    echo ""
    echo "Check logs:"
    echo "aws logs tail /aws/lambda/ai-prompt-generator-production --follow"
else
    echo "❓ Unexpected response:"
    echo "$RESPONSE"
fi
