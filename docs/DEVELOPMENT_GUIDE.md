# PromtCraft Development Guide

## 🔄 How to Make Changes & Deploy

### Quick Change Workflow

```bash
# 1. Navigate to project
cd /Users/abhiramgannavaram/promot-project

# 2. Make your changes to files
# Edit frontend/index.html, frontend/js/app.js, lambda/index.js, etc.

# 3. Test locally (optional)
open frontend/index.html  # Opens in browser

# 4. Deploy to AWS
# For frontend changes:
aws s3 sync frontend/ s3://ai-prompt-generator-production-362015461740/ --delete

# For Lambda changes:
cd lambda && zip -r ../lambda.zip . && cd ..
aws lambda update-function-code --function-name ai-prompt-generator-production --zip-file fileb://lambda.zip

# 5. Clear CloudFront cache
aws cloudfront create-invalidation --distribution-id E35H3XC092ZZDB --paths "/*"

# 6. Commit and push to GitHub
git add .
git commit -m "Your commit message"
git push origin main
```

### File Locations

| What to Change | File Location |
|----------------|---------------|
| Website content (HTML) | `frontend/index.html` |
| Styles (CSS) | `frontend/css/styles.css` |
| Frontend JavaScript | `frontend/js/app.js` |
| Backend Lambda logic | `lambda/index.js` |
| Prompt enhancement rules | `lambda/index.js` (spellingCorrections, detectRequestType, etc.) |
| Terraform infrastructure | `terraform/main.tf` |
| GitHub Actions | `.github/workflows/deploy.yml` |

---

## 🚀 New Features You Can Add

### Easy (1-2 hours)

#### 1. Prompt History (Local Storage)
Save user's last 10 prompts in browser localStorage.

```javascript
// In frontend/js/app.js
function saveToHistory(original, enhanced) {
    const history = JSON.parse(localStorage.getItem('promptHistory') || '[]');
    history.unshift({ original, enhanced, date: new Date().toISOString() });
    localStorage.setItem('promptHistory', JSON.stringify(history.slice(0, 10)));
}

function getHistory() {
    return JSON.parse(localStorage.getItem('promptHistory') || '[]');
}
```

#### 2. Share Button
Add Twitter/LinkedIn share for the enhanced prompt.

```javascript
function shareToTwitter(text) {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text.slice(0, 200) + '...')}&url=https://promtcraft.in`;
    window.open(url, '_blank');
}
```

#### 3. Download as Text File
Let users download the enhanced prompt.

```javascript
function downloadPrompt(text) {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'enhanced-prompt.txt';
    a.click();
}
```

#### 4. Character Count for Output
Show how many tokens the enhanced prompt uses.

```javascript
// Rough token estimation (1 token ≈ 4 characters)
function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}
```

---

### Medium (3-5 hours)

#### 5. Prompt Templates Library
Pre-built templates users can select.

```javascript
const templates = {
    'code_review': 'Please review this code for: security issues, performance, best practices...',
    'blog_post': 'Write a blog post about [TOPIC] with introduction, 3 main points, and conclusion...',
    'email': 'Write a professional email to [RECIPIENT] about [SUBJECT]...',
    'debug': 'Help me debug this issue: [ERROR]. The expected behavior is [EXPECTED]...'
};
```

#### 6. Favorite Prompts
Let users star/bookmark prompts they like.

#### 7. Comparison Mode
Show original vs enhanced side-by-side with diff highlighting.

#### 8. Multiple Output Formats
Generate prompts optimized for:
- ChatGPT (conversational)
- Claude (analytical)
- Midjourney (image prompts)
- Stable Diffusion (art prompts)

---

### Advanced (1-2 days)

#### 9. Chrome Extension
Build a browser extension that enhances prompts anywhere.

```
chrome-extension/
├── manifest.json
├── popup.html
├── popup.js
├── content.js
└── background.js
```

#### 10. API Access
Provide a simple API for developers.

```bash
curl -X POST https://api.promtcraft.in/enhance \
  -H "Content-Type: application/json" \
  -d '{"prompt": "your prompt"}'
```

#### 11. User Accounts (Optional)
- Save prompt history in cloud
- Custom preferences
- Usage analytics

#### 12. AI-Powered Mode (Gemini)
When Gemini quota resets, use AI for enhanced results.

```javascript
// In lambda/index.js
async function enhanceWithAI(prompt) {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `Enhance this prompt: ${prompt}` }] }]
        })
    });
    return response.json();
}
```

#### 13. Multi-Language Support
Detect and enhance prompts in Hindi, Spanish, French, etc.

#### 14. Admin Dashboard
View analytics, popular prompts, usage stats.

---

## 📝 Example: Adding a New Feature

Let's add a **"Copy with Attribution"** button:

### Step 1: Update HTML (`frontend/index.html`)
```html
<button id="copy-with-attr-btn" class="btn btn-secondary">
    📎 Copy with Credit
</button>
```

### Step 2: Update JavaScript (`frontend/js/app.js`)
```javascript
document.getElementById('copy-with-attr-btn').addEventListener('click', () => {
    const output = document.getElementById('output-text').textContent;
    const withCredit = output + '\n\n---\nEnhanced with PromtCraft.in';
    navigator.clipboard.writeText(withCredit);
    alert('Copied with credit!');
});
```

### Step 3: Deploy
```bash
cd /Users/abhiramgannavaram/promot-project
aws s3 sync frontend/ s3://ai-prompt-generator-production-362015461740/
aws cloudfront create-invalidation --distribution-id E35H3XC092ZZDB --paths "/*"
```

### Step 4: Commit to Git
```bash
git add .
git commit -m "Add copy with attribution feature"
git push origin main
```

---

## 🔧 Adding New Prompt Types (Backend)

To add a new prompt type (e.g., "resume_writing"):

### Step 1: Update `lambda/index.js`

```javascript
// In detectRequestType function, add:
if (lowerPrompt.includes('resume') || lowerPrompt.includes('cv') || lowerPrompt.includes('job application')) {
    return 'resume_writing';
}

// Add new generator function:
function generateResumePrompt(correctedPrompt, tone, length) {
    return `## Resume/CV Writing Request

**Goal:** ${correctedPrompt}

---

### Please help me create:

**1. Professional Summary**
- 3-4 sentence overview
- Key achievements
- Career highlights

**2. Experience Section**
- Action verbs
- Quantified achievements
- Relevant keywords

**3. Skills Section**
- Technical skills
- Soft skills
- Industry-specific terms

**4. ATS Optimization**
- Keyword suggestions
- Format recommendations

**Target role and industry: [Specify if known]**`;
}

// In enhancePrompt switch statement, add:
case 'resume_writing':
    enhanced = generateResumePrompt(correctedPrompt, tone, length);
    break;
```

### Step 2: Deploy Lambda
```bash
cd lambda
zip -r ../lambda.zip .
cd ..
aws lambda update-function-code --function-name ai-prompt-generator-production --zip-file fileb://lambda.zip
rm lambda.zip
```

---

## 📊 Adding Analytics

### Google Analytics Events
```javascript
// Track prompt generation
gtag('event', 'generate_prompt', {
    'event_category': 'engagement',
    'event_label': requestType,
    'value': inputLength
});

// Track copy button
gtag('event', 'copy_prompt', {
    'event_category': 'engagement'
});
```

### Custom Analytics (DynamoDB)
Already tracking:
- Original prompt
- Enhanced prompt  
- Request type
- Timestamp
- Input/output length

Query with:
```bash
aws dynamodb scan --table-name ai-prompt-generator-prompts-production --limit 10
```

---

## 🐛 Debugging

### Check Lambda Logs
```bash
aws logs tail /aws/lambda/ai-prompt-generator-production --follow
```

### Check Recent Errors
```bash
aws logs filter-log-events \
  --log-group-name /aws/lambda/ai-prompt-generator-production \
  --filter-pattern "ERROR" \
  --start-time $(date -v-1h +%s000)
```

### Test API Locally
```bash
curl -X POST "https://njzzp0serg.execute-api.us-east-1.amazonaws.com/prod/generate-prompt" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test prompt"}'
```

---

## 🚀 GitHub Workflow

Once you set up GitHub:

1. **Create repo:** https://github.com/new → Name: `promtcraft`

2. **Push code:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/promtcraft.git
   git push -u origin main
   ```

3. **Add secrets** (Settings → Secrets → Actions):
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

4. **Auto-deploy on push:** Every push to `main` will:
   - Run tests
   - Deploy frontend to S3
   - Update Lambda
   - Invalidate CloudFront cache

---

## 📞 Quick Commands Reference

```bash
# Deploy frontend
aws s3 sync frontend/ s3://ai-prompt-generator-production-362015461740/

# Deploy Lambda
cd lambda && zip -r ../l.zip . && cd .. && aws lambda update-function-code --function-name ai-prompt-generator-production --zip-file fileb://l.zip && rm l.zip

# Clear cache
aws cloudfront create-invalidation --distribution-id E35H3XC092ZZDB --paths "/*"

# Check prompt count
aws dynamodb scan --table-name ai-prompt-generator-prompts-production --select COUNT

# View recent prompts
aws dynamodb scan --table-name ai-prompt-generator-prompts-production --limit 5

# Git commit and push
git add . && git commit -m "message" && git push
```
