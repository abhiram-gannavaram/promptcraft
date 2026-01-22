#!/bin/bash

# 🔴 IMPORTANT: Enable Bedrock Model Access First!
# This script will FAIL until you enable model access in AWS Console

echo "=============================================="
echo "🔴 BEDROCK DEPLOYMENT - ACTION REQUIRED"
echo "=============================================="
echo ""
echo "Before testing, you MUST enable Bedrock model access:"
echo ""
echo "1. Go to: https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess"
echo ""
echo "2. Click 'Manage model access' (orange button)"
echo ""
echo "3. Check these models:"
echo "   ☐ Claude 3.5 Haiku"
echo "   ☐ Claude 3.5 Sonnet (optional)"
echo "   ☐ Claude 3 Haiku (backup)"
echo ""
echo "4. Click 'Request model access' at bottom"
echo ""
echo "5. Wait 1-2 minutes for 'Access granted' status"
echo ""
echo "=============================================="
echo ""
read -p "Press ENTER after you've enabled model access..."
echo ""

# Test Bedrock deployment
echo "🧪 Testing Bedrock Integration..."
echo ""

RESPONSE=$(curl -s -X POST https://njzzp0serg.execute-api.us-east-1.amazonaws.com/prod/generate-prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt":"write a professional email about quarterly results","tone":"professional"}')

if echo "$RESPONSE" | grep -q "enhancedPrompt"; then
    echo "✅ SUCCESS! Bedrock is working!"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | jq .
    echo ""
    echo "=============================================="
    echo "🎉 AWS Bedrock Migration Complete!"
    echo "=============================================="
    echo ""
    echo "Your site now uses AI-powered prompt generation!"
    echo ""
    echo "Cost monitoring:"
    echo "- Check: https://console.aws.amazon.com/billing/"
    echo "- Expected: $0.40 per 1,000 requests"
    echo "- Current month: $0 (just started)"
    echo ""
elif echo "$RESPONSE" | grep -q "Rate limit exceeded"; then
    echo "⚠️  Rate limited. Wait 1 minute and try again."
elif echo "$RESPONSE" | grep -q "error"; then
    echo "❌ Error occurred. Check logs:"
    echo ""
    echo "$RESPONSE" | jq .
    echo ""
    echo "Debug with:"
    echo "aws logs tail /aws/lambda/ai-prompt-generator-production --follow"
else
    echo "❓ Unexpected response:"
    echo "$RESPONSE"
fi
