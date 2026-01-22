const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { PromptFramework } = require('./promptFramework');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const PROMPTS_TABLE = process.env.PROMPTS_TABLE || 'promtcraft-production-prompts';
const RATE_LIMIT_TABLE = process.env.RATE_LIMIT_TABLE || 'promtcraft-production-ratelimit';

const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

// Spell corrections
function fixSpelling(text) {
    const corrections = {
        'andoid': 'Android', 'talkng': 'talking', 'builld': 'build',
        'teh': 'the', 'adn': 'and', 'wiht': 'with'
    };
    
    Object.keys(corrections).forEach(wrong => {
        text = text.replace(new RegExp('\\b' + wrong + '\\b', 'gi'), corrections[wrong]);
    });
    
    return text.trim();
}

// Advanced Intent Detection
function detectIntent(prompt) {
    const lower = prompt.toLowerCase();
    
    // Content/Blog writing (check BEFORE creative writing)
    if (lower.match(/\b(blog|article|post|content|essay|copywriting|seo|marketing)\b/)) {
        const topic = prompt.replace(/^(write|create).*?(blog|article|post|content).*?(about|on)\s+/i, '').trim();
        return { type: 'content_writing', topic };
    }
    
    // Creative writing (fiction, stories, poems)
    if (lower.match(/\b(story|stories|tale|narrative|fiction|novel|poem|poetry|screenplay)\b/)) {
        const subject = prompt.replace(/^(write|create|tell me).*?(story|tale|fiction|narrative).*?(about|on)\s+/i, '').trim();
        return { type: 'creative_writing', subject };
    }
    
    // App/Mobile development
    if (lower.match(/\b(build|create|make|develop).*(app|application|mobile|android|ios)\b/)) {
        const platform = lower.includes('android') ? 'Android' : lower.includes('ios') ? 'iOS' : 'Mobile';
        const features = [];
        if (lower.match(/\b(talk|speak|voice|tts)\b/)) features.push('text-to-speech');
        if (lower.match(/\b(mic|microphone|record|listen)\b/)) features.push('microphone input');
        if (lower.match(/\b(ai|chatbot|gpt)\b/)) features.push('AI integration');
        
        const description = prompt.replace(/^(build|create|make|develop)\s+(me\s+)?(an?\s+)?/i, '').trim();
        return { type: 'app_development', description, platform, features };
    }
    
    // Web development
    if (lower.match(/\b(build|create|make).*(website|web app|web|site|frontend|backend)\b/)) {
        const features = [];
        if (lower.match(/\b(auth|login|signup)\b/)) features.push('user authentication');
        if (lower.match(/\b(api|rest|endpoint)\b/)) features.push('API integration');
        if (lower.match(/\b(database|db)\b/)) features.push('database design');
        
        const description = prompt.replace(/^(build|create|make)\s+(me\s+)?(an?\s+)?/i, '').trim();
        return { type: 'web_development', description, features };
    }
    
    // Code writing
    if (lower.match(/\b(write|create|implement).*(code|function|algorithm|script|program)\b/) ||
        lower.match(/\b(python|javascript|java|c\+\+|typescript)\b/)) {
        const language = prompt.match(/\b(python|javascript|java|c\+\+|typescript|go|rust|kotlin|swift)\b/i)?.[0];
        return { type: 'code_writing', task: prompt, language };
    }
    
    // Debugging
    if (lower.match(/\b(fix|debug|error|issue|problem|bug|not working|doesn't work)\b/)) {
        return { type: 'debugging', problem: prompt };
    }
    
    // Explanation
    if (lower.match(/\b(explain|what is|how does|how to|tell me about|teach me)\b/)) {
        const concept = prompt.replace(/^(explain|what is|how does|how to|tell me about|teach me)\s+/i, '').replace(/\?$/, '').trim();
        return { type: 'explanation', concept };
    }
    
    // Brainstorming
    if (lower.match(/\b(idea|ideas|suggest|brainstorm|options|solutions)\b/)) {
        const challenge = prompt.replace(/^(give me|suggest|brainstorm|generate).*(ideas?|options|solutions).*?(for|to|about)\s+/i, '').trim();
        return { type: 'brainstorming', challenge };
    }
    
    return { type: 'general', prompt };
}

// Generate Enhanced Prompt
function generateEnhancedPrompt(originalPrompt, options = {}) {
    const corrected = fixSpelling(originalPrompt);
    const { type, length = 'balanced', tone = 'professional' } = options;
    
    const intent = detectIntent(corrected);
    const wordCount = length === 'concise' ? 500 : length === 'detailed' ? 2000 : 1000;
    
    switch (intent.type) {
        case 'creative_writing':
            return PromptFramework.creative_writing(intent.subject || corrected, length);
            
        case 'app_development':
            return PromptFramework.app_development(
                intent.description || corrected,
                intent.platform,
                intent.features || []
            );
            
        case 'web_development':
            return PromptFramework.web_development(
                intent.description || corrected,
                intent.features || []
            );
            
        case 'code_writing':
            return PromptFramework.code_writing(intent.task, intent.language);
            
        case 'debugging':
            return PromptFramework.debugging(intent.problem);
            
        case 'content_writing':
            return PromptFramework.content_writing(intent.topic || corrected, wordCount, tone);
            
        case 'explanation':
            return PromptFramework.explanation(intent.concept || corrected);
            
        case 'brainstorming':
            return PromptFramework.brainstorming(intent.challenge || corrected, 15);
            
        default:
            // General fallback with role assignment
            return `You are an expert assistant with deep knowledge across multiple domains.

Your task: ${corrected}

**Approach:**
• Provide accurate, well-researched information
• Use clear, structured explanations
• Include practical examples where relevant
• Cite sources or reasoning where appropriate

**Format:**
Organize your response with clear headings and bullet points for readability.`;
    }
}

// Rate limiting
async function checkRateLimit(ip) {
    try {
        const result = await docClient.send(new GetCommand({
            TableName: RATE_LIMIT_TABLE,
            Key: { ip, window: 'current' }
        }));
        
        if (!result.Item) return true;
        
        const now = Date.now();
        if (result.Item.resetAt < now) return true;
        
        return result.Item.count < 20;
    } catch (error) {
        console.error('Rate limit check failed:', error);
        return true; // Allow on error
    }
}

// Save prompt analytics
async function savePrompt(data) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const id = now.getTime() + '-' + Math.random().toString(36).substr(2, 9);
    
    try {
        await docClient.send(new PutCommand({
            TableName: PROMPTS_TABLE,
            Item: {
                pk: 'PROMPT#' + dateStr,
                sk: id,
                timestamp: now.toISOString(),
                originalPrompt: data.originalPrompt,
                enhancedPrompt: data.enhancedPrompt,
                requestType: data.requestType || 'general',
                options: data.options,
                ip: data.ip,
                inputLength: data.originalPrompt.length,
                outputLength: data.enhancedPrompt.length,
                ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60)
            }
        }));
    } catch (error) {
        console.error('Error saving prompt:', error);
    }
}

// Main handler
exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event));
    
    if (event.httpMethod === 'OPTIONS' || event.requestContext?.http?.method === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    try {
        const ip = event.requestContext?.identity?.sourceIp || 
                   event.requestContext?.http?.sourceIp || 
                   'unknown';
        
        if (!await checkRateLimit(ip)) {
            return {
                statusCode: 429,
                headers,
                body: JSON.stringify({
                    error: 'Rate limit exceeded',
                    message: 'Maximum 20 requests per minute. Please try again later.'
                })
            };
        }
        
        const body = JSON.parse(event.body || '{}');
        const { prompt, options = {} } = body;
        
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Invalid request',
                    message: 'Prompt is required and must be a non-empty string'
                })
            };
        }
        
        if (prompt.length > 10000) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Prompt too long',
                    message: 'Maximum prompt length is 10,000 characters'
                })
            };
        }
        
        const enhancedPrompt = generateEnhancedPrompt(prompt, options);
        const intent = detectIntent(prompt);
        
        await savePrompt({
            originalPrompt: prompt,
            enhancedPrompt,
            requestType: intent.type,
            options,
            ip
        });
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                original: prompt,
                enhancedPrompt,
                requestType: intent.type,
                metadata: {
                    originalLength: prompt.length,
                    enhancedLength: enhancedPrompt.length,
                    improvement: `${Math.round((enhancedPrompt.length / prompt.length) * 100)}% richer`
                }
            })
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: 'Failed to process prompt'
            })
        };
    }
};
