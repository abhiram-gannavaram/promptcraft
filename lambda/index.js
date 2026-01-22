const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

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

// Common spelling corrections dictionary
const spellingCorrections = {
    'andoid': 'Android', 'androi': 'Android', 'iphone': 'iPhone', 'ios': 'iOS',
    'javascript': 'JavaScript', 'typescript': 'TypeScript', 'nodejs': 'Node.js',
    'mongodb': 'MongoDB', 'postgresql': 'PostgreSQL', 'mysql': 'MySQL',
    'chatgpt': 'ChatGPT', 'openai': 'OpenAI', 'api': 'API', 'apis': 'APIs',
    'ui': 'UI', 'ux': 'UX', 'html': 'HTML', 'css': 'CSS', 'sql': 'SQL',
    'aws': 'AWS', 'gcp': 'GCP', 'azure': 'Azure', 'saas': 'SaaS', 'ai': 'AI', 'ml': 'ML',
    'whre': 'where', 'teh': 'the', 'taht': 'that', 'adn': 'and', 'wiht': 'with',
    'hte': 'the', 'dont': "don't", 'cant': "can't", 'wont': "won't",
    'doesnt': "doesn't", 'isnt': "isn't", 'wasnt': "wasn't", 'havent': "haven't",
    'youre': "you're", 'theyre': "they're", 'thats': "that's", 'whats': "what's",
    'heres': "here's", 'lets': "let's", 'im': "I'm", 'ive': "I've", 'id': "I'd",
    'wanna': 'want to', 'gonna': 'going to', 'gotta': 'got to',
    'kinda': 'kind of', 'sorta': 'sort of', 'alot': 'a lot', 'untill': 'until',
    'recieve': 'receive', 'seperate': 'separate', 'definately': 'definitely',
    'occured': 'occurred', 'succesful': 'successful', 'neccessary': 'necessary',
    'enviroment': 'environment', 'buisness': 'business', 'begining': 'beginning',
    'beleive': 'believe', 'collegue': 'colleague', 'comittee': 'committee',
    'embarass': 'embarrass', 'excercise': 'exercise', 'foriegn': 'foreign',
    'freind': 'friend', 'garantee': 'guarantee', 'happend': 'happened',
    'immediatly': 'immediately', 'independant': 'independent', 'knowlege': 'knowledge',
    'maintainance': 'maintenance', 'noticable': 'noticeable', 'occassion': 'occasion',
    'peice': 'piece', 'posession': 'possession', 'profesional': 'professional',
    'reccomend': 'recommend', 'relevent': 'relevant', 'similiar': 'similar',
    'suprise': 'surprise', 'tommorow': 'tomorrow', 'truely': 'truly',
    'wether': 'whether', 'wierd': 'weird', 'accomodate': 'accommodate'
};

// Fix spelling and grammar
function fixSpellingAndGrammar(text) {
    let fixed = text;
    
    Object.keys(spellingCorrections).forEach(wrong => {
        const regex = new RegExp('\\b' + wrong + '\\b', 'gi');
        fixed = fixed.replace(regex, spellingCorrections[wrong]);
    });
    
    fixed = fixed.replace(/(^|[.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
    fixed = fixed.replace(/\bi\b/g, 'I');
    fixed = fixed.replace(/\s+/g, ' ').trim();
    
    if (!/[.!?]$/.test(fixed)) {
        fixed += '.';
    }
    
    return fixed;
}

// Detect the type of request
function detectRequestType(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('build') || lowerPrompt.includes('create') || lowerPrompt.includes('develop') || lowerPrompt.includes('make')) {
        if (lowerPrompt.includes('app') || lowerPrompt.includes('application') || lowerPrompt.includes('mobile') || lowerPrompt.includes('android') || lowerPrompt.includes('ios')) {
            return 'app_development';
        }
        if (lowerPrompt.includes('website') || lowerPrompt.includes('web app') || lowerPrompt.includes('webpage')) {
            return 'web_development';
        }
        if (lowerPrompt.includes('api') || lowerPrompt.includes('backend') || lowerPrompt.includes('server')) {
            return 'backend_development';
        }
        return 'development';
    }
    
    if (lowerPrompt.includes('write') || lowerPrompt.includes('draft') || lowerPrompt.includes('compose')) {
        if (lowerPrompt.includes('email') || lowerPrompt.includes('mail')) return 'email_writing';
        if (lowerPrompt.includes('blog') || lowerPrompt.includes('article') || lowerPrompt.includes('post')) return 'content_writing';
        if (lowerPrompt.includes('code') || lowerPrompt.includes('function') || lowerPrompt.includes('script')) return 'code_writing';
        return 'writing';
    }
    
    if (lowerPrompt.includes('explain') || lowerPrompt.includes('what is') || lowerPrompt.includes('how does') || lowerPrompt.includes('tell me about')) {
        return 'explanation';
    }
    
    if (lowerPrompt.includes('fix') || lowerPrompt.includes('debug') || lowerPrompt.includes('error') || lowerPrompt.includes('issue') || lowerPrompt.includes('problem')) {
        return 'debugging';
    }
    
    if (lowerPrompt.includes('analyze') || lowerPrompt.includes('review') || lowerPrompt.includes('evaluate')) {
        return 'analysis';
    }
    
    if (lowerPrompt.includes('idea') || lowerPrompt.includes('suggest') || lowerPrompt.includes('brainstorm') || lowerPrompt.includes('recommend')) {
        return 'brainstorming';
    }
    
    return 'general';
}

// Extract key topics from the prompt
function extractKeyTopics(prompt) {
    const topics = [];
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('android')) topics.push('Android development');
    if (lowerPrompt.includes('ios') || lowerPrompt.includes('iphone')) topics.push('iOS development');
    if (lowerPrompt.includes('react native')) topics.push('React Native');
    if (lowerPrompt.includes('flutter')) topics.push('Flutter');
    if (lowerPrompt.includes('news')) topics.push('news aggregation/RSS feeds');
    if (lowerPrompt.includes('ai') || lowerPrompt.includes('artificial intelligence')) topics.push('AI/ML integration');
    if (lowerPrompt.includes('api')) topics.push('API integration');
    if (lowerPrompt.includes('database')) topics.push('database design');
    if (lowerPrompt.includes('authentication') || lowerPrompt.includes('login')) topics.push('user authentication');
    if (lowerPrompt.includes('notification') || lowerPrompt.includes('push')) topics.push('push notifications');
    if (lowerPrompt.includes('real-time') || lowerPrompt.includes('realtime') || lowerPrompt.includes('latest')) topics.push('real-time updates');
    
    return topics;
}

// Prompt generation functions
function generateAppDevelopmentPrompt(correctedPrompt, topics, tone, length) {
    const topicsStr = topics.length > 0 ? ` focusing on ${topics.join(', ')}` : '';
    const detail = length === 'concise' ? 'Provide a brief technical overview.' : 
                   length === 'detailed' ? 'Include detailed code examples and architecture decisions.' : 
                   'Provide clear explanations with key code examples.';
    
    return `Create a mobile app development plan for: ${correctedPrompt}${topicsStr}

${detail}

Include:
- Recommended tech stack (framework, backend, database)
- Core features for MVP
- Key implementation steps
- Code examples for critical functionality`;
}

function generateWebDevelopmentPrompt(correctedPrompt, topics, tone, length) {
    const detail = length === 'concise' ? 'Provide essential steps only.' : 
                   length === 'detailed' ? 'Include complete code examples and setup instructions.' : 
                   'Provide clear guidance with code samples.';
    
    return `Build a web application for: ${correctedPrompt}

${detail}

Cover:
- Tech stack recommendation (frontend/backend/database)
- Project structure and key components
- Implementation steps with code examples
- Deployment approach`;
}

function generateDebuggingPrompt(correctedPrompt, tone, length) {
    const detail = length === 'concise' ? 'Provide the fix and brief explanation.' : 
                   length === 'detailed' ? 'Explain root cause, provide complete solution with code, and prevention tips.' : 
                   'Explain the issue and provide working code solution.';
    
    return `Debug this issue: ${correctedPrompt}

${detail}

Include:
- Root cause identification
- Working code fix
- How to prevent this error`;
}

function generateContentPrompt(correctedPrompt, tone, length) {
    const wordCount = length === 'concise' ? '500-800' : length === 'detailed' ? '1500-2000' : '800-1200';
    const toneStyle = tone === 'casual' ? 'conversational and engaging' : tone === 'technical' ? 'precise and technical' : 'professional';
    
    return `Write ${wordCount}-word ${toneStyle} content about: ${correctedPrompt}

Include:
- Compelling headline
- Engaging introduction
- Well-structured body with examples
- Clear conclusion`;
}

function generateExplanationPrompt(correctedPrompt, tone, length) {
    const detail = length === 'concise' ? 'Provide a clear, brief explanation.' : 
                   length === 'detailed' ? 'Explain thoroughly with examples, analogies, and practical applications.' : 
                   'Explain clearly with relevant examples.';
    
    return `Explain: ${correctedPrompt}

${detail}

Include:
- Simple overview
- How it works
- Practical examples
- Key takeaways`;
}

function generateBrainstormingPrompt(correctedPrompt, tone, length) {
    const count = length === 'concise' ? '5-7' : length === 'detailed' ? '15-20' : '10-12';
    
    return `Generate ${count} creative ideas for: ${correctedPrompt}

For each idea:
- Brief description
- Feasibility (Easy/Medium/Hard)
- Potential impact

Rank ideas by priority and explain top recommendation.`;
}

function generateGeneralPrompt(correctedPrompt, tone, length) {
    const style = tone === 'casual' ? 'conversational' : tone === 'technical' ? 'technical and precise' : 'professional';
    const detail = length === 'concise' ? 'Be concise.' : length === 'detailed' ? 'Provide comprehensive detail.' : 'Balance depth with clarity.';
    
    return `${correctedPrompt}

Use ${style} tone. ${detail} Include relevant examples.`;
}

function enhancePrompt(originalPrompt, options = {}) {
    const { tone = 'professional', length = 'balanced' } = options;
    
    const correctedPrompt = fixSpellingAndGrammar(originalPrompt);
    const requestType = detectRequestType(originalPrompt);
    const topics = extractKeyTopics(originalPrompt);
    
    let enhanced = '';
    
    switch (requestType) {
        case 'app_development':
            enhanced = generateAppDevelopmentPrompt(correctedPrompt, topics, tone, length);
            break;
        case 'web_development':
            enhanced = generateWebDevelopmentPrompt(correctedPrompt, topics, tone, length);
            break;
        case 'debugging':
            enhanced = generateDebuggingPrompt(correctedPrompt, tone, length);
            break;
        case 'content_writing':
        case 'writing':
            enhanced = generateContentPrompt(correctedPrompt, tone, length);
            break;
        case 'explanation':
            enhanced = generateExplanationPrompt(correctedPrompt, tone, length);
            break;
        case 'brainstorming':
            enhanced = generateBrainstormingPrompt(correctedPrompt, tone, length);
            break;
        default:
            enhanced = generateGeneralPrompt(correctedPrompt, tone, length);
    }
    
    return enhanced;
}

async function checkRateLimit(ip) {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - 60;
    
    try {
        const result = await docClient.send(new GetCommand({
            TableName: RATE_LIMIT_TABLE,
            Key: { ip }
        }));
        
        if (result.Item && result.Item.count >= 20 && result.Item.windowStart > windowStart) {
            return false;
        }
        
        await docClient.send(new PutCommand({
            TableName: RATE_LIMIT_TABLE,
            Item: {
                ip,
                count: (result.Item && result.Item.windowStart > windowStart ? result.Item.count : 0) + 1,
                windowStart: result.Item && result.Item.windowStart > windowStart ? result.Item.windowStart : now,
                ttl: now + 120
            }
        }));
        
        return true;
    } catch (error) {
        console.error('Rate limit error:', error);
        return true;
    }
}

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
        console.log('Prompt saved:', id);
    } catch (error) {
        console.error('Error saving prompt:', error);
    }
}

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
                body: JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' })
            };
        }
        
        const body = JSON.parse(event.body || '{}');
        const prompt = body.prompt;
        const options = body.options || {};
        
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Prompt is required' })
            };
        }
        
        if (prompt.length > 10000) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Prompt exceeds maximum length of 10000 characters' })
            };
        }
        
        const enhancedPrompt = enhancePrompt(prompt.trim(), options);
        const requestType = detectRequestType(prompt);
        
        await savePrompt({
            originalPrompt: prompt.trim(),
            enhancedPrompt,
            requestType,
            options,
            ip
        });
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                enhancedPrompt,
                metadata: {
                    requestType,
                    inputLength: prompt.length,
                    outputLength: enhancedPrompt.length,
                    timestamp: new Date().toISOString()
                }
            })
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'An error occurred while processing your request' })
        };
    }
};
