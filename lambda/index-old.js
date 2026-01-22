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
    
    // Platforms
    if (lowerPrompt.includes('android')) topics.push('Android development');
    if (lowerPrompt.includes('ios') || lowerPrompt.includes('iphone')) topics.push('iOS development');
    if (lowerPrompt.includes('react native')) topics.push('React Native');
    if (lowerPrompt.includes('flutter')) topics.push('Flutter');
    
    // Features
    if (lowerPrompt.match(/\b(talk|speak|voice|speech|tts|text.to.speech)\b/)) topics.push('text-to-speech');
    if (lowerPrompt.match(/\b(mic|microphone|record|audio|listen)\b/)) topics.push('microphone input');
    if (lowerPrompt.match(/\b(news|rss|feed)\b/)) topics.push('news aggregation/RSS feeds');
    if (lowerPrompt.match(/\b(ai|ml|artificial intelligence|machine learning|chatbot|gpt)\b/)) topics.push('AI/ML integration');
    if (lowerPrompt.match(/\b(api|rest|endpoint)\b/)) topics.push('API integration');
    if (lowerPrompt.match(/\b(database|db|sql|sqlite|realm)\b/)) topics.push('database design');
    if (lowerPrompt.match(/\b(auth|login|signup|authentication|oauth)\b/)) topics.push('user authentication');
    if (lowerPrompt.match(/\b(notification|push|alert)\b/)) topics.push('push notifications');
    if (lowerPrompt.match(/\b(real.?time|live|websocket|socket)\b/)) topics.push('real-time updates');
    if (lowerPrompt.match(/\b(camera|photo|image|gallery)\b/)) topics.push('camera/image handling');
    if (lowerPrompt.match(/\b(location|gps|map|geolocation)\b/)) topics.push('location services');
    if (lowerPrompt.match(/\b(payment|stripe|paypal|checkout)\b/)) topics.push('payment integration');
    
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
    // Extract app type/purpose
    const appType = correctedPrompt.replace(/^(build|create|make|develop)\s+(me\s+)?(an?\s+)?/i, '').replace(/\s+(app|application).*$/i, '').trim();
    
    // Determine platform
    const isAndroid = correctedPrompt.toLowerCase().includes('android');
    const isIOS = correctedPrompt.toLowerCase().includes('ios');
    const platform = isAndroid ? 'Android' : isIOS ? 'iOS' : 'cross-platform';
    const language = isAndroid ? 'Kotlin' : isIOS ? 'Swift' : 'React Native/Flutter';
    const ide = isAndroid ? 'Android Studio' : isIOS ? 'Xcode' : 'VS Code';
    
    // Determine if full code or architecture is needed
    const fullCode = length === 'detailed' || correctedPrompt.toLowerCase().includes('full code') || correctedPrompt.toLowerCase().includes('complete code');
    
    if (fullCode) {
        return `Build a ${platform} app: ${appType}

Provide a complete, production-ready implementation including:

**1. Project Setup**
- Target SDK versions and Gradle dependencies
- Required permissions in AndroidManifest.xml (or Info.plist for iOS)
- Project structure and package organization

**2. Complete Code Files**
- MainActivity.${isAndroid ? 'kt' : 'swift'} with full implementation
- UI layout files (XML/SwiftUI)
- ViewModel/Controller classes
- Utility/Helper classes

**3. Core Features Implementation**
${topics.includes('AI/ML integration') ? '- AI/ML model integration with code examples' : ''}
${topics.includes('real-time updates') ? '- Real-time data synchronization (WebSockets/Firebase)' : ''}
${topics.includes('user authentication') ? '- Authentication flow (Firebase Auth/OAuth)' : ''}
${topics.includes('API integration') ? '- REST API calls with Retrofit/Alamofire' : ''}
- UI components and user interactions
- Data persistence (Room/SQLite/CoreData)
- Background tasks and lifecycle management

**4. Step-by-Step Setup**
1. Create new ${platform} project in ${ide}
2. Add dependencies to build.gradle${isAndroid ? '' : ' (or Podfile)'}
3. Configure permissions and app settings
4. Implement core functionality
5. Test on emulator/device

**5. Code Snippets with Explanations**
Include working code for:
- Main activity/view controller
- Key feature implementation
- API/data handling
- UI components

**Format:** Provide copy-paste ready code with inline comments explaining logic.`;
    } else {
        return `Build a ${platform} app: ${appType}

**Architecture & Implementation Guide**

**1. Technology Stack**
- **Language:** ${language}
- **IDE:** ${ide}
- **Framework:** ${platform === 'Android' ? 'Jetpack Compose (modern) or XML layouts' : platform === 'iOS' ? 'SwiftUI or UIKit' : 'React Native/Flutter'}
- **Backend:** ${topics.includes('API integration') ? 'REST API + Firebase/Supabase' : 'Firebase (BaaS) or local SQLite'}
- **Libraries:**
  ${isAndroid ? `- Retrofit (networking)
  - Room (database)
  - Coroutines (async)
  - ViewModel + LiveData (MVVM)` : isIOS ? `- Alamofire (networking)
  - CoreData (database)
  - Combine (reactive)` : `- Axios (networking)
  - AsyncStorage
  - Redux/MobX`}

**2. App Architecture**
\`\`\`
UI Layer (Views/Activities)
    ↓
ViewModel/Presenter Layer
    ↓
Repository Layer (Data Access)
    ↓
Data Sources (API/Database)
\`\`\`

**3. Core Features for MVP**
${appType ? `For a ${appType} app:` : ''}
${topics.includes('AI/ML integration') ? '- AI model integration (TensorFlow Lite/CoreML)' : ''}
${topics.includes('real-time updates') ? '- Real-time updates (WebSockets/Firebase Realtime Database)' : ''}
${topics.includes('user authentication') ? '- User authentication (Firebase Auth)' : ''}
${topics.includes('API integration') ? '- External API integration' : ''}
- Core user interface
- Data persistence
- Background processing
- Error handling

**4. Key Implementation Steps**

**Step 1: Project Setup**
\`\`\`${isAndroid ? 'kotlin' : 'swift'}
// ${isAndroid ? 'build.gradle (app level)' : 'Podfile'}
${isAndroid ? `dependencies {
    implementation "androidx.core:core-ktx:1.12.0"
    implementation "androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0"
    // Add specific dependencies based on features
}` : `pod 'Alamofire'
pod 'Firebase/Auth'`}
\`\`\`

**Step 2: Required Permissions**
\`\`\`xml
${isAndroid ? `<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />` : `<key>NSMicrophoneUsageDescription</key>
<string>App needs microphone access</string>`}
\`\`\`

**Step 3: Main Activity/ViewController**
\`\`\`${isAndroid ? 'kotlin' : 'swift'}
${isAndroid ? `class MainActivity : AppCompatActivity() {
    private lateinit var viewModel: MainViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Initialize UI and viewModel
    }
}` : `class ViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        // Setup UI
    }
}`}
\`\`\`

**Step 4: Critical Features Code**
[Include 2-3 key code snippets for main features]

**5. Testing & Deployment**
- Test on emulator (AVD/iOS Simulator)
- Test on physical device
- Handle edge cases and errors
- Prepare for ${platform === 'Android' ? 'Google Play' : platform === 'iOS' ? 'App Store' : 'both stores'}

**Next Steps:**
1. Set up ${ide} project
2. Implement features incrementally
3. Test thoroughly
4. Optimize performance`;
    }
}

function generateWebDevelopmentPrompt(correctedPrompt, topics, tone, length) {
    const appType = correctedPrompt.replace(/^(build|create|make|develop)\s+(me\s+)?(an?\s+)?/i, '').replace(/\s+(website|web app|web application|site).*$/i, '').trim();
    const fullCode = length === 'detailed' || correctedPrompt.toLowerCase().includes('full code');
    
    if (fullCode) {
        return `Build a complete web application: ${appType}

**Full Implementation Required**

**1. Project Structure**
\`\`\`
project/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── utils/
│   └── App.js
├── package.json
└── README.md
\`\`\`

**2. Technology Stack**
- **Frontend:** React 18+ with Hooks or Next.js 14+
- **Styling:** Tailwind CSS or styled-components
- **State Management:** Context API or Zustand
- **Backend:** ${topics.includes('API integration') ? 'Node.js + Express' : 'Firebase/Supabase (serverless)'}
- **Database:** ${topics.includes('database design') ? 'PostgreSQL or MongoDB' : 'Firebase Firestore'}
- **Hosting:** Vercel (frontend) + Railway/Render (backend)

**3. Complete Code Files**

**package.json:**
\`\`\`json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    // Add relevant packages
  }
}
\`\`\`

**src/App.js:**
\`\`\`javascript
import React from 'react';
// Full implementation with routing, state, API calls
\`\`\`

**Key Components:**
[Provide 3-5 complete component files]

**4. API/Backend Code**
${topics.includes('API integration') ? '\`\`\`javascript\n// Express server setup\n// Route handlers\n// Database connections\n\`\`\`' : 'Firebase configuration and security rules'}

**5. Step-by-Step Setup**
\`\`\`bash
npx create-react-app ${appType.replace(/\s+/g, '-')}
cd ${appType.replace(/\s+/g, '-')}
npm install [dependencies]
npm start
\`\`\`

**6. Deployment Instructions**
- Build: \`npm run build\`
- Deploy to Vercel: \`vercel --prod\`
- Environment variables setup
- Domain configuration`;
    } else {
        return `Build a modern web application: ${appType}

**Architecture & Technology Stack**

**1. Recommended Stack**
- **Frontend Framework:** React + Next.js 14 (for SSR/SEO) or Vite + React (for SPA)
- **Styling:** Tailwind CSS (utility-first) or Material-UI (components)
- **State Management:** 
  - Simple apps: React Context API
  - Complex apps: Zustand or Redux Toolkit
- **Backend:** 
  - Option A: Next.js API routes (serverless)
  - Option B: Node.js + Express + PostgreSQL
  - Option C: Firebase/Supabase (BaaS)
- **Authentication:** NextAuth.js or Firebase Auth
- **Deployment:** Vercel (frontend) + Railway (backend)

**2. Project Architecture**
\`\`\`
Client (Next.js/React)
    ↓ API calls
API Layer (Next.js routes / Express)
    ↓ queries
Database (PostgreSQL / Firestore)
\`\`\`

**3. Core Features Implementation**

${topics.includes('user authentication') ? `**User Authentication:**
\`\`\`javascript
// NextAuth.js setup
import NextAuth from 'next-auth'
import Providers from 'next-auth/providers'

export default NextAuth({
  providers: [
    Providers.Google({...}),
  ],
  // callbacks, session config
})
\`\`\`
` : ''}
${topics.includes('API integration') ? `**API Integration:**
\`\`\`javascript
// services/api.js
const fetchData = async () => {
  const response = await fetch('/api/endpoint')
  return response.json()
}
\`\`\`
` : ''}
${topics.includes('database design') ? `**Database Schema:**
\`\`\`sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  created_at TIMESTAMP
);
\`\`\`
` : ''}

**4. Key Implementation Steps**

**Step 1: Initialize Project**
\`\`\`bash
npx create-next-app@latest ${appType.replace(/\s+/g, '-')}
cd ${appType.replace(/\s+/g, '-')}
npm install [required-packages]
\`\`\`

**Step 2: Set Up Components**
\`\`\`javascript
// components/MainComponent.jsx
export default function MainComponent() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    // Fetch data, handle state
  }, [])
  
  return <div>{/* UI */}</div>
}
\`\`\`

**Step 3: API Routes (Next.js)**
\`\`\`javascript
// pages/api/data.js
export default async function handler(req, res) {
  // Handle API logic
  res.status(200).json({ data })
}
\`\`\`

**Step 4: Styling**
\`\`\`javascript
// Use Tailwind classes or styled-components
<div className="flex items-center justify-center min-h-screen">
  {/* Content */}
</div>
\`\`\`

**5. Performance Optimization**
- Image optimization (Next.js Image component)
- Code splitting and lazy loading
- Server-side rendering for SEO
- Caching strategies

**6. SEO & Accessibility**
- Meta tags and Open Graph
- Semantic HTML
- ARIA labels
- Lighthouse score 90+

**7. Deployment Checklist**
- [ ] Environment variables configured
- [ ] Build passes: \`npm run build\`
- [ ] Deploy to Vercel: \`vercel --prod\`
- [ ] Set up custom domain
- [ ] Configure SSL/HTTPS
- [ ] Set up analytics (Vercel Analytics/Google Analytics)

**Next Steps:**
1. Clone starter template or create from scratch
2. Implement features incrementally
3. Test on multiple browsers
4. Deploy to staging → production`;
    }
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
