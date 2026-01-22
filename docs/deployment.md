# 🚀 Deployment Guide

Complete step-by-step guide to deploy the AI Prompt Generator to AWS.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Manual Deployment](#manual-deployment)
4. [CI/CD Deployment](#cicd-deployment)
5. [Custom Domain Setup](#custom-domain-setup)
6. [Post-Deployment Configuration](#post-deployment-configuration)
7. [Verification Checklist](#verification-checklist)
8. [Rollback Procedures](#rollback-procedures)
9. [Cost Optimization](#cost-optimization)

---

## Prerequisites

### Required Tools

| Tool | Version | Installation |
|------|---------|--------------|
| AWS CLI | 2.x | `brew install awscli` or [AWS CLI Install](https://aws.amazon.com/cli/) |
| Node.js | 18+ | `brew install node` or [Node.js](https://nodejs.org/) |
| Git | 2.x | `brew install git` |
| jq | 1.6+ | `brew install jq` (optional, for scripts) |

### AWS Account Setup

1. **Create an AWS Account** (if you don't have one)
   - Go to [aws.amazon.com](https://aws.amazon.com)
   - Sign up for a free tier account

2. **Create an IAM User**
   ```bash
   # Create a user with programmatic access
   aws iam create-user --user-name ai-prompt-generator-deploy
   
   # Attach required policies
   aws iam attach-user-policy --user-name ai-prompt-generator-deploy \
     --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
   aws iam attach-user-policy --user-name ai-prompt-generator-deploy \
     --policy-arn arn:aws:iam::aws:policy/CloudFrontFullAccess
   aws iam attach-user-policy --user-name ai-prompt-generator-deploy \
     --policy-arn arn:aws:iam::aws:policy/AWSCloudFormationFullAccess
   aws iam attach-user-policy --user-name ai-prompt-generator-deploy \
     --policy-arn arn:aws:iam::aws:policy/AWSLambda_FullAccess
   aws iam attach-user-policy --user-name ai-prompt-generator-deploy \
     --policy-arn arn:aws:iam::aws:policy/AmazonAPIGatewayAdministrator
   ```

3. **Configure AWS CLI**
   ```bash
   aws configure
   # Enter your Access Key ID
   # Enter your Secret Access Key
   # Enter default region: us-east-1
   # Enter default output format: json
   ```

4. **Verify Configuration**
   ```bash
   aws sts get-caller-identity
   ```

### Get AI API Keys

#### Claude API (Recommended)
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Save the key securely

#### OpenAI API (Alternative)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Go to API Keys section
4. Create a new secret key
5. Save the key securely

---

## Quick Start

The fastest way to deploy:

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/ai-prompt-generator.git
cd ai-prompt-generator

# 2. Install dependencies
npm install

# 3. Copy and configure environment
cp .env.example .env
# Edit .env with your API keys

# 4. Make deployment script executable
chmod +x scripts/deploy.sh

# 5. Deploy to production
./scripts/deploy.sh production
```

That's it! The script will:
- ✅ Deploy CloudFormation stacks
- ✅ Create S3 bucket and CloudFront distribution
- ✅ Set up Lambda functions and API Gateway
- ✅ Upload frontend files
- ✅ Invalidate CloudFront cache
- ✅ Run smoke tests

---

## Manual Deployment

### Step 1: Deploy Frontend Infrastructure

```bash
# Set variables
ENVIRONMENT=production
STACK_NAME="ai-prompt-generator-frontend-${ENVIRONMENT}"
AWS_REGION=us-east-1

# Deploy the CloudFormation stack
aws cloudformation deploy \
  --template-file infrastructure/cloudformation/main.yaml \
  --stack-name ${STACK_NAME} \
  --parameter-overrides \
    Environment=${ENVIRONMENT} \
    EnableWAF=true \
    PriceClass=PriceClass_100 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ${AWS_REGION}

# Get the outputs
aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --query 'Stacks[0].Outputs' \
  --output table
```

### Step 2: Deploy Backend Infrastructure

```bash
BACKEND_STACK="ai-prompt-generator-backend-${ENVIRONMENT}"

aws cloudformation deploy \
  --template-file infrastructure/cloudformation/backend.yaml \
  --stack-name ${BACKEND_STACK} \
  --parameter-overrides \
    Environment=${ENVIRONMENT} \
    AIProvider=claude \
    RateLimitRequests=100 \
  --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --region ${AWS_REGION}
```

### Step 3: Update API Keys in Secrets Manager

```bash
# Get the secret ARN
SECRET_ARN=$(aws cloudformation describe-stacks \
  --stack-name ${BACKEND_STACK} \
  --query 'Stacks[0].Outputs[?OutputKey==`APIKeysSecretArn`].OutputValue' \
  --output text)

# Update with your actual API keys
aws secretsmanager update-secret \
  --secret-id ${SECRET_ARN} \
  --secret-string '{
    "CLAUDE_API_KEY": "sk-ant-your-actual-key-here",
    "OPENAI_API_KEY": "sk-your-actual-key-here"
  }'
```

### Step 4: Upload Frontend Files

```bash
# Get bucket name
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
  --output text)

# Get API endpoint
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name ${BACKEND_STACK} \
  --query 'Stacks[0].Outputs[?OutputKey==`APIEndpoint`].OutputValue' \
  --output text)

# Update API endpoint in app.js
sed -i '' "s|API_ENDPOINT: '/api/generate-prompt'|API_ENDPOINT: '${API_ENDPOINT}/generate-prompt'|g" frontend/js/app.js

# Sync files
aws s3 sync frontend/ s3://${BUCKET_NAME}/ \
  --cache-control "public, max-age=86400"
```

### Step 5: Invalidate CloudFront Cache

```bash
# Get distribution ID
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text)

# Create invalidation
aws cloudfront create-invalidation \
  --distribution-id ${DISTRIBUTION_ID} \
  --paths "/*"
```

### Step 6: Verify Deployment

```bash
# Get website URL
WEBSITE_URL=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
  --output text)

echo "Website deployed at: ${WEBSITE_URL}"

# Test the website
curl -I ${WEBSITE_URL}
```

---

## CI/CD Deployment

### GitHub Actions Setup

1. **Create GitHub Secrets**
   
   Go to your repository → Settings → Secrets → Actions, and add:
   
   | Secret Name | Description |
   |-------------|-------------|
   | `AWS_ROLE_ARN` | ARN of IAM role for GitHub Actions |
   | `DOMAIN_NAME` | Your custom domain (optional) |
   | `HOSTED_ZONE_ID` | Route 53 hosted zone ID (optional) |

2. **Create IAM Role for GitHub Actions**

   ```bash
   # Create the trust policy
   cat > trust-policy.json << EOF
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringEquals": {
             "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
           },
           "StringLike": {
             "token.actions.githubusercontent.com:sub": "repo:yourusername/ai-prompt-generator:*"
           }
         }
       }
     ]
   }
   EOF
   
   # Create the role
   aws iam create-role \
     --role-name github-actions-ai-prompt-generator \
     --assume-role-policy-document file://trust-policy.json
   ```

3. **Trigger Deployment**
   
   Push to the `main` branch to trigger production deployment:
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

---

## Custom Domain Setup

### Step 1: Register Domain (if needed)

Use Route 53 or any domain registrar.

### Step 2: Create Hosted Zone

```bash
aws route53 create-hosted-zone \
  --name yourdomain.com \
  --caller-reference $(date +%s)
```

### Step 3: Update Nameservers

Get the nameservers from Route 53 and update your domain registrar.

### Step 4: Deploy with Custom Domain

```bash
aws cloudformation deploy \
  --template-file infrastructure/cloudformation/main.yaml \
  --stack-name ai-prompt-generator-frontend-production \
  --parameter-overrides \
    Environment=production \
    DomainName=promptgenerator.yourdomain.com \
    HostedZoneId=Z1234567890ABC \
    EnableWAF=true \
  --capabilities CAPABILITY_NAMED_IAM
```

### Step 5: Wait for Certificate Validation

The ACM certificate requires DNS validation. This happens automatically when you provide a HostedZoneId.

---

## Post-Deployment Configuration

### 1. Set Up Budget Alerts

```bash
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget '{
    "BudgetName": "AI-Prompt-Generator-Monthly",
    "BudgetLimit": {
      "Amount": "10",
      "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }' \
  --notifications-with-subscribers '[
    {
      "Notification": {
        "NotificationType": "ACTUAL",
        "ComparisonOperator": "GREATER_THAN",
        "Threshold": 80,
        "ThresholdType": "PERCENTAGE"
      },
      "Subscribers": [
        {
          "SubscriptionType": "EMAIL",
          "Address": "your-email@example.com"
        }
      ]
    }
  ]'
```

### 2. Configure CloudWatch Alarms

```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "AI-Prompt-Generator-High-Error-Rate" \
  --alarm-description "Alert when error rate exceeds 5%" \
  --metric-name "5xxErrorRate" \
  --namespace "AWS/CloudFront" \
  --statistic "Average" \
  --period 300 \
  --threshold 5 \
  --comparison-operator "GreaterThanThreshold" \
  --dimensions Name=DistributionId,Value=${DISTRIBUTION_ID} Name=Region,Value=Global \
  --evaluation-periods 2 \
  --alarm-actions "arn:aws:sns:us-east-1:YOUR_ACCOUNT:alerts"
```

### 3. Update Google Analytics ID

Edit `frontend/index.html` and replace `G-XXXXXXXXXX` with your actual Google Analytics ID.

---

## Verification Checklist

After deployment, verify:

- [ ] Website loads at CloudFront URL
- [ ] HTTPS is working (check for padlock)
- [ ] Prompt generation works
- [ ] Copy to clipboard works
- [ ] Dark mode toggle works
- [ ] Mobile responsiveness
- [ ] Error handling displays correctly
- [ ] Rate limiting works (after many requests)
- [ ] CloudWatch logs are being created
- [ ] No console errors in browser

### Run Lighthouse Audit

```bash
npm run lighthouse
# Open reports/lighthouse.html
```

Expected scores:
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

---

## Rollback Procedures

### Quick Rollback (S3 versioning)

```bash
# List object versions
aws s3api list-object-versions --bucket ${BUCKET_NAME}

# Restore previous version of a file
aws s3api copy-object \
  --bucket ${BUCKET_NAME} \
  --copy-source ${BUCKET_NAME}/index.html?versionId=PREVIOUS_VERSION_ID \
  --key index.html
```

### CloudFormation Rollback

```bash
# Rollback to previous stack version
aws cloudformation rollback-stack \
  --stack-name ${STACK_NAME}
```

### Full Rollback

```bash
# Delete and redeploy
aws cloudformation delete-stack --stack-name ${STACK_NAME}
aws cloudformation wait stack-delete-complete --stack-name ${STACK_NAME}
./scripts/deploy.sh production
```

---

## Cost Optimization

### Estimated Monthly Costs

| Traffic (users/day) | Estimated Cost |
|--------------------|----------------|
| 100 | ~$1-2 |
| 1,000 | ~$5-10 |
| 10,000 | ~$50-100 |

### Cost Reduction Tips

1. **Use PriceClass_100** - Only US, Canada, Europe edge locations
2. **Enable S3 Intelligent Tiering** for logs
3. **Set CloudFront cache TTL** appropriately
4. **Use Lambda reserved concurrency** to prevent runaway costs
5. **Set up budget alerts** at $5, $10, $25 thresholds

### Free Tier Usage

First 12 months:
- S3: 5GB storage, 20K GET, 2K PUT
- CloudFront: 1TB data transfer
- Lambda: 1M requests, 400K GB-seconds
- API Gateway: 1M calls
- DynamoDB: 25GB storage, 25 WCU, 25 RCU

---

## Troubleshooting

See [troubleshooting.md](troubleshooting.md) for common issues and solutions.

---

## Support

If you encounter issues:

1. Check CloudWatch Logs
2. Review CloudFormation events
3. Open an issue on GitHub

Happy deploying! 🚀
