# Changelog

## [2.0.0] - 2026-01-25

### ✅ Major Updates

#### Branding & Domain
- **Changed copyright** from "PromptCraft AI" to "promtcraft.in" across all pages
- **Updated footer** on all pages to use domain name
- **Updated meta tags** to reflect promtcraft.in branding

#### GitHub Link Removal
- ✅ Removed all GitHub links from website footer
- ✅ Removed GitHub links from contact page
- ✅ Removed GitHub links from privacy policy
- ✅ Removed GitHub links from terms of service
- ✅ Removed GitHub links from cookies policy
- ✅ Removed GitHub from structured data (JSON-LD)
- ✅ Replaced GitHub contact with email addresses:
  - support@promtcraft.in
  - bugs@promtcraft.in
  - feedback@promtcraft.in
  - privacy@promtcraft.in
  - legal@promtcraft.in

#### AWS Lambda Runtime Upgrade
- **Upgraded from Node.js 20.x to Node.js 22.x** ✅
  - Reason: AWS ending support for Node.js 20.x on April 30, 2026
  - New runtime: `nodejs22.x` (latest available)
  - Lambda function: `ai-prompt-generator-production`
  - Status: Active and tested
  - Performance: No degradation, fully compatible

#### Code Quality Improvements
- **Removed debug console.log** statements from production code
  - Removed from API response handler
  - Removed from loading state function
  - Removed from initialization function
- **Kept error logging** (console.error, console.warn) for debugging

### 📦 Deployment Status

#### Frontend
- ✅ Deployed to S3: `ai-prompt-generator-production-362015461740`
- ✅ CloudFront cache invalidated
- ✅ Live at: https://promtcraft.in

#### Backend
- ✅ Lambda runtime updated to Node.js 22.x
- ✅ Function tested and working
- ✅ AWS Bedrock integration intact

### 🧪 Testing

All systems tested and verified:
- ✅ Lambda function executing on Node.js 22.x
- ✅ AWS Bedrock API calls working
- ✅ Frontend deployed successfully
- ✅ No errors in logs
- ✅ API responding correctly

### 📝 Files Modified

1. `frontend/index.html` - Copyright, footer, meta tags, removed GitHub
2. `frontend/contact.html` - Contact methods, footer, removed GitHub sections
3. `frontend/legal/privacy-policy.html` - Contact info, copyright
4. `frontend/legal/terms-of-service.html` - Contact info, copyright
5. `frontend/legal/cookies-policy.html` - Contact info, copyright
6. `frontend/js/app.js` - Removed debug console.log statements
7. Lambda configuration - Runtime updated to nodejs22.x

### 🔒 Security

No security issues introduced:
- All email addresses are public-facing contact addresses
- No credentials exposed
- GitHub links removed as requested
- Runtime upgrade addresses AWS security recommendations

### 📊 Impact

- **User Experience**: No changes, site works exactly the same
- **Performance**: No degradation with Node.js 22.x
- **Maintenance**: Compliant with AWS runtime support timeline
- **Branding**: Consistent use of promtcraft.in domain

### 🚀 Next Steps

Recommended actions:
1. ✅ Monitor Lambda logs for any issues with Node.js 22.x
2. ✅ Verify email addresses are monitored
3. Set up email forwarding if needed
4. Consider AWS SES for handling contact emails

---

## Previous Versions

See git history for previous changes:
- v1.0.0 - Initial release with template-based prompts
- v1.5.0 - AWS Bedrock integration with Claude AI
- v1.8.0 - SEO optimizations and marketing guides
