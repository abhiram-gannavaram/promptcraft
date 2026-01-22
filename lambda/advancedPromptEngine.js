/**
 * ADVANCED PROMPT ENGINE v2.0
 * 
 * Uses NLP-like entity extraction and semantic analysis to generate
 * rich, specific prompts that match professional quality standards.
 * 
 * Key Features:
 * - Entity extraction (characters, settings, themes)
 * - Semantic enrichment
 * - Context-aware specifications
 * - Dynamic requirement generation
 */

// =============================================================
// ENTITY EXTRACTION SYSTEM (NLP-like analysis)
// =============================================================

const EntityExtractor = {
    
    // Extract character/creature entities from prompt
    extractCharacters: (prompt) => {
        const lower = prompt.toLowerCase();
        const entities = [];
        
        // Mythical creatures with their attributes
        const creatures = {
            dragon: { type: 'mythical creature', attributes: ['ancient', 'powerful', 'intelligent'], 
                      species: ['Western dragon', 'Eastern dragon', 'Wyvern', 'Drake', 'Wyrm'],
                      roles: ['guardian', 'destroyer', 'sage', 'outcast', 'last of its kind'] },
            unicorn: { type: 'mythical creature', attributes: ['pure', 'magical', 'elusive'],
                       species: ['Celestial unicorn', 'Forest unicorn', 'Dark unicorn'],
                       roles: ['protector', 'healer', 'guide', 'hunted'] },
            phoenix: { type: 'mythical creature', attributes: ['immortal', 'fiery', 'rebirth'],
                       species: ['Fire phoenix', 'Ice phoenix', 'Shadow phoenix'],
                       roles: ['symbol of hope', 'eternal witness', 'catalyst of change'] },
            wizard: { type: 'character', attributes: ['wise', 'mysterious', 'powerful'],
                      archetypes: ['mentor', 'hermit', 'corrupted', 'young apprentice'] },
            robot: { type: 'character', attributes: ['logical', 'learning', 'evolving'],
                     types: ['android', 'AI consciousness', 'ancient automaton', 'war machine'],
                     arcs: ['gaining humanity', 'questioning purpose', 'protecting humans'] },
            vampire: { type: 'character', attributes: ['immortal', 'cursed', 'predatory'],
                       types: ['ancient noble', 'reluctant monster', 'feral creature'],
                       themes: ['immortality burden', 'humanity loss', 'redemption'] },
            ghost: { type: 'supernatural', attributes: ['ethereal', 'bound', 'unfinished'],
                     types: ['vengeful spirit', 'protective guardian', 'lost soul'],
                     purposes: ['unfinished business', 'warning', 'protection'] },
            warrior: { type: 'character', attributes: ['skilled', 'honorable', 'scarred'],
                       archetypes: ['reluctant hero', 'fallen knight', 'last defender'] },
            witch: { type: 'character', attributes: ['mystical', 'outcast', 'knowledgeable'],
                     types: ['hedge witch', 'dark sorceress', 'nature guardian'] },
            elf: { type: 'mythical race', attributes: ['ancient', 'graceful', 'magical'],
                   types: ['high elf', 'wood elf', 'dark elf', 'exiled'] },
            fairy: { type: 'mythical creature', attributes: ['small', 'mischievous', 'magical'],
                     types: ['trickster', 'guardian', 'court fae'] },
            mermaid: { type: 'mythical creature', attributes: ['mysterious', 'beautiful', 'dangerous'],
                       types: ['siren', 'sea guardian', 'cursed human'] },
            demon: { type: 'supernatural', attributes: ['dark', 'powerful', 'tempter'],
                     types: ['fallen angel', 'ancient evil', 'bound servant'] },
            angel: { type: 'supernatural', attributes: ['divine', 'righteous', 'messenger'],
                     types: ['guardian', 'warrior', 'fallen', 'observer'] },
            alien: { type: 'character', attributes: ['otherworldly', 'advanced', 'curious'],
                     types: ['explorer', 'refugee', 'observer', 'invader'] },
            knight: { type: 'character', attributes: ['honorable', 'loyal', 'burdened'],
                      archetypes: ['questing knight', 'fallen hero', 'guardian'] },
            pirate: { type: 'character', attributes: ['adventurous', 'lawless', 'cunning'],
                      archetypes: ['captain', 'treasure hunter', 'reformed criminal'] },
            detective: { type: 'character', attributes: ['observant', 'persistent', 'haunted'],
                         archetypes: ['noir detective', 'amateur sleuth', 'consulting detective'] },
            assassin: { type: 'character', attributes: ['deadly', 'shadowy', 'conflicted'],
                        archetypes: ['reluctant killer', 'reformed', 'honor-bound'] },
            princess: { type: 'character', attributes: ['noble', 'trapped', 'resourceful'],
                        archetypes: ['rebel', 'diplomat', 'warrior princess'] },
            king: { type: 'character', attributes: ['powerful', 'burdened', 'decisive'],
                    archetypes: ['just ruler', 'tyrant', 'dying king'] },
            queen: { type: 'character', attributes: ['regal', 'strategic', 'formidable'],
                     archetypes: ['benevolent ruler', 'puppet master', 'warrior queen'] }
        };
        
        for (const [creature, data] of Object.entries(creatures)) {
            if (lower.includes(creature)) {
                entities.push({ name: creature, ...data });
            }
        }
        
        return entities.length > 0 ? entities : [{ name: 'protagonist', type: 'character', attributes: ['complex', 'driven', 'evolving'] }];
    },
    
    // Extract settings/environments
    extractSettings: (prompt) => {
        const lower = prompt.toLowerCase();
        const settings = [];
        
        const environments = {
            forest: { type: 'natural', atmosphere: 'mysterious', details: ['ancient trees', 'dappled light', 'hidden paths'] },
            castle: { type: 'architectural', atmosphere: 'grand', details: ['stone walls', 'torchlight', 'echoing halls'] },
            city: { type: 'urban', atmosphere: 'bustling', details: ['crowded streets', 'towering buildings', 'hidden alleys'] },
            ocean: { type: 'natural', atmosphere: 'vast', details: ['endless horizon', 'salt spray', 'hidden depths'] },
            mountain: { type: 'natural', atmosphere: 'majestic', details: ['snow peaks', 'thin air', 'ancient stone'] },
            desert: { type: 'natural', atmosphere: 'harsh', details: ['endless sand', 'scorching sun', 'oasis mirages'] },
            space: { type: 'cosmic', atmosphere: 'infinite', details: ['star fields', 'cosmic silence', 'alien worlds'] },
            cave: { type: 'underground', atmosphere: 'claustrophobic', details: ['dripping water', 'absolute darkness', 'hidden chambers'] },
            village: { type: 'settlement', atmosphere: 'rustic', details: ['thatched roofs', 'village square', 'local inn'] },
            kingdom: { type: 'realm', atmosphere: 'epic', details: ['sweeping vistas', 'political intrigue', 'ancient history'] },
            dungeon: { type: 'underground', atmosphere: 'dangerous', details: ['iron chains', 'distant screams', 'flickering torches'] },
            garden: { type: 'natural', atmosphere: 'peaceful', details: ['blooming flowers', 'winding paths', 'hidden secrets'] },
            library: { type: 'architectural', atmosphere: 'scholarly', details: ['dusty tomes', 'towering shelves', 'ancient knowledge'] },
            battlefield: { type: 'conflict zone', atmosphere: 'chaotic', details: ['clash of steel', 'fallen warriors', 'smoke and fire'] },
            island: { type: 'isolated', atmosphere: 'mysterious', details: ['hidden shores', 'jungle interior', 'ancient ruins'] },
            temple: { type: 'sacred', atmosphere: 'reverent', details: ['sacred symbols', 'incense smoke', 'echoing prayers'] },
            tavern: { type: 'social', atmosphere: 'lively', details: ['crackling fire', 'ale and stories', 'shadowy corners'] },
            palace: { type: 'royal', atmosphere: 'opulent', details: ['gilded halls', 'courtly intrigue', 'hidden passages'] },
            swamp: { type: 'natural', atmosphere: 'treacherous', details: ['murky water', 'twisted trees', 'unseen creatures'] },
            ruins: { type: 'ancient', atmosphere: 'melancholic', details: ['crumbling walls', 'lost glory', 'hidden treasures'] },
            tower: { type: 'architectural', atmosphere: 'isolated', details: ['spiral stairs', 'high windows', 'magical wards'] },
            ship: { type: 'vessel', atmosphere: 'adventurous', details: ['creaking timbers', 'salt wind', 'distant horizons'] },
            academy: { type: 'institution', atmosphere: 'scholarly', details: ['learned masters', 'eager students', 'hidden secrets'] },
            graveyard: { type: 'sacred', atmosphere: 'eerie', details: ['weathered stones', 'mist-shrouded paths', 'restless spirits'] },
            market: { type: 'social', atmosphere: 'vibrant', details: ['colorful stalls', 'exotic goods', 'haggling voices'] }
        };
        
        for (const [setting, data] of Object.entries(environments)) {
            if (lower.includes(setting)) {
                settings.push({ name: setting, ...data });
            }
        }
        
        return settings;
    },
    
    // Extract themes from context
    extractThemes: (prompt, characters) => {
        const lower = prompt.toLowerCase();
        const themes = [];
        
        // Theme detection based on keywords and character types
        const themePatterns = {
            'immortality': { keywords: ['immortal', 'eternal', 'forever', 'never die', 'vampire', 'phoenix', 'elf'], 
                             exploration: 'the burden and gift of living beyond mortal years' },
            'loss': { keywords: ['lose', 'lost', 'death', 'gone', 'grief', 'mourn'],
                      exploration: 'the profound impact of losing what we hold dear' },
            'identity': { keywords: ['who am i', 'true self', 'destiny', 'purpose', 'robot', 'android'],
                          exploration: 'the journey of self-discovery and understanding one\'s place in the world' },
            'power': { keywords: ['power', 'control', 'rule', 'kingdom', 'dragon', 'king', 'queen'],
                       exploration: 'the corrupting influence and responsibility of great power' },
            'redemption': { keywords: ['redemption', 'forgive', 'atone', 'past', 'mistake', 'fallen'],
                            exploration: 'the possibility of overcoming past failures and finding forgiveness' },
            'love': { keywords: ['love', 'heart', 'beloved', 'romance', 'passion'],
                      exploration: 'the transformative and sometimes destructive nature of love' },
            'sacrifice': { keywords: ['sacrifice', 'give up', 'cost', 'price', 'hero'],
                           exploration: 'what one must surrender for a greater good' },
            'knowledge': { keywords: ['knowledge', 'learn', 'secret', 'truth', 'wisdom', 'library', 'wizard'],
                           exploration: 'the pursuit and price of understanding hidden truths' },
            'freedom': { keywords: ['freedom', 'escape', 'prison', 'chain', 'slave', 'cage'],
                         exploration: 'the struggle against constraints and the meaning of true liberty' },
            'legacy': { keywords: ['legacy', 'heir', 'descendant', 'ancestor', 'bloodline'],
                        exploration: 'what we leave behind and how the past shapes the future' },
            'transformation': { keywords: ['change', 'transform', 'become', 'evolution', 'metamorphosis'],
                                exploration: 'the process of becoming something new, for better or worse' },
            'belonging': { keywords: ['belong', 'home', 'outcast', 'family', 'tribe', 'alone'],
                           exploration: 'the search for connection and a place in the world' },
            'betrayal': { keywords: ['betray', 'trust', 'treachery', 'deceive', 'lie'],
                          exploration: 'the shattering of trust and its lasting consequences' },
            'hope': { keywords: ['hope', 'light', 'darkness', 'despair', 'faith'],
                      exploration: 'finding light in the darkest moments' },
            'mortality': { keywords: ['mortal', 'death', 'dying', 'finite', 'time'],
                           exploration: 'confronting the finite nature of existence' }
        };
        
        // Check for explicit theme keywords
        for (const [theme, data] of Object.entries(themePatterns)) {
            for (const keyword of data.keywords) {
                if (lower.includes(keyword)) {
                    if (!themes.find(t => t.name === theme)) {
                        themes.push({ name: theme, exploration: data.exploration });
                    }
                    break;
                }
            }
        }
        
        // Infer themes from character types
        if (characters.length > 0) {
            const charType = characters[0].name;
            const inferredThemes = {
                dragon: ['power', 'immortality', 'knowledge'],
                robot: ['identity', 'belonging', 'transformation'],
                vampire: ['immortality', 'loss', 'redemption'],
                ghost: ['loss', 'belonging', 'legacy'],
                phoenix: ['transformation', 'hope', 'immortality'],
                wizard: ['knowledge', 'power', 'sacrifice']
            };
            
            if (inferredThemes[charType]) {
                for (const themeName of inferredThemes[charType]) {
                    if (!themes.find(t => t.name === themeName)) {
                        const themeData = themePatterns[themeName];
                        if (themeData) {
                            themes.push({ name: themeName, exploration: themeData.exploration });
                        }
                    }
                }
            }
        }
        
        // Default themes if none detected
        if (themes.length === 0) {
            themes.push(
                { name: 'identity', exploration: 'the journey of self-discovery' },
                { name: 'transformation', exploration: 'how experiences shape who we become' }
            );
        }
        
        return themes.slice(0, 3); // Return top 3 themes
    },
    
    // Extract actions/events
    extractActions: (prompt) => {
        const lower = prompt.toLowerCase();
        const actions = [];
        
        const actionPatterns = {
            painting: { type: 'creative', detail: 'discovering or creating art' },
            fighting: { type: 'conflict', detail: 'engaging in battle or combat' },
            flying: { type: 'movement', detail: 'soaring through the sky' },
            learning: { type: 'growth', detail: 'acquiring new knowledge or skills' },
            saving: { type: 'heroic', detail: 'rescuing or protecting others' },
            destroying: { type: 'destructive', detail: 'causing devastation or ruin' },
            discovering: { type: 'exploration', detail: 'uncovering hidden truths' },
            healing: { type: 'restorative', detail: 'mending wounds or restoring health' },
            hunting: { type: 'pursuit', detail: 'tracking and capturing prey' },
            teaching: { type: 'mentorship', detail: 'passing on knowledge to others' },
            escaping: { type: 'flight', detail: 'fleeing from danger or captivity' },
            building: { type: 'creative', detail: 'constructing something new' },
            ruling: { type: 'leadership', detail: 'governing or commanding others' },
            searching: { type: 'quest', detail: 'seeking something lost or hidden' },
            protecting: { type: 'guardian', detail: 'defending the vulnerable' },
            dying: { type: 'mortality', detail: 'facing the end of existence' },
            awakening: { type: 'transformation', detail: 'coming to consciousness or realization' },
            falling: { type: 'descent', detail: 'losing status, grace, or literally plummeting' },
            rising: { type: 'ascent', detail: 'gaining power, status, or overcoming obstacles' },
            choosing: { type: 'decision', detail: 'making a crucial choice' }
        };
        
        for (const [action, data] of Object.entries(actionPatterns)) {
            if (lower.includes(action) || lower.includes(action.slice(0, -3))) { // Handle verb forms
                actions.push({ action: action, ...data });
            }
        }
        
        return actions;
    },
    
    // Detect genre
    detectGenre: (prompt, characters, settings) => {
        const lower = prompt.toLowerCase();
        
        const genreIndicators = {
            fantasy: ['dragon', 'magic', 'wizard', 'elf', 'kingdom', 'sword', 'spell', 'castle', 'quest'],
            scifi: ['robot', 'space', 'alien', 'future', 'technology', 'android', 'spaceship', 'AI'],
            horror: ['ghost', 'demon', 'haunted', 'terror', 'nightmare', 'monster', 'curse', 'blood'],
            romance: ['love', 'heart', 'passion', 'desire', 'kiss', 'beloved'],
            mystery: ['detective', 'murder', 'clue', 'mystery', 'secret', 'investigation'],
            adventure: ['quest', 'journey', 'treasure', 'explore', 'expedition', 'voyage'],
            thriller: ['chase', 'danger', 'escape', 'survival', 'hunter', 'prey'],
            historical: ['ancient', 'medieval', 'war', 'empire', 'dynasty', 'century'],
            literary: ['meaning', 'life', 'death', 'truth', 'existence', 'consciousness']
        };
        
        for (const [genre, keywords] of Object.entries(genreIndicators)) {
            for (const keyword of keywords) {
                if (lower.includes(keyword)) {
                    return genre;
                }
            }
        }
        
        // Infer from characters
        if (characters.length > 0) {
            const charName = characters[0].name;
            if (['dragon', 'wizard', 'elf', 'fairy', 'unicorn'].includes(charName)) return 'fantasy';
            if (['robot', 'alien'].includes(charName)) return 'scifi';
            if (['ghost', 'demon', 'vampire'].includes(charName)) return 'horror';
            if (['detective'].includes(charName)) return 'mystery';
            if (['pirate', 'knight', 'warrior'].includes(charName)) return 'adventure';
        }
        
        return 'literary fiction';
    }
};

// =============================================================
// ADVANCED PROMPT GENERATORS
// =============================================================

const AdvancedPromptEngine = {
    
    // Generate rich creative writing prompt
    creative_writing: (originalPrompt, length = 'balanced') => {
        // Extract entities
        const characters = EntityExtractor.extractCharacters(originalPrompt);
        const settings = EntityExtractor.extractSettings(originalPrompt);
        const themes = EntityExtractor.extractThemes(originalPrompt, characters);
        const actions = EntityExtractor.extractActions(originalPrompt);
        const genre = EntityExtractor.detectGenre(originalPrompt, characters, settings);
        
        // Primary character
        const mainChar = characters[0];
        const charName = mainChar.name.charAt(0).toUpperCase() + mainChar.name.slice(1);
        
        // Word count based on length
        const wordCount = length === 'concise' ? '1000-1500' : length === 'detailed' ? '2500-3500' : '1500-2000';
        
        // Build character specification
        let charSpec = '';
        if (mainChar.species) {
            charSpec = `Specify the ${mainChar.name}'s species (${mainChar.species.join(', ')} or your own creation)`;
        } else if (mainChar.archetypes) {
            charSpec = `Define the character archetype (${mainChar.archetypes.join(', ')} or original)`;
        } else if (mainChar.types) {
            charSpec = `Establish the type (${mainChar.types.join(', ')} or unique variation)`;
        }
        
        // Build role specification
        let roleSpec = '';
        if (mainChar.roles) {
            roleSpec = `Historical/narrative role: ${mainChar.roles.join(', ')} or create a unique role`;
        } else if (mainChar.arcs) {
            roleSpec = `Character arc possibilities: ${mainChar.arcs.join(', ')}`;
        }
        
        // Build setting description
        let settingDesc = '';
        if (settings.length > 0) {
            const setting = settings[0];
            settingDesc = `\n\n**SETTING REQUIREMENTS:**\nEnvironment: ${setting.name.charAt(0).toUpperCase() + setting.name.slice(1)}\nAtmosphere: ${setting.atmosphere}\nSensory Details to Include: ${setting.details.join(', ')}`;
        } else {
            settingDesc = `\n\n**SETTING REQUIREMENTS:**\nCreate a vivid, immersive environment that complements the ${genre} genre. Include specific sensory details: visual elements, sounds, smells, textures, and ambient atmosphere.`;
        }
        
        // Build action focus
        let actionFocus = '';
        if (actions.length > 0) {
            const action = actions[0];
            actionFocus = `\n\n**CENTRAL ACTION/EVENT:**\n${action.detail.charAt(0).toUpperCase() + action.detail.slice(1)} - this should be central to the narrative, revealing character and advancing theme.`;
        }
        
        // Build theme requirements
        const themeRequirements = themes.map((t, i) => `${i + 1}. **${t.name.charAt(0).toUpperCase() + t.name.slice(1)}**: ${t.exploration}`).join('\n');
        
        // Genre-specific writing tips
        const genreTips = {
            fantasy: 'Use evocative, lyrical language. Build a sense of wonder and ancient mystery. Magic should have rules and costs.',
            scifi: 'Ground futuristic elements in relatable human emotions. Technology should serve the story, not overwhelm it.',
            horror: 'Build dread through atmosphere and implication rather than explicit gore. Fear of the unknown is most powerful.',
            romance: 'Focus on emotional truth and character chemistry. Show vulnerability and growth.',
            mystery: 'Plant clues fairly. Build suspense through revelation and withholding. The answer should be surprising yet inevitable.',
            adventure: 'Maintain momentum through escalating challenges. Balance action with character moments.',
            thriller: 'Keep the pace tight. Use short sentences during intense moments. Create genuine stakes.',
            historical: 'Research period details but don\'t let them overwhelm the story. Characters should feel authentic to their time.',
            'literary fiction': 'Prioritize character depth and thematic resonance over plot. Language itself can be beautiful.'
        };
        
        // Construct the enhanced prompt
        return `Write a compelling, original short story (approximately ${wordCount} words) featuring a ${mainChar.name} as a central character.

**CHARACTER REQUIREMENTS:**
${charSpec}
${roleSpec}
Primary motivation or internal conflict: Define what the ${mainChar.name} wants vs. what it needs - create psychological depth through this tension.
Attributes to embody: ${mainChar.attributes.join(', ')}
${settingDesc}
${actionFocus}

**THEMATIC EXPLORATION (choose at least one as primary focus):**
${themeRequirements}

**NARRATIVE STRUCTURE:**
• **Opening Hook**: Begin with immediate intrigue - a striking image, provocative question, or moment of tension
• **Rising Action**: Escalate the central conflict through at least 3 distinct complications
• **Climax**: Deliver a transformative moment of revelation, decision, or confrontation
• **Resolution**: Provide emotional closure that resonates with your chosen theme (avoid neat, clichéd endings)

**CRAFT REQUIREMENTS:**
• **POV**: Write from the ${mainChar.name}'s perspective using ${genre === 'literary fiction' ? 'close third-person or first-person' : 'the most effective viewpoint for your story'}
• **Sensory Detail**: Include vivid descriptions engaging at least 3 senses in each scene
• **Dialogue**: If present, dialogue must reveal character and advance plot simultaneously
• **Pacing**: Vary sentence length - short during tension, longer during reflection
• **Show Don't Tell**: Dramatize emotions through actions, body language, and environmental details

**GENRE GUIDANCE (${genre.charAt(0).toUpperCase() + genre.slice(1)}):**
${genreTips[genre] || genreTips['literary fiction']}

**QUALITY STANDARDS:**
The story should be publication-ready, demonstrating mastery of:
- A distinctive narrative voice
- Believable character motivation
- Atmospheric world-building
- Thematic coherence
- A memorable final line that echoes the central theme

Begin your story immediately with the narrative - no preamble or meta-commentary.`;
    },

    // App Development (keep similar to before but more detailed)
    app_development: (appDescription, platform, features) => {
        const isAndroid = platform === 'Android';
        const isiOS = platform === 'iOS';
        const language = isAndroid ? 'Kotlin' : isiOS ? 'Swift' : 'TypeScript (React Native)';
        
        // Extract app type and features
        const appFeatures = [];
        const lower = appDescription.toLowerCase();
        
        // Detect app type
        let appType = 'general';
        if (lower.includes('talk') || lower.includes('voice') || lower.includes('speak')) {
            appType = 'voice-interactive';
            appFeatures.push('Text-to-Speech (TTS)', 'Speech Recognition', 'Voice Effects');
        }
        if (lower.includes('game')) {
            appType = 'game';
            appFeatures.push('Game Loop', 'Animation System', 'Score Tracking', 'Levels/Progression');
        }
        if (lower.includes('social') || lower.includes('chat')) {
            appType = 'social';
            appFeatures.push('Real-time Messaging', 'User Profiles', 'Friend System', 'Notifications');
        }
        if (lower.includes('shop') || lower.includes('store') || lower.includes('ecommerce')) {
            appType = 'ecommerce';
            appFeatures.push('Product Catalog', 'Shopping Cart', 'Payment Integration', 'Order Tracking');
        }
        if (lower.includes('fitness') || lower.includes('health')) {
            appType = 'health';
            appFeatures.push('Activity Tracking', 'Health Metrics', 'Progress Charts', 'Reminders');
        }
        
        // Add passed features
        appFeatures.push(...features);
        
        return `Design and build a complete ${platform} application: ${appDescription}

**PROJECT SPECIFICATIONS:**
App Type: ${appType.charAt(0).toUpperCase() + appType.slice(1)} Application
Platform: ${platform}
Language: ${language}
${appFeatures.length > 0 ? `Core Features: ${[...new Set(appFeatures)].join(', ')}` : ''}

**ARCHITECTURE DESIGN:**

1. **Pattern: Clean Architecture with MVVM**
\`\`\`
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │    Views    │◄─│   ViewModels    │   │
│  │ (UI/Screens)│  │ (State+Logic)   │   │
│  └─────────────┘  └────────┬────────┘   │
├─────────────────────────────┼───────────┤
│             Domain Layer    │           │
│  ┌─────────────────────────▼────────┐   │
│  │         Use Cases/Interactors    │   │
│  │    (Business Logic Orchestration)│   │
│  └────────────────┬─────────────────┘   │
├───────────────────┼─────────────────────┤
│          Data Layer                     │
│  ┌────────────────▼─────────────────┐   │
│  │           Repositories           │   │
│  └──┬─────────────────────────┬─────┘   │
│  ┌──▼──┐  ┌─────────┐  ┌──────▼─────┐   │
│  │ API │  │  Cache  │  │  Database  │   │
│  └─────┘  └─────────┘  └────────────┘   │
└─────────────────────────────────────────┘
\`\`\`

2. **TECHNOLOGY STACK:**

| Layer | Technology |
|-------|------------|
| Language | ${language} |
| UI Framework | ${isAndroid ? 'Jetpack Compose' : isiOS ? 'SwiftUI' : 'React Native'} |
| State Management | ${isAndroid ? 'StateFlow + ViewModel' : isiOS ? 'Combine + ObservableObject' : 'Redux/Zustand'} |
| Networking | ${isAndroid ? 'Retrofit2 + OkHttp + Moshi' : isiOS ? 'URLSession + Alamofire' : 'Axios'} |
| Database | ${isAndroid ? 'Room' : isiOS ? 'CoreData/SwiftData' : 'SQLite/Realm'} |
| DI | ${isAndroid ? 'Hilt' : isiOS ? 'Swift DI' : 'React Context'} |
| Navigation | ${isAndroid ? 'Navigation Compose' : isiOS ? 'NavigationStack' : 'React Navigation'} |
${appFeatures.includes('Text-to-Speech (TTS)') ? `| TTS | ${isAndroid ? 'android.speech.tts.TextToSpeech' : isiOS ? 'AVSpeechSynthesizer' : 'expo-speech'} |` : ''}
${appFeatures.includes('Speech Recognition') ? `| Speech | ${isAndroid ? 'SpeechRecognizer' : isiOS ? 'SFSpeechRecognizer' : 'expo-speech'} |` : ''}

3. **IMPLEMENTATION PHASES:**

**Phase 1: Project Setup & Core Architecture**
\`\`\`${language.toLowerCase().includes('kotlin') ? 'kotlin' : language.toLowerCase().includes('swift') ? 'swift' : 'typescript'}
${isAndroid ? `// app/build.gradle.kts
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.dagger.hilt.android")
    id("org.jetbrains.kotlin.kapt")
}

dependencies {
    // Core
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    
    // Compose
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    
    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.7")
    
    // Hilt
    implementation("com.google.dagger:hilt-android:2.50")
    kapt("com.google.dagger:hilt-compiler:2.50")
    
    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-moshi:2.9.0")
    
    // Room
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")
}` : isiOS ? `// Package.swift or SPM dependencies
dependencies: [
    .package(url: "https://github.com/Alamofire/Alamofire.git", from: "5.8.0"),
    .package(url: "https://github.com/realm/SwiftLint.git", from: "0.54.0")
]

// App structure
@main
struct MainApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}` : `// package.json
{
  "dependencies": {
    "@react-navigation/native": "^6.1.0",
    "react-native": "0.73.0",
    "axios": "^1.6.0",
    "zustand": "^4.5.0"
  }
}`}
\`\`\`

**Phase 2: Data Layer Implementation**

**Phase 3: Domain Layer (Use Cases)**

**Phase 4: Presentation Layer (UI)**

**Phase 5: Feature Integration**

4. **SPECIFIC FEATURES TO IMPLEMENT:**
${[...new Set(appFeatures)].map(f => `• ${f}`).join('\n')}

5. **PERMISSIONS REQUIRED:**
${isAndroid ? `\`\`\`xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
${appFeatures.includes('Speech Recognition') ? '<uses-permission android:name="android.permission.RECORD_AUDIO" />' : ''}
${appFeatures.includes('Activity Tracking') ? '<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />' : ''}
\`\`\`` : isiOS ? `\`\`\`
// Info.plist keys
NSMicrophoneUsageDescription - If using voice features
NSCameraUsageDescription - If using camera
\`\`\`` : '// Configure in app.json for Expo'}

6. **TESTING REQUIREMENTS:**
• Unit Tests: ViewModels, Use Cases, Repositories
• Integration Tests: API + Database
• UI Tests: Critical user flows

7. **DELIVERABLES:**
□ Complete source code with comments
□ Architecture diagram
□ API documentation
□ README with setup instructions
□ Unit test coverage >70%`;
    },

    // Web Development
    web_development: (description, features) => {
        // Similar detailed implementation...
        const techStack = features.includes('user authentication') ? 
            'Next.js 14 + Auth.js + Prisma + PostgreSQL' : 
            'Next.js 14 + Tailwind CSS';
            
        return `Build a modern, production-ready web application: ${description}

**PROJECT REQUIREMENTS:**

1. **TECHNOLOGY STACK:**
   Framework: Next.js 14+ (App Router)
   Styling: Tailwind CSS + shadcn/ui
   State: React Server Components + Zustand (client state)
   Database: ${features.includes('database design') ? 'PostgreSQL with Prisma ORM' : 'As needed'}
   Auth: ${features.includes('user authentication') ? 'NextAuth.js / Auth.js' : 'If required'}
   Deployment: Vercel (recommended)

2. **PROJECT STRUCTURE:**
\`\`\`
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   └── page.tsx
│   ├── api/
│   │   └── [...route]/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/           # Reusable UI components
│   ├── forms/        # Form components
│   └── layouts/      # Layout components
├── lib/
│   ├── db.ts         # Database connection
│   ├── auth.ts       # Auth configuration
│   └── utils.ts      # Utility functions
├── hooks/            # Custom React hooks
├── types/            # TypeScript types
└── styles/           # Global styles
\`\`\`

3. **IMPLEMENTATION REQUIREMENTS:**
   • Server-side rendering for SEO-critical pages
   • API routes for backend logic
   • Responsive design (mobile-first)
   • Accessibility (WCAG 2.1 AA)
   • Performance optimization (Core Web Vitals)
   • Error boundaries and loading states

4. **FEATURES TO BUILD:**
${features.map(f => `   • ${f}`).join('\n') || '   • Core functionality as described'}

5. **CODE QUALITY:**
   • TypeScript strict mode
   • ESLint + Prettier configuration
   • Component documentation
   • Unit tests for utilities
   • E2E tests for critical flows

6. **DELIVERABLES:**
   □ Complete, deployable application
   □ Environment configuration guide
   □ API documentation
   □ Deployment instructions`;
    },

    // Code Writing
    code_writing: (task, language) => {
        const lang = language || 'the appropriate language';
        
        return `Implement a production-quality solution for: ${task}

**REQUIREMENTS:**

1. **CODE STANDARDS:**
   Language: ${lang}
   Style: Follow ${lang} best practices and idioms
   Principles: Apply SOLID, DRY, and clean code principles
   Documentation: Include docstrings/comments for public APIs

2. **SOLUTION STRUCTURE:**

   A. **Problem Analysis**
   Explain the problem, edge cases, and your approach

   B. **Implementation**
   Complete, runnable code with:
   • Clear variable/function naming
   • Proper error handling
   • Input validation
   • Edge case handling

   C. **Usage Examples**
   Demonstrate practical usage scenarios

   D. **Complexity Analysis**
   • Time Complexity: O(?)
   • Space Complexity: O(?)

   E. **Testing**
   Unit tests covering:
   • Normal cases
   • Edge cases
   • Error cases

   F. **Alternative Approaches**
   Briefly discuss trade-offs of other solutions

3. **QUALITY CHECKLIST:**
   □ Code compiles/runs without errors
   □ Handles edge cases gracefully
   □ Efficient time/space complexity
   □ Well-documented
   □ Follows language conventions`;
    },

    // Debugging
    debugging: (problem) => {
        return `Diagnose and fix the following issue: ${problem}

**DEBUGGING FRAMEWORK:**

1. **PROBLEM ANALYSIS:**
   • Reproduce the issue
   • Identify expected vs. actual behavior
   • Isolate the scope (which component/function?)

2. **ROOT CAUSE INVESTIGATION:**
   • Examine error messages/stack traces
   • Check recent changes
   • Review related code paths
   • Identify data flow issues

3. **SOLUTION:**
   • Explain the root cause
   • Provide the corrected code
   • Explain why the fix works

4. **VERIFICATION:**
   • Test cases to confirm the fix
   • Regression tests to prevent recurrence

5. **PREVENTION:**
   • Recommendations to avoid similar issues
   • Code improvements or best practices`;
    },

    // Content Writing
    content_writing: (topic, wordCount = 1000, tone = 'professional') => {
        return `Write a ${wordCount}-word ${tone} article about: ${topic}

**CONTENT FRAMEWORK:**

1. **HEADLINE:**
   Create an SEO-optimized, compelling title
   Formula: [Number] + [Adjective] + [Keyword] + [Promise/Benefit]

2. **OPENING (10% of word count):**
   • Hook: Start with surprising fact, question, or story
   • Context: Why this matters now
   • Promise: What reader will learn

3. **BODY (75% of word count):**
   3-5 main sections with:
   • H2 subheadings (keyword-rich)
   • Supporting data/research
   • Practical examples
   • Bullet points for scannability

4. **CONCLUSION (15% of word count):**
   • Key takeaways summary
   • Clear call-to-action
   • Forward-looking statement

5. **SEO REQUIREMENTS:**
   • Primary keyword in title, intro, and conclusion
   • Related keywords naturally distributed
   • Meta description (155 characters)
   • Internal/external link suggestions

6. **WRITING STYLE:**
   Tone: ${tone}
   Paragraphs: 2-4 sentences max
   Voice: Active over passive
   Reading level: Grade 8-10`;
    },

    // Explanation
    explanation: (concept) => {
        return `Explain ${concept} comprehensively but accessibly.

**TEACHING FRAMEWORK:**

1. **SIMPLE DEFINITION (ELI5):**
   One sentence + everyday analogy

2. **HOW IT WORKS:**
   Step-by-step breakdown with diagrams if helpful

3. **REAL-WORLD EXAMPLES:**
   • Basic example
   • Intermediate example  
   • Advanced application

4. **COMMON MISCONCEPTIONS:**
   What people often misunderstand and why

5. **KEY TAKEAWAYS:**
   3-5 essential points to remember

6. **DEEPER LEARNING:**
   Resources for further exploration`;
    },

    // Brainstorming
    brainstorming: (challenge) => {
        return `Generate innovative solutions for: ${challenge}

**IDEATION FRAMEWORK:**

Generate 15 ideas organized by feasibility:

**QUICK WINS (5-6 ideas):**
Implementable in days/weeks, low resource requirement
Format: Idea | Execution Steps | Expected Impact

**INNOVATIVE APPROACHES (5-6 ideas):**
Moderate effort, creative solutions
Format: Concept | Requirements | Potential Value

**MOONSHOT IDEAS (3-4 ideas):**
Ambitious, transformative possibilities
Format: Vision | Key Challenges | Long-term Potential

**CREATIVE TECHNIQUES APPLIED:**
• SCAMPER (Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse)
• First Principles thinking
• Analogy from other industries
• Constraint removal`;
    },

    // General fallback
    general: (prompt) => {
        return `Provide a comprehensive, expert-level response to: ${prompt}

**RESPONSE FRAMEWORK:**

1. **DIRECT ANSWER:**
   Address the core question clearly and concisely

2. **CONTEXT & BACKGROUND:**
   Relevant background information

3. **DETAILED EXPLANATION:**
   In-depth coverage with examples

4. **PRACTICAL APPLICATION:**
   How to use this information

5. **ADDITIONAL CONSIDERATIONS:**
   Related points, caveats, or alternatives

6. **SUMMARY:**
   Key takeaways in bullet points`;
    }
};

module.exports = { AdvancedPromptEngine, EntityExtractor };
