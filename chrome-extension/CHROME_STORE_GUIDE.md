# Chrome Web Store Publishing Guide - PromptCraft Extension

## ✅ Pre-Launch Checklist

### Code Status
- [x] All bugs fixed (notifications permission, timeouts, error handling)
- [x] Console.log statements removed
- [x] API timeout configured (30 seconds)
- [x] Deprecated APIs replaced (navigator.clipboard preferred)
- [x] Error handling for all async operations
- [ ] Icons created (16x16, 48x48, 128x128)
- [ ] Local testing completed
- [ ] Production API tested

### Required Assets
- [ ] Extension icons (3 sizes)
- [ ] Promotional images for store listing
- [ ] Screenshots (minimum 1, recommended 5)
- [ ] Privacy policy URL: https://promtcraft.in/legal/privacy-policy.html

---

## Step 1: Create Extension Icons

**IMPORTANT:** You must create icon files before proceeding.

See **CREATE_ICONS.md** for detailed instructions.

Quick option:
1. Use ChatGPT/DALL-E to generate a 512x512 purple gradient icon
2. Resize to 128x128, 48x48, 16x16 using Preview or online tool
3. Save as `icon128.png`, `icon48.png`, `icon16.png` in `/chrome-extension/icons/`

---

## Step 2: Local Testing (CRITICAL)

Before publishing, test the extension thoroughly:

### Install Locally:
```bash
# Open Chrome
chrome://extensions/

# Enable Developer Mode (top right toggle)

# Click "Load unpacked"

# Select folder:
/Users/abhiramgannavaram/promot-project/chrome-extension/

# Verify extension loads without errors
```

### Test Checklist:
- [ ] Extension icon appears in Chrome toolbar
- [ ] Click extension icon → popup opens
- [ ] Enter test prompt → "Enhance Prompt" works
- [ ] Enhanced prompt displays with stats
- [ ] Copy button works
- [ ] Right-click on selected text → "Enhance with PromptCraft" appears
- [ ] Context menu enhancement works
- [ ] Keyboard shortcut `Ctrl+Shift+P` works
- [ ] Test on multiple websites (Reddit, Gmail, Twitter)
- [ ] Check for console errors (F12 → Console)
- [ ] Test with long prompts (2000 characters)
- [ ] Test with very short prompts (< 3 characters, should show error)
- [ ] Test timeout (if API slow, should show timeout message)

### Fix Any Issues Found
If errors occur:
1. Check console logs (chrome://extensions → Extension → Errors)
2. Fix issues in code
3. Click "Reload" button in chrome://extensions
4. Re-test

---

## Step 3: Create Chrome Web Store Developer Account

### Register:
1. Go to: https://chrome.google.com/webstore/devconsole
2. Sign in with Google account
3. Pay **$5 one-time registration fee**
4. Accept Developer Agreement
5. Complete profile information

**Account Email:** Use abhiramgannavaram@gmail.com or dedicated email

---

## Step 4: Prepare Extension Package

### Create ZIP file:
```bash
cd /Users/abhiramgannavaram/promot-project/chrome-extension

# Verify all files present
ls -la

# Create ZIP (exclude unnecessary files)
zip -r promptcraft-extension.zip . \
  -x "*.md" \
  -x ".DS_Store" \
  -x "CREATE_ICONS.md"

# Verify ZIP contents
unzip -l promptcraft-extension.zip
```

**ZIP should contain:**
- manifest.json
- popup.html
- popup.js
- background.js
- content.js
- content.css
- icons/icon16.png
- icons/icon48.png
- icons/icon128.png

---

## Step 5: Create Store Listing Assets

### Required Screenshots (PNG/JPG):
1. **Main popup interface** (show input field, tone/length options)
2. **Enhanced prompt result** (show before/after example)
3. **Right-click context menu** (show "Enhance with PromptCraft")
4. **Keyboard shortcut in action**
5. **Statistics display** (tokens, cost, processing time)

**Screenshot Requirements:**
- **Dimensions:** 1280x800 or 640x400
- **Format:** PNG or JPG
- **Minimum:** 1 screenshot
- **Maximum:** 5 screenshots
- **Show actual UI:** Use real extension screenshots

**How to Take Screenshots:**
```bash
# Load extension in Chrome
# Press Cmd+Shift+4 (macOS) to take screenshot
# Crop to 1280x800 or use full window
# Save in /chrome-extension/screenshots/
```

### Promotional Images (Optional but Recommended):
- **Small tile:** 440x280 pixels
- **Large tile:** 920x680 pixels
- **Marquee:** 1400x560 pixels

These appear in featured sections. Create with Canva:
- Purple gradient background
- "PromptCraft" text
- "AI Prompt Enhancement for Chrome" tagline
- Sparkle icon

---

## Step 6: Upload to Chrome Web Store

### Navigate to Developer Dashboard:
https://chrome.google.com/webstore/devconsole

### Click "New Item":
1. Click **"New Item"** button
2. Upload **promptcraft-extension.zip**
3. Wait for upload (may take 1-2 minutes)

### Fill Store Listing:

#### Primary Details:
- **Extension Name:** PromptCraft - AI Prompt Enhancement
- **Summary (132 chars max):** 
  ```
  Instantly enhance your AI prompts with Claude 3 Haiku. Right-click any text to transform it into optimized, detailed prompts.
  ```

#### Description:
```
🚀 Transform Your AI Prompts Instantly

PromptCraft is a Chrome extension that enhances your AI prompts using Claude 3 Haiku, making them more detailed, effective, and optimized for better AI responses.

✨ KEY FEATURES:
• One-click prompt enhancement from any webpage
• Right-click context menu on selected text
• Keyboard shortcuts (Ctrl+Shift+P)
• Customizable tone (Professional, Casual, Creative, Academic, Technical)
• Adjustable length (Concise, Balanced, Detailed)
• Real-time token usage and cost tracking
• Prompt history saved locally

🎯 HOW IT WORKS:
1. Select any text or type in the popup
2. Choose tone and length preferences
3. Click "Enhance Prompt"
4. Get AI-optimized prompt with metadata

💡 USE CASES:
• Improve ChatGPT prompts
• Create better AI art prompts (Midjourney, DALL-E)
• Optimize prompts for Claude, Gemini, GPT-4
• Enhance content generation prompts
• Refine creative writing prompts

🔒 PRIVACY:
• No data stored on servers
• History saved locally in your browser
• Secure AWS API connection
• See full privacy policy: https://promtcraft.in/legal/privacy-policy.html

📊 USAGE STATS:
Track your enhancement history, token usage, and costs directly in the extension.

💰 PRICING:
Free to use with pay-per-request model. Typical cost: $0.0004 per prompt enhancement.

🌐 WEBSITE: https://promtcraft.in

Need help? Contact: support@promtcraft.in
```

#### Category:
- **Primary:** Productivity
- **Secondary:** AI Tools (if available, otherwise "Developer Tools")

#### Language:
- English (United States)

#### Icon:
- Upload **icon128.png** (will be auto-selected from ZIP)

#### Screenshots:
- Upload 1-5 screenshots (drag to reorder)
- First screenshot is most important (shown in search results)

#### Promotional Tiles:
- Upload small tile (440x280) - optional
- Upload large tile (920x680) - optional

### Privacy Practices:

#### Data Collection:
- **Select:** "This item does not collect user data"
- If prompted, specify:
  - **Personal data:** None
  - **Authentication:** None
  - **Website content:** Text you choose to enhance (not stored)

#### Privacy Policy URL:
```
https://promtcraft.in/legal/privacy-policy.html
```

#### Single Purpose Description:
```
This extension enhances AI prompts by sending user text to Claude 3 Haiku for optimization and improvement.
```

#### Permissions Justification:
- **storage:** Save user preferences and prompt history locally
- **activeTab:** Access selected text on active page
- **contextMenus:** Add right-click menu option
- **notifications:** Show enhancement status notifications

---

## Step 7: Distribution Settings

### Visibility:
- **Public** (recommended)
- Or **Unlisted** if you want direct link only

### Regions:
- **All regions** (recommended)
- Or select specific countries

### Pricing:
- **Free**

---

## Step 8: Submit for Review

### Before Submitting:
- [ ] All required fields completed
- [ ] At least 1 screenshot uploaded
- [ ] Privacy policy URL provided
- [ ] Extension tested locally without errors
- [ ] Icons display correctly

### Submit:
1. Click **"Submit for Review"** button
2. Confirm submission
3. Wait for review email

### Review Timeline:
- **Typical:** 1-3 business days
- **Complex cases:** Up to 1 week
- **Re-submissions:** 1-2 days

### Review Status:
Check at: https://chrome.google.com/webstore/devconsole

**Possible Outcomes:**
- ✅ **Approved** → Extension goes live automatically
- ⚠️ **Needs Changes** → Fix issues and resubmit
- ❌ **Rejected** → Address violations and resubmit

---

## Step 9: Post-Approval Actions

### Once Approved:

#### 1. Get Store Link:
```
https://chrome.google.com/webstore/detail/[extension-id]
```
Example: `https://chrome.google.com/webstore/detail/abc123xyz456`

#### 2. Add to Website:
Update **promtcraft.in** homepage:
```html
<a href="https://chrome.google.com/webstore/detail/[extension-id]" target="_blank">
  <img src="https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/iNEddTyWiMfLSwFD6qGq.png" 
       alt="Get PromptCraft on Chrome Web Store">
</a>
```

#### 3. Promote Extension:
- Post on Reddit: r/chrome_extensions, r/ChatGPT, r/productivity
- Submit to AI directories (see PROMOTION_GUIDE.md)
- Tweet announcement
- Product Hunt launch
- Post on LinkedIn

#### 4. Monitor Reviews:
- Respond to user feedback
- Fix reported bugs quickly
- Update extension as needed

---

## Step 10: Updates and Maintenance

### Updating Extension:
```bash
# Make code changes
# Update version in manifest.json
"version": "1.0.1"

# Create new ZIP
cd /Users/abhiramgannavaram/promot-project/chrome-extension
zip -r promptcraft-extension-v1.0.1.zip . -x "*.md" -x ".DS_Store"

# Upload to Chrome Web Store:
# Developer Dashboard → Your Item → Package → Upload New Package
# Fill "What's New" field with changelog
# Submit for review
```

**Update Review:** Usually faster (1-2 days)

---

## Common Rejection Reasons

### ❌ Issues to Avoid:

1. **Missing Privacy Policy**
   - Solution: Ensure https://promtcraft.in/legal/privacy-policy.html is accessible

2. **Unclear Permissions**
   - Solution: Already provided justification in manifest

3. **Low-Quality Screenshots**
   - Solution: Use 1280x800, show actual UI, clear text

4. **Misleading Description**
   - Solution: Accurate description, no false claims

5. **Icon Issues**
   - Solution: All 3 icon sizes must be present and clear

6. **Keyword Stuffing**
   - Solution: Natural language in description

7. **Non-Functional Extension**
   - Solution: Test thoroughly before submission

---

## Troubleshooting

### Extension Won't Load:
```bash
# Check manifest syntax
cat manifest.json | python -m json.tool

# Check file permissions
chmod 644 *.js *.html *.css manifest.json
chmod 755 icons/*.png
```

### API Not Working:
```bash
# Test API endpoint
curl -X POST https://njzzp0serg.execute-api.us-east-1.amazonaws.com/prod/generate-prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","options":{"tone":"professional","length":"balanced"}}'
```

### Icons Not Showing:
```bash
# Verify icon files exist
ls -lh icons/

# Check file sizes (should be reasonable, < 100KB each)
du -h icons/*

# Re-create icons if corrupted
```

---

## Support Resources

### Chrome Web Store Help:
- Developer Policies: https://developer.chrome.com/docs/webstore/program-policies/
- Review Guidelines: https://developer.chrome.com/docs/webstore/review-process/
- Best Practices: https://developer.chrome.com/docs/webstore/best-practices/

### Extension Documentation:
- Manifest V3: https://developer.chrome.com/docs/extensions/mv3/
- API Reference: https://developer.chrome.com/docs/extensions/reference/

### Contact Support:
- Email: support@promtcraft.in
- Chrome Web Store Support: Through developer dashboard

---

## Success Metrics

### Track After Launch:
- **Installations:** Check Developer Dashboard
- **Active Users:** Daily/Weekly active users
- **Reviews:** Star ratings and feedback
- **Crash Rate:** Monitor errors in dashboard
- **Update Adoption:** How many users update

### Analytics:
- Add Google Analytics to track usage (optional)
- Monitor API requests in AWS CloudWatch
- Track costs in AWS Cost Explorer

---

## Next Steps

1. ✅ Fix all code bugs (DONE)
2. ⏳ Create icons (USE CREATE_ICONS.md)
3. ⏳ Test extension locally
4. ⏳ Take 5 screenshots
5. ⏳ Create developer account ($5)
6. ⏳ Upload and submit
7. ⏳ Wait for approval (1-3 days)
8. ⏳ Promote extension

**Estimated Time to Launch:** 2-3 hours (excluding review time)

---

## Questions?

Contact: abhiramgannavaram@gmail.com
Website: https://promtcraft.in
