/**
 * AWS Bedrock-powered Prompt Generator
 * Uses Claude 3.5 Haiku for intelligent prompt enhancement
 * Cost: ~$0.0004 per request
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });

const PROMPTS_TABLE = process.env.PROMPTS_TABLE || 'promtcraft-production-prompts';
const RATE_LIMIT_TABLE = process.env.RATE_LIMIT_TABLE || 'promtcraft-production-ratelimit';

// Model selection - using available active models
const BEDROCK_MODELS = {
    'haiku': 'us.anthropic.claude-3-haiku-20240307-v1:0',      // Active, fastest, cheapest ($0.25/M input, $1.25/M output)
    'sonnet': 'us.anthropic.claude-3-sonnet-20240229-v1:0',    // Active, better quality ($3/M input, $15/M output)
    'opus': 'us.anthropic.claude-3-opus-20240229-v1:0',        // Active, best quality ($15/M input, $75/M output)
    'haiku-direct': 'anthropic.claude-3-haiku-20240307-v1:0',  // Direct model (no inference profile)
    'haiku-35': 'anthropic.claude-3-5-haiku-20241022-v1:0'     // Claude 3.5 Haiku (if available)
};

const SELECTED_MODEL = BEDROCK_MODELS.haiku; // Using Claude 3 Haiku - proven to work

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
    'https://promtcraft.in',
    'https://www.promtcraft.in',
    'http://localhost:3000', // For local development
    'http://localhost:8080'
];

// Security headers
const SECURITY_HEADERS = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};

const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...SECURITY_HEADERS
};

/**
 * Call AWS Bedrock Claude API
 */
async function enhancePromptWithBedrock(userPrompt, options = {}) {
    const tone = options.tone || 'professional';
    const length = options.length || 'balanced';
    
    const systemPrompt = `You are an expert prompt engineer. Transform user's rough ideas into clear, effective prompts for AI models.

RULES:
1. Keep the user's original intent and meaning
2. Make it specific and actionable
3. Add helpful context where needed
4. Fix grammar and spelling
5. Match the requested tone: ${tone}
6. Match requested length: ${length === 'concise' ? '50-100 words' : length === 'detailed' ? '200-400 words' : '100-200 words'}
7. If user mentions images/photos, preserve that context
8. Don't add unnecessary complexity - enhance, don't completely rewrite

Output the enhanced prompt directly - no explanations, no meta-text.`;

    const userMessage = `Enhance this prompt:\n\n"${userPrompt}"`;

    const requestBody = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1024,
        temperature: 0.7,
        messages: [
            {
                role: "user",
                content: userMessage
            }
        ],
        system: systemPrompt
    };

    try {
        const command = new InvokeModelCommand({
            modelId: SELECTED_MODEL,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify(requestBody)
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        
        // Extract the enhanced prompt
        const enhancedPrompt = responseBody.content[0].text.trim();
        
        // Detect intent from the original prompt
        const intent = detectIntent(userPrompt);
        
        return {
            enhancedPrompt,
            metadata: {
                type: intent.type,
                model: SELECTED_MODEL.split('/').pop(),
                inputTokens: responseBody.usage.input_tokens,
                outputTokens: responseBody.usage.output_tokens,
                cost: calculateCost(responseBody.usage)
            }
        };
    } catch (error) {
        // Log detailed error server-side only
        console.error('Bedrock API error:', {
            message: error.message,
            code: error.code,
            statusCode: error.$metadata?.httpStatusCode
        });
        // Return generic error to client
        throw new Error('AI service temporarily unavailable. Please try again.');
    }
}

/**
 * Calculate cost of API call
 */
function calculateCost(usage) {
    const costs = {
        'haiku': { input: 0.00000025, output: 0.00000125 },   // $0.25/$1.25 per 1M tokens
        'sonnet': { input: 0.000003, output: 0.000015 },       // $3/$15 per 1M tokens
        'opus': { input: 0.000015, output: 0.000075 }          // $15/$75 per 1M tokens
    };
    
    const modelType = SELECTED_MODEL.includes('haiku') ? 'haiku' : 
                     SELECTED_MODEL.includes('sonnet') ? 'sonnet' : 'opus';
    
    const cost = (usage.input_tokens * costs[modelType].input) + 
                 (usage.output_tokens * costs[modelType].output);
    
    return parseFloat(cost.toFixed(6));
}

/**
 * Intent detection (simple version for metadata)
 */
function detectIntent(prompt) {
    const lower = prompt.toLowerCase();
    
    if (lower.match(/\b(poem|poetry)\b/)) return { type: 'poetry' };
    if (lower.match(/\b(code|coding|program|debug)\b/)) return { type: 'code_writing' };
    if (lower.match(/\b(app|application|mobile)\b/)) return { type: 'app_development' };
    if (lower.match(/\b(website|web app|site)\b/)) return { type: 'web_development' };
    if (lower.match(/\b(story|tale|fiction)\b/)) return { type: 'creative_writing' };
    if (lower.match(/\b(blog|article|content)\b/)) return { type: 'content_writing' };
    if (lower.match(/\b(explain|understand|learn)\b/)) return { type: 'explanation' };
    if (lower.match(/\b(image|picture|photo|art)\b/)) return { type: 'image_generation' };
    
    return { type: 'general' };
}

/**
 * Validate IP address format
 */
function validateIP(ip) {
    if (typeof ip !== 'string') {
        throw new Error('Invalid IP format');
    }
    // IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv6 validation (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    
    if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
        throw new Error('Invalid IP address');
    }
    return ip;
}

/**
 * Rate limiting check
 */
async function checkRateLimit(ip) {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 10;

    try {
        // Validate IP before using in database query
        const validatedIp = validateIP(ip);
        
        const result = await docClient.send(new GetCommand({
            TableName: RATE_LIMIT_TABLE,
            Key: { ip: validatedIp }
        }));

        if (result.Item) {
            const requests = result.Item.requests || [];
            const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);

            if (recentRequests.length >= maxRequests) {
                return false;
            }

            recentRequests.push(now);
            await docClient.send(new PutCommand({
                TableName: RATE_LIMIT_TABLE,
                Item: { ip: validatedIp, requests: recentRequests, updatedAt: now }
            }));
        } else {
            await docClient.send(new PutCommand({
                TableName: RATE_LIMIT_TABLE,
                Item: { ip: validatedIp, requests: [now], updatedAt: now }
            }));
        }

        return true;
    } catch (error) {
        console.error('Rate limit check error:', error);
        return true; // Allow on error
    }
}

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
    // Determine CORS origin
    const origin = event.headers?.origin || event.headers?.Origin;
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    
    // Add CORS origin to headers
    const responseHeaders = {
        ...headers,
        'Access-Control-Allow-Origin': allowedOrigin
    };
    
    // Only log in development/debugging
    if (process.env.LOG_LEVEL === 'debug') {
        console.log('Event:', JSON.stringify(event, null, 2));
    }

    // Handle OPTIONS for CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: responseHeaders,
            body: ''
        };
    }

    try {
        // Parse request body
        const body = JSON.parse(event.body || '{}');
        const { prompt, tone, length, model } = body;

        // Validation
        if (!prompt || typeof prompt !== 'string') {
            return {
                statusCode: 400,
                headers: responseHeaders,
                body: JSON.stringify({ 
                    error: 'Prompt is required and must be a string' 
                })
            };
        }

        if (prompt.length < 1 || prompt.length > 10000) {
            return {
                statusCode: 400,
                headers: responseHeaders,
                body: JSON.stringify({ 
                    error: 'Prompt must be between 1 and 10,000 characters' 
                })
            };
        }

        // Rate limiting
        const ip = event.requestContext?.identity?.sourceIp || 'unknown';
        if (!await checkRateLimit(ip)) {
            return {
                statusCode: 429,
                headers: responseHeaders,
                body: JSON.stringify({ 
                    error: 'Rate limit exceeded. Please try again in a minute.' 
                })
            };
        }

        // Enhance prompt with Bedrock
        const startTime = Date.now();
        const result = await enhancePromptWithBedrock(prompt, { tone, length, model });
        const processingTime = Date.now() - startTime;

        // Save to DynamoDB (optional - for analytics)
        try {
            await docClient.send(new PutCommand({
                TableName: PROMPTS_TABLE,
                Item: {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    ip,
                    originalPrompt: prompt,
                    enhancedPrompt: result.enhancedPrompt,
                    type: result.metadata.type,
                    model: result.metadata.model,
                    cost: result.metadata.cost,
                    processingTime,
                    timestamp: Date.now(),
                    options: { tone, length, model }
                }
            }));
        } catch (dbError) {
            console.error('DynamoDB save error:', dbError);
            // Continue even if save fails
        }

        // Return enhanced prompt
        return {
            statusCode: 200,
            headers: responseHeaders,
            body: JSON.stringify({
                enhancedPrompt: result.enhancedPrompt,
                metadata: {
                    type: result.metadata.type,
                    processingTime,
                    model: result.metadata.model,
                    tokens: {
                        input: result.metadata.inputTokens,
                        output: result.metadata.outputTokens
                    },
                    cost: result.metadata.cost
                }
            })
        };

    } catch (error) {
        // Log detailed error server-side
        console.error('Lambda handler error:', {
            message: error.message,
            stack: error.stack
        });
        
        return {
            statusCode: 500,
            headers: responseHeaders,
            body: JSON.stringify({ 
                error: 'An error occurred processing your request. Please try again.'
            })
        };
    }
};
