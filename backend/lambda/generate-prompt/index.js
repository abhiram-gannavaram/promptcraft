/**
 * AI Prompt Generator - Lambda Handler
 * 
 * This file should be deployed as an AWS Lambda function
 * It handles prompt enhancement using Claude or OpenAI APIs
 */

const AWS = require('aws-sdk');

// Initialize AWS clients
const secretsManager = new AWS.SecretsManager();
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Environment variables
const SECRETS_ARN = process.env.SECRETS_ARN;
const TABLE_NAME = process.env.TABLE_NAME || 'ai-prompt-generator-usage';
const RATE_LIMIT_TABLE = process.env.RATE_LIMIT_TABLE || 'ai-prompt-generator-rate-limit';

// Cache for secrets
let cachedSecrets = null;
let secretsExpiry = 0;

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
    console.log('Event received:', JSON.stringify(event));
    
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return createResponse(200, { message: 'OK' });
    }

    try {
        // Parse request body
        const body = JSON.parse(event.body || '{}');
        const { prompt, language = 'en' } = body;

        // Validate input
        if (!prompt || prompt.trim().length === 0) {
            return createResponse(400, { 
                error: 'Prompt is required',
                code: 'MISSING_PROMPT'
            });
        }

        if (prompt.length > 10000) {
            return createResponse(400, { 
                error: 'Prompt exceeds maximum length of 10,000 characters',
                code: 'PROMPT_TOO_LONG'
            });
        }

        // Get client IP for rate limiting
        const clientIp = event.requestContext?.identity?.sourceIp || 
                        event.headers?.['X-Forwarded-For']?.split(',')[0] || 
                        'unknown';

        // Check rate limit
        const rateLimitResult = await checkRateLimit(clientIp);
        if (!rateLimitResult.allowed) {
            return createResponse(429, {
                error: 'Rate limit exceeded. Please try again later.',
                code: 'RATE_LIMITED',
                retryAfter: rateLimitResult.retryAfter
            });
        }

        // Get API keys from Secrets Manager
        const secrets = await getSecrets();

        // Generate enhanced prompt
        const enhancedPrompt = await generateEnhancedPrompt(prompt, language, secrets);

        // Log usage
        await logUsage(clientIp, prompt.length, enhancedPrompt.length);

        return createResponse(200, {
            enhancedPrompt,
            originalLength: prompt.length,
            enhancedLength: enhancedPrompt.length,
            language
        });

    } catch (error) {
        console.error('Error processing request:', error);
        
        return createResponse(500, {
            error: 'An error occurred while processing your request',
            code: 'INTERNAL_ERROR'
        });
    }
};

/**
 * Create HTTP response with CORS headers
 */
function createResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY'
        },
        body: JSON.stringify(body)
    };
}

/**
 * Get secrets from AWS Secrets Manager with caching
 */
async function getSecrets() {
    const now = Date.now();
    
    // Return cached secrets if still valid (5 minute cache)
    if (cachedSecrets && secretsExpiry > now) {
        return cachedSecrets;
    }

    try {
        const response = await secretsManager.getSecretValue({
            SecretId: SECRETS_ARN
        }).promise();

        cachedSecrets = JSON.parse(response.SecretString);
        secretsExpiry = now + (5 * 60 * 1000); // 5 minutes
        
        return cachedSecrets;
    } catch (error) {
        console.error('Error fetching secrets:', error);
        throw new Error('Failed to retrieve API configuration');
    }
}

/**
 * Check rate limit for client IP
 */
async function checkRateLimit(clientIp) {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 10; // 10 requests per minute

    try {
        const result = await dynamodb.get({
            TableName: RATE_LIMIT_TABLE,
            Key: { ip: clientIp }
        }).promise();

        const item = result.Item;

        if (!item || item.windowStart < now - windowMs) {
            // No record or expired window - allow and create new window
            await dynamodb.put({
                TableName: RATE_LIMIT_TABLE,
                Item: {
                    ip: clientIp,
                    windowStart: now,
                    count: 1,
                    ttl: Math.floor((now + windowMs) / 1000)
                }
            }).promise();

            return { allowed: true };
        }

        if (item.count >= maxRequests) {
            // Rate limit exceeded
            const retryAfter = Math.ceil((item.windowStart + windowMs - now) / 1000);
            return { allowed: false, retryAfter };
        }

        // Increment counter
        await dynamodb.update({
            TableName: RATE_LIMIT_TABLE,
            Key: { ip: clientIp },
            UpdateExpression: 'SET #count = #count + :inc',
            ExpressionAttributeNames: { '#count': 'count' },
            ExpressionAttributeValues: { ':inc': 1 }
        }).promise();

        return { allowed: true };

    } catch (error) {
        console.error('Rate limit check error:', error);
        // Allow on error to avoid blocking users
        return { allowed: true };
    }
}

/**
 * Log usage to DynamoDB
 */
async function logUsage(clientIp, inputLength, outputLength) {
    try {
        await dynamodb.put({
            TableName: TABLE_NAME,
            Item: {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date().toISOString(),
                clientIp: hashIp(clientIp),
                inputLength,
                outputLength,
                ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days TTL
            }
        }).promise();
    } catch (error) {
        console.error('Usage logging error:', error);
        // Don't fail the request if logging fails
    }
}

/**
 * Hash IP address for privacy
 */
function hashIp(ip) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

/**
 * Generate enhanced prompt using Claude API
 */
async function generateEnhancedPrompt(prompt, language, secrets) {
    const https = require('https');
    
    // System prompt for enhancement
    const systemPrompt = getSystemPrompt(language);
    
    // Try Claude first, fallback to OpenAI
    if (secrets.ANTHROPIC_API_KEY) {
        return await callClaudeAPI(prompt, systemPrompt, secrets.ANTHROPIC_API_KEY);
    } else if (secrets.OPENAI_API_KEY) {
        return await callOpenAIAPI(prompt, systemPrompt, secrets.OPENAI_API_KEY);
    } else {
        throw new Error('No API keys configured');
    }
}

/**
 * Get system prompt based on language
 */
function getSystemPrompt(language) {
    const prompts = {
        en: `You are an expert prompt engineer. Your task is to take a basic prompt and transform it into a highly effective, detailed prompt that will produce better results from AI systems.

Guidelines:
- Add specific context and details
- Include clear objectives and constraints
- Specify the desired format and tone
- Add relevant examples if helpful
- Maintain the original intent
- Keep the enhanced prompt concise but comprehensive

Return only the enhanced prompt, no explanations.`,

        es: `Eres un experto en ingeniería de prompts. Tu tarea es tomar un prompt básico y transformarlo en un prompt altamente efectivo y detallado que producirá mejores resultados de los sistemas de IA.

Directrices:
- Añade contexto específico y detalles
- Incluye objetivos y restricciones claras
- Especifica el formato y tono deseados
- Añade ejemplos relevantes si es útil
- Mantén la intención original
- Mantén el prompt mejorado conciso pero completo

Devuelve solo el prompt mejorado, sin explicaciones.`,

        fr: `Vous êtes un expert en ingénierie de prompts. Votre tâche est de prendre un prompt basique et de le transformer en un prompt très efficace et détaillé qui produira de meilleurs résultats des systèmes d'IA.

Directives:
- Ajoutez un contexte spécifique et des détails
- Incluez des objectifs et des contraintes clairs
- Spécifiez le format et le ton souhaités
- Ajoutez des exemples pertinents si utile
- Maintenez l'intention originale
- Gardez le prompt amélioré concis mais complet

Retournez uniquement le prompt amélioré, pas d'explications.`,

        de: `Sie sind ein Experte für Prompt-Engineering. Ihre Aufgabe ist es, einen einfachen Prompt in einen hocheffektiven, detaillierten Prompt umzuwandeln, der bessere Ergebnisse von KI-Systemen liefert.

Richtlinien:
- Fügen Sie spezifischen Kontext und Details hinzu
- Fügen Sie klare Ziele und Einschränkungen hinzu
- Geben Sie das gewünschte Format und den Ton an
- Fügen Sie relevante Beispiele hinzu, wenn hilfreich
- Behalten Sie die ursprüngliche Absicht bei
- Halten Sie den verbesserten Prompt prägnant, aber umfassend

Geben Sie nur den verbesserten Prompt zurück, keine Erklärungen.`
    };

    return prompts[language] || prompts.en;
}

/**
 * Call Anthropic Claude API
 */
async function callClaudeAPI(prompt, systemPrompt, apiKey) {
    return new Promise((resolve, reject) => {
        const https = require('https');
        
        const data = JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 2000,
            system: systemPrompt,
            messages: [
                { role: 'user', content: prompt }
            ]
        });

        const options = {
            hostname: 'api.anthropic.com',
            port: 443,
            path: '/v1/messages',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    if (res.statusCode === 200 && response.content?.[0]?.text) {
                        resolve(response.content[0].text);
                    } else {
                        reject(new Error(`Claude API error: ${response.error?.message || 'Unknown error'}`));
                    }
                } catch (e) {
                    reject(new Error('Failed to parse Claude API response'));
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('Claude API timeout'));
        });
        
        req.write(data);
        req.end();
    });
}

/**
 * Call OpenAI API (fallback)
 */
async function callOpenAIAPI(prompt, systemPrompt, apiKey) {
    return new Promise((resolve, reject) => {
        const https = require('https');
        
        const data = JSON.stringify({
            model: 'gpt-3.5-turbo',
            max_tokens: 2000,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ]
        });

        const options = {
            hostname: 'api.openai.com',
            port: 443,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    if (res.statusCode === 200 && response.choices?.[0]?.message?.content) {
                        resolve(response.choices[0].message.content);
                    } else {
                        reject(new Error(`OpenAI API error: ${response.error?.message || 'Unknown error'}`));
                    }
                } catch (e) {
                    reject(new Error('Failed to parse OpenAI API response'));
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('OpenAI API timeout'));
        });
        
        req.write(data);
        req.end();
    });
}
