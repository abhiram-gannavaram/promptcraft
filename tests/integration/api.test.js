/**
 * AI Prompt Generator - Integration Tests
 * Run with: npm run test:integration
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

describe('API Integration Tests', () => {
    // Skip if no API URL is configured
    const itif = (condition) => condition ? it : it.skip;
    const apiConfigured = !!process.env.API_URL;

    describe('Health Check', () => {
        itif(apiConfigured)('should return healthy status', async () => {
            const response = await fetch(`${API_BASE_URL}/health`);
            expect(response.status).toBe(200);
            
            const data = await response.json();
            expect(data.status).toBe('healthy');
        });
    });

    describe('Generate Prompt Endpoint', () => {
        itif(apiConfigured)('should generate enhanced prompt', async () => {
            const response = await fetch(`${API_BASE_URL}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: 'Write a story about a dragon',
                    language: 'en'
                })
            });

            expect(response.status).toBe(200);
            
            const data = await response.json();
            expect(data).toHaveProperty('enhancedPrompt');
            expect(data.enhancedPrompt.length).toBeGreaterThan(0);
        });

        itif(apiConfigured)('should reject empty prompts', async () => {
            const response = await fetch(`${API_BASE_URL}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: '',
                    language: 'en'
                })
            });

            expect(response.status).toBe(400);
        });

        itif(apiConfigured)('should respect rate limits', async () => {
            const requests = Array(100).fill().map(() => 
                fetch(`${API_BASE_URL}/api/generate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        prompt: 'Test prompt',
                        language: 'en'
                    })
                })
            );

            const responses = await Promise.all(requests);
            const rateLimited = responses.some(r => r.status === 429);
            
            // At least some requests should be rate limited
            expect(rateLimited).toBe(true);
        }, 30000);
    });

    describe('CORS Headers', () => {
        itif(apiConfigured)('should include proper CORS headers', async () => {
            const response = await fetch(`${API_BASE_URL}/api/generate`, {
                method: 'OPTIONS'
            });

            expect(response.headers.get('access-control-allow-origin')).toBeTruthy();
            expect(response.headers.get('access-control-allow-methods')).toContain('POST');
        });
    });
});

describe('Frontend Integration', () => {
    // These tests require a browser environment
    // Run with Playwright or similar

    test.todo('should load main page successfully');
    test.todo('should display character counter');
    test.todo('should toggle dark mode');
    test.todo('should change language');
    test.todo('should show loading state during generation');
    test.todo('should copy result to clipboard');
    test.todo('should download result as text file');
});
