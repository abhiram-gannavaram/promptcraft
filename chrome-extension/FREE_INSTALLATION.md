# 🎉 FREE Chrome Extension Installation Guide

## PromptCraft - 100% Free, No Store Required!

Since PromptCraft is **completely free**, we're distributing it directly without Chrome Web Store fees. This means you can install it immediately without waiting for store approval.

---

## 📥 Installation Steps (2 Minutes)

### Step 1: Download Extension

**Option A: GitHub Download**
1. Go to: https://github.com/abhiram-gannavaram/promptcraft
2. Click green **"Code"** button
3. Select **"Download ZIP"**
4. Unzip the downloaded file
5. Navigate to the `chrome-extension` folder

**Option B: Git Clone**
```bash
git clone https://github.com/abhiram-gannavaram/promptcraft.git
cd promptcraft/chrome-extension
```

---

### Step 2: Install in Chrome

1. **Open Chrome Extensions**
   ```
   chrome://extensions/
   ```
   Or: Menu (⋮) → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle the switch in **top-right corner**
   - Should turn blue/green

3. **Load Extension**
   - Click **"Load unpacked"** button (top-left)
   - Select the `chrome-extension` folder from Step 1
   - Click **"Select Folder"**

4. **Done!** 🎉
   - Extension icon appears in toolbar
   - You may need to pin it (puzzle icon → pin)

---

## ✅ Verify Installation

### Quick Test:
1. Click PromptCraft icon in toolbar
2. Type: "Write a blog post"
3. Click "Enhance Prompt"
4. Should see enhanced result with stats

### If Extension Icon Not Visible:
- Click puzzle icon (🧩) in Chrome toolbar
- Find "PromptCraft"
- Click pin icon to keep it visible

---

## 🚀 How to Use

### Method 1: Click Icon
- Click PromptCraft toolbar icon
- Enter your prompt
- Select tone and length
- Click "Enhance Prompt"

### Method 2: Right-Click
- Select any text on any webpage
- Right-click → "Enhance with PromptCraft"
- Enhanced prompt copied to clipboard

### Method 3: Keyboard Shortcut
- Select text
- Press `Ctrl+Shift+P` (Windows/Linux)
- Or `Cmd+Shift+P` (Mac)

---

## 🔄 Updating the Extension

When we release updates:

1. Download latest version (same as Step 1)
2. Go to `chrome://extensions/`
3. Find PromptCraft
4. Click **"Remove"**
5. Click **"Load unpacked"** again
6. Select new folder

Or just click the **"Reload"** button (🔄) in chrome://extensions/

---

## ❓ Troubleshooting

### Extension Won't Load
**Error:** "Manifest file is missing or unreadable"
- Make sure you selected the `chrome-extension` folder, not the parent folder
- Folder should contain `manifest.json` file directly

### Icon Doesn't Appear
- Extension may need icon files created
- Works fine without icons, just shows default Chrome icon
- To add custom icons, see CREATE_ICONS.md

### API Errors
- Check internet connection
- Extension needs to connect to: `https://njzzp0serg.execute-api.us-east-1.amazonaws.com`
- If blocked by firewall, contact your IT department

### "This extension is not from Chrome Web Store"
- This is normal! Click "Continue" or dismiss
- Chrome shows this for all manually installed extensions
- Extension is safe and open-source (check the code!)

---

## 🔒 Privacy & Security

### What data is collected?
- **None stored on our servers**
- Prompts sent to AWS API for enhancement (not logged)
- History saved locally in your browser only
- No tracking, no analytics in extension

### Is it safe?
- ✅ Open-source code (you can review everything)
- ✅ No external scripts loaded
- ✅ Only connects to our AWS API endpoint
- ✅ No permissions to read credit cards, passwords, etc.
- ✅ Permissions only for: selected text, context menu, notifications, local storage

### Why not on Chrome Web Store?
- **To keep it 100% free!**
- Chrome Web Store charges $5 developer fee
- Direct distribution = No cost to users or developers
- Faster updates (no waiting for Google review)

---

## 💰 Pricing

### Extension: FREE ✅
- No installation fee
- No subscription
- No ads
- Open-source

### API Usage: Pay-Per-Use
- Claude 3 Haiku API costs ~$0.0004 per prompt
- You can track costs in the extension stats
- Typical user: < $0.10/month
- Heavy user (100 prompts/day): ~$1.20/month

**Note:** API costs go directly to AWS, not to us. We don't make money from this.

---

## 🌐 Share with Friends

Help others discover PromptCraft:

**Installation Link:**
```
https://github.com/abhiram-gannavaram/promptcraft/tree/main/chrome-extension
```

**Quick Instructions to Share:**
```
Install PromptCraft (FREE Chrome Extension):
1. Download: https://github.com/abhiram-gannavaram/promptcraft/archive/refs/heads/main.zip
2. Unzip → Open chrome://extensions/
3. Enable Developer Mode
4. Click "Load unpacked" → Select chrome-extension folder
5. Enjoy AI-powered prompt enhancement!
```

---

## 📞 Support

### Need Help?
- **Email:** support@promtcraft.in
- **Bug Reports:** bugs@promtcraft.in
- **GitHub Issues:** https://github.com/abhiram-gannavaram/promptcraft/issues

### Want to Contribute?
- Fork the repo
- Make improvements
- Submit pull request
- Help make it better!

---

## 🎁 Why It's Free

We believe AI tools should be accessible to everyone. By distributing directly:
- No store fees
- No artificial paywalls  
- No subscription models
- Just pay for what you use (AWS API costs)

**Enjoy PromptCraft! 🚀**

---

## 📋 Quick Reference

**Installation:** chrome://extensions/ → Developer Mode → Load unpacked  
**Updates:** Click Reload button in chrome://extensions/  
**Uninstall:** chrome://extensions/ → Remove button  
**Support:** support@promtcraft.in  
**Source Code:** https://github.com/abhiram-gannavaram/promptcraft
