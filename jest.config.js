/** @type {import('jest').Config} */
module.exports = {
    // Test environment
    testEnvironment: 'node',
    
    // Test file patterns
    testMatch: [
        '**/tests/unit/**/*.test.js',
        '**/tests/integration/**/*.test.js'
    ],
    
    // Coverage configuration
    collectCoverageFrom: [
        'frontend/js/**/*.js',
        '!**/node_modules/**',
        '!**/vendor/**'
    ],
    
    coverageDirectory: 'coverage',
    
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },
    
    // Module paths
    moduleDirectories: ['node_modules', 'frontend'],
    
    // Setup files
    setupFilesAfterEnv: ['./tests/setup.js'],
    
    // Timeout
    testTimeout: 10000,
    
    // Verbose output
    verbose: true,
    
    // Clear mocks between tests
    clearMocks: true,
    
    // Collect coverage on CI
    collectCoverage: process.env.CI === 'true',
    
    // Reporter
    reporters: [
        'default',
        ...(process.env.CI ? [['github-actions', { silent: false }]] : [])
    ]
};
