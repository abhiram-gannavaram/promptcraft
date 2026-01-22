# 🔧 Troubleshooting Guide

Common issues and their solutions for the AI Prompt Generator.

## Table of Contents

1. [Deployment Issues](#deployment-issues)
2. [Frontend Issues](#frontend-issues)
3. [API Issues](#api-issues)
4. [CloudFront Issues](#cloudfront-issues)
5. [Lambda Issues](#lambda-issues)
6. [Performance Issues](#performance-issues)
7. [Security Issues](#security-issues)

---

## Deployment Issues

### CloudFormation Stack Creation Failed

**Symptoms:**
- Stack status shows `ROLLBACK_COMPLETE` or `CREATE_FAILED`

**Diagnosis:**
```bash
# View stack events
aws cloudformation describe-stack-events \
  --stack-name YOUR_STACK_NAME \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'
```

**Common Causes & Solutions:**

| Error | Cause | Solution |
|-------|-------|----------|
| `S3 bucket already exists` | Bucket name not unique | Change bucket name or use account ID suffix |
| `Access Denied` | Insufficient IAM permissions | Add required policies to IAM user/role |
| `Certificate validation timeout` | DNS not configured | Add CNAME records for ACM validation |
| `WAF Web ACL limit exceeded` | Account limit reached | Request limit increase or delete unused WAFs |

### S3 Bucket Access Denied

**Symptoms:**
- 403 Forbidden when accessing website
- "Access Denied" error in browser

**Solutions:**

1. **Check bucket policy:**
   ```bash
   aws s3api get-bucket-policy --bucket YOUR_BUCKET_NAME
   ```

2. **Check CloudFront OAC configuration:**
   ```bash
   aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID \
     --query 'Distribution.DistributionConfig.Origins.Items[0]'
   ```

3. **Verify files exist:**
   ```bash
   aws s3 ls s3://YOUR_BUCKET_NAME/
   ```

4. **Re-sync files:**
   ```bash
   aws s3 sync frontend/ s3://YOUR_BUCKET_NAME/ --delete
   ```

---

## Frontend Issues

### Page Not Loading

**Symptoms:**
- Blank page
- Console errors
- 404 errors

**Diagnosis:**
1. Open browser Developer Tools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests

**Solutions:**

| Issue | Solution |
|-------|----------|
| CORS errors | Update CloudFront response headers policy |
| Missing files | Re-sync to S3 and invalidate cache |
| JavaScript errors | Check console for specific error messages |
| HTTPS mixed content | Ensure all resources use HTTPS |

### Dark Mode Not Working

**Cause:** localStorage not accessible or JavaScript error

**Solution:**
1. Clear browser cache and localStorage
2. Check console for errors
3. Verify `app.js` is loaded correctly

### Character Counter Not Updating

**Cause:** JavaScript not initialized properly

**Solution:**
1. Check if `app.js` is loaded
2. Verify textarea has correct ID (`prompt-input`)
3. Check for JavaScript errors in console

---

## API Issues

### "Rate limit exceeded" Error

**Symptoms:**
- 429 Too Many Requests response
- Error message about rate limiting

**Solutions:**

1. **Wait and retry** - Rate limits reset after 1 minute

2. **Increase rate limit:**
   ```bash
   aws lambda update-function-configuration \
     --function-name ai-prompt-generator-generate-production \
     --environment "Variables={RATE_LIMIT_REQUESTS=200}"
   ```

3. **Check DynamoDB rate limit table:**
   ```bash
   aws dynamodb scan \
     --table-name ai-prompt-generator-ratelimit-production
   ```

### "API Error" or Generation Failing

**Symptoms:**
- 500 Internal Server Error
- Generic error message

**Diagnosis:**
```bash
# Check Lambda logs
aws logs tail /aws/lambda/ai-prompt-generator-generate-production --follow
```

**Common Causes:**

| Error in Logs | Solution |
|---------------|----------|
| `Invalid API key` | Update API key in Secrets Manager |
| `Insufficient quota` | Check API provider billing/limits |
| `Connection timeout` | Increase Lambda timeout |
| `Out of memory` | Increase Lambda memory |

### Updating API Keys

```bash
# Get secret ARN
SECRET_ARN=$(aws secretsmanager list-secrets \
  --query "SecretList[?Name=='ai-prompt-generator/production/api-keys'].ARN" \
  --output text)

# Update secret
aws secretsmanager update-secret \
  --secret-id ${SECRET_ARN} \
  --secret-string '{"CLAUDE_API_KEY":"sk-ant-new-key","OPENAI_API_KEY":"sk-new-key"}'
```

---

## CloudFront Issues

### Changes Not Appearing

**Cause:** CloudFront caching old content

**Solution:**
```bash
# Create cache invalidation
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"

# Wait for completion
aws cloudfront wait invalidation-completed \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --id INVALIDATION_ID
```

### SSL Certificate Errors

**Symptoms:**
- "Certificate not valid" warning
- HTTPS not working

**Diagnosis:**
```bash
# Check certificate status
aws acm describe-certificate \
  --certificate-arn YOUR_CERTIFICATE_ARN \
  --query 'Certificate.Status'
```

**Solutions:**

| Status | Action |
|--------|--------|
| `PENDING_VALIDATION` | Add DNS validation records |
| `FAILED` | Check domain ownership, recreate certificate |
| `EXPIRED` | Renew certificate (should be automatic) |

### Custom Domain Not Working

**Checklist:**
1. ✅ ACM certificate is `ISSUED` status
2. ✅ Certificate is in `us-east-1` region
3. ✅ CloudFront alternate domain names include your domain
4. ✅ Route 53 A/AAAA records point to CloudFront
5. ✅ DNS has propagated (use `dig` or online checker)

```bash
# Check DNS propagation
dig promptgenerator.yourdomain.com
```

---

## Lambda Issues

### Lambda Timeout

**Symptoms:**
- "Task timed out" in logs
- No response from API

**Solutions:**

1. **Increase timeout:**
   ```bash
   aws lambda update-function-configuration \
     --function-name ai-prompt-generator-generate-production \
     --timeout 30
   ```

2. **Check for slow external calls:**
   - AI API response times
   - DynamoDB latency

3. **Enable X-Ray tracing:**
   ```bash
   aws lambda update-function-configuration \
     --function-name ai-prompt-generator-generate-production \
     --tracing-config Mode=Active
   ```

### Lambda Memory Errors

**Symptoms:**
- "Runtime exited with error: signal: killed" in logs
- Out of memory errors

**Solution:**
```bash
aws lambda update-function-configuration \
  --function-name ai-prompt-generator-generate-production \
  --memory-size 512
```

### Cold Starts

**Symptoms:**
- First request after idle period is slow (3-5 seconds)

**Solutions:**

1. **Use Provisioned Concurrency** (adds cost):
   ```bash
   aws lambda put-provisioned-concurrency-config \
     --function-name ai-prompt-generator-generate-production \
     --qualifier production \
     --provisioned-concurrent-executions 1
   ```

2. **Keep function warm** with scheduled CloudWatch Events

---

## Performance Issues

### Slow Page Load

**Diagnosis:**
```bash
# Run Lighthouse audit
npm run lighthouse
```

**Optimization Checklist:**
- [ ] Enable Gzip/Brotli in CloudFront
- [ ] Set appropriate cache headers
- [ ] Minimize JavaScript/CSS
- [ ] Optimize images
- [ ] Use lazy loading

### High CloudFront Costs

**Diagnosis:**
```bash
# Check cache hit ratio
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name CacheHitRate \
  --dimensions Name=DistributionId,Value=YOUR_DIST_ID Name=Region,Value=Global \
  --start-time $(date -u -v-7d +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 86400 \
  --statistics Average
```

**Solutions:**
- Target cache hit ratio > 80%
- Increase cache TTL for static assets
- Use `PriceClass_100` for cost savings

---

## Security Issues

### WAF Blocking Legitimate Requests

**Symptoms:**
- 403 Forbidden for valid requests
- "Request blocked by AWS WAF" error

**Diagnosis:**
```bash
# Check WAF logs (if enabled)
aws wafv2 get-sampled-requests \
  --web-acl-arn YOUR_WEB_ACL_ARN \
  --scope CLOUDFRONT \
  --rule-metric-name AWSManagedRulesCommonRuleSet \
  --time-window StartTime=$(date -u -v-1H +%Y-%m-%dT%H:%M:%SZ),EndTime=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --max-items 10
```

**Solutions:**
1. Add rules to exclude false positives
2. Adjust rate limiting thresholds
3. Whitelist specific IPs if needed

### Exposed API Keys

**If you accidentally exposed API keys:**

1. **Immediately rotate the keys:**
   - Claude: Generate new key at console.anthropic.com
   - OpenAI: Generate new key at platform.openai.com

2. **Update Secrets Manager:**
   ```bash
   aws secretsmanager update-secret \
     --secret-id ai-prompt-generator/production/api-keys \
     --secret-string '{"CLAUDE_API_KEY":"new-key","OPENAI_API_KEY":"new-key"}'
   ```

3. **Check for unauthorized usage** in API provider dashboard

---

## Getting Help

If you can't resolve an issue:

1. **Check CloudWatch Logs:**
   ```bash
   aws logs tail /aws/lambda/ai-prompt-generator-generate-production --since 1h
   ```

2. **Check CloudFormation Events:**
   ```bash
   aws cloudformation describe-stack-events --stack-name YOUR_STACK
   ```

3. **Enable Debug Logging:**
   Update Lambda environment variable `LOG_LEVEL=debug`

4. **Open a GitHub Issue** with:
   - Description of the problem
   - Steps to reproduce
   - Relevant log excerpts
   - Environment details

---

## Quick Reference Commands

```bash
# View Lambda logs
aws logs tail /aws/lambda/FUNCTION_NAME --follow

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"

# Check stack status
aws cloudformation describe-stacks --stack-name STACK_NAME

# List S3 bucket contents
aws s3 ls s3://BUCKET_NAME/

# Update Lambda environment
aws lambda update-function-configuration --function-name FUNC --environment "Variables={KEY=value}"

# Get secret value
aws secretsmanager get-secret-value --secret-id SECRET_NAME

# Check API Gateway logs
aws logs tail /aws/apigateway/API_NAME --follow
```
