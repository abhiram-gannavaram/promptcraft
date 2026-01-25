# PromptCraft Chrome Extension

Transform any text into professional AI prompts instantly with the PromptCraft Chrome extension.

## 🚀 Features

- **Right-Click Enhancement**: Select any text → Right-click → "Enhance with PromptCraft"
- **Popup Interface**: Click extension icon for full interface
- **Keyboard Shortcuts**: 
  - `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`) - Enhance selected text
  - `Ctrl+Shift+E` (Mac: `Cmd+Shift+E`) - Open popup
- **Customizable Options**: Choose tone (professional, casual, creative, etc.) and length
- **Instant Copy**: Copy enhanced prompts to clipboard with one click
- **History Tracking**: Saves last 50 enhanced prompts locally
- **Privacy-Focused**: All data stored locally, no tracking

## 📦 Installation

### 🎉 100% FREE - Direct Installation (No Chrome Web Store)

**Quick Install (2 minutes):**
1. Download: https://github.com/abhiram-gannavaram/promptcraft/archive/refs/heads/main.zip
2. Unzip the file and navigate to `chrome-extension` folder
3. Open Chrome → `chrome://extensions/`
4. Enable **"Developer mode"** (toggle in top right)
5. Click **"Load unpacked"**
6. Select the `chrome-extension` folder
7. **Done!** PromptCraft icon appears in toolbar

**Detailed Guide:** See [FREE_INSTALLATION.md](FREE_INSTALLATION.md)

### Why Not Chrome Web Store?
We're distributing directly to keep it **100% free** (no $5 store fee). You get:
- ✅ No installation fees
- ✅ No subscriptions
- ✅ Faster updates
- ✅ Open-source code
- ✅ Pay only for API usage (~$0.0004/prompt)

## 🎯 How to Use

### Method 1: Right-Click (Context Menu)
1. Select any text on any webpage
2. Right-click and choose "Enhance with PromptCraft"
3. Enhanced prompt automatically copied to clipboard
4. Notification confirms success

### Method 2: Popup Interface
1. Click the PromptCraft icon in toolbar
2. Enter your prompt
3. Select tone and length options
4. Click "Enhance Prompt"
5. Copy enhanced result

### Method 3: Keyboard Shortcut
1. Select text on any page
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Enhanced prompt shown in modal overlay
4. Click "Copy" button

## ⚙️ Configuration

The extension remembers your preferences:
- **Tone preference**: Professional, Casual, Creative, Academic, Technical
- **Length preference**: Concise, Balanced, Detailed
- **History**: Last 50 prompts saved locally

Access settings by clicking the extension icon.

## 🔒 Privacy

- All data stored locally in your browser
- No tracking or analytics
- API calls only made to promtcraft.in backend
- Your prompts are not shared with third parties
- History can be cleared anytime

## 📊 Usage Statistics

The extension tracks (locally only):
- Total enhancements performed
- Total copies made
- Last used timestamp

View stats in the extension popup.

## 🛠️ Technical Details

**Built with:**
- Manifest V3 (latest Chrome extension standard)
- Vanilla JavaScript (no dependencies)
- AWS API Gateway backend
- AWS Bedrock (Claude AI)

**Permissions:**
- `contextMenus` - For right-click menu
- `activeTab` - To read selected text
- `storage` - To save preferences locally

## 🐛 Troubleshooting

**Extension not working?**
1. Check if you're connected to internet
2. Try reloading the extension (chrome://extensions → reload)
3. Check console for errors (F12 → Console)

**API errors?**
- Ensure backend is running at promtcraft.in
- Check CORS settings on API Gateway

## 📝 Publishing to Chrome Web Store

### Prerequisites
1. Google Developer Account ($5 one-time fee)
2. Extension icons (16x16, 48x48, 128x128)
3. Screenshots for store listing
4. Privacy policy URL

### Steps to Publish

1. **Create Developer Account**
   - Go to: https://chrome.google.com/webstore/devconsole
   - Pay $5 registration fee
   - Verify email

2. **Prepare Extension Package**
   ```bash
   cd chrome-extension
   zip -r promptcraft-extension.zip *
   ```

3. **Upload to Chrome Web Store**
   - Click "New Item"
   - Upload `promptcraft-extension.zip`
   - Fill out store listing details

4. **Store Listing Details**
   
   **Name:** PromptCraft - AI Prompt Enhancer
   
   **Summary:** Transform rough ideas into professional AI prompts for ChatGPT, Claude, and GPT-5
   
   **Description:**
   ```
   PromptCraft is a free Chrome extension that enhances your AI prompts instantly. Turn rough ideas into professional, effective prompts for ChatGPT, Claude, GPT-5, and other AI models.

   🌟 KEY FEATURES:
   • Right-click any text to enhance it
   • Popup interface for quick access
   • Keyboard shortcuts (Ctrl+Shift+P)
   • Customizable tone and length
   • Instant copy to clipboard
   • Local history (last 50 prompts)
   • 100% free, no signup required

   🎯 HOW TO USE:
   1. Select text on any webpage
   2. Right-click → "Enhance with PromptCraft"
   3. Enhanced prompt copied to clipboard
   4. Paste into ChatGPT, Claude, or any AI

   ⚡ PERFECT FOR:
   • Writers and content creators
   • Marketers and copywriters
   • Developers and technical writers
   • Students and researchers
   • Anyone using AI tools regularly

   🔒 PRIVACY:
   • All data stored locally
   • No tracking or analytics
   • Your prompts stay private
   • Open source (coming soon)

   💡 EXAMPLE:
   Input: "write a blog post"
   Output: "Compose a comprehensive blog post of approximately 1,000 words that provides valuable insights on [topic]. Structure the content with an engaging introduction, 3-4 well-developed main points supported by examples, and a compelling conclusion. Use a professional yet conversational tone suitable for [target audience]. Include relevant statistics or research to support key claims."

   Powered by AWS Bedrock and Claude AI.
   Website: https://promtcraft.in
   ```

   **Category:** Productivity
   
   **Language:** English
   
   **Screenshots:** (5 required)
   - Main popup interface
   - Right-click context menu
   - Enhanced prompt example
   - Settings/options
   - Mobile view (if applicable)

5. **Privacy Policy**
   - Must include privacy policy URL
   - Can use: https://promtcraft.in/legal/privacy-policy.html

6. **Submit for Review**
   - Review time: 1-3 days typically
   - May ask for clarifications
   - Address any policy violations

### Marketing the Extension

**After approval:**
1. Share on Reddit (r/chrome_extensions, r/productivity)
2. Post on Product Hunt
3. Tweet announcement
4. Add badge to promtcraft.in website
5. Blog post about the extension

**Chrome Web Store Badge:**
```html
<a href="https://chrome.google.com/webstore/detail/[YOUR-EXTENSION-ID]">
  <img src="https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/UV4C4ybeBTsZt43U4xis.png" 
       alt="Available in the Chrome Web Store">
</a>
```

## 🎨 Customization

To customize branding:
1. Replace icons in `icons/` folder
2. Update colors in `popup.html` (CSS variables)
3. Modify API endpoint in `popup.js` and `background.js`

## 📈 Analytics (Optional)

To add analytics:
1. Add Google Analytics tracking
2. Use Chrome extension analytics API
3. Track: installs, usage, errors

## 🚀 Next Steps

1. **Create Icons**: Design 16x16, 48x48, 128x128 PNG icons
2. **Test Extension**: Load unpacked and test all features
3. **Take Screenshots**: Capture for Chrome Web Store listing
4. **Register Developer Account**: Pay $5 fee
5. **Publish**: Upload and submit for review
6. **Promote**: Share with your audience

## 💰 Monetization Ideas

- Keep extension free to drive website traffic
- Add premium features (saved templates, team sharing)
- Affiliate links to AI services
- Sponsorships from AI companies

## 🤝 Contributing

Contributions welcome! Ideas:
- Add more AI model integrations
- Multilanguage support
- Template library
- Team collaboration features

---

**Need help?** Contact: support@promtcraft.in

**Website:** https://promtcraft.in

**License:** MIT (specify if open sourcing)
