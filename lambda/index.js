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
    
    // Creative writing (stories, fiction, narratives)
    if (lowerPrompt.match(/\b(story|stories|tale|narrative|fiction|novel|character|plot|scene)\b/) ||
        lowerPrompt.match(/\b(write|compose|craft).*(story|tale|narrative|fiction|character)\b/)) {
        return 'creative_writing';
    }
    
    // Poetry and verse
    if (lowerPrompt.match(/\b(poem|poetry|verse|haiku|sonnet|rhyme)\b/)) {
        return 'poetry';
    }
    
    // Development tasks
    if (lowerPrompt.includes('build') || lowerPrompt.includes('create') || lowerPrompt.includes('develop') || lowerPrompt.includes('make')) {
        if (lowerPrompt.match(/\b(app|application|mobile|android|ios)\b/)) return 'app_development';
        if (lowerPrompt.match(/\b(website|web app|webpage|frontend|ui)\b/)) return 'web_development';
        if (lowerPrompt.match(/\b(api|backend|server|database)\b/)) return 'backend_development';
        return 'development';
    }
    
    // Debugging
    if (lowerPrompt.match(/\b(fix|debug|error|issue|problem|bug|crash)\b/)) {
        return 'debugging';
    }
    
    // Content writing (blogs, articles)
    if (lowerPrompt.match(/\b(blog|article|post|content|essay|report)\b/) && 
        (lowerPrompt.includes('write') || lowerPrompt.includes('create'))) {
        return 'content_writing';
    }
    
    // Email/business writing
    if (lowerPrompt.match(/\b(email|letter|message|memo|proposal)\b/)) {
        return 'business_writing';
    }
    
    // Explanation/educational
    if (lowerPrompt.match(/\b(explain|what is|how does|how to|teach|tutorial)\b/)) {
        return 'explanation';
    }
    
    // Analysis
    if (lowerPrompt.match(/\b(analyze|review|evaluate|assess|critique)\b/)) {
        return 'analysis';
    }
    
    // Brainstorming
    if (lowerPrompt.match(/\b(idea|ideas|suggest|brainstorm|recommend|options)\b/)) {
        return 'brainstorming';
    }
    
    // Code writing
    if (lowerPrompt.match(/\b(code|function|script|program|algorithm)\b/) && 
        (lowerPrompt.includes('write') || lowerPrompt.includes('create'))) {
        return 'code_writing';
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

// Creative Writing (Stories, Fiction)
function generateCreativeWritingPrompt(correctedPrompt, tone, length) {
    const wordCount = length === 'concise' ? '800-1000' : length === 'detailed' ? '2000-3000' : '1200-1500';
    
    // Extract subject from prompt
    const subject = correctedPrompt.replace(/^(write|create|compose)\s+(a\s+)?(story|tale|narrative)\s+(about\s+)?/i, '').trim();
    
    return `Write a compelling and richly detailed short story (${wordCount} words) about: ${subject}

Your story must include:

1. **Character Development:** Create vivid, multi-dimensional characters with clear motivations, internal conflicts, and distinctive voices

2. **Narrative Structure:**
   - Opening hook that immediately engages the reader
   - Rising tension with meaningful obstacles or conflicts
   - Climactic moment that challenges characters or reveals truth
   - Satisfying resolution that transforms the protagonist

3. **Sensory Details:** Employ rich, concrete imagery across all five senses to immerse readers in the story world

4. **Thematic Depth:** Explore underlying themes related to ${subject} - consider human nature, relationships, technology, morality, or existential questions

5. **Setting:** Establish a vivid, believable environment that influences the plot and character actions

6. **Dialogue:** Use natural, purposeful conversations that reveal character and advance the plot

7. **Unique Perspective:** Offer an original angle or unexpected insight into ${subject}

Ensure the narrative maintains consistent pacing, shows rather than tells, and leaves a lasting emotional impact.`;
}

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

// Poetry
function generatePoetryPrompt(correctedPrompt, tone, length) {
    const lines = length === 'concise' ? '8-12 lines' : length === 'detailed' ? '30-40 lines' : '16-24 lines';
    const subject = correctedPrompt.replace(/^(write|create|compose)\s+(a\s+)?(poem|poetry)\s+(about\s+)?/i, '').trim();
    
    return `Compose an original poem (${lines}) about: ${subject}

Craft your poem with:

1. **Vivid Imagery:** Use concrete, sensory metaphors and similes that evoke ${subject}

2. **Emotional Resonance:** Capture genuine feeling - whether melancholy, joy, wonder, or conflict

3. **Sound Devices:** Employ alliteration, assonance, consonance, or internal rhyme to enhance musicality

4. **Precise Diction:** Choose each word deliberately for its connotative power and rhythm

5. **Original Perspective:** Offer a fresh, unexpected angle on ${subject}

6. **Structural Choice:** Select a form (free verse, sonnet, haiku, etc.) that serves the subject matter

Avoid clichés. Show genuine observation and emotional truth.`;
}

function generateContentPrompt(correctedPrompt, tone, length) {
    const wordCount = length === 'concise' ? '500-800' : length === 'detailed' ? '1500-2000' : '800-1200';
    const toneStyle = tone === 'casual' ? 'conversational and engaging' : tone === 'technical' ? 'precise and technical' : 'professional';
    const subject = correctedPrompt.replace(/^(write|create)\s+(a\s+)?(blog|article|post)\s+(about\s+)?/i, '').trim();
    
    return `Write ${wordCount}-word ${toneStyle} article/blog post about: ${subject}

Structure:
1. **Headline:** Compelling, SEO-optimized title with power words
2. **Hook:** Opening paragraph that immediately addresses reader pain point or curiosity
3. **Body:** 3-5 main sections with:
   - Clear subheadings
   - Concrete examples and data
   - Actionable insights
   - Visual formatting (bullets, numbered lists)
4. **Conclusion:** Key takeaways and clear call-to-action

Include: Expert credibility markers, relevant statistics, and practical examples readers can apply immediately.`;
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

// Business Writing
function generateBusinessWritingPrompt(correctedPrompt, tone, length) {
    const type = correctedPrompt.match(/\b(email|letter|proposal|memo)\b/i)?.[0]?.toLowerCase() || 'message';
    
    return `Compose a professional ${type} regarding: ${correctedPrompt}

Essential elements:
1. **Clear purpose statement** in opening line
2. **Structured body** with logical flow and supporting details
3. **Professional tone** - courteous, direct, and action-oriented
4. **Specific ask or next steps** clearly stated
5. **Appropriate closing** with clear timeline if needed

Avoid jargon, maintain brevity, and ensure every sentence serves the core objective.`;
}

// Code Writing
function generateCodeWritingPrompt(correctedPrompt, tone, length) {
    const detail = length === 'detailed' ? 'Include comprehensive documentation, error handling, and test cases.' : 'Include key functionality with comments.';
    
    return `Write production-quality code for: ${correctedPrompt}

Requirements:
- Clean, readable implementation following language best practices
- Proper error handling and edge case management
- Inline comments explaining complex logic
- Time/space complexity considerations
- ${detail}

Provide working code with explanation of key design decisions.`;
}

function generateGeneralPrompt(correctedPrompt, tone, length) {
    const style = tone === 'casual' ? 'conversational' : tone === 'technical' ? 'technical and precise' : 'professional';
    const detail = length === 'concise' ? 'Focus on key points only.' : length === 'detailed' ? 'Provide comprehensive analysis with examples.' : 'Balance depth with clarity.';
    
    return `${correctedPrompt}

Approach:
- Use ${style} tone
- ${detail}
- Support claims with specific examples
- Structure response logically with clear sections
- Provide actionable insights where relevant`;
}

function enhancePrompt(originalPrompt, options = {}) {
    const { tone = 'professional', length = 'balanced' } = options;
    
    const correctedPrompt = fixSpellingAndGrammar(originalPrompt);
    const requestType = detectRequestType(originalPrompt);
    const topics = extractKeyTopics(originalPrompt);
    
    let enhanced = '';
    
    switch (requestType) {
        case 'creative_writing':
            enhanced = generateCreativeWritingPrompt(correctedPrompt, tone, length);
            break;
        case 'poetry':
            enhanced = generatePoetryPrompt(correctedPrompt, tone, length);
            break;
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
            enhanced = generateContentPrompt(correctedPrompt, tone, length);
            break;
        case 'business_writing':
            enhanced = generateBusinessWritingPrompt(correctedPrompt, tone, length);
            break;
        case 'code_writing':
            enhanced = generateCodeWritingPrompt(correctedPrompt, tone, length);
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
