#!/bin/bash
# PromtCraft AWS Cleanup Script
# ⚠️ WARNING: This will DELETE all resources permanently!

set -e

echo "⚠️  WARNING: This will delete ALL PromtCraft AWS resources!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

echo "🗑️ Starting cleanup..."

# 1. Empty and delete S3 bucket
echo "1/9 Deleting S3 bucket..."
aws s3 rm s3://ai-prompt-generator-production-362015461740 --recursive 2>/dev/null || true
aws s3 rb s3://ai-prompt-generator-production-362015461740 2>/dev/null || true

# 2. Delete Lambda function
echo "2/9 Deleting Lambda function..."
aws lambda delete-function --function-name ai-prompt-generator-production 2>/dev/null || true

# 3. Delete API Gateway
echo "3/9 Deleting API Gateway..."
aws apigateway delete-rest-api --rest-api-id njzzp0serg 2>/dev/null || true

# 4. Delete DynamoDB tables
echo "4/9 Deleting DynamoDB tables..."
aws dynamodb delete-table --table-name ai-prompt-generator-prompts-production 2>/dev/null || true
aws dynamodb delete-table --table-name ai-prompt-generator-ratelimit-production 2>/dev/null || true

# 5. Delete CloudFront (must disable first - this is slow)
echo "5/9 CloudFront deletion (this takes 15-20 minutes)..."
echo "   Disabling distribution..."
ETAG=$(aws cloudfront get-distribution-config --id E35H3XC092ZZDB --query 'ETag' --output text 2>/dev/null || echo "")
if [ ! -z "$ETAG" ]; then
    aws cloudfront get-distribution-config --id E35H3XC092ZZDB > /tmp/cf-config.json
    cat /tmp/cf-config.json | jq '.DistributionConfig.Enabled = false' | jq '.DistributionConfig' > /tmp/cf-disable.json
    aws cloudfront update-distribution --id E35H3XC092ZZDB --distribution-config file:///tmp/cf-disable.json --if-match $ETAG
    echo "   Waiting for CloudFront to disable (this takes ~15 minutes)..."
    aws cloudfront wait distribution-deployed --id E35H3XC092ZZDB
    ETAG=$(aws cloudfront get-distribution-config --id E35H3XC092ZZDB --query 'ETag' --output text)
    aws cloudfront delete-distribution --id E35H3XC092ZZDB --if-match $ETAG
fi

# 6. Delete Route 53 records and hosted zone
echo "6/9 Deleting Route 53..."
ZONE_ID="Z09369311GPNI6XY648MU"
# Get all records except NS and SOA
RECORDS=$(aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --query "ResourceRecordSets[?Type != 'NS' && Type != 'SOA']" 2>/dev/null || echo "[]")
if [ "$RECORDS" != "[]" ]; then
    echo "$RECORDS" | jq -c '.[]' | while read record; do
        NAME=$(echo $record | jq -r '.Name')
        TYPE=$(echo $record | jq -r '.Type')
        echo "   Deleting $TYPE record for $NAME..."
        aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch "{\"Changes\":[{\"Action\":\"DELETE\",\"ResourceRecordSet\":$record}]}" 2>/dev/null || true
    done
fi
aws route53 delete-hosted-zone --id $ZONE_ID 2>/dev/null || true

# 7. Delete ACM certificate
echo "7/9 Deleting ACM certificate..."
CERT_ARN=$(aws acm list-certificates --query 'CertificateSummaryList[?DomainName==`promtcraft.in`].CertificateArn' --output text 2>/dev/null || echo "")
if [ ! -z "$CERT_ARN" ]; then
    aws acm delete-certificate --certificate-arn $CERT_ARN 2>/dev/null || true
fi

# 8. Delete IAM role
echo "8/9 Deleting IAM role..."
aws iam detach-role-policy --role-name ai-prompt-generator-lambda-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole 2>/dev/null || true
aws iam delete-role-policy --role-name ai-prompt-generator-lambda-role --policy-name DynamoDBAccess 2>/dev/null || true
aws iam delete-role --role-name ai-prompt-generator-lambda-role 2>/dev/null || true

# 9. Delete Budget
echo "9/9 Deleting Budget..."
aws budgets delete-budget --account-id 362015461740 --budget-name ai-prompt-generator-monthly-budget 2>/dev/null || true

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Note: CloudFront deletion may still be in progress in the background."
echo "Check AWS Console to verify all resources are deleted."
