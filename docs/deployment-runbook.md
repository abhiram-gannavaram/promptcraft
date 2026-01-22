# AI Prompt Generator - Complete Deployment Runbook

## 📖 Overview

This runbook provides complete step-by-step instructions for deploying the AI Prompt Generator to AWS with a strict $10/month budget limit.

**Estimated Time:** 2-3 hours (first deployment)  
**Budget Limit:** $10/month  
**Required Skill Level:** Beginner to Intermediate

---

## 📋 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Testing](#2-local-testing)
3. [AWS Account Setup](#3-aws-account-setup)
4. [Budget Setup (MANDATORY)](#4-budget-setup-mandatory)
5. [Deployment](#5-deployment)
6. [Post-Deployment Verification](#6-post-deployment-verification)
7. [Monitoring Setup](#7-monitoring-setup)
8. [Maintenance](#8-maintenance)
9. [Rollback Procedures](#9-rollback-procedures)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

### 1.1 System Requirements

Verify your system has the following tools installed:

```bash
# Check Node.js (v18+)
node --version

# Check npm
npm --version

# Check AWS CLI (v2)
aws --version

# Check Git
git --version

# Check jq (for JSON processing)
jq --version

# Install missing tools (macOS)
brew install node awscli jq git
```

### 1.2 AWS CLI Configuration

```bash
# Configure AWS CLI with your credentials
aws configure

# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: us-east-1
# - Default output format: json

# Verify configuration
aws sts get-caller-identity
```

Expected output:
```json
{
    "UserId": "AIDAXXXXXXXXXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/your-user"
}
```

### 1.3 Project Setup

```bash
# Navigate to project directory
cd /Users/abhiramgannavaram/promot-project

# Install dependencies
npm install

# Make scripts executable
chmod +x scripts/*.sh
```

---

## 2. Local Testing

### 2.1 Run Automated Tests

```bash
# Run comprehensive local tests
./scripts/local-test.sh
```

**Expected Output:** All tests should pass (or have acceptable warnings).

### 2.2 Start Local Server

```bash
# Start local development server
npm run serve

# OR using Python
cd frontend && python3 -m http.server 8080
```

### 2.3 Manual Testing

1. Open http://localhost:8080 in your browser
2. Follow the [Manual Testing Checklist](manual-testing-checklist.md)
3. Test in multiple browsers (Chrome, Firefox, Safari)
4. Test on mobile devices (or use browser dev tools)

### 2.4 Performance Testing

```bash
# Run Lighthouse audit (optional)
RUN_LIGHTHOUSE=true ./scripts/local-test.sh

# Or use Chrome DevTools Lighthouse tab
```

**Target Scores:**
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90

### 2.5 Fix Any Issues

Before proceeding:
- [ ] All automated tests pass
- [ ] Manual testing complete
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Security checks pass

---

## 3. AWS Account Setup

### 3.1 Security Best Practices (One-time Setup)

```bash
# 1. Enable MFA on root account (via AWS Console)
# https://console.aws.amazon.com/iam/home#/security_credentials

# 2. Create IAM user for deployment
aws iam create-user --user-name prompt-generator-deploy

# 3. Create access key
aws iam create-access-key --user-name prompt-generator-deploy

# Save the Access Key ID and Secret Access Key securely!

# 4. Attach necessary permissions (see docs/security-checklist.md)
```

### 3.2 Verify Permissions

```bash
# Check current user has required permissions
aws s3 ls  # Should list buckets (or empty list)
aws cloudfront list-distributions  # Should work
aws budgets describe-budgets --account-id $(aws sts get-caller-identity --query Account --output text)
```

---

## 4. Budget Setup (MANDATORY)

⚠️ **CRITICAL: Do this BEFORE deploying any resources!**

### 4.1 Set Environment Variables

```bash
# Set your email for budget alerts
export ALERT_EMAIL="your-email@example.com"
export AWS_REGION="us-east-1"
```

### 4.2 Create Budget via Script

```bash
# The deployment script will create the budget automatically
# But you can also create it manually first:

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

aws budgets create-budget \
    --account-id "$AWS_ACCOUNT_ID" \
    --budget '{
        "BudgetName": "ai-prompt-generator-monthly-budget",
        "BudgetLimit": {"Amount": "10.00", "Unit": "USD"},
        "BudgetType": "COST",
        "TimeUnit": "MONTHLY"
    }' \
    --notifications-with-subscribers '[
        {
            "Notification": {
                "NotificationType": "ACTUAL",
                "ComparisonOperator": "GREATER_THAN",
                "Threshold": 50,
                "ThresholdType": "PERCENTAGE"
            },
            "Subscribers": [{"SubscriptionType": "EMAIL", "Address": "'$ALERT_EMAIL'"}]
        },
        {
            "Notification": {
                "NotificationType": "ACTUAL",
                "ComparisonOperator": "GREATER_THAN",
                "Threshold": 80,
                "ThresholdType": "PERCENTAGE"
            },
            "Subscribers": [{"SubscriptionType": "EMAIL", "Address": "'$ALERT_EMAIL'"}]
        },
        {
            "Notification": {
                "NotificationType": "ACTUAL",
                "ComparisonOperator": "GREATER_THAN",
                "Threshold": 100,
                "ThresholdType": "PERCENTAGE"
            },
            "Subscribers": [{"SubscriptionType": "EMAIL", "Address": "'$ALERT_EMAIL'"}]
        }
    ]'
```

### 4.3 Verify Budget Created

```bash
# Check budget exists
aws budgets describe-budgets \
    --account-id $(aws sts get-caller-identity --query Account --output text)
```

**You should receive a confirmation email. Verify the email to activate alerts!**

---

## 5. Deployment

### 5.1 Pre-Deployment Checklist

- [ ] Local tests pass
- [ ] Budget alerts configured
- [ ] Email for alerts verified
- [ ] AWS CLI configured
- [ ] Environment variables set

### 5.2 Run Deployment Script

```bash
# Set email for alerts
export ALERT_EMAIL="your-email@example.com"

# Run deployment
./scripts/deploy-aws.sh production
```

**What the script does:**
1. ✅ Verifies prerequisites
2. ✅ Creates budget alerts (if not exists)
3. ✅ Creates S3 bucket with encryption
4. ✅ Uploads frontend files
5. ✅ Creates CloudFront distribution
6. ✅ Configures security headers
7. ✅ Sets up monitoring dashboard
8. ✅ Runs post-deployment tests

### 5.3 Deployment Output

The script will output:
- S3 Bucket Name
- CloudFront Distribution ID
- CloudFront URL (your website URL)
- Dashboard URL

**Save these values!**

### 5.4 Wait for CloudFront

CloudFront takes 5-15 minutes to deploy. The script will wait and test automatically.

---

## 6. Post-Deployment Verification

### 6.1 Test Website Access

```bash
# Get your CloudFront URL from deployment output
CLOUDFRONT_URL="https://dxxxxxxxxxx.cloudfront.net"

# Test HTTPS access
curl -I "$CLOUDFRONT_URL"
```

Expected response:
```
HTTP/2 200
content-type: text/html
...
```

### 6.2 Security Headers Check

```bash
# Check security headers
curl -sI "$CLOUDFRONT_URL" | grep -E "strict-transport|x-frame|x-content|x-xss"
```

### 6.3 SSL/TLS Check

1. Visit: https://www.ssllabs.com/ssltest/
2. Enter your CloudFront URL
3. Target: **A+ rating**

### 6.4 Security Headers Check

1. Visit: https://securityheaders.com/
2. Enter your CloudFront URL
3. Target: **A rating or better**

### 6.5 Performance Check

1. Visit: https://pagespeed.web.dev/
2. Enter your CloudFront URL
3. Target: **90+ score**

### 6.6 Functional Testing

1. Open your CloudFront URL in browser
2. Test all features:
   - [ ] Input field works
   - [ ] Generate button works (or shows demo mode)
   - [ ] Copy button works
   - [ ] Theme toggle works
   - [ ] Language selector works
   - [ ] Mobile responsive

---

## 7. Monitoring Setup

### 7.1 View CloudWatch Dashboard

```bash
# Open in browser
open "https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=ai-prompt-generator-production"
```

### 7.2 Set Up Cost Monitoring

```bash
# Run cost report
./scripts/cost-monitor.sh

# Set up daily monitoring (optional)
./scripts/cost-monitor.sh --setup
```

### 7.3 External Monitoring (Free)

1. Sign up for [UptimeRobot](https://uptimerobot.com/) (free tier)
2. Add new monitor:
   - Type: HTTP(s)
   - URL: Your CloudFront URL
   - Interval: 5 minutes
3. Set up email/SMS alerts

### 7.4 Weekly Cost Check

Every week, run:
```bash
./scripts/cost-monitor.sh --report
```

---

## 8. Maintenance

### 8.1 Updating Content

```bash
# After making changes to frontend files:

# Sync to S3
aws s3 sync frontend/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
    --distribution-id YOUR_DISTRIBUTION_ID \
    --paths "/*"
```

### 8.2 Viewing Logs

```bash
# CloudFront logs (if enabled)
aws s3 ls s3://your-bucket-name/logs/
```

### 8.3 Backup

```bash
# Create backup
./scripts/backup.sh production
```

### 8.4 Update Dependencies

```bash
# Monthly: update npm packages
npm update
npm audit fix

# Re-run tests after updates
./scripts/local-test.sh
```

---

## 9. Rollback Procedures

### 9.1 Quick Rollback (Content)

S3 versioning is enabled, so you can restore previous versions:

```bash
# List object versions
aws s3api list-object-versions --bucket your-bucket-name --prefix index.html

# Restore a specific version
aws s3api copy-object \
    --bucket your-bucket-name \
    --copy-source your-bucket-name/index.html?versionId=VERSION_ID \
    --key index.html
```

### 9.2 Full Rollback (Restore Backup)

```bash
# List backups
ls backups/production/

# Restore from backup
./scripts/restore.sh backups/production/20240122_120000
```

### 9.3 Emergency Disable

If costs are running away:

```bash
# Option 1: Disable CloudFront (website goes offline)
# Do this via AWS Console:
# CloudFront > Distributions > Select > Disable

# Option 2: Block S3 access
aws s3api put-bucket-policy \
    --bucket your-bucket-name \
    --policy '{"Version":"2012-10-17","Statement":[{"Effect":"Deny","Principal":"*","Action":"s3:*","Resource":"arn:aws:s3:::your-bucket-name/*"}]}'
```

---

## 10. Troubleshooting

### Common Issues

#### "Access Denied" when accessing website

**Cause:** S3 bucket policy not allowing CloudFront access.

**Fix:**
```bash
# Re-run deployment or manually update bucket policy
# See deploy-aws.sh for correct policy
```

#### CloudFront showing old content

**Cause:** Content cached at CloudFront edge locations.

**Fix:**
```bash
# Create cache invalidation
aws cloudfront create-invalidation \
    --distribution-id YOUR_DISTRIBUTION_ID \
    --paths "/*"
```

#### Budget alerts not working

**Cause:** Email not verified.

**Fix:**
1. Check your email for AWS Budget notification
2. Click verification link
3. Check spam folder

#### High costs unexpectedly

**Cause:** Usually CloudFront data transfer.

**Fix:**
1. Run `./scripts/cost-monitor.sh` to identify source
2. Check for unusual traffic patterns
3. Enable WAF rate limiting if needed
4. Consider geo-restrictions

#### Website not loading

**Cause:** Various - check in order:
1. CloudFront still deploying (wait 15 min)
2. DNS not propagated (wait 24-48 hours)
3. S3 bucket empty
4. CloudFront configuration error

**Debug:**
```bash
# Check CloudFront status
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID --query 'Distribution.Status'

# Check S3 bucket
aws s3 ls s3://your-bucket-name

# Check CloudFront logs
aws cloudfront get-distribution-config --id YOUR_DISTRIBUTION_ID
```

---

## 💰 Expected Costs

| Resource | Monthly Cost (1K users/day) |
|----------|----------------------------|
| S3 Storage (1GB) | ~$0.02 |
| S3 Requests | ~$0.02 |
| CloudFront Data (10GB) | ~$0.85 |
| CloudFront Requests | ~$0.01 |
| Route 53 (optional) | ~$0.50 |
| **Total** | **~$1.40** |

**With 10K users/day:** ~$9.00/month (still under $10)

---

## 📞 Support Resources

- AWS Documentation: https://docs.aws.amazon.com/
- CloudFront Troubleshooting: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/troubleshooting-distributions.html
- AWS Support (Basic - Free): https://console.aws.amazon.com/support/

---

## ✅ Deployment Complete Checklist

Before considering deployment complete:

- [ ] Website accessible via HTTPS
- [ ] All features working
- [ ] SSL Labs score A or better
- [ ] Security Headers score B+ or better
- [ ] PageSpeed score 90+
- [ ] Budget alerts active and verified
- [ ] Monitoring dashboard set up
- [ ] Backup created
- [ ] Deployment info saved
- [ ] Team notified (if applicable)

**Congratulations! Your AI Prompt Generator is live! 🎉**
