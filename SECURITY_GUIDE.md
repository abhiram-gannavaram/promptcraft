# 🔒 Security & Cost Protection Guide

## ✅ **Current Security Status**

### Protected ✅
- ✅ **Rate Limiting**: 10 requests per minute per IP (in Lambda code)
- ✅ **Input Validation**: 10,000 character limit enforced
- ✅ **CORS**: Restricted to specific origins
- ✅ **HTTPS**: CloudFront enforces SSL
- ✅ **DDoS Protection**: CloudFront built-in protection

### Needs Attention ⚠️
- ⚠️ **API Gateway Throttling**: Not configured (should add backup)
- ⚠️ **Cost Monitoring**: No billing alerts set
- ⚠️ **DynamoDB Limits**: Could be exploited
- ⚠️ **Error Messages**: May leak system info

---

## 💰 **AWS Cost Protection (DO THIS NOW)**

### 1. **Set Up Billing Alerts** (5 minutes)

**Step 1: Enable Billing Alerts**
```bash
# Go to AWS Console
# Navigate to: Billing Dashboard → Billing Preferences
# Enable: ☑ Receive Billing Alerts
# Enable: ☑ Receive Free Tier Usage Alerts
```

**Step 2: Create Budget Alerts**
```bash
# Go to: https://console.aws.amazon.com/billing/home#/budgets/create
```

Create these 3 budgets:

#### Budget 1: Early Warning ($5/month)
- Type: Cost Budget
- Amount: $5
- Alert at: 80% ($4), 100% ($5)
- Email: your-email@example.com

#### Budget 2: Critical Alert ($20/month)
- Type: Cost Budget
- Amount: $20
- Alert at: 50% ($10), 100% ($20)
- Email: your-email@example.com

#### Budget 3: Emergency Stop ($50/month)
- Type: Cost Budget
- Amount: $50
- Alert at: 100% ($50)
- Email: your-email@example.com
- **Action**: Notify + investigate immediately

### 2. **Lambda Cost Protection**

**Current Protection**: ✅ Rate limiting (10 req/min per IP)

**Add Reserved Concurrency** (prevents runaway costs):
```bash
aws lambda put-function-concurrency \
  --function-name ai-prompt-generator-production \
  --reserved-concurrent-executions 10
```

This limits Lambda to max 10 simultaneous executions = max ~$0.20/month even if attacked.

### 3. **API Gateway Throttling** (Backup Layer)

**Add usage plan**:
```bash
# Go to: API Gateway → Your API → Usage Plans → Create
# Throttle: 1000 requests/second (burst: 2000)
# Quota: 1,000,000 requests/month
```

### 4. **CloudFront Cost Protection**

**Current**: ✅ Already protected (1TB free tier)

**If costs spike, add:**
```bash
# Go to: CloudFront → Distributions → Your distribution
# Geo Restriction → Whitelist countries (US, UK, India, etc.)
```

---

## 🛡️ **Security Hardening**

### **A. Input Validation** ✅ DONE

Current protection in Lambda:
```javascript
// Already implemented ✅
- Max 10,000 characters
- Min 1 character
- Spell check sanitization
```

### **B. Rate Limiting** ✅ DONE

Current implementation:
```javascript
// checkRateLimit() function ✅
- 10 requests per minute per IP
- Uses DynamoDB for tracking
- Blocks abusers
```

**Test it works**:
```bash
# Run this to test rate limiting
for i in {1..15}; do 
  curl -X POST https://njzzp0serg.execute-api.us-east-1.amazonaws.com/prod/generate-prompt \
    -H "Content-Type: application/json" \
    -d '{"prompt":"test"}' &
done
# Should see "Rate limit exceeded" after 10 requests
```

### **C. DDoS Protection** ✅ DONE

**CloudFront provides**:
- AWS Shield Standard (FREE)
- Rate-based rules
- Geographic blocking

**Optional Upgrade** (if you get attacked):
- AWS Shield Advanced: $3,000/month (NOT needed now)
- AWS WAF: $5-20/month (add if traffic spikes)

### **D. API Security**

**Add API Key** (optional, but recommended if costs spike):

```javascript
// Add to lambda/index.js
const API_KEY = process.env.API_KEY;

exports.handler = async (event) => {
    const providedKey = event.headers['x-api-key'];
    
    if (providedKey !== API_KEY) {
        return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Invalid API key' })
        };
    }
    
    // ... rest of code
};
```

Then update frontend to include key in requests.

### **E. Error Handling** ⚠️ Needs Improvement

**Current risk**: Errors may leak system info

**Fix**: Sanitize error messages
```javascript
// Instead of:
return { error: err.message }; // ❌ Leaks internal errors

// Use:
return { error: 'An error occurred. Please try again.' }; // ✅ Generic
console.error('Internal error:', err); // Log for debugging
```

---

## 🚨 **Attack Scenarios & Protection**

### **Scenario 1: Spam Bot Attack**
**Attack**: Bot sends 1,000,000 requests in 1 hour

**Protection**:
- ✅ Rate limiting blocks after 10/min = 600/hour per IP
- ✅ Lambda reserved concurrency = max 10 simultaneous
- ✅ Bot would need 1,666 IPs to bypass

**Worst case cost**: $0.20 (limited by concurrency)

---

### **Scenario 2: Large Prompt Spam**
**Attack**: Someone sends 10,000 character prompts repeatedly

**Protection**:
- ✅ Input validation limits to 10,000 chars
- ✅ Rate limiting = max 10/min
- ✅ Lambda timeout = 30 seconds max

**Worst case cost**: ~$0.001 per request × 600/hour = $0.60/hour
- With reserved concurrency: Max $0.20/month

---

### **Scenario 3: DDoS Attack**
**Attack**: Botnet with 10,000 IPs attacking simultaneously

**Protection**:
- ✅ CloudFront absorbs the traffic
- ✅ Lambda reserved concurrency = max 10 executions
- ✅ API Gateway throttling (if configured)

**Worst case cost**: 
- CloudFront: FREE (under DDoS protection)
- Lambda: $0.20 (concurrency limited)

**Total**: ~$0.20

---

### **Scenario 4: Malicious Prompts**
**Attack**: Someone tries SQL injection, XSS, prompt injection

**Protection**:
- ✅ Lambda doesn't execute code from prompts
- ✅ Frontend escapes HTML output
- ✅ No database queries from user input
- ⚠️ Prompt injection possible (but harmless - just generates text)

**Risk**: LOW (no sensitive data, no code execution)

---

## 📊 **Monitoring Setup**

### **1. CloudWatch Alarms**

Create these alarms:

**Lambda Invocations Alarm**:
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "lambda-high-invocations" \
  --alarm-description "Alert if Lambda invocations exceed 100,000/day" \
  --metric-name Invocations \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 86400 \
  --threshold 100000 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=FunctionName,Value=ai-prompt-generator-production
```

**Lambda Errors Alarm**:
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "lambda-high-errors" \
  --alarm-description "Alert if Lambda errors exceed 100/hour" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 3600 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=FunctionName,Value=ai-prompt-generator-production
```

### **2. Daily Cost Check**

Add this to your routine:
```bash
# Check yesterday's costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -u -v-1d +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost \
  --query 'ResultsByTime[*].[TimePeriod.Start,Total.BlendedCost.Amount]' \
  --output table
```

Or use AWS Console: https://console.aws.amazon.com/cost-management/home#/dashboard

### **3. Logs Monitoring**

Check CloudWatch Logs weekly:
```bash
# View recent Lambda logs
aws logs tail /aws/lambda/ai-prompt-generator-production --follow
```

Look for:
- Unusual error spikes
- Repeated rate limit blocks from same IP
- Suspicious prompts (SQL injection attempts, etc.)

---

## 🔐 **Data Privacy & Compliance**

### **What Data You Collect**:
- ✅ User prompts (stored in DynamoDB)
- ✅ IP addresses (for rate limiting)
- ✅ Timestamps
- ✅ User agent (from requests)

### **Privacy Compliance**:

**GDPR/CCPA Requirements**:
1. ✅ Privacy policy exists ([privacy-policy.html](frontend/legal/privacy-policy.html))
2. ⚠️ **Missing**: Data deletion mechanism
3. ⚠️ **Missing**: Data export mechanism

**Add to Lambda** (data deletion endpoint):
```javascript
// Add DELETE endpoint to delete user data
if (event.httpMethod === 'DELETE' && event.path === '/user-data') {
    const ip = event.requestContext.identity.sourceIp;
    
    // Delete all records for this IP
    await docClient.send(new DeleteCommand({
        TableName: PROMPTS_TABLE,
        Key: { ip }
    }));
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Data deleted' })
    };
}
```

### **Data Retention**:

**Current**: Prompts stored forever ⚠️

**Recommended**: Auto-delete after 30 days

Add to DynamoDB table:
```bash
# Enable TTL on DynamoDB table
aws dynamodb update-time-to-live \
  --table-name promtcraft-production-prompts \
  --time-to-live-specification Enabled=true,AttributeName=expiresAt
```

Then in Lambda, add expiration:
```javascript
const expiresAt = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days

await docClient.send(new PutCommand({
    TableName: PROMPTS_TABLE,
    Item: { ...item, expiresAt }
}));
```

---

## ✅ **Security Checklist**

### **Immediate Actions** (Do Today):
- [ ] Set up AWS billing alerts ($5, $20, $50)
- [ ] Test rate limiting works
- [ ] Set Lambda reserved concurrency to 10
- [ ] Enable CloudWatch alarms

### **This Week**:
- [ ] Add API Gateway usage plan
- [ ] Enable DynamoDB TTL (30 day retention)
- [ ] Add data deletion endpoint
- [ ] Review CloudWatch logs

### **Monthly**:
- [ ] Check AWS costs (should be $0-5)
- [ ] Review rate limit blocks
- [ ] Check for unusual traffic patterns
- [ ] Update dependencies

---

## 📈 **Cost Projections**

### **Current Usage (Estimated)**:
- Visitors: ~0/day (just launched)
- Lambda invocations: ~0/day
- **Cost: $0/month**

### **If You Go Viral** (100,000 visitors/month):
- Lambda: 100K invocations × $0.20/1M = **$0.02**
- S3: Minimal = **$0.01**
- CloudFront: 100GB transfer = **FREE** (under 1TB)
- DynamoDB: Minimal = **$0.01**
- **Total: ~$0.04/month** ✅

### **Very High Traffic** (1 million visitors/month):
- Lambda: 1M invocations = **$0.20**
- CloudFront: 1TB transfer = **FREE**
- S3: **$0.05**
- DynamoDB: **$0.10**
- **Total: ~$0.35/month** ✅ Still cheap!

### **Extreme Viral** (10 million visitors/month):
- Lambda: 10M invocations = **$2.00**
- CloudFront: 10TB transfer = **$765** ⚠️ (biggest cost!)
- S3: **$0.50**
- DynamoDB: **$1.00**
- **Total: ~$768/month**

**At this scale**: You'd be making money from ads/sponsorships to cover costs!

---

## 🚀 **When to Scale**

**Scale triggers**:
- Cost > $50/month → Add CloudFront caching optimization
- Traffic > 1M/month → Consider upgrading Lambda memory
- Errors > 1%/day → Investigate and fix
- Rate limiting blocks > 100/day → Possible attack, investigate

---

## 📞 **Emergency Response Plan**

### **If Costs Spike Above $50**:

1. **Immediately**:
   ```bash
   # Disable Lambda function
   aws lambda put-function-concurrency \
     --function-name ai-prompt-generator-production \
     --reserved-concurrent-executions 0
   ```

2. **Investigate**:
   - Check CloudWatch logs for unusual patterns
   - Check which service is costing money
   - Look for IP addresses with excessive requests

3. **Fix**:
   - Lower rate limits
   - Add geographic restrictions
   - Enable AWS WAF if under attack
   - Contact AWS support (they often waive DDoS costs)

4. **Re-enable**:
   ```bash
   # After fixing, re-enable with lower limits
   aws lambda put-function-concurrency \
     --function-name ai-prompt-generator-production \
     --reserved-concurrent-executions 5
   ```

---

## 🎯 **Summary**

### **Current Risk Level**: 🟢 **LOW**

**You're well protected because**:
- ✅ Rate limiting active
- ✅ Input validation working
- ✅ CloudFront DDoS protection
- ✅ AWS Free Tier covers normal traffic
- ✅ No sensitive data stored
- ✅ No code execution from user input

### **Main Risks**:
1. ⚠️ Viral traffic → CloudFront costs (but good problem to have!)
2. ⚠️ No cost alerts → could miss spike
3. ⚠️ Unlimited Lambda concurrency → could cost $$$

### **Priority Fixes** (in order):
1. **Set up billing alerts** (5 min) 🔴 CRITICAL
2. **Set Lambda concurrency to 10** (2 min) 🔴 CRITICAL  
3. Test rate limiting (5 min) 🟡 IMPORTANT
4. Enable DynamoDB TTL (5 min) 🟢 NICE TO HAVE

---

**Total time to secure everything: ~20 minutes**

**Expected monthly cost: $0-5** (unless you get 1M+ visitors, which would be amazing!) 🚀

---

Need help setting any of this up? Let me know!
