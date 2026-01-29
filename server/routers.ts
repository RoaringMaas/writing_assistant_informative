import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

// ============================================
// COST-FREE VERSION - NO LLM CALLS
// ============================================

// Static scoring function (rule-based, no AI)
function scoreContentStatic(section: string, content: string, topic: string): { score: number; feedback: string } {
  const wordCount = content.trim().split(/\s+/).length;
  
  let feedback = "";
  let score = 0;
  
  if (wordCount < 5) {
    score = 1;
    if (section === "hook") {
      feedback = "Your hook is too short. Try asking a question or sharing an interesting fact to grab your reader's attention!";
    } else if (section === "body") {
      feedback = "Your paragraph needs more details. Add 2-3 facts or examples to support your main idea.";
    } else {
      feedback = "Your conclusion is too short. Summarize your main points and remind the reader why your topic matters.";
    }
  } else if (wordCount < 15) {
    score = 2;
    if (section === "hook") {
      feedback = "Good start! Your hook is interesting. Try making it even more engaging with a surprising fact or question.";
    } else if (section === "body") {
      feedback = "Good effort! Your paragraph has details. Try adding more specific examples or facts to make it stronger.";
    } else {
      feedback = "Good conclusion! You've summarized your ideas. Try adding one more thought to make it more memorable.";
    }
  } else {
    score = 3;
    if (section === "hook") {
      feedback = "Amazing hook! You've grabbed your reader's attention with an engaging opening. Excellent work!";
    } else if (section === "body") {
      feedback = "Excellent paragraph! You've included great details and examples. Your writing is very clear and interesting!";
    } else {
      feedback = "Perfect conclusion! You've wrapped up your essay beautifully. Your ending is memorable and strong!";
    }
  }
  
  return { score, feedback };
}

// Static tips based on section
function getStaticTips(section: string, topic: string): string[] {
  const tips: Record<string, string[]> = {
    hook: [
      "Start with a question to grab your reader's attention!",
      "Use an interesting fact or surprising statement.",
      "Try starting with 'Did you know...' or 'Have you ever...'",
    ],
    body: [
      "Include specific details and examples.",
      "Use transition words like 'First', 'Next', 'Also'.",
      "Make sure each sentence relates to your topic.",
    ],
    conclusion: [
      "Summarize your main ideas.",
      "End with a thought-provoking question or statement.",
      "Remind the reader why your topic is important.",
    ],
  };
  
  return tips[section] || [];
}

// Predefined word banks for different topics
const wordBanks: Record<string, string[]> = {
  butterflies: ["butterfly", "wings", "colorful", "fly", "caterpillar", "metamorphosis", "beautiful", "insect", "pattern", "delicate", "transform", "chrysalis", "emerge", "flutter", "migrate"],
  animals: ["animal", "habitat", "species", "behavior", "predator", "prey", "survival", "adaptation", "instinct", "migration", "endangered", "ecosystem", "wildlife", "nature", "creature"],
  plants: ["plant", "flower", "stem", "leaf", "root", "seed", "grow", "photosynthesis", "garden", "nature", "green", "bloom", "petal", "soil", "water"],
  weather: ["weather", "rain", "snow", "wind", "cloud", "storm", "temperature", "forecast", "climate", "thunder", "lightning", "tornado", "hurricane", "season", "atmosphere"],
  ocean: ["ocean", "water", "wave", "fish", "coral", "reef", "marine", "deep", "current", "tide", "shell", "creature", "whale", "dolphin", "underwater"],
  space: ["space", "star", "planet", "moon", "galaxy", "universe", "astronaut", "rocket", "orbit", "gravity", "comet", "asteroid", "constellation", "solar", "cosmic"],
  dinosaurs: ["dinosaur", "fossil", "extinct", "prehistoric", "reptile", "carnivore", "herbivore", "T-Rex", "Triceratops", "Stegosaurus", "Velociraptor", "ancient", "roamed", "era", "species"],
};

export const writingRouter = router({
  // ============================================
  // ANONYMOUS PROCEDURES (No Auth Required)
  // ============================================

  // Get word bank for a topic
  getWordBankAnonymous: publicProcedure
    .input(z.object({
      topic: z.string(),
    }))
    .query(({ input }) => {
      const topicLower = input.topic.toLowerCase();
      const words = wordBanks[topicLower] || wordBanks.animals;
      return { words };
    }),

  // Get help/tips for a section
  getHelpAnonymous: publicProcedure
    .input(z.object({
      section: z.enum(["hook", "body", "conclusion"]),
      topic: z.string(),
    }))
    .query(({ input }) => {
      const tips = getStaticTips(input.section, input.topic);
      return { tips };
    }),

  // Get intelligent feedback (static version)
  getIntelligentFeedbackAnonymous: publicProcedure
    .input(z.object({
      section: z.enum(["hook", "body", "conclusion"]),
      topic: z.string(),
      content: z.string(),
    }))
    .mutation(async ({ input }) => {
      const scoring = scoreContentStatic(input.section, input.content, input.topic);
      const tips = getStaticTips(input.section, input.topic);
      
      return {
        score: scoring.score,
        feedback: scoring.feedback,
        tips: tips,
      };
    }),

  // Save session with code
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
    .mutation(async ({ input }) => {
      try {
        const { saveSessionWithCode } = await import("./db");
        const saveCode = await saveSessionWithCode({
          sessionId: input.sessionId,
          studentName: input.studentName,
          topic: input.topic,
          title: input.title,
          hook: input.hook,
          bodyParagraphs: input.bodyParagraphs,
          conclusion: input.conclusion,
        });
        return { success: true, saveCode, message: "Session saved successfully!" };
      } catch (error) {
        console.error("Error saving session:", error);
        return { success: false, message: "Failed to save session" };
      }
    }),

  // Load session by code
  loadSessionByCodeAnonymous: publicProcedure
    .input(z.object({
      saveCode: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const { loadSessionByCode } = await import("./db");
        const sessionData = await loadSessionByCode(input.saveCode);
        
        if (!sessionData) {
          return { success: false, message: "Save code not found or expired", data: null };
        }
        
        return { success: true, message: "Session loaded successfully!", data: sessionData };
      } catch (error) {
        console.error("Error loading session:", error);
        return { success: false, message: "Failed to load session", data: null };
      }
    }),

  // Preview scoring for a section
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
        tips: tips,
      };
    }),

  // Perform overall assessment
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
      // Score each section
      const titleScore = scoreContentStatic("hook", input.title, input.topic);
      const hookScore = scoreContentStatic("hook", input.hook, input.topic);
      
      let bodyScore = 0;
      input.bodyParagraphs.forEach(para => {
        const score = scoreContentStatic("body", para.supportingDetails, input.topic);
        bodyScore += score.score;
      });
      bodyScore = input.bodyParagraphs.length > 0 ? Math.round(bodyScore / input.bodyParagraphs.length) : 0;
      
      const conclusionScore = scoreContentStatic("conclusion", input.conclusion, input.topic);
      
      // Calculate total score (out of 18: 3 points each for 6 criteria)
      const totalScore = titleScore.score + hookScore.score + bodyScore + conclusionScore.score;
      
      // Generate score-specific feedback based on total score
      let feedback = "";
      if (totalScore <= 6) {
        feedback = "Keep trying! Your writing is just starting. Focus on adding more details and making your sentences longer.";
      } else if (totalScore <= 12) {
        feedback = "Good job! You're making progress. Try adding more interesting details and using transition words to connect your ideas.";
      } else {
        feedback = "Excellent work! Your writing is strong and well-developed. Keep practicing to become an even better writer!";
      }
      
      return {
        scores: {
          titleSubtitles: titleScore.score,
          hook: hookScore.score,
          relevantInfo: bodyScore,
          transitions: 2, // Static score
          accuracy: 2, // Static score
          vocabulary: conclusionScore.score,
        },
        totalScore: totalScore,
        feedback: feedback,
      };
    }),
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      return ctx.user || null;
    }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      return { success: true };
    }),
  }),
});

export const appRouter = writingRouter;
export type AppRouter = typeof appRouter;
