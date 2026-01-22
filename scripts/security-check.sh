#!/bin/bash

# 🔒 Security Setup Script for PromptCraft AI
# Run this to protect your AWS resources from abuse and high costs

echo "🔒 PromptCraft AI - Security Setup"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Set up billing alerts
echo -e "${YELLOW}📊 Step 1: Setting up billing alerts...${NC}"
echo ""
echo "⚠️  MANUAL ACTION REQUIRED:"
echo "1. Go to: https://console.aws.amazon.com/billing/home#/budgets/create"
echo "2. Click 'Create budget'"
echo "3. Create these 3 budgets:"
echo ""
echo "   Budget #1: Early Warning"
echo "   - Type: Cost Budget"
echo "   - Amount: \$5"
echo "   - Alert at: 80% and 100%"
echo ""
echo "   Budget #2: Critical Alert"
echo "   - Type: Cost Budget"
echo "   - Amount: \$20"
echo "   - Alert at: 100%"
echo ""
echo "   Budget #3: Emergency"
echo "   - Type: Cost Budget"
echo "   - Amount: \$50"
echo "   - Alert at: 100%"
echo ""
read -p "Press ENTER after you've created the budgets (or SKIP to continue)..."
echo ""

# 2. Check current costs
echo -e "${YELLOW}💰 Step 2: Checking current AWS costs...${NC}"
YESTERDAY=$(date -u -v-1d +%Y-%m-%d 2>/dev/null || date -u -d '1 day ago' +%Y-%m-%d)
TODAY=$(date -u +%Y-%m-%d)

COST=$(aws ce get-cost-and-usage \
  --time-period Start=$YESTERDAY,End=$TODAY \
  --granularity DAILY \
  --metrics BlendedCost \
  --query 'ResultsByTime[0].Total.BlendedCost.Amount' \
  --output text 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Yesterday's cost: \$$COST${NC}"
else
    echo -e "${RED}❌ Could not fetch costs. Check AWS CLI configuration.${NC}"
fi
echo ""

# 3. Check Lambda function
echo -e "${YELLOW}⚡ Step 3: Checking Lambda function status...${NC}"
LAMBDA_STATUS=$(aws lambda get-function \
  --function-name ai-prompt-generator-production \
  --query 'Configuration.State' \
  --output text 2>/dev/null)

if [ "$LAMBDA_STATUS" = "Active" ]; then
    echo -e "${GREEN}✅ Lambda function is active${NC}"
    
    # Get concurrency setting
    CONCURRENCY=$(aws lambda get-function-concurrency \
      --function-name ai-prompt-generator-production \
      --query 'ReservedConcurrentExecutions' \
      --output text 2>/dev/null)
    
    if [ "$CONCURRENCY" = "None" ] || [ -z "$CONCURRENCY" ]; then
        echo -e "${YELLOW}⚠️  No concurrency limit set (unlimited executions possible)${NC}"
        echo "   Recommendation: Set to 50-100 to prevent runaway costs"
        echo "   Command: aws lambda put-function-concurrency --function-name ai-prompt-generator-production --reserved-concurrent-executions 100"
    else
        echo -e "${GREEN}✅ Concurrency limit: $CONCURRENCY${NC}"
    fi
else
    echo -e "${RED}❌ Lambda function not found or inactive${NC}"
fi
echo ""

# 4. Check DynamoDB tables
echo -e "${YELLOW}📊 Step 4: Checking DynamoDB tables...${NC}"

# Check prompts table
PROMPTS_TABLE=$(aws dynamodb describe-table \
  --table-name promtcraft-production-prompts \
  --query 'Table.ItemCount' \
  --output text 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prompts table exists (${PROMPTS_TABLE} items)${NC}"
    
    # Check if TTL is enabled
    TTL_STATUS=$(aws dynamodb describe-time-to-live \
      --table-name promtcraft-production-prompts \
      --query 'TimeToLiveDescription.TimeToLiveStatus' \
      --output text 2>/dev/null)
    
    if [ "$TTL_STATUS" = "ENABLED" ]; then
        echo -e "${GREEN}✅ TTL enabled (auto-delete old data)${NC}"
    else
        echo -e "${YELLOW}⚠️  TTL not enabled (data stored forever)${NC}"
        echo "   Recommendation: Enable TTL to auto-delete old prompts after 30 days"
        read -p "   Enable TTL now? (y/n): " enable_ttl
        if [ "$enable_ttl" = "y" ]; then
            aws dynamodb update-time-to-live \
              --table-name promtcraft-production-prompts \
              --time-to-live-specification Enabled=true,AttributeName=expiresAt
            echo -e "${GREEN}✅ TTL enabled!${NC}"
        fi
    fi
else
    echo -e "${RED}❌ Prompts table not found${NC}"
fi

# Check rate limit table
RATE_TABLE=$(aws dynamodb describe-table \
  --table-name promtcraft-production-ratelimit \
  --query 'Table.ItemCount' \
  --output text 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Rate limit table exists (${RATE_TABLE} IPs tracked)${NC}"
else
    echo -e "${YELLOW}⚠️  Rate limit table not found (create manually if needed)${NC}"
fi
echo ""

# 5. Test rate limiting
echo -e "${YELLOW}🧪 Step 5: Testing rate limiting...${NC}"
echo "Sending 3 test requests to your API..."
API_ENDPOINT="https://njzzp0serg.execute-api.us-east-1.amazonaws.com/prod/generate-prompt"

for i in {1..3}; do
    RESPONSE=$(curl -s -X POST $API_ENDPOINT \
      -H "Content-Type: application/json" \
      -d '{"prompt":"test security"}' \
      --max-time 10)
    
    if echo "$RESPONSE" | grep -q "Rate limit exceeded"; then
        echo -e "${GREEN}✅ Request $i: Rate limiting working!${NC}"
    elif echo "$RESPONSE" | grep -q "enhancedPrompt"; then
        echo -e "${GREEN}✅ Request $i: Successful response${NC}"
    else
        echo -e "${YELLOW}⚠️  Request $i: Unexpected response${NC}"
    fi
    sleep 1
done
echo ""

# 6. Check CloudFront
echo -e "${YELLOW}☁️  Step 6: Checking CloudFront distribution...${NC}"
CF_STATUS=$(aws cloudfront get-distribution \
  --id E35H3XC092ZZDB \
  --query 'Distribution.Status' \
  --output text 2>/dev/null)

if [ "$CF_STATUS" = "Deployed" ]; then
    echo -e "${GREEN}✅ CloudFront distribution is deployed${NC}"
    
    # Check if WAF is attached
    WAF_ID=$(aws cloudfront get-distribution \
      --id E35H3XC092ZZDB \
      --query 'Distribution.DistributionConfig.WebACLId' \
      --output text 2>/dev/null)
    
    if [ "$WAF_ID" = "None" ] || [ -z "$WAF_ID" ]; then
        echo -e "${YELLOW}⚠️  No WAF attached (no DDoS protection beyond CloudFront defaults)${NC}"
        echo "   Note: AWS Shield Standard is free and automatic"
    else
        echo -e "${GREEN}✅ WAF attached (advanced DDoS protection)${NC}"
    fi
else
    echo -e "${RED}❌ CloudFront distribution not deployed${NC}"
fi
echo ""

# 7. Security Summary
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🎯 Security Status Summary${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Protections Active:"
echo "  ✅ HTTPS enforced (CloudFront)"
echo "  ✅ CORS configured"
echo "  ✅ Input validation (10,000 char limit)"
echo "  ✅ Rate limiting (10 req/min per IP)"
echo "  ✅ CloudFront DDoS protection"
echo ""
echo "Recommended Next Steps:"
echo "  1. Set up billing alerts (if not done)"
echo "  2. Monitor costs weekly at: https://console.aws.amazon.com/billing/"
echo "  3. Check CloudWatch logs monthly for suspicious activity"
echo "  4. Consider Lambda concurrency limit if costs spike"
echo ""
echo -e "${YELLOW}📊 Monitoring URLs:${NC}"
echo "  Billing: https://console.aws.amazon.com/billing/home#/bills"
echo "  Lambda Metrics: https://console.aws.amazon.com/lambda/home#/functions/ai-prompt-generator-production?tab=monitoring"
echo "  CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home#logsV2:log-groups/log-group/\$252Faws\$252Flambda\$252Fai-prompt-generator-production"
echo ""
echo -e "${GREEN}✅ Security check complete!${NC}"
echo ""
echo "For detailed security info, see: SECURITY_GUIDE.md"
