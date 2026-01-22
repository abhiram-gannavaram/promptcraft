/**
 * AI Prompt Generator - Load Testing with k6
 * 
 * Installation: brew install k6 (macOS) or https://k6.io/docs/getting-started/installation/
 * Run: k6 run tests/load/load-test.js
 * 
 * Environment variables:
 * - API_URL: Base URL of the API (default: http://localhost:3000)
 * - VUS: Number of virtual users (default: 10)
 * - DURATION: Test duration (default: 30s)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const generateDuration = new Trend('generate_duration');

// Configuration
const API_URL = __ENV.API_URL || 'http://localhost:3000';

export const options = {
    // Test stages
    stages: [
        { duration: '30s', target: 10 },  // Ramp up to 10 users
        { duration: '1m', target: 10 },   // Stay at 10 users
        { duration: '30s', target: 50 },  // Ramp up to 50 users
        { duration: '1m', target: 50 },   // Stay at 50 users
        { duration: '30s', target: 0 },   // Ramp down
    ],

    // Thresholds
    thresholds: {
        http_req_duration: ['p(95)<2000'],  // 95% of requests under 2s
        http_req_failed: ['rate<0.05'],     // Error rate under 5%
        errors: ['rate<0.05'],              // Custom error rate under 5%
        generate_duration: ['p(95)<3000'],  // 95% of generations under 3s
    },
};

// Sample prompts for testing
const samplePrompts = [
    'Write a story about a brave knight',
    'Explain quantum computing simply',
    'Create a recipe for chocolate cake',
    'Describe a sunset over the ocean',
    'Write a poem about autumn leaves',
    'Explain how airplanes fly',
    'Create a workout routine for beginners',
    'Write a product description for headphones',
    'Explain the water cycle to a child',
    'Create a travel itinerary for Paris',
];

// Test scenarios
export default function () {
    // Scenario 1: Generate prompt
    testGeneratePrompt();
    
    sleep(1);
    
    // Scenario 2: Health check
    testHealthCheck();
    
    sleep(1);
}

function testGeneratePrompt() {
    const prompt = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];
    
    const payload = JSON.stringify({
        prompt: prompt,
        language: 'en'
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
        tags: { name: 'GeneratePrompt' },
    };

    const startTime = Date.now();
    const response = http.post(`${API_URL}/api/generate`, payload, params);
    const duration = Date.now() - startTime;

    generateDuration.add(duration);

    const success = check(response, {
        'status is 200': (r) => r.status === 200,
        'response has enhancedPrompt': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.enhancedPrompt && body.enhancedPrompt.length > 0;
            } catch {
                return false;
            }
        },
        'response time OK': (r) => r.timings.duration < 3000,
    });

    errorRate.add(!success);
}

function testHealthCheck() {
    const response = http.get(`${API_URL}/health`, {
        tags: { name: 'HealthCheck' },
    });

    const success = check(response, {
        'health check status is 200': (r) => r.status === 200,
        'health check response OK': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.status === 'healthy';
            } catch {
                return false;
            }
        },
    });

    errorRate.add(!success);
}

// Lifecycle hooks
export function setup() {
    console.log(`Starting load test against: ${API_URL}`);
    
    // Verify API is accessible
    const response = http.get(`${API_URL}/health`);
    if (response.status !== 200) {
        console.error('API health check failed!');
    }
    
    return { startTime: Date.now() };
}

export function teardown(data) {
    const duration = (Date.now() - data.startTime) / 1000;
    console.log(`Load test completed in ${duration.toFixed(2)} seconds`);
}

// Handle summary
export function handleSummary(data) {
    return {
        'tests/load/summary.json': JSON.stringify(data, null, 2),
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
    };
}

function textSummary(data, options) {
    const indent = options.indent || '';
    let summary = '\n';
    
    summary += `${indent}=== Load Test Summary ===\n\n`;
    
    // Request stats
    const reqs = data.metrics.http_reqs;
    if (reqs) {
        summary += `${indent}Total Requests: ${reqs.values.count}\n`;
        summary += `${indent}Request Rate: ${(reqs.values.rate).toFixed(2)} req/s\n\n`;
    }
    
    // Duration stats
    const duration = data.metrics.http_req_duration;
    if (duration) {
        summary += `${indent}Response Times:\n`;
        summary += `${indent}  - Average: ${duration.values.avg.toFixed(2)}ms\n`;
        summary += `${indent}  - Median: ${duration.values.med.toFixed(2)}ms\n`;
        summary += `${indent}  - p(90): ${duration.values['p(90)'].toFixed(2)}ms\n`;
        summary += `${indent}  - p(95): ${duration.values['p(95)'].toFixed(2)}ms\n\n`;
    }
    
    // Error stats
    const errors = data.metrics.http_req_failed;
    if (errors) {
        const errorPct = (errors.values.rate * 100).toFixed(2);
        summary += `${indent}Error Rate: ${errorPct}%\n`;
    }
    
    // Threshold results
    summary += `\n${indent}Threshold Results:\n`;
    for (const [name, threshold] of Object.entries(data.thresholds || {})) {
        const status = threshold.ok ? '✅' : '❌';
        summary += `${indent}  ${status} ${name}\n`;
    }
    
    return summary;
}
