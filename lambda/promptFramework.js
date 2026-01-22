/**
 * ADVANCED PROMPT ENGINEERING SYSTEM
 * 
 * Based on state-of-the-art prompt engineering principles:
 * 1. Role Assignment - Assign expert persona to LLM
 * 2. Clear Constraints - Define scope, format, and limitations
 * 3. Structured Output - Request organized, actionable responses
 * 4. Context Richness - Provide necessary background
 * 5. Specificity - Avoid ambiguity with precise requirements
 */

// Core Prompt Engineering Framework
const PromptFramework = {
    
    // Creative Writing (Stories, Fiction, Narratives)
    creative_writing: (subject, length) => {
        const wordCount = length === 'concise' ? '800-1200' : length === 'detailed' ? '2500-3000' : '1500-2000';
        
        return `You are an acclaimed fiction writer and creative writing instructor with expertise in narrative craft, character development, and literary techniques.

Your task: Write a ${wordCount}-word short story about ${subject}.

Apply professional storytelling techniques:

**NARRATIVE STRUCTURE:**
• Opening: Establish immediate conflict or intrigue
• Rising Action: Build tension through escalating obstacles
• Climax: Deliver a transformative revelation or decision point
• Resolution: Provide emotional closure while avoiding clichés

**CHARACTER DEVELOPMENT:**
• Create protagonists with clear wants vs. needs (internal conflict)
• Use distinctive voice, speech patterns, and mannerisms
• Reveal character through action, not exposition
• Show psychological depth and believable motivation

**CRAFT ELEMENTS:**
• Employ vivid sensory details (visual, auditory, tactile, olfactory)
• Use "show don't tell" - dramatize scenes rather than summarizing
• Include purposeful dialogue that advances plot and reveals character
• Maintain consistent POV and verb tense
• Create symbolic or thematic resonance related to ${subject}

**TONE & STYLE:**
• Match style to subject matter (e.g., suspenseful for thriller, lyrical for romance)
• Vary sentence structure for rhythm and pacing
• Use concrete, specific details over abstractions
• Create memorable imagery and metaphors

**THEMATIC DEPTH:**
Explore universal themes: human connection, mortality, identity, power, redemption, transformation, or the intersection of ${subject} with the human condition.

**FORMAT:**
Deliver a polished, publication-ready story with clear paragraph breaks. Begin with a hook that immediately engages the reader.`;
    },

    // App/Software Development
    app_development: (appDescription, platform, features) => {
        const isAndroid = platform === 'Android';
        const language = isAndroid ? 'Kotlin' : platform === 'iOS' ? 'Swift' : 'React Native';
        
        return `You are a senior mobile application architect with 10+ years of experience building production apps for ${platform}. You specialize in clean architecture, performance optimization, and best practices.

Your task: Design and provide implementation guidance for: ${appDescription}

**PROJECT SCOPE:**
${features.length > 0 ? `Key Features Required: ${features.join(', ')}` : 'Standard mobile app with core functionality'}

**DELIVERABLES:**

1. **ARCHITECTURE DESIGN**
   Pattern: MVVM (Model-View-ViewModel) with Repository pattern
   \`\`\`
   UI Layer (Activities/ViewControllers)
       ↓ observes
   ViewModel (Business Logic + State)
       ↓ requests
   Repository (Data Abstraction)
       ↓ fetches from
   Data Sources (API/Database/Cache)
   \`\`\`

2. **TECHNOLOGY STACK**
   • Language: ${language}
   • UI Framework: ${isAndroid ? 'Jetpack Compose (modern declarative UI)' : platform === 'iOS' ? 'SwiftUI' : 'React Native'}
   • Async Operations: ${isAndroid ? 'Kotlin Coroutines + Flow' : platform === 'iOS' ? 'async/await + Combine' : 'Promises/async-await'}
   • Networking: ${isAndroid ? 'Retrofit2 + OkHttp' : platform === 'iOS' ? 'URLSession + Alamofire' : 'Axios'}
   • Local Storage: ${isAndroid ? 'Room Database' : platform === 'iOS' ? 'CoreData' : 'AsyncStorage'}
   • Dependency Injection: ${isAndroid ? 'Hilt/Koin' : platform === 'iOS' ? 'Swift DI' : 'Context API'}

3. **IMPLEMENTATION ROADMAP**

   **Phase 1: Project Setup**
   \`\`\`${isAndroid ? 'kotlin' : 'swift'}
   // build.gradle${isAndroid ? '' : '.kts'} dependencies
   ${isAndroid ? `implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")
   implementation("androidx.room:room-runtime:2.6.1")
   implementation("com.squareup.retrofit2:retrofit:2.9.0")` : '// Swift Package Manager or CocoaPods setup'}
   \`\`\`

   **Phase 2: Core Implementation**
   
   A. **Data Layer**
   \`\`\`${isAndroid ? 'kotlin' : 'swift'}
   ${isAndroid ? `// Repository Pattern
   class AppRepository(
       private val apiService: ApiService,
       private val database: AppDatabase
   ) {
       suspend fun getData(): Flow<Result<Data>> = flow {
           // Implement data fetching with caching
       }
   }` : `// iOS Repository Example
   class DataRepository {
       func fetchData() async throws -> [DataModel] {
           // Implementation
       }
   }`}
   \`\`\`

   B. **ViewModel**
   \`\`\`${isAndroid ? 'kotlin' : 'swift'}
   ${isAndroid ? `class MainViewModel(
       private val repository: AppRepository
   ) : ViewModel() {
       
       private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
       val uiState: StateFlow<UiState> = _uiState.asStateFlow()
       
       fun loadData() {
           viewModelScope.launch {
               repository.getData().collect { result ->
                   _uiState.value = result.toUiState()
               }
           }
       }
   }` : `@MainActor
   class ViewModel: ObservableObject {
       @Published var state: ViewState = .loading
       
       func loadData() async {
           // Implementation
       }
   }`}
   \`\`\`

   C. **UI Layer**
   [Provide specific UI implementation based on features]

4. **CRITICAL REQUIREMENTS**

   **Permissions (AndroidManifest.xml / Info.plist):**
   ${features.includes('microphone input') ? `• ${isAndroid ? 'RECORD_AUDIO' : 'NSMicrophoneUsageDescription'}` : ''}
   ${features.includes('location services') ? `• ${isAndroid ? 'ACCESS_FINE_LOCATION' : 'NSLocationWhenInUseUsageDescription'}` : ''}
   • INTERNET (always required for API calls)

   **Error Handling:**
   • Network errors with retry logic
   • User-friendly error messages
   • Offline mode graceful degradation
   • Crash analytics integration (Firebase Crashlytics)

   **Performance:**
   • Lazy loading for lists (RecyclerView/UITableView)
   • Image caching (Glide/Coil or Kingfisher)
   • Background thread for heavy operations
   • Memory leak prevention

5. **TESTING STRATEGY**
   • Unit tests: ViewModels and Repository (JUnit/XCTest)
   • UI tests: Critical user flows (Espresso/XCUITest)
   • Integration tests: API and Database interactions

6. **DEPLOYMENT CHECKLIST**
   □ ProGuard/R8 optimization (${isAndroid ? 'Android' : 'N/A'})
   □ App signing configured
   □ Store listing assets prepared
   □ Privacy policy compliant
   □ ${isAndroid ? 'Google Play' : platform === 'iOS' ? 'App Store' : 'both store'} guidelines met

**PROVIDE:** Working code snippets for each layer, explain architectural decisions, and highlight potential pitfalls.`;
    },

    // Web Development
    web_development: (appDescription, features) => {
        return `You are a full-stack web architect specializing in modern JavaScript frameworks, scalable architectures, and production-grade web applications.

Your task: Build a complete web application for: ${appDescription}

**ARCHITECTURE DECISION:**

Modern Stack (Recommended):
• **Frontend:** Next.js 14+ (React framework with SSR/SSG)
• **Styling:** Tailwind CSS (utility-first)
• **State:** Zustand (lightweight) or React Context
• **Backend:** Next.js API Routes (serverless) OR Express + Node.js
• **Database:** PostgreSQL (Vercel Postgres) or MongoDB Atlas
• **Auth:** NextAuth.js or Clerk
• **Deployment:** Vercel (frontend + serverless functions)

**PROJECT STRUCTURE:**
\`\`\`
app/
├── (auth)/
│   ├── login/
│   └── signup/
├── (dashboard)/
│   └── page.tsx
├── api/
│   └── [...routes]/
├── components/
│   ├── ui/           # Reusable components
│   └── features/     # Feature-specific components
├── lib/
│   ├── db.ts        # Database connection
│   ├── auth.ts      # Auth config
│   └── utils.ts     # Helper functions
└── middleware.ts     # Auth/routing middleware
\`\`\`

**IMPLEMENTATION GUIDE:**

**1. INITIAL SETUP**
\`\`\`bash
npx create-next-app@latest ${appDescription.replace(/\s+/g, '-').toLowerCase()} \\
  --typescript --tailwind --app --eslint
cd ${appDescription.replace(/\s+/g, '-').toLowerCase()}
npm install zustand @vercel/postgres bcrypt
\`\`\`

**2. DATABASE SCHEMA**
\`\`\`typescript
// prisma/schema.prisma or lib/schema.sql
${features.includes('user authentication') ? `model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
}` : '// Define your data models'}
\`\`\`

**3. API ROUTES (Serverless Functions)**
\`\`\`typescript
// app/api/data/route.ts
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Fetch from database
    const data = await db.query('SELECT * FROM table')
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const body = await request.json()
  // Validate and save to database
  return NextResponse.json({ success: true })
}
\`\`\`

**4. FRONTEND COMPONENTS**
\`\`\`typescript
// app/components/DataDisplay.tsx
'use client'

import { useState, useEffect } from 'react'

export default function DataDisplay() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton />
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {data?.map(item => (
        <Card key={item.id}>
          {/* Render item */}
        </Card>
      ))}
    </div>
  )
}
\`\`\`

**5. AUTHENTICATION (${features.includes('user authentication') ? 'Required' : 'Optional'})**
${features.includes('user authentication') ? `\`\`\`typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        // Validate credentials against database
        const user = await verifyUser(credentials)
        return user || null
      }
    })
  ],
  pages: {
    signIn: '/login'
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
\`\`\`` : '// Not required for this app'}

**6. PERFORMANCE OPTIMIZATION**
• Image optimization: Use Next.js <Image /> component
• Code splitting: Dynamic imports for heavy components
• Caching: Implement ISR (Incremental Static Regeneration)
• CDN: Vercel Edge Network for global distribution
• Database: Connection pooling and query optimization

**7. SEO & ACCESSIBILITY**
\`\`\`typescript
// app/layout.tsx
export const metadata = {
  title: '${appDescription}',
  description: 'Your app description for SEO',
  openGraph: {
    title: '${appDescription}',
    description: '...',
    images: ['/og-image.png']
  }
}
\`\`\`

**8. DEPLOYMENT**
\`\`\`bash
# Push to GitHub
git init && git add . && git commit -m "Initial commit"
gh repo create --public --source=. --push

# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
\`\`\`

**SECURITY CHECKLIST:**
□ Input validation and sanitization
□ CSRF protection (built-in Next.js)
□ SQL injection prevention (use parameterized queries)
□ Rate limiting for API routes
□ Environment variables for secrets
□ HTTPS enforced (automatic on Vercel)

**PROVIDE:** Complete, production-ready code with error handling, TypeScript types, and best practices.`;
    },

    // Code Writing/Development
    code_writing: (task, language) => {
        return `You are a senior software engineer with expertise in ${language || 'multiple programming languages'}, clean code principles, and design patterns.

Your task: ${task}

**REQUIREMENTS:**

1. **CODE QUALITY STANDARDS**
   • Follow ${language || 'language-specific'} best practices and idioms
   • Apply SOLID principles where applicable
   • Write self-documenting code with clear variable/function names
   • Add inline comments only for complex logic

2. **IMPLEMENTATION**
   • Provide complete, runnable code (not pseudocode)
   • Include proper error handling and edge cases
   • Consider performance implications (time/space complexity)
   • Make code extensible and maintainable

3. **STRUCTURE YOUR RESPONSE**
   
   A. **Solution Overview**
   [Brief explanation of your approach and why you chose it]

   B. **Complete Implementation**
   \`\`\`${language || 'javascript'}
   // Your production-ready code here
   \`\`\`

   C. **Usage Example**
   \`\`\`${language || 'javascript'}
   // How to use the code
   \`\`\`

   D. **Complexity Analysis**
   • Time Complexity: O(?)
   • Space Complexity: O(?)

   E. **Testing**
   [Provide test cases or explain how to verify correctness]

**ADDITIONAL CONSIDERATIONS:**
• Security: Validate inputs, prevent injection attacks
• Performance: Optimize for typical use cases
• Maintainability: Write code others can understand
• Documentation: Add JSDoc/docstrings for public APIs`;
    },

    // Debugging/Problem Solving
    debugging: (problem) => {
        return `You are an expert debugging specialist and software troubleshooter with deep knowledge of common programming pitfalls, error patterns, and systematic debugging methodologies.

Your task: Debug and fix this issue: ${problem}

**SYSTEMATIC DEBUGGING APPROACH:**

**1. ROOT CAUSE ANALYSIS**
   • Identify the exact error/unexpected behavior
   • Explain WHY this occurs (underlying mechanism)
   • List common scenarios that trigger this issue

**2. IMMEDIATE SOLUTION**
   
   **Before (Broken Code):**
   \`\`\`
   // Show the problematic code
   \`\`\`

   **After (Fixed Code):**
   \`\`\`
   // Corrected implementation with explanation
   \`\`\`

   **Key Changes:**
   • [Specific fix #1]
   • [Specific fix #2]

**3. PREVENTION STRATEGY**
   • Best practices to avoid this error in future
   • Linting rules or tools that catch this
   • Related issues to watch for

**4. TESTING VERIFICATION**
   \`\`\`
   // Test cases to verify the fix works
   \`\`\`

**5. DEEPER CONTEXT** (if relevant)
   • Performance implications of the fix
   • Alternative solutions and trade-offs
   • Related documentation or resources

**DELIVER:** Clear, actionable solution with explained reasoning.`;
    },

    // Content/Blog Writing
    content_writing: (topic, wordCount, tone) => {
        const toneGuidance = {
            'professional': 'authoritative yet accessible, using industry terminology appropriately',
            'casual': 'conversational and relatable, like talking to a knowledgeable friend',
            'technical': 'precise and detailed, assuming expert-level audience'
        };

        return `You are a professional content strategist and writer specializing in ${topic.includes('tech') || topic.includes('AI') ? 'technology and digital trends' : 'engaging, research-backed content'}.

Your task: Write a ${wordCount}-word ${tone} article about: ${topic}

**CONTENT FRAMEWORK:**

**1. HEADLINE**
Create a compelling, SEO-optimized title using power words. Formula: [Number] + [Adjective] + [Keyword] + [Promise]
Example: "7 Proven Strategies to [Outcome] in 2026"

**2. OPENING (150-200 words)**
• Hook: Start with a provocative question, surprising stat, or relatable scenario
• Promise: Clearly state what readers will learn/gain
• Credibility: Briefly establish why you're qualified to write this

**3. BODY STRUCTURE**

   **Main Point #1**
   • Subheading (H2)
   • Supporting evidence (data, examples, quotes)
   • Practical takeaway

   **Main Point #2**
   [Repeat structure]

   **Main Point #3**
   [Repeat structure]

   [Continue for 3-5 main points depending on word count]

**4. WRITING STYLE**
• Tone: ${toneGuidance[tone] || 'professional and clear'}
• Paragraphs: 2-4 sentences max for readability
• Use bullet points and numbered lists for scannability
• Include concrete examples, not vague generalities
• Add transitional phrases for flow

**5. SEO OPTIMIZATION**
• Primary keyword: [Identify from topic]
• Use keyword naturally in: title, first paragraph, subheadings, conclusion
• Include LSI (Latent Semantic Indexing) keywords
• Meta description (150-160 characters): [Write one]

**6. ENGAGEMENT ELEMENTS**
• Pose questions to readers
• Include relevant statistics or data points
• Add subheadings every 300-400 words
• Consider adding [infographic suggestions] or [image ideas]

**7. CONCLUSION (100-150 words)**
• Summarize key takeaways (3-5 bullet points)
• Call-to-action: What should readers do next?
• Future outlook or thought-provoking final statement

**FORMAT:**
Deliver publication-ready content with:
• H1 headline
• H2 section headers
• Proper paragraph spacing
• Bold for emphasis (sparingly)
• Hyperlink suggestions [where relevant research could be cited]`;
    },

    // Explanation/Educational
    explanation: (concept) => {
        return `You are a master educator and technical communicator who excels at making complex topics accessible without sacrificing accuracy.

Your task: Explain ${concept} in a comprehensive yet understandable way.

**TEACHING FRAMEWORK:**

**1. SIMPLE OVERVIEW (ELI5 - Explain Like I'm 5)**
Start with a one-sentence definition, then use an everyday analogy.

Example format:
"${concept} is [simple definition]. Think of it like [relatable analogy]."

**2. CORE MECHANICS**
Explain HOW it actually works, step-by-step:
• Step 1: [What happens first]
• Step 2: [What happens next]
• Step 3: [Final outcome]

Use plain language first, then introduce technical terms with definitions.

**3. PRACTICAL EXAMPLES**
Provide 2-3 real-world examples showing ${concept} in action:
• Example 1: [Everyday scenario]
• Example 2: [Technical application]
• Example 3: [Advanced use case]

**4. COMMON MISCONCEPTIONS**
Address what people often misunderstand:
• Myth: [Common wrong belief]
  Reality: [Correct understanding]
• Myth: [Another misconception]
  Reality: [Clarification]

**5. WHY IT MATTERS**
Explain the significance:
• Practical benefits
• Historical context (if relevant)
• Future implications

**6. DEEPER DIVE** (Optional - for interested readers)
• Technical details for advanced understanding
• Mathematical/scientific principles (if applicable)
• Related concepts and how they connect

**7. KEY TAKEAWAYS**
Summarize in 3-5 bullet points what readers should remember.

**LEARNING RESOURCES:**
• [Suggest 2-3 resources for further learning]

**DELIVERY STYLE:**
• Use progressive disclosure (simple → complex)
• Include diagrams/visual descriptions where helpful
• Maintain enthusiasm - make it interesting!
• Test understanding with a simple question at the end`;
    },

    // Brainstorming/Ideation
    brainstorming: (challenge, count) => {
        return `You are an innovation consultant and creative strategist specializing in systematic ideation, lateral thinking, and breakthrough solutions.

Your task: Generate ${count || '15-20'} creative, actionable ideas for: ${challenge}

**IDEATION FRAMEWORK:**

**1. QUICK WINS (5-7 ideas)**
Low effort, immediate impact solutions
Format for each:
• **Idea:** [Concise title]
• **Execution:** [How to implement in 1-2 weeks]
• **Impact:** [Expected result]
• **Difficulty:** ⭐ (Easy)

**2. INNOVATIVE APPROACHES (5-7 ideas)**
Creative solutions requiring moderate resources
Format for each:
• **Idea:** [Compelling title]
• **Concept:** [Unique angle or approach]
• **Requirements:** [What you need to execute]
• **Potential ROI:** [Value proposition]
• **Difficulty:** ⭐⭐ (Medium)

**3. MOONSHOT IDEAS (3-5 ideas)**
Ambitious, transformative concepts
Format for each:
• **Idea:** [Bold vision]
• **Game-changer:** [Why this could be revolutionary]
• **Challenges:** [Key obstacles to overcome]
• **Timeline:** [Realistic timeframe]
• **Difficulty:** ⭐⭐⭐ (Hard)

**CREATIVE TECHNIQUES APPLIED:**
• SCAMPER: Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse
• First Principles: Break problem down to fundamentals
• Analogous Thinking: Solutions from other industries
• Constraint Removal: "What if we had unlimited [resource]?"

**PRIORITIZATION MATRIX:**
\`\`\`
         │ High Impact
         │
    ⭐⭐⭐ │ Moonshots
         │
Medium   │ ⭐⭐ Innovative
Impact   │
         │
    Low  │ ⭐ Quick Wins
         │
         └─────────────────
           Easy → Hard
           (Difficulty)
\`\`\`

**TOP 3 RECOMMENDATIONS:**
1. **[Idea Name]** - [1-sentence rationale for why this is priority #1]
2. **[Idea Name]** - [Why this is priority #2]
3. **[Idea Name]** - [Why this is priority #3]

**IMPLEMENTATION ROADMAP:**
Phase 1 (Weeks 1-2): [Which ideas to start with]
Phase 2 (Month 2-3): [Next set of ideas]
Phase 3 (Month 4-6): [Long-term ideas]

**AVOID:** Generic suggestions. Each idea should be specific, actionable, and tailored to the challenge.`;
    }
};

module.exports = { PromptFramework };
