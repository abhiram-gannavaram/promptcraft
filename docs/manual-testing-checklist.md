# AI Prompt Generator - Manual Testing Checklist

## 📋 Overview

This document provides step-by-step manual testing procedures for the AI Prompt Generator.
Use this checklist before each deployment to ensure quality.

**Test Date:** _________________ **Tester:** _________________

---

## 🌐 Browser Testing Matrix

Test in the following browsers:

| Browser | Version | Desktop | Mobile | Status |
|---------|---------|---------|--------|--------|
| Chrome | Latest | ☐ | ☐ | |
| Firefox | Latest | ☐ | ☐ | |
| Safari | Latest | ☐ | ☐ | |
| Edge | Latest | ☐ | ☐ | |

---

## 📱 Device Testing

| Device Type | Resolution | Status | Notes |
|-------------|------------|--------|-------|
| Mobile (small) | 375x667 | ☐ | iPhone SE |
| Mobile (large) | 414x896 | ☐ | iPhone 11 |
| Tablet | 768x1024 | ☐ | iPad |
| Desktop (small) | 1366x768 | ☐ | Laptop |
| Desktop (large) | 1920x1080 | ☐ | Monitor |
| Desktop (wide) | 2560x1440 | ☐ | Large monitor |

---

## ✅ Functional Tests

### 1. Page Load
| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Page loads without errors | No console errors | | ☐ |
| All styles load correctly | Page is styled | | ☐ |
| All scripts load correctly | Interactive elements work | | ☐ |
| Page loads in <3 seconds | Fast load time | | ☐ |

### 2. Input Field
| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Text can be entered | Text appears in field | | ☐ |
| Placeholder text visible | Shows hint text | | ☐ |
| Long text (10000 chars) accepted | Text is entered | | ☐ |
| Paste works correctly | Pasted text appears | | ☐ |
| Special characters work | No encoding issues | | ☐ |
| Emoji work correctly | Emojis display | | ☐ |

### 3. Character Counter
| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Counter shows 0 when empty | "0 / 10000" or similar | | ☐ |
| Counter updates on typing | Real-time update | | ☐ |
| Counter updates on paste | Correct count | | ☐ |
| Warning at 9000 chars | Visual warning | | ☐ |
| Error at 10001+ chars | Prevents more input | | ☐ |

### 4. Generate Button
| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Button visible | Clearly visible | | ☐ |
| Disabled when input empty | Grayed out/disabled | | ☐ |
| Enabled when input valid | Clickable | | ☐ |
| Click triggers action | API call made | | ☐ |
| Loading state shown | Spinner/loading text | | ☐ |
| Disabled during loading | Prevents double-click | | ☐ |

### 5. API Integration
| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Valid prompt generates | Enhanced prompt returned | | ☐ |
| Response displays | Output area populated | | ☐ |
| Error handling works | User-friendly error | | ☐ |
| Network error handled | Retry option shown | | ☐ |
| Timeout handled | Message after 30s | | ☐ |

### 6. Output Area
| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Output displays clearly | Text is readable | | ☐ |
| Output is selectable | Can highlight text | | ☐ |
| Long output scrolls | Scrollbar appears | | ☐ |
| Output preserves formatting | Newlines/spacing intact | | ☐ |

### 7. Copy Functionality
| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Copy button visible | When output present | | ☐ |
| Click copies to clipboard | Text in clipboard | | ☐ |
| Success feedback shown | "Copied!" message | | ☐ |
| Can paste copied text | Paste works elsewhere | | ☐ |

### 8. Download Functionality
| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Download button visible | When output present | | ☐ |
| Click triggers download | File saves | | ☐ |
| File contains output | Correct content | | ☐ |
| Filename is appropriate | Includes timestamp | | ☐ |

### 9. Reset/Clear
| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Reset option available | Button/link visible | | ☐ |
| Clears input field | Input empty | | ☐ |
| Clears output area | Output empty | | ☐ |
| Resets character counter | Counter at 0 | | ☐ |

---

## 🎨 UI/UX Tests

### 1. Theme Toggle (Dark Mode)
| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Toggle visible | Icon/button present | | ☐ |
| Click switches theme | Colors change | | ☐ |
| All elements themed | Consistent colors | | ☐ |
| Preference persists | Same after reload | | ☐ |
| Respects system preference | On first load | | ☐ |

### 2. Language Selector
| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Selector visible | Dropdown/buttons | | ☐ |
| English works | UI in English | | ☐ |
| Spanish works | UI in Spanish | | ☐ |
| French works | UI in French | | ☐ |
| German works | UI in German | | ☐ |
| Preference persists | Same after reload | | ☐ |

### 3. Responsive Design
| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Mobile layout works | Single column | | ☐ |
| Tablet layout works | Appropriate spacing | | ☐ |
| Desktop layout works | Optimal use of space | | ☐ |
| No horizontal scroll | Content fits | | ☐ |
| Touch targets adequate | 44px minimum | | ☐ |

### 4. Visual Feedback
| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Button hover states | Visual change | | ☐ |
| Button focus states | Outline visible | | ☐ |
| Input focus state | Border highlight | | ☐ |
| Error states visible | Red color/icon | | ☐ |
| Success states visible | Green color/icon | | ☐ |
| Loading animations | Smooth motion | | ☐ |

---

## ♿ Accessibility Tests

### 1. Keyboard Navigation
| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Tab navigates forward | Focus moves correctly | | ☐ |
| Shift+Tab navigates back | Reverse order | | ☐ |
| Enter activates buttons | Button clicked | | ☐ |
| Escape closes modals | Modal dismissed | | ☐ |
| Focus visible | Always clear | | ☐ |
| Skip link works | Jumps to main content | | ☐ |

### 2. Screen Reader (VoiceOver/NVDA)
| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Page title announced | Correct title | | ☐ |
| Headings structure clear | H1, H2, H3 order | | ☐ |
| Form labels read | Input purposes clear | | ☐ |
| Buttons have names | Actions described | | ☐ |
| Errors announced | Alert role works | | ☐ |
| Status updates announced | Live regions work | | ☐ |

### 3. Visual Accessibility
| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Color contrast adequate | 4.5:1 minimum | | ☐ |
| Not color-only | Icons/text too | | ☐ |
| Text resizable | 200% still works | | ☐ |
| No seizure triggers | No rapid flashing | | ☐ |

---

## 🔒 Security Tests

### 1. Input Sanitization
| Test | Input | Expected | Pass/Fail |
|------|-------|----------|-----------|
| XSS script tag | `<script>alert(1)</script>` | Escaped/blocked | ☐ |
| XSS event handler | `<img onerror=alert(1)>` | Escaped/blocked | ☐ |
| SQL injection | `'; DROP TABLE--` | Treated as text | ☐ |
| HTML injection | `<b>bold</b>` | Escaped or allowed | ☐ |

### 2. Client-Side Security
| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| No secrets in code | F12 shows nothing | | ☐ |
| No API keys visible | Source clean | | ☐ |
| HTTPS enforced | No mixed content | | ☐ |
| Console clean | No sensitive logs | | ☐ |

---

## ⚡ Performance Tests

### 1. Page Speed (Chrome DevTools)
| Metric | Target | Actual | Pass/Fail |
|--------|--------|--------|-----------|
| First Contentful Paint | <1.8s | | ☐ |
| Largest Contentful Paint | <2.5s | | ☐ |
| Time to Interactive | <3.0s | | ☐ |
| Total Blocking Time | <200ms | | ☐ |
| Cumulative Layout Shift | <0.1 | | ☐ |

### 2. Network (Chrome DevTools Network tab)
| Test | Target | Actual | Pass/Fail |
|------|--------|--------|-----------|
| Total page size | <1MB | | ☐ |
| Number of requests | <20 | | ☐ |
| Largest file | <500KB | | ☐ |
| Gzip compression | Enabled | | ☐ |

### 3. Memory (Chrome DevTools Memory tab)
| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| No memory leaks | Stable after use | | ☐ |
| Heap size reasonable | <50MB typical | | ☐ |
| No detached DOM | Cleanup works | | ☐ |

---

## 🌍 SEO Tests

### 1. Meta Tags (View Source)
| Tag | Present | Content OK | Pass/Fail |
|-----|---------|------------|-----------|
| title | ☐ | ☐ | |
| meta description | ☐ | ☐ | |
| meta viewport | ☐ | ☐ | |
| og:title | ☐ | ☐ | |
| og:description | ☐ | ☐ | |
| og:image | ☐ | ☐ | |
| twitter:card | ☐ | ☐ | |

### 2. Structure
| Element | Present | Pass/Fail |
|---------|---------|-----------|
| Single H1 | ☐ | |
| Heading hierarchy | ☐ | |
| robots.txt | ☐ | |
| sitemap.xml | ☐ | |
| Favicon | ☐ | |
| Structured data | ☐ | |

---

## 🍪 Cookie/Privacy Tests

### 1. Cookie Consent
| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Banner shows first visit | Visible | | ☐ |
| Accept button works | Banner dismisses | | ☐ |
| Decline option exists | Visible | | ☐ |
| Choice persists | No banner on reload | | ☐ |
| Privacy link works | Opens policy | | ☐ |

### 2. Legal Pages
| Page | Loads | Content OK | Pass/Fail |
|------|-------|------------|-----------|
| Privacy Policy | ☐ | ☐ | |
| Terms of Service | ☐ | ☐ | |
| Cookie Policy | ☐ | ☐ | |

---

## 📝 Test Results Summary

**Total Tests:** _____ **Passed:** _____ **Failed:** _____ **Blocked:** _____

### Issues Found

| # | Description | Severity | Status |
|---|-------------|----------|--------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

### Overall Assessment

- [ ] ✅ Ready for deployment
- [ ] ⚠️ Minor issues - can deploy with known issues
- [ ] ❌ Blocking issues - do not deploy

**Tester Signature:** _________________ **Date:** _________________

---

## 🐛 Bug Report Template

When reporting bugs, use this format:

```
## Bug Report

**Title:** [Brief description]

**Environment:**
- Browser: 
- OS: 
- Device: 

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshot/Video:**
[Attach if applicable]

**Severity:** [Critical/High/Medium/Low]

**Additional Notes:**
[Any other relevant information]
```
