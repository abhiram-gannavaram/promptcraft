# AWS Resources Inventory - PromtCraft.in

## 📋 Complete Resource List

| Service | Resource Name/ID | Details | Monthly Cost Est. |
|---------|------------------|---------|-------------------|
| **S3** | ai-prompt-generator-production-362015461740 | Static website hosting | ~$0.02 |
| **DynamoDB** | ai-prompt-generator-prompts-production | PAY_PER_REQUEST | ~$0.50 |
| **DynamoDB** | ai-prompt-generator-ratelimit-production | PAY_PER_REQUEST | ~$0.10 |
| **Lambda** | ai-prompt-generator-production | nodejs20.x, 256MB | ~$0.00 (free tier) |
| **API Gateway** | njzzp0serg | REST API | ~$0.50 |
| **CloudFront** | E35H3XC092ZZDB | dahfd6citmphf.cloudfront.net | ~$1.00 |
| **Route 53** | Z09369311GPNI6XY648MU | promtcraft.in hosted zone | $0.50/month |
| **ACM** | promtcraft.in | SSL Certificate | FREE |
| **IAM Role** | ai-prompt-generator-lambda-role | Lambda execution role | FREE |
| **Budget** | ai-prompt-generator-monthly-budget | $10 limit with alerts | FREE |

**Estimated Monthly Cost: $2-3** (well under $10 budget)

---

## 🗑️ One-Command Cleanup Script

Save this as `cleanup-aws.sh` and run when you want to delete everything:

```bash
#!/bin/bash
# ⚠️ WARNING: This will DELETE all resources permanently!

echo "🗑️ Starting AWS Cleanup..."

# 1. Empty and delete S3 bucket
echo "Deleting S3 bucket..."
aws s3 rm s3://ai-prompt-generator-production-362015461740 --recursive
aws s3 rb s3://ai-prompt-generator-production-362015461740

# 2. Delete CloudFront distribution (must disable first)
echo "Disabling CloudFront..."
aws cloudfront get-distribution-config --id E35H3XC092ZZDB > /tmp/cf-config.json
ETAG=$(jq -r '.ETag' /tmp/cf-config.json)
jq '.DistributionConfig.Enabled = false' /tmp/cf-config.json > /tmp/cf-disable.json
aws cloudfront update-distribution --id E35H3XC092ZZDB --distribution-config file:///tmp/cf-disable.json --if-match $ETAG
echo "Wait 15 mins for CloudFront to disable, then run:"
echo "aws cloudfront delete-distribution --id E35H3XC092ZZDB --if-match <new-etag>"

# 3. Delete API Gateway
echo "Deleting API Gateway..."
aws apigateway delete-rest-api --rest-api-id njzzp0serg

# 4. Delete Lambda function
echo "Deleting Lambda..."
aws lambda delete-function --function-name ai-prompt-generator-production

# 5. Delete DynamoDB tables
echo "Deleting DynamoDB tables..."
aws dynamodb delete-table --table-name ai-prompt-generator-prompts-production
aws dynamodb delete-table --table-name ai-prompt-generator-ratelimit-production

# 6. Delete Route 53 records and hosted zone
echo "Deleting Route 53..."
# First delete all records except NS and SOA
aws route53 delete-hosted-zone --id Z09369311GPNI6XY648MU

# 7. Delete ACM certificate
echo "Deleting ACM certificate..."
CERT_ARN=$(aws acm list-certificates --query 'CertificateSummaryList[?DomainName==`promtcraft.in`].CertificateArn' --output text)
aws acm delete-certificate --certificate-arn $CERT_ARN

# 8. Delete IAM role (must detach policies first)
echo "Deleting IAM role..."
aws iam detach-role-policy --role-name ai-prompt-generator-lambda-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam delete-role-policy --role-name ai-prompt-generator-lambda-role --policy-name DynamoDBAccess
aws iam delete-role --role-name ai-prompt-generator-lambda-role

# 9. Delete Budget
echo "Deleting Budget..."
aws budgets delete-budget --account-id 362015461740 --budget-name ai-prompt-generator-monthly-budget

echo "✅ Cleanup complete!"
```

---

## 🏗️ Why Terraform Would Be Better

### Manual Creation (Current Approach)
- ❌ Hard to track all resources
- ❌ Difficult to replicate
- ❌ Cleanup is error-prone
- ❌ No version control of infrastructure

### Terraform (Recommended)
- ✅ Infrastructure as Code
- ✅ `terraform destroy` - one command cleanup
- ✅ Version controlled with git
- ✅ Easy to replicate across environments
- ✅ State tracking of all resources

---

## 📊 Resource ARNs (for reference)

```
S3:         arn:aws:s3:::ai-prompt-generator-production-362015461740
DynamoDB:   arn:aws:dynamodb:us-east-1:362015461740:table/ai-prompt-generator-prompts-production
DynamoDB:   arn:aws:dynamodb:us-east-1:362015461740:table/ai-prompt-generator-ratelimit-production
Lambda:     arn:aws:lambda:us-east-1:362015461740:function:ai-prompt-generator-production
API GW:     arn:aws:apigateway:us-east-1::/restapis/njzzp0serg
CloudFront: arn:aws:cloudfront::362015461740:distribution/E35H3XC092ZZDB
Route 53:   arn:aws:route53:::hostedzone/Z09369311GPNI6XY648MU
ACM:        arn:aws:acm:us-east-1:362015461740:certificate/85b84801-1285-40a5-bef5-9e6569b102f6
IAM Role:   arn:aws:iam::362015461740:role/ai-prompt-generator-lambda-role
```
