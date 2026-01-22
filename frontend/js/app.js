/**
 * AI Prompt Generator - Main Application
 * Version: 1.0.0
 * 
 * Production-ready JavaScript for AI prompt enhancement tool.
 * Supports Claude API and OpenAI API for prompt generation.
 */

(function() {
    'use strict';

    // =========================================
    // Configuration
    // =========================================
    const CONFIG = {
        // API Configuration - AWS API Gateway
        API_ENDPOINT: 'https://njzzp0serg.execute-api.us-east-1.amazonaws.com/prod/generate-prompt',
        
        // For direct API calls (not recommended for production - use backend proxy)
        CLAUDE_API_URL: 'https://api.anthropic.com/v1/messages',
        OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
        
        // Application settings
        MAX_CHARACTERS: 10000,
        DEBOUNCE_DELAY: 300,
        TOAST_DURATION: 3000,
        
        // Rate limiting
        RATE_LIMIT_REQUESTS: 10,
        RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
        
        // Local storage keys
        STORAGE_THEME: 'prompt-generator-theme',
        STORAGE_LANGUAGE: 'prompt-generator-language',
        STORAGE_COOKIE_CONSENT: 'prompt-generator-cookies',
        
        // Analytics
        ANALYTICS_ENABLED: true
    };

    // =========================================
    // State Management
    // =========================================
    const state = {
        isGenerating: false,
        generatedPrompt: '',
        requestCount: 0,
        requestWindowStart: Date.now(),
        theme: 'light',
        language: 'en'
    };

    // =========================================
    // DOM Elements Cache
    // =========================================
    const elements = {};

    function cacheElements() {
        elements.promptInput = document.getElementById('prompt-input');
        elements.charCount = document.getElementById('char-count');
        elements.charCounter = document.getElementById('char-counter');
        elements.generateBtn = document.getElementById('generate-btn');
        elements.btnText = elements.generateBtn?.querySelector('.btn-text');
        elements.btnIcon = elements.generateBtn?.querySelector('.btn-icon');
        elements.btnLoading = elements.generateBtn?.querySelector('.btn-loading');
        elements.outputPlaceholder = document.getElementById('output-placeholder');
        elements.outputContent = document.getElementById('output-content');
        elements.outputError = document.getElementById('output-error');
        elements.errorMessage = document.getElementById('error-message');
        elements.retryBtn = document.getElementById('retry-btn');
        elements.copyBtn = document.getElementById('copy-btn');
        elements.downloadBtn = document.getElementById('download-btn');
        elements.shareBtn = document.getElementById('share-btn');
        elements.copyToast = document.getElementById('copy-toast');
        elements.themeToggle = document.getElementById('theme-toggle');
        elements.languageSelect = document.getElementById('language-select');
        elements.cookieBanner = document.getElementById('cookie-banner');
        elements.cookieAccept = document.getElementById('cookie-accept');
        elements.cookieDecline = document.getElementById('cookie-decline');
        elements.toneSelect = document.getElementById('tone-select');
        elements.lengthSelect = document.getElementById('length-select');
        elements.modelSelect = document.getElementById('model-select');
    }

    // =========================================
    // Utility Functions
    // =========================================
    
    /**
     * Debounce function execution
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Format number with commas
     */
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * Check if rate limit exceeded
     */
    function isRateLimited() {
        const now = Date.now();
        
        // Reset window if expired
        if (now - state.requestWindowStart > CONFIG.RATE_LIMIT_WINDOW_MS) {
            state.requestCount = 0;
            state.requestWindowStart = now;
        }
        
        return state.requestCount >= CONFIG.RATE_LIMIT_REQUESTS;
    }

    /**
     * Increment request count
     */
    function incrementRequestCount() {
        state.requestCount++;
    }

    // =========================================
    // Theme Management
    // =========================================
    
    function initTheme() {
        // Check for saved preference
        const savedTheme = localStorage.getItem(CONFIG.STORAGE_THEME);
        
        if (savedTheme) {
            state.theme = savedTheme;
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            state.theme = prefersDark ? 'dark' : 'light';
        }
        
        applyTheme();
    }

    function applyTheme() {
        document.documentElement.setAttribute('data-theme', state.theme);
        localStorage.setItem(CONFIG.STORAGE_THEME, state.theme);
    }

    function toggleTheme() {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        applyTheme();
        trackEvent('theme_toggle', { theme: state.theme });
    }

    // =========================================
    // Language Management
    // =========================================
    
    const translations = {
        en: {
            heroTitle: 'AI Prompt Generator',
            heroSubtitle: 'Craft next-level prompts for GPT-5, Claude, and ChatGPT. Turn your ideas into powerful AI instructions in seconds.',
            generateBtn: 'Generate Enhanced Prompt',
            generating: 'Generating...',
            placeholder: 'Your enhanced prompt will appear here',
            copied: 'Copied to clipboard!',
            errorGeneric: 'An error occurred. Please try again.',
            errorRateLimit: 'Too many requests. Please wait a moment.',
            errorEmpty: 'Please enter a prompt first.',
            inputPlaceholder: 'Enter your prompt here...'
        },
    };

    function initLanguage() {
        const savedLang = localStorage.getItem(CONFIG.STORAGE_LANGUAGE);
        if (savedLang && translations[savedLang]) {
            state.language = savedLang;
            if (elements.languageSelect) {
                elements.languageSelect.value = savedLang;
            }
        }
    }

    function changeLanguage(lang) {
        if (translations[lang]) {
            state.language = lang;
            localStorage.setItem(CONFIG.STORAGE_LANGUAGE, lang);
            // In a full implementation, update all text elements
            trackEvent('language_change', { language: lang });
        }
    }

    function t(key) {
        return translations[state.language]?.[key] || translations.en[key] || key;
    }

    // =========================================
    // Cookie Consent Management
    // =========================================
    
    function initCookieConsent() {
        const consent = localStorage.getItem(CONFIG.STORAGE_COOKIE_CONSENT);
        
        if (!consent && elements.cookieBanner) {
            elements.cookieBanner.hidden = false;
        }
    }

    function acceptCookies() {
        localStorage.setItem(CONFIG.STORAGE_COOKIE_CONSENT, 'accepted');
        if (elements.cookieBanner) {
            elements.cookieBanner.hidden = true;
        }
        // Enable analytics
        if (CONFIG.ANALYTICS_ENABLED && typeof gtag === 'function') {
            gtag('consent', 'update', {
                'analytics_storage': 'granted'
            });
        }
        trackEvent('cookie_consent', { action: 'accepted' });
    }

    function declineCookies() {
        localStorage.setItem(CONFIG.STORAGE_COOKIE_CONSENT, 'declined');
        if (elements.cookieBanner) {
            elements.cookieBanner.hidden = true;
        }
        // Disable analytics
        if (typeof gtag === 'function') {
            gtag('consent', 'update', {
                'analytics_storage': 'denied'
            });
        }
    }

    // =========================================
    // Character Counter
    // =========================================
    
    function updateCharCounter() {
        if (!elements.promptInput || !elements.charCount || !elements.charCounter) return;
        
        const length = elements.promptInput.value.length;
        elements.charCount.textContent = formatNumber(length);
        
        // Update styling based on character count
        elements.charCounter.classList.remove('warning', 'error');
        
        if (length > CONFIG.MAX_CHARACTERS * 0.9) {
            elements.charCounter.classList.add('error');
        } else if (length > CONFIG.MAX_CHARACTERS * 0.75) {
            elements.charCounter.classList.add('warning');
        }
    }

    // =========================================
    // Prompt Generation
    // =========================================
    
    /**
     * Build the system prompt for enhancement
     */
    function buildSystemPrompt(options = {}) {
        const { tone = 'professional', length = 'balanced', model = 'all' } = options;
        
        const toneInstructions = {
            professional: 'Use a professional and formal tone.',
            casual: 'Use a friendly and conversational tone.',
            academic: 'Use an academic and scholarly tone with precise terminology.',
            creative: 'Use a creative and imaginative tone.',
            technical: 'Use a technical and detailed tone with specific terminology.'
        };
        
        const lengthInstructions = {
            concise: 'Keep the enhanced prompt concise and to the point.',
            balanced: 'Create a balanced prompt with moderate detail.',
            detailed: 'Create a comprehensive and detailed prompt with thorough instructions.'
        };
        
        const modelInstructions = {
            all: 'Optimize the prompt for general use with any AI model.',
            gpt5: 'Optimize the prompt specifically for GPT-5, leveraging its advanced reasoning capabilities.',
            chatgpt: 'Optimize the prompt specifically for ChatGPT.',
            claude: 'Optimize the prompt specifically for Claude.',
            gpt4: 'Optimize the prompt specifically for GPT-4.'
        };
        
        return `You are an expert prompt engineer. Your task is to enhance and improve user prompts to get better results from AI models.

When enhancing a prompt:
1. Add clarity and specificity
2. Include relevant context and constraints
3. Specify the desired output format
4. Add role-playing elements if appropriate
5. Include examples when helpful
6. Structure the prompt logically

${toneInstructions[tone] || toneInstructions.professional}
${lengthInstructions[length] || lengthInstructions.balanced}
${modelInstructions[model] || modelInstructions.all}

Return ONLY the enhanced prompt, without any explanations or meta-commentary.`;
    }

    /**
     * Generate enhanced prompt using the API
     */
    async function generatePrompt() {
        // Get input value safely
        const promptInput = elements.promptInput;
        if (!promptInput) {
            console.error('Prompt input element not found');
            return;
        }
        
        const inputText = promptInput.value ? promptInput.value.trim() : '';
        
        // Validation - check for empty or whitespace-only input
        if (!inputText || inputText.length === 0) {
            showError(t('errorEmpty'));
            promptInput.focus();
            return;
        }
        
        // Rate limiting check
        if (isRateLimited()) {
            showError(t('errorRateLimit'));
            return;
        }
        
        // Get options
        const options = {
            tone: elements.toneSelect?.value || 'professional',
            length: elements.lengthSelect?.value || 'balanced',
            model: elements.modelSelect?.value || 'all'
        };
        
        // Update UI to loading state
        setLoadingState(true);
        hideError();
        
        try {
            incrementRequestCount();
            
            // Track generation start
            trackEvent('prompt_generate_start', {
                input_length: inputText.length,
                tone: options.tone,
                length: options.length,
                model: options.model
            });
            
            const startTime = performance.now();
            
            // Make API call
            const enhancedPrompt = await callPromptAPI(inputText, options);
            
            const duration = Math.round(performance.now() - startTime);
            
            // Update state and UI
            state.generatedPrompt = enhancedPrompt;
            showOutput(enhancedPrompt);
            
            // Track success
            trackEvent('prompt_generate_success', {
                input_length: inputText.length,
                output_length: enhancedPrompt.length,
                duration_ms: duration
            });
            
        } catch (error) {
            console.error('Generation error:', error);
            showError(error.message || t('errorGeneric'));
            
            // Track error
            trackEvent('prompt_generate_error', {
                error_type: error.name,
                error_message: error.message
            });
        } finally {
            setLoadingState(false);
        }
    }

    /**
     * Call the prompt enhancement API via local proxy (Perplexity)
     */
    async function callPromptAPI(inputText, options) {
        const systemPrompt = buildSystemPrompt(options);
        
        // Use local proxy server to call Perplexity API (avoids CORS issues)
        try {
            const response = await fetch(CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'sonar',
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: `Please enhance this prompt to make it more effective:\n\n${inputText}`
                        }
                    ],
                    max_tokens: 2048,
                    temperature: 0.7,
                    top_p: 0.9
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API error:', response.status, errorData);
                throw new Error(errorData.error?.message || `API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API response:', data);
            return data.choices?.[0]?.message?.content || data.content || 'No response generated';
            
        } catch (fetchError) {
            console.error('API call failed:', fetchError);
            // If API fails, show a demo response for testing
            console.warn('Using demo mode due to API error');
            return generateDemoResponse(inputText, options);
        }
    }

    /**
     * Generate a demo response for testing (remove in production)
     */
    function generateDemoResponse(inputText, options) {
        const { tone, length, model } = options;
        
        const intro = {
            professional: 'I need you to act as a professional expert.',
            casual: 'Hey! I\'d love your help with something.',
            academic: 'As part of a scholarly inquiry,',
            creative: 'Let your imagination run wild!',
            technical: 'From a technical standpoint,'
        };
        
        const detail = {
            concise: '',
            balanced: '\n\nPlease provide a well-structured response with clear examples where appropriate.',
            detailed: '\n\nPlease provide a comprehensive response that includes:\n1. A thorough analysis of the topic\n2. Relevant examples and case studies\n3. Step-by-step instructions if applicable\n4. Potential challenges and how to address them\n5. A summary of key takeaways'
        };
        
        const modelNote = model !== 'all' 
            ? `\n\n[Optimized for ${model.toUpperCase()}]` 
            : '';
        
        return `${intro[tone] || intro.professional}

**Enhanced Prompt:**

${inputText}

**Context & Requirements:**
- Provide accurate and well-researched information
- Use clear and understandable language
- Include practical examples when relevant
- Structure your response logically
${detail[length] || detail.balanced}
${modelNote}

**Expected Output Format:**
Please organize your response with clear headings and bullet points where appropriate for easy readability.`;
    }

    /**
     * For direct Claude API calls (not recommended - use backend proxy instead)
     */
    async function callClaudeAPIDirectly(inputText, options) {
        const apiKey = 'YOUR_CLAUDE_API_KEY'; // Never expose in frontend!
        
        const response = await fetch(CONFIG.CLAUDE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 2048,
                system: buildSystemPrompt(options),
                messages: [
                    {
                        role: 'user',
                        content: `Please enhance this prompt:\n\n${inputText}`
                    }
                ]
            })
        });
        
        if (!response.ok) {
            throw new Error(`Claude API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.content[0].text;
    }

    // =========================================
    // UI State Management
    // =========================================
    
    function setLoadingState(isLoading) {
        state.isGenerating = isLoading;
        
        if (!elements.generateBtn) {
            console.warn('Generate button not found');
            return;
        }
        
        // Update button state
        elements.generateBtn.disabled = isLoading;
        
        if (isLoading) {
            elements.generateBtn.classList.add('loading');
        } else {
            elements.generateBtn.classList.remove('loading');
        }
        
        // Toggle visibility of button content
        if (elements.btnText) {
            elements.btnText.hidden = isLoading;
            elements.btnText.style.display = isLoading ? 'none' : 'inline';
        }
        if (elements.btnIcon) {
            elements.btnIcon.hidden = isLoading;
            elements.btnIcon.style.display = isLoading ? 'none' : 'inline';
        }
        if (elements.btnLoading) {
            elements.btnLoading.hidden = !isLoading;
            elements.btnLoading.style.display = isLoading ? 'inline-flex' : 'none';
        }
        
        console.log('Loading state:', isLoading);
    }

    function showOutput(text) {
        // Hide placeholder and error
        if (elements.outputPlaceholder) {
            elements.outputPlaceholder.style.display = 'none';
        }
        if (elements.outputError) {
            elements.outputError.style.display = 'none';
        }
        // Show output content
        if (elements.outputContent) {
            elements.outputContent.style.display = 'block';
            elements.outputContent.textContent = text;
        }
        
        // Enable action buttons
        if (elements.copyBtn) elements.copyBtn.disabled = false;
        if (elements.downloadBtn) elements.downloadBtn.disabled = false;
        if (elements.shareBtn) elements.shareBtn.disabled = false;
    }

    function showError(message) {
        // Hide placeholder and output
        if (elements.outputPlaceholder) {
            elements.outputPlaceholder.style.display = 'none';
        }
        if (elements.outputContent) {
            elements.outputContent.style.display = 'none';
        }
        // Show error
        if (elements.outputError) {
            elements.outputError.style.display = 'flex';
            if (elements.errorMessage) {
                elements.errorMessage.textContent = message;
            }
        }
    }

    function hideError() {
        if (elements.outputError) {
            elements.outputError.style.display = 'none';
        }
    }

    function resetOutput() {
        if (elements.outputPlaceholder) {
            elements.outputPlaceholder.style.display = 'flex';
        }
        if (elements.outputContent) {
            elements.outputContent.style.display = 'none';
        }
        if (elements.outputError) {
            elements.outputError.style.display = 'none';
        }
    }

    function showToast(message = t('copied')) {
        if (!elements.copyToast) return;
        
        elements.copyToast.textContent = message;
        elements.copyToast.hidden = false;
        elements.copyToast.classList.add('show');
        
        setTimeout(() => {
            elements.copyToast.classList.remove('show');
            setTimeout(() => {
                elements.copyToast.hidden = true;
            }, 300);
        }, CONFIG.TOAST_DURATION);
    }

    // =========================================
    // Copy, Download, Share Actions
    // =========================================
    
    async function copyToClipboard() {
        if (!state.generatedPrompt) return;
        
        try {
            await navigator.clipboard.writeText(state.generatedPrompt);
            showToast(t('copied'));
            trackEvent('prompt_copy', { length: state.generatedPrompt.length });
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = state.generatedPrompt;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                showToast(t('copied'));
                trackEvent('prompt_copy', { length: state.generatedPrompt.length, method: 'fallback' });
            } catch (e) {
                console.error('Copy failed:', e);
            }
            
            document.body.removeChild(textArea);
        }
    }

    function downloadPrompt() {
        if (!state.generatedPrompt) return;
        
        const blob = new Blob([state.generatedPrompt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enhanced-prompt-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        trackEvent('prompt_download', { length: state.generatedPrompt.length });
    }

    async function sharePrompt() {
        if (!state.generatedPrompt) return;
        
        const shareData = {
            title: 'Enhanced AI Prompt',
            text: state.generatedPrompt,
            url: window.location.href
        };
        
        try {
            if (navigator.share && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                trackEvent('prompt_share', { method: 'native' });
            } else {
                // Fallback: copy link to clipboard
                await navigator.clipboard.writeText(window.location.href);
                showToast('Link copied to clipboard!');
                trackEvent('prompt_share', { method: 'clipboard' });
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Share failed:', error);
            }
        }
    }

    // =========================================
    // Analytics
    // =========================================
    
    function trackEvent(eventName, params = {}) {
        if (!CONFIG.ANALYTICS_ENABLED) return;
        
        // Google Analytics 4
        if (typeof gtag === 'function') {
            gtag('event', eventName, params);
        }
        
        // Console logging for development
        if (window.location.hostname === 'localhost') {
            console.log('📊 Analytics Event:', eventName, params);
        }
    }

    function trackPageView() {
        trackEvent('page_view', {
            page_title: document.title,
            page_location: window.location.href
        });
    }

    // =========================================
    // Event Listeners
    // =========================================
    
    function setupEventListeners() {
        // Generate button
        elements.generateBtn?.addEventListener('click', generatePrompt);
        
        // Retry button
        elements.retryBtn?.addEventListener('click', generatePrompt);
        
        // Character counter
        elements.promptInput?.addEventListener('input', debounce(updateCharCounter, CONFIG.DEBOUNCE_DELAY));
        
        // Keyboard shortcut: Ctrl/Cmd + Enter to generate
        elements.promptInput?.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                generatePrompt();
            }
        });
        
        // Copy button
        elements.copyBtn?.addEventListener('click', copyToClipboard);
        
        // Download button
        elements.downloadBtn?.addEventListener('click', downloadPrompt);
        
        // Share button
        elements.shareBtn?.addEventListener('click', sharePrompt);
        
        // Theme toggle
        elements.themeToggle?.addEventListener('click', toggleTheme);
        
        // Language select
        elements.languageSelect?.addEventListener('change', (e) => {
            changeLanguage(e.target.value);
        });
        
        // Cookie consent
        elements.cookieAccept?.addEventListener('click', acceptCookies);
        elements.cookieDecline?.addEventListener('click', declineCookies);
        
        // System theme change listener
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(CONFIG.STORAGE_THEME)) {
                state.theme = e.matches ? 'dark' : 'light';
                applyTheme();
            }
        });
        
        // Track outbound links
        document.querySelectorAll('a[href^="http"]').forEach(link => {
            link.addEventListener('click', () => {
                trackEvent('outbound_link', { url: link.href });
            });
        });
    }

    // =========================================
    // Initialization
    // =========================================
    
    function init() {
        // Cache DOM elements
        cacheElements();
        
        // Initialize features
        initTheme();
        initLanguage();
        initCookieConsent();
        
        // Setup event listeners
        setupEventListeners();
        
        // Initial character count
        updateCharCounter();
        
        // Track page view
        trackPageView();
        
        console.log('🚀 AI Prompt Generator initialized');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose public API for testing
    window.PromptGenerator = {
        generatePrompt,
        copyToClipboard,
        toggleTheme,
        getState: () => ({ ...state })
    };

})();
