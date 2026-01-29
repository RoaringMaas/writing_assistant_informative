import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

// ============================================
// COST-FREE VERSION - NO LLM CALLS
// ============================================
// This is a simplified router with all LLM features removed
// Use static scoring and tips instead of AI-powered features
// ============================================

// Static scoring function (no LLM)
function scoreContentStatic(
  criterion: string,
  content: string,
  topic: string
): { score: number; feedback: string; suggestions: string[] } {
  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
  
  let score = 2;
  let feedback = "Good effort!";
  let suggestions: string[] = [];

  if (wordCount < 10) {
    score = 1;
    feedback = "Your writing is too short. Add more details!";
    suggestions = ["Write at least 15-20 words for this section"];
  } else if (wordCount > 150) {
    score = 2;
    feedback = "Great! You wrote a lot. Make sure it's all about the topic.";
    suggestions = ["Check that every sentence is about your topic"];
  } else {
    score = 2;
    feedback = "Nice work! Keep going!";
    suggestions = ["Add more interesting details"];
  }

  return { score, feedback, suggestions };
}

// Static word bank (no LLM)
function getStaticWordBank(topic: string): string[] {
  const wordBanks: Record<string, string[]> = {
    butterflies: ["butterfly", "wings", "colorful", "fly", "caterpillar", "metamorphosis", "beautiful", "insect", "pattern", "delicate", "transform", "chrysalis", "emerge", "flutter", "migrate"],
    animals: ["animal", "species", "habitat", "wild", "nature", "predator", "prey", "mammal", "bird", "reptile", "behavior", "survive", "adapt", "ecosystem", "endangered"],
    plants: ["plant", "flower", "stem", "leaf", "root", "grow", "soil", "sunlight", "water", "seed", "bloom", "photosynthesis", "nature", "garden", "green"],
    weather: ["weather", "rain", "cloud", "sun", "wind", "storm", "temperature", "forecast", "climate", "thunder", "lightning", "snow", "hail", "fog", "breeze"],
    ocean: ["ocean", "water", "fish", "coral", "wave", "sea", "marine", "creature", "deep", "current", "reef", "whale", "dolphin", "shell", "tide"],
    space: ["space", "star", "planet", "moon", "galaxy", "astronaut", "rocket", "universe", "orbit", "gravity", "telescope", "comet", "asteroid", "solar", "cosmic"],
    dinosaurs: ["dinosaur", "fossil", "extinct", "prehistoric", "reptile", "roar", "massive", "ancient", "species", "paleontologist", "excavate", "skeleton", "Tyrannosaurus", "Triceratops", "Stegosaurus"],
    default: ["interesting", "amazing", "beautiful", "important", "special", "different", "unique", "wonderful", "fascinating", "incredible", "remarkable", "outstanding", "excellent", "fantastic", "awesome"],
  };

  const topicLower = topic.toLowerCase();
  for (const [key, words] of Object.entries(wordBanks)) {
    if (topicLower.includes(key)) {
      return words;
    }
  }
  return wordBanks.default;
}

// Static tips (no LLM)
function getStaticTips(section: string, topic: string): string[] {
  const tips: Record<string, string[]> = {
    hook: [
      "Start with a question that makes readers curious!",
      "Share an amazing fact about your topic.",
      "Use words like 'Did you know...' or 'Imagine...' to grab attention.",
      "Tell a short story or give an example.",
    ],
    body: [
      "Add facts and details about your topic.",
      "Use words like 'first,' 'next,' 'also,' and 'because' to connect ideas.",
      "Explain WHY each fact is important.",
      "Give examples to help readers understand.",
    ],
    conclusion: [
      "Remind readers what your writing was about.",
      "Tell them why your topic is important.",
      "End with a question or interesting thought.",
      "Use words like 'In conclusion...' or 'Remember...'",
    ],
  };

  return tips[section] || tips.body;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  writing: router({
    // Preview score (static, no LLM)
    previewScore: publicProcedure
      .input(z.object({
        topic: z.string(),
        sectionType: z.enum(["hook", "body", "conclusion"]),
        content: z.string(),
        totalWordCount: z.number(),
      }))
      .mutation(async ({ input }) => {
        const scoring = scoreContentStatic(
          input.sectionType,
          input.content,
          input.topic
        );
        
        const MIN_WORDS = 120;
        const MAX_WORDS = 300;
        
        return {
          score: scoring.score,
          feedback: scoring.feedback,
          suggestions: scoring.suggestions,
          totalWordCount: input.totalWordCount,
          minWords: MIN_WORDS,
          maxWords: MAX_WORDS,
        };
      }),

    // Get static tips (no LLM)
    getHelp: publicProcedure
      .input(z.object({
        section: z.enum(["hook", "body", "conclusion"]),
        topic: z.string(),
      }))
      .query(async ({ input }) => {
        const tips = getStaticTips(input.section, input.topic);
        return { tips };
      }),

    // Get static word bank (no LLM)
    getWordBank: publicProcedure
      .input(z.object({
        topic: z.string(),
      }))
      .query(async ({ input }) => {
        const words = getStaticWordBank(input.topic);
        return { words };
      }),

    // Anonymous procedures (for non-logged-in users)
    getWordBankAnonymous: publicProcedure
      .input(z.object({
        topic: z.string(),
      }))
      .mutation(async ({ input }) => {
        const words = getStaticWordBank(input.topic);
        return { words };
      }),

    getHelpAnonymous: publicProcedure
      .input(z.object({
        section: z.enum(["hook", "body", "conclusion"]),
        topic: z.string(),
      }))
      .mutation(async ({ input }) => {
        const tips = getStaticTips(input.section, input.topic);
        return { tips };
      }),

    getIntelligentFeedbackAnonymous: publicProcedure
      .input(z.object({
        section: z.enum(["hook", "body", "conclusion"]),
        topic: z.string(),
        content: z.string(),
      }))
      .mutation(async ({ input }) => {
        const scoring = scoreContentStatic(input.section, input.content, input.topic);
        return {
          feedback: scoring.feedback,
          suggestions: scoring.suggestions,
        };
      }),

    performOverallAssessmentAnonymous: publicProcedure
      .input(z.object({
        topic: z.string(),
        title: z.string(),
        hook: z.string(),
        bodyParagraphs: z.array(z.object({
          topicSentence: z.string(),
          supportingDetails: z.string(),
        })),
        conclusion: z.string(),
      }))
      .mutation(async ({ input }) => {
        const fullText = `${input.title} ${input.hook} ${input.bodyParagraphs.map(p => `${p.topicSentence} ${p.supportingDetails}`).join(" ")} ${input.conclusion}`;
        const totalWordCount = fullText.trim().split(/\s+/).filter(w => w.length > 0).length;
        
        const MIN_WORDS = 120;
        const MAX_WORDS = 300;
        
        const titleScore = input.title && input.title.length > 3 ? 2 : 1;
        const hookScore = input.hook && input.hook.length > 10 ? 2 : 1;
        const bodyScore = input.bodyParagraphs.length > 0 ? 2 : 1;
        const conclusionScore = input.conclusion && input.conclusion.length > 10 ? 2 : 1;
        
        const scores = {
          titleSubtitles: titleScore,
          hook: hookScore,
          relevantInfo: bodyScore,
          transitions: bodyScore,
          accuracy: 2,
          vocabulary: 2,
        };
        
        const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
        
        return {
          scores,
          feedback: {
            titleSubtitles: input.title ? "Good title!" : "Add a title",
            hook: input.hook ? "Nice hook!" : "Add an attention-grabbing opening",
            relevantInfo: input.bodyParagraphs.length > 0 ? "Good details!" : "Add more information",
            transitions: "Use words like 'first,' 'next,' and 'also'",
            accuracy: "Check your spelling and punctuation",
            vocabulary: "Use interesting words",
          },
          totalScore,
          maxScore: 18,
          strengths: [
            input.bodyParagraphs.length > 1 ? "You wrote multiple paragraphs!" : "You started your writing!",
            totalWordCount > 50 ? "You wrote a lot of details!" : "Keep writing!",
          ],
          areasForGrowth: [
            totalWordCount < MIN_WORDS ? `Add more words to reach ${MIN_WORDS} total` : "",
            input.bodyParagraphs.length < 2 ? "Add more body paragraphs" : "",
            !input.conclusion ? "Write a conclusion" : "",
          ].filter(Boolean),
          overallFeedback: "Great work on your writing! Keep practicing!",
          totalWordCount,
          wordCountStatus: totalWordCount < MIN_WORDS 
            ? `Your writing has ${totalWordCount} words. You need at least ${MIN_WORDS} words.`
            : totalWordCount > MAX_WORDS
            ? `Your writing has ${totalWordCount} words. Try to keep it under ${MAX_WORDS} words.`
            : `Great job! Your writing has ${totalWordCount} words, which is perfect!`,
        };
      }),

    saveSessionAnonymous: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        studentName: z.string(),
        topic: z.string(),
        title: z.string(),
        hook: z.string(),
        bodyParagraphs: z.array(z.object({
          topicSentence: z.string(),
          supportingDetails: z.string(),
        })),
        conclusion: z.string(),
      }))
      .mutation(async () => {
        // Generate a random 6-character save code
        const saveCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        // In cost-free version, we don't save to database
        // Just return success with the save code
        return { success: true, saveCode, message: "Session saved locally only (cost-free version)" };
      }),

    previewScoreAnonymous: publicProcedure
      .input(z.object({
        topic: z.string(),
        title: z.string(),
        currentSection: z.enum(["hook", "body", "conclusion"]),
        currentContent: z.string(),
        totalWordCount: z.number(),
      }))
      .mutation(async ({ input }) => {
        const scoring = scoreContentStatic(
          input.currentSection,
          input.currentContent,
          input.topic
        );
        
        const tips = getStaticTips(input.currentSection, input.topic);
        
        return {
          score: scoring.score,
          feedback: scoring.feedback,
          suggestions: scoring.suggestions,
          tips,
          totalWordCount: input.totalWordCount,
          minWords: 120,
          maxWords: 300,
        };
      }),

    // Get final assessment (static scoring)
    getFinalAssessment: publicProcedure
      .input(z.object({
        topic: z.string(),
        title: z.string(),
        hook: z.string(),
        bodyParagraphs: z.array(z.object({
          topicSentence: z.string(),
          supportingDetails: z.string(),
        })),
        conclusion: z.string(),
      }))
      .mutation(async ({ input }) => {
        const fullText = `${input.title} ${input.hook} ${input.bodyParagraphs.map(p => `${p.topicSentence} ${p.supportingDetails}`).join(" ")} ${input.conclusion}`;
        const totalWordCount = fullText.trim().split(/\s+/).filter(w => w.length > 0).length;
        
        const MIN_WORDS = 120;
        const MAX_WORDS = 300;
        
        // Static scoring based on simple rules
        const titleScore = input.title && input.title.length > 3 ? 2 : 1;
        const hookScore = input.hook && input.hook.length > 10 ? 2 : 1;
        const bodyScore = input.bodyParagraphs.length > 0 ? 2 : 1;
        const conclusionScore = input.conclusion && input.conclusion.length > 10 ? 2 : 1;
        
        const scores = {
          titleSubtitles: titleScore,
          hook: hookScore,
          relevantInfo: bodyScore,
          transitions: bodyScore,
          accuracy: 2,
          vocabulary: 2,
        };
        
        const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
        
        return {
          scores,
          feedback: {
            titleSubtitles: input.title ? "Good title!" : "Add a title",
            hook: input.hook ? "Nice hook!" : "Add an attention-grabbing opening",
            relevantInfo: input.bodyParagraphs.length > 0 ? "Good details!" : "Add more information",
            transitions: "Use words like 'first,' 'next,' and 'also'",
            accuracy: "Check your spelling and punctuation",
            vocabulary: "Use interesting words",
          },
          totalScore,
          maxScore: 18,
          strengths: [
            input.bodyParagraphs.length > 1 ? "You wrote multiple paragraphs!" : "You started your writing!",
            totalWordCount > 50 ? "You wrote a lot of details!" : "Keep writing!",
          ],
          areasForGrowth: [
            totalWordCount < MIN_WORDS ? `Add more words to reach ${MIN_WORDS} total` : "",
            input.bodyParagraphs.length < 2 ? "Add more body paragraphs" : "",
            !input.conclusion ? "Write a conclusion" : "",
          ].filter(Boolean),
          overallFeedback: "Great work on your writing! Keep practicing!",
          totalWordCount,
          wordCountStatus: totalWordCount < MIN_WORDS 
            ? `Your writing has ${totalWordCount} words. You need at least ${MIN_WORDS} words.`
            : totalWordCount > MAX_WORDS
            ? `Your writing has ${totalWordCount} words. Try to keep it under ${MAX_WORDS} words.`
            : `Great job! Your writing has ${totalWordCount} words, which is perfect!`,
        };
      }),
  }),
});
