# Prompt Generation Philosophy

## Core Principles

PromptCraft follows a **task-aligned, minimal** approach to prompt generation:

### 1. **Identify Task Type First**
- Creative writing
- Technical/factual information  
- Code development
- Debugging
- Brainstorming
- General explanation

### 2. **Include Only Relevant Instructions**
- Each task type gets appropriate guidance
- No mixing of incompatible requirements
- No unnecessary meta-instructions

### 3. **Avoid Common Anti-Patterns**

❌ **Don't Do:**
- Mix creative writing prompts with factual accuracy requirements
- Request structured formats for narrative/creative tasks
- Add meta-instructions unless explicitly needed
- Over-specify format requirements
- Create verbose, multi-section templates

✅ **Do:**
- Keep prompts concise and unambiguous
- Focus on the specific task at hand
- Optimize for LLM execution
- Provide only necessary context
- Use natural, direct language

## Prompt Templates

### Technical/Development Tasks
```
Create a [type] for: [user's request]

Include:
- Tech stack recommendation
- Key implementation steps
- Code examples for critical functionality
```

### Creative/Writing Tasks
```
Write [length] [tone] content about: [user's request]

Include:
- Compelling headline
- Engaging introduction
- Clear structure with examples
```

### Debugging Tasks
```
Debug this issue: [user's request]

Include:
- Root cause identification
- Working code fix
- Prevention tips
```

### Brainstorming Tasks
```
Generate [count] creative ideas for: [user's request]

For each idea:
- Brief description
- Feasibility
- Potential impact

Rank by priority and explain top recommendation.
```

## Why This Approach?

1. **LLMs perform better with clear, focused prompts** - Not verbose instructions
2. **Task-specific guidance is more effective** - Than one-size-fits-all templates
3. **Less is more** - Over-specification can confuse or constrain outputs
4. **Natural language works** - You don't need formal structures for every task

## Examples

### ❌ Bad (Old Approach)
```
## Content Writing Request

**Topic:** Write about AI

---

### Requirements:

**Tone:** professional and authoritative
**Length:** 800-1200 words

**Please include:**

1. **Compelling headline** - Attention-grabbing and SEO-friendly
2. **Strong introduction** - Hook the reader immediately
3. **Well-structured body** - Clear headings and subheadings
4. **Practical examples** - Real-world applications
5. **Actionable conclusion** - Clear takeaways
6. **Meta description** - For SEO (150-160 characters)

**Additional requirements:**
- Use short paragraphs for readability
- Include bullet points where appropriate
- Add relevant statistics or data if applicable
- Ensure originality and factual accuracy
```

### ✅ Good (New Approach)
```
Write 800-1200 word professional content about: AI

Include:
- Compelling headline
- Engaging introduction
- Well-structured body with examples
- Clear conclusion
```

**Why it's better:**
- 70% shorter
- Equally clear
- No meta-instructions
- Focused on the actual task
- Doesn't over-constrain the LLM

## Implementation

See `/lambda/index.js` for the actual implementation:
- `generateAppDevelopmentPrompt()` - For app/web development
- `generateDebuggingPrompt()` - For bug fixes
- `generateContentPrompt()` - For writing tasks
- `generateExplanationPrompt()` - For explanations
- `generateBrainstormingPrompt()` - For ideation
- `generateGeneralPrompt()` - For general queries

Each function creates concise, task-aligned prompts optimized for LLM execution.
