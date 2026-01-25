# Chrome Extension Testing Checklist - PromptCraft

## ⚠️ COMPLETE BEFORE CHROME WEB STORE SUBMISSION

---

## 🎨 Step 1: Create Icons (REQUIRED)

**Status:** ⏳ NOT STARTED

### Action Required:
Create 3 PNG icon files and save in `/chrome-extension/icons/`:
- [ ] `icon16.png` (16x16 pixels)
- [ ] `icon48.png` (48x48 pixels)  
- [ ] `icon128.png` (128x128 pixels)

### Quick Method:
See **CREATE_ICONS.md** for detailed instructions.

**Fastest option:**
1. Ask ChatGPT: "Generate a Chrome extension icon, 512x512px, purple gradient (#667eea to #764ba2), white sparkle ✨, flat design"
2. Download image
3. Resize to 128x128, 48x48, 16x16 using Preview (Tools → Adjust Size)
4. Save in `/chrome-extension/icons/`

---

## 🧪 Step 2: Local Testing

**Status:** ⏳ NOT STARTED

### Install Extension Locally:
```bash
# 1. Open Chrome
# 2. Go to: chrome://extensions/
# 3. Enable "Developer mode" (top-right toggle)
# 4. Click "Load unpacked"
# 5. Select folder: /Users/abhiramgannavaram/promot-project/chrome-extension/
```

### Basic Functionality Tests:
- [ ] Extension loads without errors
- [ ] Extension icon appears in Chrome toolbar
- [ ] Click icon → popup opens correctly
- [ ] UI elements render properly (textarea, buttons, selectors)
- [ ] No console errors in popup (right-click popup → Inspect)

### Popup Interface Tests:
- [ ] Enter prompt text → "Enhance Prompt" button enables
- [ ] Empty prompt → Shows error "Please enter a prompt first"
- [ ] Very short prompt (< 3 chars) → Shows error "Prompt too short"
- [ ] Long prompt (> 2000 chars) → Shows error "Prompt too long"
- [ ] Valid prompt → Loading spinner shows
- [ ] API call succeeds → Enhanced prompt displays
- [ ] Enhanced prompt → Copy button works
- [ ] Copy button → Changes to "✅ Copied!" temporarily
- [ ] "New Prompt" button → Clears output and focuses input
- [ ] "Clear" button → Clears input field
- [ ] Tone selector → Saves selection (reopen popup, should persist)
- [ ] Length selector → Saves selection (reopen popup, should persist)

### Advanced Tests:
- [ ] Ctrl+Enter in textarea → Triggers enhance
- [ ] Stats display correctly (tokens, cost, processing time)
- [ ] Multiple enhancements → History saved (check chrome.storage)
- [ ] Close and reopen → Preferences persist

### Context Menu Tests:
- [ ] Visit any webpage (e.g., reddit.com)
- [ ] Select some text
- [ ] Right-click → "Enhance with PromptCraft" appears
- [ ] Click context menu → Notification "Enhancing your prompt..."
- [ ] Wait for API → Notification "Enhanced prompt copied to clipboard!"
- [ ] Paste (Cmd+V) → Enhanced prompt appears

### Keyboard Shortcut Tests:
- [ ] Select text on page
- [ ] Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
- [ ] Extension processes selected text

### Content Script Tests:
Test on multiple websites to ensure compatibility:
- [ ] Reddit (reddit.com)
- [ ] Twitter/X (twitter.com)
- [ ] Gmail (gmail.com)
- [ ] Google Docs (docs.google.com)
- [ ] GitHub (github.com)

### Error Handling Tests:
- [ ] Disconnect internet → Shows error "Failed to enhance prompt"
- [ ] Restore internet → Works again
- [ ] Very slow API (simulate) → Timeout after 30s with error message
- [ ] Invalid API response → Shows error gracefully

### Edge Cases:
- [ ] Special characters in prompt (emojis, unicode, symbols)
- [ ] Very long enhanced output (>5000 chars)
- [ ] Rapid clicking "Enhance" button (should not crash)
- [ ] Open multiple popup windows (should work independently)

### Chrome Extension Errors Check:
```bash
# Go to: chrome://extensions/
# Find PromptCraft extension
# Click "Errors" button (should show 0 errors)
# If errors exist, click "Clear all" and re-test
```

### Performance Tests:
- [ ] Popup opens quickly (< 1 second)
- [ ] API response time reasonable (< 5 seconds typical)
- [ ] No memory leaks (check Task Manager after multiple uses)
- [ ] Extension doesn't slow down browser

---

## 📸 Step 3: Create Screenshots

**Status:** ⏳ NOT STARTED

### Required Screenshots (1-5):
Create folder: `/chrome-extension/screenshots/`

1. **Main Popup (REQUIRED)**
   - [ ] Open extension popup
   - [ ] Show filled form (prompt + tone/length selections)
   - [ ] Press `Cmd+Shift+4` → Capture popup
   - [ ] Save as `screenshot-1-popup.png`

2. **Enhanced Result**
   - [ ] Show successful enhancement with stats
   - [ ] Capture full popup with output
   - [ ] Save as `screenshot-2-result.png`

3. **Context Menu**
   - [ ] Select text on webpage
   - [ ] Right-click to show context menu
   - [ ] Highlight "Enhance with PromptCraft" option
   - [ ] Capture
   - [ ] Save as `screenshot-3-context-menu.png`

4. **Before/After Example**
   - [ ] Create side-by-side comparison
   - [ ] Original prompt vs Enhanced prompt
   - [ ] Use Canva or PowerPoint to create
   - [ ] Save as `screenshot-4-comparison.png`

5. **Statistics Display**
   - [ ] Show metadata (tokens, cost, processing time)
   - [ ] Capture stats section
   - [ ] Save as `screenshot-5-stats.png`

### Screenshot Requirements:
- **Format:** PNG or JPG
- **Dimensions:** 1280x800 or 640x400 (recommended: 1280x800)
- **Quality:** Clear, readable text, no blur
- **Content:** Show actual UI, not mockups

---

## 📦 Step 4: Create ZIP Package

**Status:** ⏳ NOT STARTED

### Create Package:
```bash
cd /Users/abhiramgannavaram/promot-project/chrome-extension

# Verify icons exist
ls -la icons/
# Should show: icon16.png, icon48.png, icon128.png

# Create ZIP file
zip -r promptcraft-extension.zip . \
  -x "*.md" \
  -x ".DS_Store" \
  -x "screenshots/*" \
  -x "CREATE_ICONS.md" \
  -x "CHROME_STORE_GUIDE.md" \
  -x "TESTING_CHECKLIST.md"

# Verify ZIP contents
unzip -l promptcraft-extension.zip
```

### Expected ZIP Contents:
- [ ] manifest.json
- [ ] popup.html
- [ ] popup.js
- [ ] background.js
- [ ] content.js
- [ ] content.css
- [ ] icons/icon16.png
- [ ] icons/icon48.png
- [ ] icons/icon128.png

**ZIP should be < 5MB** (typically 50-200KB)

---

## 🌐 Step 5: API Production Test

**Status:** ⏳ NOT STARTED

### Test Live API Endpoint:
```bash
# Test API is responding
curl -X POST https://njzzp0serg.execute-api.us-east-1.amazonaws.com/prod/generate-prompt \
  -H "Content-Type: application/json" \
  -H "Origin: chrome-extension://test" \
  -d '{
    "prompt": "Test prompt for extension",
    "options": {
      "tone": "professional",
      "length": "balanced"
    }
  }'
```

### Expected Response:
```json
{
  "enhancedPrompt": "...",
  "metadata": {
    "tokens": { "input": 5, "output": 50 },
    "cost": 0.0004,
    "processingTime": "1.2s"
  }
}
```

### CORS Verification:
- [ ] API accepts requests from `chrome-extension://` origin
- [ ] No CORS errors in browser console
- [ ] API returns proper headers

**If CORS issues:** May need to update Lambda CORS headers to allow chrome-extension:// origin

---

## 📋 Step 6: Final Code Review

**Status:** ✅ COMPLETED

### Code Quality Checks:
- [x] No console.log in production code
- [x] All async functions have try-catch
- [x] API timeouts configured (30s)
- [x] Error messages user-friendly
- [x] No hardcoded secrets or credentials
- [x] Permissions justified in manifest
- [x] Modern APIs used (navigator.clipboard)
- [x] No deprecated APIs (document.execCommand as fallback only)

### Security Checks:
- [x] No eval() usage
- [x] No inline scripts in HTML
- [x] CSP compliant
- [x] No external script loading
- [x] Secure API endpoint (HTTPS)
- [x] No localStorage of sensitive data

---

## 🚀 Step 7: Chrome Web Store Submission

**Status:** ⏳ NOT READY

### Prerequisites:
- [ ] Icons created and tested
- [ ] Extension tested locally (all tests passing)
- [ ] Screenshots created (1-5 images)
- [ ] ZIP package created
- [ ] Developer account created ($5 fee)

### Submission Checklist:
See **CHROME_STORE_GUIDE.md** for complete step-by-step instructions.

Quick checklist:
- [ ] Go to: https://chrome.google.com/webstore/devconsole
- [ ] Upload promptcraft-extension.zip
- [ ] Fill store listing details
- [ ] Upload screenshots
- [ ] Set privacy policy URL: https://promtcraft.in/legal/privacy-policy.html
- [ ] Justify permissions
- [ ] Submit for review

---

## 📊 Known Issues (Fixed)

### ✅ Fixed Issues:
1. Missing notifications permission → ADDED to manifest.json
2. console.log in production → REMOVED from background.js
3. No API timeout → ADDED 30s timeout with AbortController
4. Missing error handling for chrome.tabs.sendMessage → ADDED
5. Deprecated document.execCommand → REPLACED with navigator.clipboard (with fallback)
6. Duplicate enhancePrompt function → REMOVED
7. Missing timeout error messages → ADDED

### ⚠️ Remaining Tasks:
1. **Icons:** Must be created before any testing
2. **CORS:** May need Lambda update if chrome-extension:// origin rejected
3. **Screenshots:** Need to be created after local testing

---

## 🎯 Definition of Done

Extension is ready for Chrome Web Store when:
- [x] All code bugs fixed
- [ ] Icons created (3 sizes)
- [ ] Local testing completed (all items checked)
- [ ] No console errors
- [ ] Screenshots created (1-5 images)
- [ ] ZIP package created
- [ ] API endpoint tested and working
- [ ] Privacy policy accessible
- [ ] Developer account created
- [ ] Store listing prepared

**Estimated Time Remaining:** 2-3 hours

---

## 📞 Support

If any issues during testing:
- Check console: Right-click → Inspect → Console tab
- Check extension errors: chrome://extensions/ → Errors button
- Test API separately: Use curl command above
- Review code: All files in /chrome-extension/

Contact: abhiramgannavaram@gmail.com

---

## 🎉 Next Steps After Approval

1. Add "Available on Chrome Web Store" badge to promtcraft.in
2. Post on Reddit (r/chrome_extensions, r/ChatGPT)
3. Submit to AI directories
4. Tweet announcement
5. Monitor reviews and respond
6. Track installation metrics
7. Plan feature updates

**See PROMOTION_GUIDE.md for marketing strategy**

---

Last Updated: 2025-01-27
Status: Ready for icon creation and testing
