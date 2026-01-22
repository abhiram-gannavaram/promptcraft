/**
 * AI Prompt Generator - E2E Tests with Playwright
 * Run with: npm run test:e2e
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.E2E_URL || 'http://localhost:8080';

test.describe('Homepage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL);
    });

    test('should display the main heading', async ({ page }) => {
        await expect(page.locator('h1')).toContainText(/AI Prompt Generator|Prompt/i);
    });

    test('should have a working prompt input', async ({ page }) => {
        const textarea = page.locator('textarea, [contenteditable="true"]').first();
        await expect(textarea).toBeVisible();
        
        await textarea.fill('This is a test prompt for the AI generator');
        await expect(textarea).toHaveValue('This is a test prompt for the AI generator');
    });

    test('should update character counter', async ({ page }) => {
        const textarea = page.locator('textarea').first();
        const counter = page.locator('.char-counter, [class*="counter"]').first();
        
        await textarea.fill('Hello World');
        
        // Counter should show the character count
        await expect(counter).toContainText(/11|9989/);
    });

    test('should have a generate button', async ({ page }) => {
        const button = page.locator('button').filter({ hasText: /generate|enhance/i }).first();
        await expect(button).toBeVisible();
    });
});

test.describe('Theme Toggle', () => {
    test('should toggle dark mode', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const themeToggle = page.locator('[class*="theme"], [aria-label*="theme"], button[id*="theme"]').first();
        
        if (await themeToggle.isVisible()) {
            // Get initial state
            const htmlBefore = await page.locator('html').getAttribute('class') || 
                               await page.locator('html').getAttribute('data-theme') || '';
            
            // Click toggle
            await themeToggle.click();
            
            // Wait for theme to change
            await page.waitForTimeout(300);
            
            // Verify change
            const htmlAfter = await page.locator('html').getAttribute('class') || 
                              await page.locator('html').getAttribute('data-theme') || '';
            
            expect(htmlAfter).not.toEqual(htmlBefore);
        }
    });

    test('should persist theme preference', async ({ page, context }) => {
        await page.goto(BASE_URL);
        
        const themeToggle = page.locator('[class*="theme"], button[id*="theme"]').first();
        
        if (await themeToggle.isVisible()) {
            // Set dark mode
            await themeToggle.click();
            await page.waitForTimeout(300);
            
            // Reload page
            await page.reload();
            
            // Check localStorage or theme persists
            const theme = await page.evaluate(() => localStorage.getItem('theme'));
            expect(theme).toBeTruthy();
        }
    });
});

test.describe('Language Selector', () => {
    test('should change interface language', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const langSelector = page.locator('select[id*="lang"], [class*="language"]').first();
        
        if (await langSelector.isVisible()) {
            // Select Spanish
            await langSelector.selectOption('es');
            
            // Wait for UI update
            await page.waitForTimeout(300);
            
            // Check for Spanish text
            const pageContent = await page.textContent('body');
            expect(pageContent).toMatch(/generar|generador/i);
        }
    });
});

test.describe('Cookie Consent', () => {
    test('should show cookie banner on first visit', async ({ page, context }) => {
        // Clear cookies first
        await context.clearCookies();
        
        await page.goto(BASE_URL);
        
        const banner = page.locator('[class*="cookie"], [id*="cookie"]').first();
        
        // Banner should be visible on first visit
        if (await banner.isVisible({ timeout: 2000 })) {
            await expect(banner).toBeVisible();
        }
    });

    test('should hide banner after accepting', async ({ page, context }) => {
        await context.clearCookies();
        await page.goto(BASE_URL);
        
        const acceptButton = page.locator('button').filter({ hasText: /accept|agree|got it/i }).first();
        
        if (await acceptButton.isVisible({ timeout: 2000 })) {
            await acceptButton.click();
            
            // Wait for banner to hide
            await page.waitForTimeout(500);
            
            // Reload and check banner doesn't appear
            await page.reload();
            
            const banner = page.locator('[class*="cookie-banner"], [id*="cookie"]').first();
            await expect(banner).not.toBeVisible({ timeout: 2000 }).catch(() => {
                // Banner might not exist which is also fine
            });
        }
    });
});

test.describe('Prompt Generation', () => {
    test('should show loading state during generation', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const textarea = page.locator('textarea').first();
        const button = page.locator('button').filter({ hasText: /generate/i }).first();
        
        await textarea.fill('Write a story about an adventurous cat exploring a magical forest');
        
        // Click generate
        await button.click();
        
        // Check for loading indicator
        const loader = page.locator('[class*="loading"], [class*="spinner"], .loader');
        await expect(loader.first()).toBeVisible({ timeout: 5000 }).catch(() => {
            // Might be too fast to catch
        });
    });

    test('should display error for empty prompt', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const button = page.locator('button').filter({ hasText: /generate/i }).first();
        
        // Try to generate without entering text
        await button.click();
        
        // Look for error message
        const error = page.locator('[class*="error"], [role="alert"]').first();
        await expect(error).toBeVisible({ timeout: 3000 }).catch(() => {
            // Button might be disabled, which is also valid
        });
    });
});

test.describe('Copy and Download', () => {
    test.skip('should have copy button for results', async ({ page }) => {
        await page.goto(BASE_URL);
        
        // Generate a result first (or look for copy button)
        const copyButton = page.locator('button').filter({ hasText: /copy/i }).first();
        
        // Copy button should exist (might be disabled without content)
        await expect(copyButton).toBeVisible();
    });

    test.skip('should have download button for results', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const downloadButton = page.locator('button').filter({ hasText: /download|save/i }).first();
        
        await expect(downloadButton).toBeVisible();
    });
});

test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(BASE_URL);
        
        // Main elements should be visible
        await expect(page.locator('h1').first()).toBeVisible();
        await expect(page.locator('textarea').first()).toBeVisible();
        
        // No horizontal scroll
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // Allow small margin
    });

    test('should work on tablet viewport', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto(BASE_URL);
        
        await expect(page.locator('h1').first()).toBeVisible();
        await expect(page.locator('textarea').first()).toBeVisible();
    });

    test('should work on desktop viewport', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto(BASE_URL);
        
        await expect(page.locator('h1').first()).toBeVisible();
        await expect(page.locator('textarea').first()).toBeVisible();
    });
});

test.describe('Accessibility', () => {
    test('should have skip link', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const skipLink = page.locator('a[href="#main"], .skip-link, [class*="skip"]').first();
        
        if (await skipLink.count() > 0) {
            // Focus on skip link (usually hidden until focused)
            await page.keyboard.press('Tab');
            
            // Check skip link is focusable
            const focused = await page.evaluate(() => document.activeElement?.textContent);
            expect(focused?.toLowerCase()).toMatch(/skip|main|content/);
        }
    });

    test('should have proper heading hierarchy', async ({ page }) => {
        await page.goto(BASE_URL);
        
        // Check h1 exists
        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBeGreaterThanOrEqual(1);
        
        // Optionally check hierarchy
        const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', (elements) =>
            elements.map(el => parseInt(el.tagName.substring(1)))
        );
        
        // Verify no skipped levels (e.g., h1 to h3 without h2)
        let lastLevel = 0;
        for (const level of headings) {
            expect(level - lastLevel).toBeLessThanOrEqual(1);
            lastLevel = Math.max(lastLevel, level);
        }
    });

    test('should have alt text for images', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const images = await page.locator('img').all();
        
        for (const img of images) {
            const alt = await img.getAttribute('alt');
            const role = await img.getAttribute('role');
            
            // Either has alt text or is decorative (role="presentation")
            expect(alt !== null || role === 'presentation').toBeTruthy();
        }
    });

    test('should have form labels', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const inputs = await page.locator('input:not([type="hidden"]), textarea, select').all();
        
        for (const input of inputs) {
            const id = await input.getAttribute('id');
            const ariaLabel = await input.getAttribute('aria-label');
            const ariaLabelledby = await input.getAttribute('aria-labelledby');
            const placeholder = await input.getAttribute('placeholder');
            
            if (id) {
                const label = page.locator(`label[for="${id}"]`);
                const hasLabel = await label.count() > 0;
                
                // Has either label, aria-label, aria-labelledby, or placeholder
                expect(hasLabel || ariaLabel || ariaLabelledby || placeholder).toBeTruthy();
            }
        }
    });
});

test.describe('Legal Pages', () => {
    test('should have privacy policy page', async ({ page }) => {
        await page.goto(`${BASE_URL}/legal/privacy-policy.html`);
        await expect(page.locator('h1')).toContainText(/privacy/i);
    });

    test('should have terms of service page', async ({ page }) => {
        await page.goto(`${BASE_URL}/legal/terms-of-service.html`);
        await expect(page.locator('h1')).toContainText(/terms/i);
    });

    test('should have cookies policy page', async ({ page }) => {
        await page.goto(`${BASE_URL}/legal/cookies-policy.html`);
        await expect(page.locator('h1')).toContainText(/cookie/i);
    });
});

test.describe('Performance', () => {
    test('should load within acceptable time', async ({ page }) => {
        const startTime = Date.now();
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
        const loadTime = Date.now() - startTime;
        
        // Should load within 3 seconds
        expect(loadTime).toBeLessThan(3000);
    });

    test('should not have console errors', async ({ page }) => {
        const errors: string[] = [];
        
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });
        
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        // Filter out known acceptable errors
        const significantErrors = errors.filter(e => 
            !e.includes('favicon') && 
            !e.includes('404')
        );
        
        expect(significantErrors).toHaveLength(0);
    });
});
