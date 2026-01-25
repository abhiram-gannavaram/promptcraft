#!/bin/bash

# Analytics Setup Script for promtcraft.in
# This script helps you set up comprehensive analytics tracking

echo "🔍 Analytics Setup for promtcraft.in"
echo "======================================"
echo ""

# Check current CloudWatch metrics
echo "📊 Current Usage Statistics (Last 7 Days)"
echo "----------------------------------------"

STATS=$(aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=ai-prompt-generator-production \
  --start-time $(date -u -v-7d +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Sum \
  --query 'Datapoints[*].[Timestamp,Sum]' \
  --output text 2>/dev/null)

if [ -n "$STATS" ]; then
    echo "$STATS" | awk '{sum+=$2} END {print "Total API Requests: " sum}'
    echo ""
    echo "Daily Breakdown:"
    echo "$STATS" | awk '{print "  " $1 ": " $2 " requests"}'
else
    echo "No data available or AWS CLI not configured"
fi

echo ""
echo "======================================"
echo ""

# Option 1: Enable CloudFront Access Logs
echo "📈 OPTION 1: Enable CloudFront Access Logs (FREE)"
echo "----------------------------------------"
echo "This will track:"
echo "  • Page views and unique visitors"
echo "  • Geographic location (country/city)"
echo "  • Browser and device types"
echo "  • Referrer sources"
echo "  • Download/bandwidth usage"
echo ""
read -p "Do you want to enable CloudFront logging? (y/n): " enable_cf

if [ "$enable_cf" = "y" ]; then
    echo ""
    echo "Creating S3 bucket for CloudFront logs..."
    
    LOG_BUCKET="promtcraft-cloudfront-logs"
    aws s3 mb s3://$LOG_BUCKET --region us-east-1 2>/dev/null
    
    # Set bucket policy for CloudFront
    cat > /tmp/cf-log-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AWSCloudFrontWrite",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:PutObject",
            "Resource": "arn:aws:s3:::$LOG_BUCKET/*"
        }
    ]
}
EOF
    
    aws s3api put-bucket-policy --bucket $LOG_BUCKET --policy file:///tmp/cf-log-policy.json
    
    echo ""
    echo "✅ S3 bucket created: s3://$LOG_BUCKET"
    echo ""
    echo "⚠️  MANUAL STEP REQUIRED:"
    echo "1. Go to CloudFront Console:"
    echo "   https://console.aws.amazon.com/cloudfront/v3/home?region=us-east-1#/distributions/E35H3XC092ZZDB"
    echo ""
    echo "2. Click 'Edit' on General settings"
    echo "3. Under 'Standard logging':"
    echo "   - Enable: ON"
    echo "   - S3 bucket: $LOG_BUCKET.s3.amazonaws.com"
    echo "   - Log prefix: cloudfront/"
    echo "4. Save changes"
    echo ""
    echo "Logs will appear in s3://$LOG_BUCKET/cloudfront/ within 24 hours"
fi

echo ""
echo "======================================"
echo ""

# Option 2: Google Analytics
echo "📊 OPTION 2: Add Google Analytics 4 (FREE)"
echo "----------------------------------------"
echo "This will track:"
echo "  • Real-time visitors"
echo "  • Traffic sources and campaigns"
echo "  • User demographics and interests"
echo "  • Conversion goals"
echo "  • Custom events (button clicks, etc.)"
echo ""
read -p "Do you want to add Google Analytics? (y/n): " enable_ga

if [ "$enable_ga" = "y" ]; then
    echo ""
    echo "📝 To add Google Analytics:"
    echo ""
    echo "1. Create GA4 property:"
    echo "   https://analytics.google.com/analytics/web/#/a/admin/streams"
    echo ""
    echo "2. Get your Measurement ID (format: G-XXXXXXXXXX)"
    echo ""
    read -p "Enter your Google Analytics Measurement ID (or press Enter to skip): " GA_ID
    
    if [ -n "$GA_ID" ]; then
        echo ""
        echo "Adding Google Analytics to index.html..."
        
        # Create GA snippet
        GA_SNIPPET="<!-- Google Analytics -->
<script async src=\"https://www.googletagmanager.com/gtag/js?id=$GA_ID\"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '$GA_ID', {
    'anonymize_ip': true,
    'cookie_flags': 'SameSite=None;Secure'
  });
</script>"
        
        echo "$GA_SNIPPET" > /tmp/ga-snippet.html
        
        echo ""
        echo "✅ Google Analytics snippet saved to /tmp/ga-snippet.html"
        echo ""
        echo "⚠️  MANUAL STEP REQUIRED:"
        echo "Add this code to frontend/index.html in the <head> section:"
        echo ""
        cat /tmp/ga-snippet.html
        echo ""
        echo "Then deploy: aws s3 sync frontend/ s3://ai-prompt-generator-production-362015461740/"
    fi
fi

echo ""
echo "======================================"
echo ""

# Option 3: Custom Event Tracking
echo "🎯 OPTION 3: Enable Custom Event Tracking"
echo "----------------------------------------"
echo "Track specific user actions:"
echo "  • Prompt generation clicks"
echo "  • Copy to clipboard usage"
echo "  • Advanced options usage"
echo "  • History item clicks"
echo ""
read -p "Do you want to enable custom event tracking? (y/n): " enable_events

if [ "$enable_events" = "y" ]; then
    echo ""
    echo "✅ Custom events are already implemented in app.js!"
    echo ""
    echo "Current tracked events:"
    echo "  • app_init - App loaded"
    echo "  • prompt_generate - Prompt generated"
    echo "  • prompt_copy - Copied to clipboard"
    echo "  • theme_toggle - Theme changed"
    echo ""
    echo "These events will automatically send to Google Analytics once GA is enabled."
fi

echo ""
echo "======================================"
echo ""

# Show current costs
echo "💰 Current Costs"
echo "----------------------------------------"

# Get Lambda costs (approximate)
LAMBDA_REQUESTS=$(echo "$STATS" | awk '{sum+=$2} END {print sum}')
if [ -n "$LAMBDA_REQUESTS" ]; then
    BEDROCK_COST=$(echo "$LAMBDA_REQUESTS * 0.0004" | bc -l)
    LAMBDA_COST=$(echo "$LAMBDA_REQUESTS * 0.0000002" | bc -l)
    TOTAL_COST=$(echo "$BEDROCK_COST + $LAMBDA_COST" | bc -l)
    
    echo "AWS Bedrock (Claude): \$$BEDROCK_COST"
    echo "Lambda invocations:   \$$LAMBDA_COST"
    echo "--------------------------------"
    echo "Total (past 7 days):  \$$TOTAL_COST"
    echo ""
    echo "Monthly estimate: \$$(echo "$TOTAL_COST * 4" | bc -l)"
fi

echo ""
echo "======================================"
echo ""
echo "✅ Analytics setup complete!"
echo ""
echo "📊 To view metrics:"
echo ""
echo "CloudWatch Logs:"
echo "aws logs tail /aws/lambda/ai-prompt-generator-production --follow"
echo ""
echo "CloudWatch Metrics:"
echo "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#metricsV2:graph=~()"
echo ""
echo "DynamoDB (stored prompts):"
echo "aws dynamodb scan --table-name promtcraft-production-prompts --max-items 10"
echo ""
echo "======================================"
