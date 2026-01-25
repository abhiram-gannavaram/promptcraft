# PromptCraft Extension - Icon Creation Guide

## Required Icons for Chrome Web Store

You need to create 3 PNG icon files before publishing:

### Icon Sizes Required:
- `icon16.png` - 16x16 pixels (toolbar icon)
- `icon48.png` - 48x48 pixels (extension management page)
- `icon128.png` - 128x128 pixels (Chrome Web Store listing)

### Design Specifications:
- **Style**: Purple gradient (matching website theme)
- **Colors**: #667eea to #764ba2
- **Symbol**: White sparkle ✨ or "PC" letters
- **Background**: Rounded corners, modern gradient
- **Format**: PNG with transparency

---

## Quick Option 1: Use AI Image Generator

**Prompt for DALL-E/Midjourney:**
```
Create a Chrome extension icon set with purple gradient background (#667eea to #764ba2), 
white sparkle or "PC" text, modern flat design, rounded corners, clean professional look, 
3 sizes: 16x16, 48x48, 128x128 pixels
```

**Or use ChatGPT:**
1. Go to ChatGPT with DALL-E access
2. Use this prompt: "Create a square icon for a Chrome extension called PromptCraft. Purple gradient background from #667eea to #764ba2. White sparkle icon in center. Modern flat design. 512x512 pixels."
3. Download and resize to 16x16, 48x48, 128x128

---

## Quick Option 2: Use Canva (Free)

1. Go to **canva.com**
2. Create custom size: **128 x 128 pixels**
3. Add gradient background:
   - Top color: #667eea
   - Bottom color: #764ba2
4. Add white text "PC" or sparkle emoji ✨
5. Export as PNG
6. Resize to create 48x48 and 16x16 versions

**Resize with Preview (macOS):**
```bash
# Open exported icon in Preview
Tools → Adjust Size → Width: 48 (keep aspect ratio) → Save as icon48.png
Tools → Adjust Size → Width: 16 (keep aspect ratio) → Save as icon16.png
```

---

## Quick Option 3: Use Figma (Free)

1. Go to **figma.com**
2. Create 128x128 frame
3. Add rectangle with gradient fill:
   - Color 1: #667eea
   - Color 2: #764ba2
   - Angle: 135°
4. Add white text "✨" (emoji) or "PC"
5. Export:
   - Format: PNG
   - Sizes: 1x, 0.375x (48px), 0.125x (16px)

---

## Quick Option 4: Use Online Icon Generator

**Websites:**
- https://www.icoconverter.com/
- https://icon.kitchen/
- https://www.favicon-generator.org/

1. Upload a 512x512 base image
2. Generate all sizes
3. Download icon pack

---

## Quick Option 5: Use ImageMagick (Command Line)

If you have a 512x512 source image:

```bash
cd /Users/abhiramgannavaram/promot-project/chrome-extension/icons

# Create 16x16
convert source.png -resize 16x16 icon16.png

# Create 48x48
convert source.png -resize 48x48 icon48.png

# Create 128x128
convert source.png -resize 128x128 icon128.png
```

---

## Recommended: Quick Test Icons

For immediate testing, create simple colored squares:

```bash
cd /Users/abhiramgannavaram/promot-project/chrome-extension/icons

# Create purple test icon (requires ImageMagick)
convert -size 16x16 xc:"#764ba2" icon16.png
convert -size 48x48 xc:"#764ba2" icon48.png
convert -size 128x128 xc:"#764ba2" icon128.png
```

Or download any purple icon temporarily from:
- https://www.flaticon.com/search?word=sparkle
- https://icons8.com/icons/set/magic

---

## Final Steps

1. Save all 3 icons in `/chrome-extension/icons/` folder
2. Verify filenames match manifest.json:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`
3. Test in Chrome → Extensions → Load unpacked
4. Icons should appear in toolbar and extension management

---

## Quick AI Generation Command (if you have access)

If you have Claude/ChatGPT with image generation:
```
"Generate a Chrome extension icon set for PromptCraft:
- 128x128 pixels
- Purple gradient (#667eea to #764ba2)
- White sparkle ✨ in center
- Modern flat design
- Export as PNG"
```

Then resize to 48x48 and 16x16.
