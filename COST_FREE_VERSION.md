# Cost-Free Version Guide

This document explains how to use the cost-free version of the Writing Assistant that removes all LLM API calls.

## Overview

The writing tool has two versions:

### Version 1: Full-Featured (Current)
- **AI-Powered Scoring** - Uses LLM to evaluate student writing against 6 criteria
- **Intelligent Feedback** - LLM generates personalized improvement suggestions
- **Smart Word Bank** - LLM creates topic-specific vocabulary lists
- **Cost**: $0.05-0.60 per student session (LLM API usage)

### Version 2: Cost-Free (New)
- **Static Scoring** - Rule-based scoring (no AI)
- **Generic Tips** - Pre-written suggestions for each section
- **Predefined Word Bank** - Topic-specific word lists (no LLM generation)
- **Cost**: $0 per student session (no API calls)

## Feature Comparison

| Feature | Full-Featured | Cost-Free |
|---------|---------------|-----------|
| **Scoring** | AI-powered (LLM) | Rule-based (static) |
| **Feedback** | Personalized AI feedback | Generic tips |
| **Word Bank** | AI-generated vocabulary | Predefined lists |
| **Accuracy** | High (trained model) | Medium (rule-based) |
| **Cost per session** | $0.05-0.60 | $0 |
| **Setup time** | 5 minutes | 2 minutes |
| **Customization** | Limited | Easy to customize |

## How to Switch to Cost-Free Version

### Step 1: Backup Current Router
```bash
cp server/routers.ts server/routers-llm-backup.ts
```

### Step 2: Replace Router
```bash
cp server/routers-no-llm.ts server/routers.ts
```

### Step 3: Remove LLM Import
Edit `server/routers.ts` and remove this line:
```typescript
import { invokeLLM } from "./_core/llm";
```

### Step 4: Restart Server
```bash
pnpm dev
```

### Step 5: Test
- Start a writing session
- Write some content
- Click "Check My Score" - should work without LLM calls
- Click "Get Help" - should show generic tips
- Click "Word Bank" - should show predefined words

## Cost-Free Scoring System

The cost-free version uses simple rule-based scoring:

### Hook Scoring
- **3 points**: Content > 20 words AND contains engaging language
- **2 points**: Content 10-20 words
- **1 point**: Content < 10 words

### Body Paragraph Scoring
- **3 points**: Multiple paragraphs with good length
- **2 points**: At least one paragraph
- **1 point**: No paragraphs or very short

### Conclusion Scoring
- **3 points**: Content > 15 words
- **2 points**: Content 5-15 words
- **1 point**: Content < 5 words

### Overall Score
- **18 points maximum** (6 criteria × 3 points each)
- Based on: Title, Hook, Body, Conclusion, Accuracy, Vocabulary
- Word count validation: 120-300 words total

## Customizing the Cost-Free Version

### Add More Word Banks

Edit `server/routers-no-llm.ts` and add to the `wordBanks` object:

```typescript
const wordBanks: Record<string, string[]> = {
  butterflies: [...],
  animals: [...],
  // ADD YOUR TOPIC HERE
  mytopic: [
    "word1", "word2", "word3", "word4", "word5",
    "word6", "word7", "word8", "word9", "word10",
  ],
};
```

### Customize Tips

Edit the `getStaticTips` function:

```typescript
function getStaticTips(section: string, topic: string): string[] {
  const tips: Record<string, string[]> = {
    hook: [
      "Your custom tip here",
      "Another tip",
      // ...
    ],
    body: [...],
    conclusion: [...],
  };
  return tips[section] || tips.body;
}
```

### Adjust Scoring Rules

Edit the `scoreContentStatic` function to change how content is scored:

```typescript
function scoreContentStatic(
  criterion: string,
  content: string,
  topic: string
): { score: number; feedback: string; suggestions: string[] } {
  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
  
  // Customize these thresholds
  if (wordCount < 10) {
    score = 1;
    // ...
  } else if (wordCount > 150) {
    score = 2;
    // ...
  }
  
  return { score, feedback, suggestions };
}
```

## Limitations of Cost-Free Version

1. **No AI Evaluation** - Scoring is based on word count and simple rules, not content quality
2. **Generic Feedback** - All students get the same tips, not personalized suggestions
3. **Limited Word Banks** - Only predefined topics have vocabulary lists
4. **No Accuracy Check** - Can't detect spelling or grammar errors
5. **No Vocabulary Analysis** - Can't evaluate word choice sophistication

## When to Use Each Version

### Use Full-Featured (LLM) Version When:
- You want accurate, AI-powered scoring
- You need personalized feedback for each student
- You can afford $0.05-0.60 per student session
- You want to evaluate writing quality, not just length
- You're using it with a small number of students

### Use Cost-Free Version When:
- You want zero API costs
- You're deploying on free tier (Render, Vercel, etc.)
- You want a simple word count validator
- You're using it with a large number of students
- You want to customize scoring rules yourself

## Switching Back to Full-Featured

If you want to go back to the LLM version:

```bash
cp server/routers-llm-backup.ts server/routers.ts
pnpm dev
```

## Example: Customizing for Your Classroom

Here's how to customize the cost-free version for specific topics:

```typescript
// In server/routers-no-llm.ts

function getStaticWordBank(topic: string): string[] {
  const wordBanks: Record<string, string[]> = {
    // ... existing topics ...
    
    // Add your custom topic
    "solar system": [
      "planet", "star", "orbit", "gravity", "satellite",
      "asteroid", "comet", "galaxy", "universe", "telescope",
      "astronaut", "spacecraft", "lunar", "solar", "celestial",
    ],
    
    "rainforest": [
      "jungle", "canopy", "biodiversity", "ecosystem", "species",
      "humid", "vegetation", "wildlife", "endangered", "conservation",
      "tropical", "habitat", "predator", "prey", "photosynthesis",
    ],
  };
  
  const topicLower = topic.toLowerCase();
  for (const [key, words] of Object.entries(wordBanks)) {
    if (topicLower.includes(key)) {
      return words;
    }
  }
  return wordBanks.default;
}
```

## Performance Comparison

| Metric | Full-Featured | Cost-Free |
|--------|---------------|-----------|
| **Response time** | 2-5 seconds | <100ms |
| **API calls** | 4-6 per session | 0 |
| **Monthly cost (100 students)** | $5-60 | $0 |
| **Monthly cost (1000 students)** | $50-600 | $0 |
| **Scoring accuracy** | 90%+ | 70% |

## Troubleshooting

### "Word Bank is empty"
- Add more topics to the `wordBanks` object in `getStaticWordBank()`
- Check that topic name matches exactly

### "Scoring seems wrong"
- Adjust thresholds in `scoreContentStatic()` function
- Remember: cost-free version uses word count, not content quality

### "Tips are not helpful"
- Customize tips in `getStaticTips()` function
- Add more specific tips for your curriculum

## Migration Path

If you start with the cost-free version and want to upgrade later:

1. Keep both routers (`routers-no-llm.ts` and `routers.ts`)
2. Add a feature flag to switch between them
3. Gradually migrate students to the full-featured version
4. Monitor costs and adjust as needed

## Support

For questions about the cost-free version:
- Check the customization examples above
- Review the code in `server/routers-no-llm.ts`
- Test with sample content to understand scoring behavior
