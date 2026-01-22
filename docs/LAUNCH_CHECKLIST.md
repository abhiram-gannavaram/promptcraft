# PromtCraft Production Checklist

## Pre-Launch (Completed)

### Infrastructure ✅
- [x] S3 bucket for static hosting
- [x] CloudFront distribution
- [x] Lambda function deployed
- [x] API Gateway configured
- [x] DynamoDB tables created
- [x] Route 53 hosted zone
- [x] ACM certificate (pending www validation)
- [x] IAM roles configured
- [x] Budget alerts set up

### Code ✅
- [x] Prompt enhancement logic
- [x] Spelling correction dictionary
- [x] Request type detection
- [x] Rate limiting (20/min)
- [x] Error handling
- [x] CORS configuration

### Frontend ✅
- [x] Responsive design
- [x] Dark/light mode
- [x] Copy to clipboard
- [x] Loading states
- [x] Error messages
- [x] SEO meta tags
- [x] Open Graph tags
- [x] Structured data (JSON-LD)

### Testing ✅
- [x] Basic functionality
- [x] Spelling correction
- [x] Type detection (app, web, debug, etc.)
- [x] Empty prompt validation
- [x] CORS headers
- [x] Rate limiting
- [x] Tone options
- [x] Length options

---

## Launch Day Checklist

### Hour 0 - Final Verification
- [ ] SSL certificate ISSUED
- [ ] CloudFront custom domain added
- [ ] https://promtcraft.in loads correctly
- [ ] API endpoint working
- [ ] All tests passing

### Hour 1 - Search Engines
- [ ] Submit to Google Search Console
- [ ] Submit sitemap.xml
- [ ] Submit to Bing Webmaster Tools
- [ ] Verify robots.txt

### Hour 2 - Social Launch
- [ ] Post on Twitter/X
- [ ] Post on Reddit r/ChatGPT
- [ ] Post on Reddit r/SideProject
- [ ] Post on LinkedIn
- [ ] Post on Hacker News

### Hour 3-6 - Engagement
- [ ] Monitor for errors (CloudWatch)
- [ ] Respond to comments
- [ ] Fix any reported issues
- [ ] Celebrate first users! 🎉

---

## Post-Launch Monitoring

### Daily Checks
```bash
# Check prompt count
aws dynamodb scan --table-name ai-prompt-generator-prompts-production --select COUNT

# Check for errors
aws logs filter-log-events --log-group-name /aws/lambda/ai-prompt-generator-production --filter-pattern "ERROR" --start-time $(date -v-1d +%s000)

# Check CloudFront stats
aws cloudfront get-distribution --id E35H3XC092ZZDB --query 'Distribution.Status'
```

### Key Metrics to Watch
1. **Prompts/day** - Track growth
2. **Error rate** - Should be <1%
3. **Response time** - Should be <500ms
4. **Unique visitors** - Track via CloudFront logs

---

## Rollback Plan

### If Something Goes Wrong

1. **Frontend Issue:**
   ```bash
   # Revert to previous version
   aws s3 sync s3://ai-prompt-generator-production-362015461740-backup/ s3://ai-prompt-generator-production-362015461740/
   aws cloudfront create-invalidation --distribution-id E35H3XC092ZZDB --paths "/*"
   ```

2. **Lambda Issue:**
   ```bash
   # Rollback to previous version
   aws lambda update-function-code --function-name ai-prompt-generator-production --s3-bucket BACKUP_BUCKET --s3-key previous-lambda.zip
   ```

3. **Complete Outage:**
   - CloudFront URL still works: https://dahfd6citmphf.cloudfront.net
   - Use this as fallback while fixing custom domain

---

## Security Checklist

- [x] No API keys in frontend
- [x] No API keys in GitHub repo
- [x] HTTPS enforced
- [x] Rate limiting active
- [x] Input validation
- [x] Error messages don't expose internals
- [ ] Enable CloudWatch alarms for unusual activity

---

## Cost Monitoring

### Expected Monthly Cost: ~$2.50
| Service | Budget |
|---------|--------|
| S3 | $0.10 |
| DynamoDB | $1.00 |
| Lambda | $0.00 |
| API Gateway | $0.50 |
| CloudFront | $1.00 |
| Route 53 | $0.50 |

### Alert Thresholds
- 50% of $10 budget → Email alert
- 80% of $10 budget → Urgent email
- 100% → Stop services

---

## Emergency Contacts

- **AWS Support:** https://console.aws.amazon.com/support
- **CloudFront Status:** https://status.aws.amazon.com/
- **Domain (Hostinger):** https://www.hostinger.in/

---

## Success! 🎉

When all boxes are checked, you're live!

**Live URL:** https://promtcraft.in
**Backup URL:** https://dahfd6citmphf.cloudfront.net
