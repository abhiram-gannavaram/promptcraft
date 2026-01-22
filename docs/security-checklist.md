# AI Prompt Generator - Security Checklist & Configuration

## 🔒 Pre-Deployment Security Checklist

### Code Security
- [ ] **No hardcoded API keys** in frontend code
- [ ] **No hardcoded passwords** or secrets
- [ ] **Console.log statements removed** from production code
- [ ] **.env files in .gitignore**
- [ ] **Input validation** implemented on all user inputs
- [ ] **Output encoding** to prevent XSS
- [ ] **No eval()** or Function() with user input
- [ ] **innerHTML** sanitized before use

### Dependencies
- [ ] **npm audit** shows no critical vulnerabilities
- [ ] **Dependencies up-to-date** (npm outdated)
- [ ] **Unused dependencies removed**
- [ ] **package-lock.json committed** for reproducible builds

### AWS Security (Pre-deployment)
- [ ] **MFA enabled** on root account
- [ ] **IAM user created** (not using root)
- [ ] **Least privilege permissions** applied
- [ ] **AWS CLI configured** with IAM user credentials
- [ ] **Budget alerts configured** BEFORE deployment

---

## 🔐 Post-Deployment Security Checklist

### S3 Bucket
- [ ] **Public access blocked** (all 4 options enabled)
- [ ] **Bucket policy** only allows CloudFront access
- [ ] **Versioning enabled** for recovery
- [ ] **Server-side encryption** enabled (AES-256)
- [ ] **Access logging** enabled
- [ ] **Lifecycle policy** for old versions

### CloudFront
- [ ] **HTTPS only** (HTTP redirects to HTTPS)
- [ ] **TLS 1.2 minimum** configured
- [ ] **Origin Access Control** configured
- [ ] **Security headers** configured
- [ ] **Geo-restrictions** if needed

### Security Headers Check
Run after deployment:
```bash
curl -I https://your-cloudfront-url.cloudfront.net
```

Expected headers:
- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Content-Security-Policy: default-src 'self'...`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`

### External Security Tests
- [ ] **SSL Labs** test: https://www.ssllabs.com/ssltest/
  - Target: A+ rating
- [ ] **Security Headers**: https://securityheaders.com/
  - Target: A rating
- [ ] **Mozilla Observatory**: https://observatory.mozilla.org/
  - Target: B+ or better

---

## 🛡️ IAM Policies

### Minimum Permissions for Deployment (deployment-user-policy.json)

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "S3BucketManagement",
            "Effect": "Allow",
            "Action": [
                "s3:CreateBucket",
                "s3:PutBucketVersioning",
                "s3:PutBucketEncryption",
                "s3:PutBucketPolicy",
                "s3:PutPublicAccessBlock",
                "s3:PutLifecycleConfiguration",
                "s3:PutBucketTagging",
                "s3:GetBucketLocation",
                "s3:ListBucket",
                "s3:HeadBucket"
            ],
            "Resource": "arn:aws:s3:::ai-prompt-generator-*"
        },
        {
            "Sid": "S3ObjectManagement",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::ai-prompt-generator-*/*"
        },
        {
            "Sid": "CloudFrontManagement",
            "Effect": "Allow",
            "Action": [
                "cloudfront:CreateDistribution",
                "cloudfront:GetDistribution",
                "cloudfront:UpdateDistribution",
                "cloudfront:ListDistributions",
                "cloudfront:CreateInvalidation",
                "cloudfront:GetInvalidation",
                "cloudfront:CreateOriginAccessControl",
                "cloudfront:GetOriginAccessControl",
                "cloudfront:ListOriginAccessControls",
                "cloudfront:CreateResponseHeadersPolicy",
                "cloudfront:GetResponseHeadersPolicy",
                "cloudfront:ListResponseHeadersPolicies"
            ],
            "Resource": "*"
        },
        {
            "Sid": "BudgetManagement",
            "Effect": "Allow",
            "Action": [
                "budgets:CreateBudget",
                "budgets:DescribeBudget",
                "budgets:ModifyBudget",
                "budgets:ViewBudget"
            ],
            "Resource": "*"
        },
        {
            "Sid": "CloudWatchManagement",
            "Effect": "Allow",
            "Action": [
                "cloudwatch:PutDashboard",
                "cloudwatch:GetDashboard",
                "cloudwatch:PutMetricAlarm",
                "cloudwatch:DescribeAlarms"
            ],
            "Resource": "*"
        }
    ]
}
```

### Read-Only Access for Monitoring (readonly-policy.json)

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ReadOnlyAccess",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket",
                "cloudfront:GetDistribution",
                "cloudfront:ListDistributions",
                "cloudwatch:GetDashboard",
                "cloudwatch:DescribeAlarms",
                "budgets:ViewBudget"
            ],
            "Resource": "*"
        }
    ]
}
```

---

## 🔥 WAF Configuration (Optional - Free Tier)

### Basic WAF Rules (waf-rules.json)

```json
{
    "Name": "ai-prompt-generator-waf",
    "Scope": "CLOUDFRONT",
    "DefaultAction": {
        "Allow": {}
    },
    "Rules": [
        {
            "Name": "RateLimit",
            "Priority": 1,
            "Statement": {
                "RateBasedStatement": {
                    "Limit": 2000,
                    "AggregateKeyType": "IP"
                }
            },
            "Action": {
                "Block": {}
            },
            "VisibilityConfig": {
                "SampledRequestsEnabled": true,
                "CloudWatchMetricsEnabled": true,
                "MetricName": "RateLimitRule"
            }
        },
        {
            "Name": "AWSManagedRulesCommonRuleSet",
            "Priority": 2,
            "Statement": {
                "ManagedRuleGroupStatement": {
                    "VendorName": "AWS",
                    "Name": "AWSManagedRulesCommonRuleSet"
                }
            },
            "OverrideAction": {
                "None": {}
            },
            "VisibilityConfig": {
                "SampledRequestsEnabled": true,
                "CloudWatchMetricsEnabled": true,
                "MetricName": "CommonRuleSet"
            }
        }
    ],
    "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "ai-prompt-generator-waf"
    }
}
```

⚠️ **Note**: WAF incurs additional costs (~$5/month minimum). Only enable if budget allows.

---

## 🔧 Security Headers Policy (CloudFront)

### Response Headers Policy Configuration

```json
{
    "Name": "ai-prompt-generator-security-headers",
    "Comment": "Security headers for AI Prompt Generator",
    "SecurityHeadersConfig": {
        "XSSProtection": {
            "Override": true,
            "Protection": true,
            "ModeBlock": true
        },
        "FrameOptions": {
            "Override": true,
            "FrameOption": "DENY"
        },
        "ContentTypeOptions": {
            "Override": true
        },
        "StrictTransportSecurity": {
            "Override": true,
            "IncludeSubdomains": true,
            "Preload": true,
            "AccessControlMaxAgeSec": 31536000
        },
        "ContentSecurityPolicy": {
            "Override": true,
            "ContentSecurityPolicy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.anthropic.com https://api.openai.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
        },
        "ReferrerPolicy": {
            "Override": true,
            "ReferrerPolicy": "strict-origin-when-cross-origin"
        }
    },
    "CustomHeadersConfig": {
        "Items": [
            {
                "Header": "Permissions-Policy",
                "Value": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
                "Override": true
            }
        ]
    }
}
```

---

## 🚨 Emergency Response Procedures

### If Suspicious Activity Detected

1. **Check CloudWatch Logs** for unusual patterns
2. **Enable WAF** rate limiting if not already active
3. **Block suspicious IPs** via WAF or S3 bucket policy
4. **Review CloudTrail** for unauthorized access
5. **Rotate credentials** if compromised

### If Budget Alert Triggered

1. **Check Cost Explorer** for spending breakdown
2. **Identify cost source** (usually CloudFront data transfer)
3. **Enable CloudFront caching** to reduce origin requests
4. **Consider geo-restrictions** if traffic from unexpected regions
5. **Scale down or delete** resources if needed

### Emergency Shutdown Script

```bash
#!/bin/bash
# emergency-shutdown.sh
# Use only if costs are running away

# Disable CloudFront distribution
aws cloudfront update-distribution \
    --id YOUR_DISTRIBUTION_ID \
    --if-match $(aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID --query 'ETag' --output text) \
    --distribution-config '{"Enabled": false, ...}'

# Block all S3 access
aws s3api put-bucket-policy \
    --bucket YOUR_BUCKET_NAME \
    --policy '{"Version":"2012-10-17","Statement":[{"Effect":"Deny","Principal":"*","Action":"s3:*","Resource":"arn:aws:s3:::YOUR_BUCKET_NAME/*"}]}'

echo "Emergency shutdown complete. Website is now offline."
```

---

## 📝 Security Audit Schedule

| Frequency | Task |
|-----------|------|
| Daily (first week) | Check cost reports |
| Weekly | Review CloudWatch alarms |
| Weekly | Check for npm vulnerabilities |
| Monthly | Review IAM permissions |
| Monthly | Check SSL certificate expiry |
| Monthly | Run security headers test |
| Quarterly | Full security audit |
| Quarterly | Review and update dependencies |

---

## ✅ Security Sign-Off

Before going live, confirm:

- [ ] All pre-deployment checks passed
- [ ] All post-deployment checks passed
- [ ] SSL Labs score is A or better
- [ ] Security Headers score is B+ or better
- [ ] Budget alerts are active and tested
- [ ] Emergency procedures documented and understood
- [ ] Monitoring dashboard reviewed

**Signed off by:** _________________ **Date:** _________________
