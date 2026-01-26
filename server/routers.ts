import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import {
  createWritingSession,
  getWritingSession,
  getUserWritingSessions,
  updateWritingSession,
  deleteWritingSession,
  addBodyParagraph,
  getBodyParagraphs,
  updateBodyParagraph,
  deleteBodyParagraph,
  addSectionRevision,
} from "./db";

// Scoring schema for LLM response
const scoringSchema = {
  type: "object" as const,
  properties: {
    score: { type: "integer", minimum: 1, maximum: 3, description: "Score from 1-3" },
    feedback: { type: "string", description: "Brief, encouraging feedback for the student" },
    suggestions: { type: "array", items: { type: "string" }, description: "Specific improvement suggestions" },
  },
  required: ["score", "feedback", "suggestions"],
  additionalProperties: false,
};

// Overall assessment schema
const overallAssessmentSchema = {
  type: "object" as const,
  properties: {
    titleSubtitles: { type: "integer", minimum: 1, maximum: 3 },
    hook: { type: "integer", minimum: 1, maximum: 3 },
    relevantInfo: { type: "integer", minimum: 1, maximum: 3 },
    transitions: { type: "integer", minimum: 1, maximum: 3 },
    accuracy: { type: "integer", minimum: 1, maximum: 3 },
    vocabulary: { type: "integer", minimum: 1, maximum: 3 },
    feedback: {
      type: "object",
      properties: {
        titleSubtitles: { type: "string" },
        hook: { type: "string" },
        relevantInfo: { type: "string" },
        transitions: { type: "string" },
        accuracy: { type: "string" },
        vocabulary: { type: "string" },
      },
      required: ["titleSubtitles", "hook", "relevantInfo", "transitions", "accuracy", "vocabulary"],
    },
    strengths: { type: "array", items: { type: "string" } },
    areasForGrowth: { type: "array", items: { type: "string" } },
    overallFeedback: { type: "string" },
  },
  required: ["titleSubtitles", "hook", "relevantInfo", "transitions", "accuracy", "vocabulary", "feedback", "strengths", "areasForGrowth", "overallFeedback"],
  additionalProperties: false,
};

// Helper function to score content using LLM
async function scoreContent(
  criterion: string,
  content: string,
  topic: string,
  rubricDescription: string
): Promise<{ score: number; feedback: string; suggestions: string[] }> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a friendly, encouraging writing teacher for elementary students (Years 1-3, ages 6-9). 
Score the student's writing using this rubric criterion:

${criterion}: ${rubricDescription}

Scoring Guide:
- 3 points (Developed): Meets all excellence indicators
- 2 points (Developing): Partially meets criteria with minor issues  
- 1 point (Working Towards): Does not meet criteria or shows significant gaps

Keep feedback simple, positive, and age-appropriate. Use short sentences. Be encouraging!`,
      },
      {
        role: "user",
        content: `Topic: ${topic}

Student's writing:
${content}

Please score this writing and provide feedback.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "scoring_result",
        strict: true,
        schema: scoringSchema,
      },
    },
  });

  const rawContent = response.choices[0].message.content;
  const contentStr = typeof rawContent === 'string' ? rawContent : '{}';
  const result = JSON.parse(contentStr);
  return {
    score: result.score || 2,
    feedback: result.feedback || "Good effort!",
    suggestions: result.suggestions || [],
  };
}

// Helper function for overall assessment
async function performOverallAssessment(
  topic: string,
  title: string,
  hook: string,
  paragraphs: Array<{ topicSentence: string | null; supportingDetails: string | null }>,
  conclusion: string
): Promise<{
  scores: Record<string, number>;
  feedback: Record<string, string>;
  strengths: string[];
  areasForGrowth: string[];
  overallFeedback: string;
  totalWordCount: number;
  wordCountStatus: string;
}> {
  const fullText = `Title: ${title}

Introduction:
${hook}

Body:
${paragraphs.map((p, i) => `Paragraph ${i + 1}:
${p.topicSentence || ""}
${p.supportingDetails || ""}`).join("\n\n")}

Conclusion:
${conclusion}`;

  // Calculate total word count across all sections
  const allContent = `${hook} ${paragraphs.map(p => `${p.topicSentence || ""} ${p.supportingDetails || ""}`).join(" ")} ${conclusion}`;
  const totalWordCount = allContent.trim().split(/\s+/).filter(w => w.length > 0).length;
  const MIN_WORDS = 120;
  const MAX_WORDS = 300;
  
  let wordCountStatus = "";
  let wordCountPenalty = 0;
  
  if (totalWordCount < MIN_WORDS) {
    wordCountStatus = `Your writing has ${totalWordCount} words. You need at least ${MIN_WORDS} words. Add more details!`;
    wordCountPenalty = 1; // Deduct 1 point from each criterion
  } else if (totalWordCount > MAX_WORDS) {
    wordCountStatus = `Your writing has ${totalWordCount} words. Try to keep it under ${MAX_WORDS} words to stay focused!`;
    wordCountPenalty = 0; // No penalty, just feedback
  } else {
    wordCountStatus = `Great job! Your writing has ${totalWordCount} words, which is perfect!`;
  }

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a friendly, encouraging writing teacher for elementary students (Years 1-3, ages 6-9).
Evaluate the complete informational text using these 6 criteria:

1. Title and Subtitles: 3=clear, relevant title; 2=title present but weak; 1=missing or irrelevant
2. Use of a Hook: 3=effectively grabs attention; 2=present but weak; 1=no hook or fails to engage
3. Relevant Information: 3=includes relevant info with supporting details; 2=some relevant info but lacks detail; 1=little to no relevant info
4. Transitions/Sequencing: 3=uses cohesive devices effectively; 2=some cohesive devices; 1=lacks cohesive devices, choppy flow
5. Accuracy: 3=few/no errors; 2=some errors that don't hinder understanding; 1=frequent errors make it difficult to read
6. Vocabulary: 3=range appropriate for grade level; 2=basic with limited variety; 1=very simple or inappropriate

Keep all feedback simple, positive, and age-appropriate. Use short sentences. Be encouraging!`,
      },
      {
        role: "user",
        content: `Topic: ${topic}

Complete Text:
${fullText}

Please provide a comprehensive assessment.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "overall_assessment",
        strict: true,
        schema: overallAssessmentSchema,
      },
    },
  });

  const rawContent2 = response.choices[0].message.content;
  const contentStr2 = typeof rawContent2 === 'string' ? rawContent2 : '{}';
  const result = JSON.parse(contentStr2);
  
  // Apply word count penalty to all scores
  const adjustScore = (score: number) => Math.max(1, score - wordCountPenalty);
  
  return {
    scores: {
      titleSubtitles: adjustScore(result.titleSubtitles || 2),
      hook: adjustScore(result.hook || 2),
      relevantInfo: adjustScore(result.relevantInfo || 2),
      transitions: adjustScore(result.transitions || 2),
      accuracy: adjustScore(result.accuracy || 2),
      vocabulary: adjustScore(result.vocabulary || 2),
    },
    feedback: result.feedback || {},
    strengths: result.strengths || [],
    areasForGrowth: totalWordCount < MIN_WORDS 
      ? [...(result.areasForGrowth || []), `Add more details to reach at least ${MIN_WORDS} words`]
      : (result.areasForGrowth || []),
    overallFeedback: result.overallFeedback || "Great effort!",
    totalWordCount,
    wordCountStatus,
  };
}

// Helper to get scaffolding prompts based on criterion
function getScaffoldingPrompts(criterion: string, topic: string): string[] {
  const prompts: Record<string, string[]> = {
    titleSubtitles: [
      "Let's think of a title that tells readers what your writing is about. What is the main idea?",
      "A good title is like a name for your story. What would you call it?",
    ],
    hook: [
      "Can you start with a question or interesting fact to hook your reader?",
      `What's something cool or surprising about ${topic}?`,
    ],
    relevantInfo: [
      `What facts do you know about ${topic}? Let's add some details.`,
      "Can you tell me more? What else is important about this?",
    ],
    transitions: [
      "Let's connect your ideas. Can you use words like 'first,' 'next,' or 'also'?",
      "How does this idea connect to the last one?",
    ],
    accuracy: [
      "Let's check: Does this sentence make sense? Let's read it together.",
      "I noticed some spelling mistakes. Can you try again?",
    ],
    vocabulary: [
      "Can you think of a more interesting word?",
      "What's another way to say that?",
    ],
  };
  return prompts[criterion] || ["Keep trying! You're doing great!"];
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

  // Writing Session Management
  writing: router({
    // Create a new writing session
    create: protectedProcedure.mutation(async ({ ctx }) => {
      const sessionId = await createWritingSession(ctx.user.id);
      return { sessionId };
    }),

    // Get current session
    get: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await getWritingSession(input.sessionId, ctx.user.id);
        if (!session) return null;
        const paragraphs = await getBodyParagraphs(input.sessionId);
        return { session, paragraphs };
      }),

    // List all sessions for user
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserWritingSessions(ctx.user.id);
    }),

    // Delete a session
    delete: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteWritingSession(input.sessionId, ctx.user.id);
        return { success: true };
      }),

    // Step 1: Set topic
    setTopic: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        topic: z.string().min(1).max(255),
        title: z.string().min(1).max(255),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await getWritingSession(input.sessionId, ctx.user.id);
        if (!session) throw new Error("Session not found");
        
        await updateWritingSession(input.sessionId, {
          topic: input.topic,
          title: input.title,
          currentStep: 2,
        });
        
        return { success: true };
      }),

    // Step 2: Save introduction/hook and score it
    saveHook: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        hook: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await getWritingSession(input.sessionId, ctx.user.id);
        if (!session) throw new Error("Session not found");
        
        // Score the hook
        const scoring = await scoreContent(
          "Hook",
          input.hook,
          session.topic || "the topic",
          "3=effectively grabs attention and introduces topic, 2=present but weak/not entirely relevant, 1=no hook or fails to engage"
        );
        
        // Track low scores
        const newLowScoreCount = scoring.score === 1 
          ? (session.lowScoreCount || 0) + 1 
          : session.lowScoreCount || 0;
        
        await updateWritingSession(input.sessionId, {
          hook: input.hook,
          currentStep: 3,
          lowScoreCount: newLowScoreCount,
        });
        
        // Create first body paragraph
        await addBodyParagraph(input.sessionId, 0);
        
        return {
          score: scoring.score,
          feedback: scoring.feedback,
          suggestions: scoring.suggestions,
          needsScaffolding: newLowScoreCount >= 3,
          scaffoldingPrompts: newLowScoreCount >= 3 ? getScaffoldingPrompts("hook", session.topic || "") : [],
        };
      }),

    // Step 3: Save body paragraph
    saveBodyParagraph: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        paragraphId: z.number(),
        topicSentence: z.string().min(1),
        supportingDetails: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await getWritingSession(input.sessionId, ctx.user.id);
        if (!session) throw new Error("Session not found");
        
        const fullParagraph = `${input.topicSentence}\n${input.supportingDetails}`;
        
        // Score relevant information
        const infoScoring = await scoreContent(
          "Relevant Information",
          fullParagraph,
          session.topic || "the topic",
          "3=includes relevant information and supporting details, 2=some relevant information but lacks detail/clarity, 1=little to no relevant information"
        );
        
        // Score transitions
        const transitionScoring = await scoreContent(
          "Transitions",
          fullParagraph,
          session.topic || "the topic",
          "3=uses cohesive devices effectively, 2=some cohesive devices but may not connect clearly, 1=lacks cohesive devices, choppy flow"
        );
        
        // Update low score count
        let newLowScoreCount = session.lowScoreCount || 0;
        if (infoScoring.score === 1) newLowScoreCount++;
        if (transitionScoring.score === 1) newLowScoreCount++;
        
        await updateBodyParagraph(input.paragraphId, {
          topicSentence: input.topicSentence,
          supportingDetails: input.supportingDetails,
          relevantInfoScore: infoScoring.score,
          transitionScore: transitionScoring.score,
          feedback: `${infoScoring.feedback} ${transitionScoring.feedback}`,
        });
        
        await updateWritingSession(input.sessionId, {
          lowScoreCount: newLowScoreCount,
        });
        
        const needsScaffolding = newLowScoreCount >= 3;
        const scaffoldingPrompts: string[] = [];
        if (needsScaffolding) {
          if (infoScoring.score === 1) scaffoldingPrompts.push(...getScaffoldingPrompts("relevantInfo", session.topic || ""));
          if (transitionScoring.score === 1) scaffoldingPrompts.push(...getScaffoldingPrompts("transitions", session.topic || ""));
        }
        
        return {
          relevantInfoScore: infoScoring.score,
          relevantInfoFeedback: infoScoring.feedback,
          transitionScore: transitionScoring.score,
          transitionFeedback: transitionScoring.feedback,
          suggestions: [...infoScoring.suggestions, ...transitionScoring.suggestions],
          needsScaffolding,
          scaffoldingPrompts,
        };
      }),

    // Add another body paragraph
    addParagraph: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = await getWritingSession(input.sessionId, ctx.user.id);
        if (!session) throw new Error("Session not found");
        
        const paragraphs = await getBodyParagraphs(input.sessionId);
        const newIndex = paragraphs.length;
        const paragraphId = await addBodyParagraph(input.sessionId, newIndex);
        
        return { paragraphId, orderIndex: newIndex };
      }),

    // Move to conclusion step
    moveToConclusion: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = await getWritingSession(input.sessionId, ctx.user.id);
        if (!session) throw new Error("Session not found");
        
        await updateWritingSession(input.sessionId, { currentStep: 4 });
        return { success: true };
      }),

    // Step 4: Save conclusion
    saveConclusion: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        conclusion: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await getWritingSession(input.sessionId, ctx.user.id);
        if (!session) throw new Error("Session not found");
        
        // Score conclusion for transitions/cohesion
        const scoring = await scoreContent(
          "Conclusion Cohesion",
          input.conclusion,
          session.topic || "the topic",
          "3=effectively wraps up the writing with clear connection to topic, 2=present but weak connection, 1=does not effectively conclude"
        );
        
        await updateWritingSession(input.sessionId, {
          conclusion: input.conclusion,
          currentStep: 5,
        });
        
        return {
          score: scoring.score,
          feedback: scoring.feedback,
          suggestions: scoring.suggestions,
        };
      }),

    // Step 5: Get overall assessment
    getOverallAssessment: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = await getWritingSession(input.sessionId, ctx.user.id);
        if (!session) throw new Error("Session not found");
        
        const paragraphs = await getBodyParagraphs(input.sessionId);
        
        const assessment = await performOverallAssessment(
          session.topic || "",
          session.title || "",
          session.hook || "",
          paragraphs.map(p => ({
            topicSentence: p.topicSentence,
            supportingDetails: p.supportingDetails,
          })),
          session.conclusion || ""
        );
        
        // Calculate total score
        const totalScore = Object.values(assessment.scores).reduce((a, b) => a + b, 0);
        
        // Count low scores
        const lowScoreCount = Object.values(assessment.scores).filter(s => s === 1).length;
        
        // Prepare overall scores object with AI scores
        const overallScores: {
          titleSubtitles: { self: number | null; teacher: number | null; feedback: string };
          hook: { self: number | null; teacher: number | null; feedback: string };
          relevantInfo: { self: number | null; teacher: number | null; feedback: string };
          transitions: { self: number | null; teacher: number | null; feedback: string };
          accuracy: { self: number | null; teacher: number | null; feedback: string };
          vocabulary: { self: number | null; teacher: number | null; feedback: string };
        } = {
          titleSubtitles: { self: assessment.scores.titleSubtitles, teacher: null, feedback: assessment.feedback.titleSubtitles },
          hook: { self: assessment.scores.hook, teacher: null, feedback: assessment.feedback.hook },
          relevantInfo: { self: assessment.scores.relevantInfo, teacher: null, feedback: assessment.feedback.relevantInfo },
          transitions: { self: assessment.scores.transitions, teacher: null, feedback: assessment.feedback.transitions },
          accuracy: { self: assessment.scores.accuracy, teacher: null, feedback: assessment.feedback.accuracy },
          vocabulary: { self: assessment.scores.vocabulary, teacher: null, feedback: assessment.feedback.vocabulary },
        };
        
        await updateWritingSession(input.sessionId, {
          status: "completed",
          overallScores,
          aiFeedback: assessment.overallFeedback,
          strengthsAndGrowth: JSON.stringify({
            strengths: assessment.strengths,
            areasForGrowth: assessment.areasForGrowth,
          }),
          lowScoreCount,
          scaffoldingTriggered: lowScoreCount >= 3 ? 1 : 0,
        });
        
        return {
          scores: assessment.scores,
          feedback: assessment.feedback,
          totalScore,
          maxScore: 18,
          strengths: assessment.strengths,
          areasForGrowth: assessment.areasForGrowth,
          overallFeedback: assessment.overallFeedback,
          needsScaffolding: lowScoreCount >= 3,
        };
      }),

    // Update self-assessment scores
    updateSelfAssessment: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        criterion: z.enum(["titleSubtitles", "hook", "relevantInfo", "transitions", "accuracy", "vocabulary"]),
        score: z.number().min(1).max(3),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await getWritingSession(input.sessionId, ctx.user.id);
        if (!session) throw new Error("Session not found");
        
        const currentScores = session.overallScores || {
          titleSubtitles: { self: null, teacher: null, feedback: "" },
          hook: { self: null, teacher: null, feedback: "" },
          relevantInfo: { self: null, teacher: null, feedback: "" },
          transitions: { self: null, teacher: null, feedback: "" },
          accuracy: { self: null, teacher: null, feedback: "" },
          vocabulary: { self: null, teacher: null, feedback: "" },
        };
        
        currentScores[input.criterion].self = input.score;
        
        await updateWritingSession(input.sessionId, {
          overallScores: currentScores,
        });
        
        return { success: true };
      }),

    // Teacher score update (for teachers/admins)
    updateTeacherScore: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        criterion: z.enum(["titleSubtitles", "hook", "relevantInfo", "transitions", "accuracy", "vocabulary"]),
        score: z.number().min(1).max(3),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if user is teacher or admin
        if (ctx.user.role !== "teacher" && ctx.user.role !== "admin") {
          throw new Error("Only teachers can update scores");
        }
        
        const session = await getWritingSession(input.sessionId, ctx.user.id);
        if (!session) throw new Error("Session not found");
        
        const currentScores = session.overallScores || {
          titleSubtitles: { self: null, teacher: null, feedback: "" },
          hook: { self: null, teacher: null, feedback: "" },
          relevantInfo: { self: null, teacher: null, feedback: "" },
          transitions: { self: null, teacher: null, feedback: "" },
          accuracy: { self: null, teacher: null, feedback: "" },
          vocabulary: { self: null, teacher: null, feedback: "" },
        };
        
        currentScores[input.criterion].teacher = input.score;
        
        await updateWritingSession(input.sessionId, {
          overallScores: currentScores,
          status: "reviewed",
        });
        
        return { success: true };
      }),

    // Revise a section
    reviseSection: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        sectionType: z.enum(["hook", "body", "conclusion"]),
        paragraphId: z.number().optional(),
        newContent: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await getWritingSession(input.sessionId, ctx.user.id);
        if (!session) throw new Error("Session not found");
        
        let previousContent = "";
        let previousScore = 0;
        
        if (input.sectionType === "hook") {
          previousContent = session.hook || "";
          // Re-score the hook
          const scoring = await scoreContent(
            "Hook",
            input.newContent,
            session.topic || "the topic",
            "3=effectively grabs attention and introduces topic, 2=present but weak/not entirely relevant, 1=no hook or fails to engage"
          );
          
          await addSectionRevision({
            sessionId: input.sessionId,
            sectionType: "hook",
            previousContent,
            newContent: input.newContent,
            previousScore,
            newScore: scoring.score,
          });
          
          await updateWritingSession(input.sessionId, { hook: input.newContent });
          
          return {
            score: scoring.score,
            feedback: scoring.feedback,
            suggestions: scoring.suggestions,
          };
        } else if (input.sectionType === "conclusion") {
          previousContent = session.conclusion || "";
          
          const scoring = await scoreContent(
            "Conclusion Cohesion",
            input.newContent,
            session.topic || "the topic",
            "3=effectively wraps up the writing with clear connection to topic, 2=present but weak connection, 1=does not effectively conclude"
          );
          
          await addSectionRevision({
            sessionId: input.sessionId,
            sectionType: "conclusion",
            previousContent,
            newContent: input.newContent,
            previousScore,
            newScore: scoring.score,
          });
          
          await updateWritingSession(input.sessionId, { conclusion: input.newContent });
          
          return {
            score: scoring.score,
            feedback: scoring.feedback,
            suggestions: scoring.suggestions,
          };
        }
        
        return { score: 2, feedback: "Updated!", suggestions: [] };
      }),

    // Preview score (Check My Score button)
    previewScore: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        sectionType: z.enum(["hook", "body", "conclusion"]),
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await getWritingSession(input.sessionId, ctx.user.id);
        if (!session) throw new Error("Session not found");
        
        // Calculate TOTAL word count across all sections (like final assessment does)
        const paragraphs = await getBodyParagraphs(input.sessionId);
        const allContent = `${session.hook || ""} ${paragraphs.map(p => `${p.topicSentence || ""} ${p.supportingDetails || ""}`).join(" ")} ${session.conclusion || ""} ${input.content}`;
        const totalWordCount = allContent.trim().split(/\s+/).filter(w => w.length > 0).length;
        const MIN_WORDS = 120;
        const MAX_WORDS = 300;
        
        let scoring: { score: number; feedback: string; suggestions: string[] };
        let scaffoldingPrompts: string[] = [];
        let wordCountWarning = "";
        let scoreAdjustment = 0;
        
        // Calculate word count for warning but DO NOT apply penalty to individual sections
        // Penalty only applies to final overall assessment
        if (totalWordCount < MIN_WORDS) {
          wordCountWarning = `Your whole article has ${totalWordCount} words. Try to write at least ${MIN_WORDS} words total to show more details!`;
        } else if (totalWordCount > MAX_WORDS) {
          wordCountWarning = `Your whole article has ${totalWordCount} words. Try to keep it under ${MAX_WORDS} words to stay focused!`;
        }
        
        // scoreAdjustment remains 0 - no penalty for individual sections
        scoreAdjustment = 0;
        
        if (input.sectionType === "hook") {
          scoring = await scoreContent(
            "Hook",
            input.content,
            session.topic || "the topic",
            "3=effectively grabs attention and introduces topic, 2=present but weak/not entirely relevant, 1=no hook or fails to engage"
          );
          
          // Score based on quality alone, no word count penalty for individual sections
          let adjustedScore = scoring.score;
          
          if (adjustedScore === 1 || totalWordCount < MIN_WORDS) {
            scaffoldingPrompts = [
              "Try starting with a question that makes readers curious!",
              "Share an amazing fact about your topic.",
              "Use words like 'Did you know...' or 'Imagine...' to grab attention.",
            ];
            if (totalWordCount < MIN_WORDS) {
              scaffoldingPrompts.push(`Add more details! Your whole article has ${totalWordCount} words, but aim for ${MIN_WORDS} words total across all sections.`);
            }
          }
          
          scoring.score = adjustedScore;
        } else if (input.sectionType === "body") {
          scoring = await scoreContent(
            "Relevant Information",
            input.content,
            session.topic || "the topic",
            "3=includes multiple accurate, relevant facts/details, 2=some relevant info but limited, 1=lacks relevant information or off-topic"
          );
          
          // Score based on quality alone, no word count penalty for individual sections
          let adjustedScore = scoring.score;
          
          if (adjustedScore === 1 || totalWordCount < MIN_WORDS) {
            scaffoldingPrompts = [
              "Add more facts and details about your topic.",
              "Think about what makes your topic special or interesting.",
              "Use words like 'first,' 'next,' and 'also' to connect your ideas.",
            ];
            if (totalWordCount < MIN_WORDS) {
              scaffoldingPrompts.push(`Add more details! Your whole article has ${totalWordCount} words, but aim for ${MIN_WORDS} words total across all sections.`);
            }
          }
          
          scoring.score = adjustedScore;
        } else if (input.sectionType === "conclusion") {
          scoring = await scoreContent(
            "Conclusion Cohesion",
            input.content,
            session.topic || "the topic",
            "3=effectively wraps up the writing with clear connection to topic, 2=present but weak connection, 1=does not effectively conclude"
          );
          
          // Score based on quality alone, no word count penalty for individual sections
          let adjustedScore = scoring.score;
          
          if (adjustedScore === 1 || totalWordCount < MIN_WORDS) {
            scaffoldingPrompts = [
              "Remind readers what your writing was about.",
              "End with a strong sentence that wraps up your ideas.",
              "Try starting with 'In conclusion...' or 'That's why...'",
            ];
            if (totalWordCount < MIN_WORDS) {
              scaffoldingPrompts.push(`Add more details! Your whole article has ${totalWordCount} words, but aim for ${MIN_WORDS} words total across all sections.`);
            }
          }
          
          scoring.score = adjustedScore;
        } else {
          scoring = { score: 2, feedback: "Keep going!", suggestions: [] };
        }
        
        return {
          score: scoring.score,
          feedback: scoring.feedback,
          suggestions: scoring.suggestions,
          scaffoldingPrompts,
          wordCount: totalWordCount,
          wordCountWarning,
          minWords: MIN_WORDS,
          maxWords: MAX_WORDS,
        };
      }),

    // Get intelligent feedback
    getIntelligentFeedback: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        currentSection: z.string(),
        currentContent: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await getWritingSession(input.sessionId, ctx.user.id);
        if (!session) throw new Error("Session not found");
        
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a friendly, encouraging writing helper for young students (ages 6-9). 
Give helpful tips to improve their writing. Keep suggestions simple and positive.
Use short sentences. Be specific but gentle. Maximum 3 tips.`,
            },
            {
              role: "user",
              content: `The student is writing about: ${session.topic}
They are working on: ${input.currentSection}
Their writing so far: ${input.currentContent}

Give them helpful, encouraging tips to improve.`,
            },
          ],
        });
        
        return {
          feedback: response.choices[0].message.content || "Keep up the great work!",
        };
      }),

    // Generate topic-specific word bank
    getWordBank: protectedProcedure
      .input(z.object({
        topic: z.string(),
      }))
      .query(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a helpful vocabulary assistant for young students (ages 6-9) writing informational texts.
Generate a list of 15-20 relevant, grade-appropriate words related to the topic.
Include nouns, verbs, and adjectives. Keep words simple but interesting.
Return ONLY a JSON array of words, nothing else.`,
            },
            {
              role: "user",
              content: `Topic: ${input.topic}

Generate helpful vocabulary words.`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "word_bank",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  words: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of vocabulary words",
                  },
                },
                required: ["words"],
                additionalProperties: false,
              },
            },
          },
        });
        
        const rawContent = response.choices[0].message.content;
        const contentStr = typeof rawContent === 'string' ? rawContent : '{}';
        const result = JSON.parse(contentStr);
        return {
          words: result.words || [],
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
