/**
 * AI Prompt Generator - Unit Tests
 * Run with: npm test
 */

// Mock DOM environment
const mockDocument = {
    getElementById: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(),
    createElement: jest.fn(() => ({
        classList: { add: jest.fn(), remove: jest.fn() },
        setAttribute: jest.fn(),
        appendChild: jest.fn(),
        style: {}
    })),
    body: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
    }
};

const mockLocalStorage = {
    store: {},
    getItem: jest.fn((key) => mockLocalStorage.store[key] || null),
    setItem: jest.fn((key, value) => { mockLocalStorage.store[key] = value; }),
    removeItem: jest.fn((key) => { delete mockLocalStorage.store[key]; }),
    clear: jest.fn(() => { mockLocalStorage.store = {}; })
};

global.document = mockDocument;
global.localStorage = mockLocalStorage;
global.navigator = { clipboard: { writeText: jest.fn() } };

describe('Character Counter', () => {
    const MAX_CHARS = 10000;
    
    function getCharCount(text) {
        return text.length;
    }
    
    function getRemainingChars(text) {
        return MAX_CHARS - text.length;
    }
    
    function isOverLimit(text) {
        return text.length > MAX_CHARS;
    }

    test('should count characters correctly', () => {
        expect(getCharCount('')).toBe(0);
        expect(getCharCount('Hello')).toBe(5);
        expect(getCharCount('Hello World!')).toBe(12);
    });

    test('should calculate remaining characters', () => {
        expect(getRemainingChars('')).toBe(10000);
        expect(getRemainingChars('Hello')).toBe(9995);
    });

    test('should detect when over limit', () => {
        expect(isOverLimit('a'.repeat(9999))).toBe(false);
        expect(isOverLimit('a'.repeat(10000))).toBe(false);
        expect(isOverLimit('a'.repeat(10001))).toBe(true);
    });
});

describe('Theme Management', () => {
    beforeEach(() => {
        mockLocalStorage.clear();
    });

    function getStoredTheme() {
        return localStorage.getItem('theme');
    }

    function setTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    function toggleTheme(currentTheme) {
        return currentTheme === 'dark' ? 'light' : 'dark';
    }

    test('should return null when no theme stored', () => {
        expect(getStoredTheme()).toBeNull();
    });

    test('should store theme preference', () => {
        setTheme('dark');
        expect(getStoredTheme()).toBe('dark');
    });

    test('should toggle between themes', () => {
        expect(toggleTheme('light')).toBe('dark');
        expect(toggleTheme('dark')).toBe('light');
    });
});

describe('Input Validation', () => {
    function validatePrompt(prompt) {
        const errors = [];
        
        if (!prompt || prompt.trim().length === 0) {
            errors.push('Prompt cannot be empty');
        }
        
        if (prompt && prompt.length > 10000) {
            errors.push('Prompt exceeds maximum length of 10,000 characters');
        }
        
        if (prompt && prompt.length < 10) {
            errors.push('Prompt must be at least 10 characters');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    test('should reject empty prompts', () => {
        const result = validatePrompt('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Prompt cannot be empty');
    });

    test('should reject prompts that are too short', () => {
        const result = validatePrompt('Hi');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Prompt must be at least 10 characters');
    });

    test('should reject prompts that exceed limit', () => {
        const result = validatePrompt('a'.repeat(10001));
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Prompt exceeds maximum length of 10,000 characters');
    });

    test('should accept valid prompts', () => {
        const result = validatePrompt('This is a valid prompt for testing');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
});

describe('Rate Limiting', () => {
    function createRateLimiter(maxRequests, windowMs) {
        const requests = [];
        
        return {
            canMakeRequest: () => {
                const now = Date.now();
                // Remove old requests outside the window
                while (requests.length > 0 && requests[0] < now - windowMs) {
                    requests.shift();
                }
                return requests.length < maxRequests;
            },
            recordRequest: () => {
                requests.push(Date.now());
            },
            getRemainingRequests: () => {
                const now = Date.now();
                while (requests.length > 0 && requests[0] < now - windowMs) {
                    requests.shift();
                }
                return maxRequests - requests.length;
            }
        };
    }

    test('should allow requests under limit', () => {
        const limiter = createRateLimiter(5, 60000);
        expect(limiter.canMakeRequest()).toBe(true);
    });

    test('should track remaining requests', () => {
        const limiter = createRateLimiter(5, 60000);
        expect(limiter.getRemainingRequests()).toBe(5);
        
        limiter.recordRequest();
        expect(limiter.getRemainingRequests()).toBe(4);
        
        limiter.recordRequest();
        limiter.recordRequest();
        expect(limiter.getRemainingRequests()).toBe(2);
    });

    test('should block requests over limit', () => {
        const limiter = createRateLimiter(2, 60000);
        
        limiter.recordRequest();
        limiter.recordRequest();
        
        expect(limiter.canMakeRequest()).toBe(false);
    });
});

describe('Language Support', () => {
    const translations = {
        en: {
            title: 'AI Prompt Generator',
            placeholder: 'Enter your prompt...',
            generate: 'Generate'
        },
        es: {
            title: 'Generador de Prompts IA',
            placeholder: 'Introduce tu prompt...',
            generate: 'Generar'
        },
        fr: {
            title: 'Générateur de Prompts IA',
            placeholder: 'Entrez votre prompt...',
            generate: 'Générer'
        },
        de: {
            title: 'KI-Prompt-Generator',
            placeholder: 'Geben Sie Ihren Prompt ein...',
            generate: 'Generieren'
        }
    };

    function translate(key, lang) {
        return translations[lang]?.[key] || translations.en[key] || key;
    }

    function getSupportedLanguages() {
        return Object.keys(translations);
    }

    test('should return correct translations', () => {
        expect(translate('title', 'en')).toBe('AI Prompt Generator');
        expect(translate('title', 'es')).toBe('Generador de Prompts IA');
        expect(translate('title', 'fr')).toBe('Générateur de Prompts IA');
        expect(translate('title', 'de')).toBe('KI-Prompt-Generator');
    });

    test('should fallback to English for unknown language', () => {
        expect(translate('title', 'xx')).toBe('AI Prompt Generator');
    });

    test('should return key for unknown translation', () => {
        expect(translate('unknown_key', 'en')).toBe('unknown_key');
    });

    test('should list all supported languages', () => {
        expect(getSupportedLanguages()).toEqual(['en', 'es', 'fr', 'de']);
    });
});

describe('Cookie Consent', () => {
    beforeEach(() => {
        mockLocalStorage.clear();
    });

    function hasConsent() {
        return localStorage.getItem('cookieConsent') === 'accepted';
    }

    function acceptCookies() {
        localStorage.setItem('cookieConsent', 'accepted');
    }

    function declineCookies() {
        localStorage.setItem('cookieConsent', 'declined');
    }

    test('should return false when no consent given', () => {
        expect(hasConsent()).toBe(false);
    });

    test('should return true when cookies accepted', () => {
        acceptCookies();
        expect(hasConsent()).toBe(true);
    });

    test('should return false when cookies declined', () => {
        declineCookies();
        expect(hasConsent()).toBe(false);
    });
});

describe('Debounce Function', () => {
    jest.useFakeTimers();

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

    test('should delay function execution', () => {
        const mockFn = jest.fn();
        const debouncedFn = debounce(mockFn, 300);

        debouncedFn();
        expect(mockFn).not.toHaveBeenCalled();

        jest.advanceTimersByTime(300);
        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should only call once for rapid calls', () => {
        const mockFn = jest.fn();
        const debouncedFn = debounce(mockFn, 300);

        debouncedFn();
        debouncedFn();
        debouncedFn();
        debouncedFn();

        jest.advanceTimersByTime(300);
        expect(mockFn).toHaveBeenCalledTimes(1);
    });
});

describe('URL Validation', () => {
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch {
            return false;
        }
    }

    test('should validate correct URLs', () => {
        expect(isValidUrl('https://example.com')).toBe(true);
        expect(isValidUrl('http://localhost:3000')).toBe(true);
        expect(isValidUrl('https://api.example.com/v1/endpoint')).toBe(true);
    });

    test('should reject invalid URLs', () => {
        expect(isValidUrl('not a url')).toBe(false);
        expect(isValidUrl('example.com')).toBe(false);
        expect(isValidUrl('')).toBe(false);
    });
});
