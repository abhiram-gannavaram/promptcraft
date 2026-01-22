/**
 * Jest Test Setup
 */

// Set test timeout
jest.setTimeout(10000);

// Mock console.error to fail tests on unexpected errors
const originalError = console.error;
beforeAll(() => {
    console.error = (...args) => {
        // Allow expected errors
        if (
            typeof args[0] === 'string' &&
            (args[0].includes('Warning:') || args[0].includes('Expected'))
        ) {
            return;
        }
        originalError.apply(console, args);
    };
});

afterAll(() => {
    console.error = originalError;
});

// Global test utilities
global.wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

global.mockFetch = (response, options = {}) => {
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok: options.ok !== false,
            status: options.status || 200,
            json: () => Promise.resolve(response),
            text: () => Promise.resolve(JSON.stringify(response)),
            headers: new Map(Object.entries(options.headers || {}))
        })
    );
};

// Reset mocks after each test
afterEach(() => {
    jest.clearAllMocks();
});
