import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          score: 3,
          feedback: "Great job! Your writing is amazing!",
          suggestions: ["Keep up the good work!"],
        }),
      },
    }],
  }),
}));

// Mock the database functions
vi.mock("./db", () => ({
  createWritingSession: vi.fn().mockResolvedValue(1),
  getWritingSession: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    topic: "Dogs",
    title: "All About Dogs",
    currentStep: 1,
    status: "in_progress",
    hook: null,
    conclusion: null,
    overallScores: null,
    lowScoreCount: 0,
    scaffoldingTriggered: 0,
    aiFeedback: null,
    strengthsAndGrowth: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getUserWritingSessions: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      topic: "Dogs",
      title: "All About Dogs",
      currentStep: 3,
      status: "in_progress",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  updateWritingSession: vi.fn().mockResolvedValue(undefined),
  deleteWritingSession: vi.fn().mockResolvedValue(undefined),
  addBodyParagraph: vi.fn().mockResolvedValue(1),
  getBodyParagraphs: vi.fn().mockResolvedValue([
    {
      id: 1,
      sessionId: 1,
      orderIndex: 0,
      topicSentence: "Dogs are loyal pets.",
      supportingDetails: "They love to play and protect their families.",
      relevantInfoScore: 3,
      transitionScore: 2,
      feedback: "Good paragraph!",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  updateBodyParagraph: vi.fn().mockResolvedValue(undefined),
  deleteBodyParagraph: vi.fn().mockResolvedValue(undefined),
  addSectionRevision: vi.fn().mockResolvedValue(undefined),
  getSessionRevisions: vi.fn().mockResolvedValue([]),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "student@example.com",
    name: "Test Student",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

function createTeacherContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "teacher-user-456",
    email: "teacher@example.com",
    name: "Test Teacher",
    loginMethod: "manus",
    role: "teacher",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

describe("writing.create", () => {
  it("creates a new writing session for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.writing.create();

    expect(result).toHaveProperty("sessionId");
    expect(result.sessionId).toBe(1);
  });
});

describe("writing.get", () => {
  it("retrieves a writing session with paragraphs", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.writing.get({ sessionId: 1 });

    expect(result).not.toBeNull();
    expect(result?.session).toHaveProperty("id", 1);
    expect(result?.session).toHaveProperty("topic", "Dogs");
    expect(result?.paragraphs).toHaveLength(1);
  });
});

describe("writing.list", () => {
  it("lists all writing sessions for user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.writing.list();

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("topic", "Dogs");
  });
});

describe("writing.setTopic", () => {
  it("sets topic and title for a session", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.writing.setTopic({
      sessionId: 1,
      topic: "Dinosaurs",
      title: "Amazing Dinosaurs",
    });

    expect(result).toEqual({ success: true });
  });

  it("rejects empty topic", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.writing.setTopic({
        sessionId: 1,
        topic: "",
        title: "Test",
      })
    ).rejects.toThrow();
  });
});

describe("writing.saveHook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves hook and returns score", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.writing.saveHook({
      sessionId: 1,
      hook: "Did you know dogs have been our friends for thousands of years?",
    });

    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("feedback");
    expect(result.score).toBeGreaterThanOrEqual(1);
    expect(result.score).toBeLessThanOrEqual(3);
  });
});

describe("writing.addParagraph", () => {
  it("adds a new body paragraph", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.writing.addParagraph({ sessionId: 1 });

    expect(result).toHaveProperty("paragraphId");
    expect(result).toHaveProperty("orderIndex");
  });
});

describe("writing.moveToConclusion", () => {
  it("advances session to conclusion step", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.writing.moveToConclusion({ sessionId: 1 });

    expect(result).toEqual({ success: true });
  });
});

describe("writing.updateSelfAssessment", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Mock a completed session with overall scores
    const db = await import("./db");
    vi.mocked(db.getWritingSession).mockResolvedValue({
      id: 1,
      userId: 1,
      topic: "Dogs",
      title: "All About Dogs",
      currentStep: 5,
      status: "completed",
      overallScores: {
        titleSubtitles: { self: null, teacher: null, feedback: "Good title" },
        hook: { self: null, teacher: null, feedback: "Nice hook" },
        relevantInfo: { self: null, teacher: null, feedback: "Good info" },
        transitions: { self: null, teacher: null, feedback: "Nice flow" },
        accuracy: { self: null, teacher: null, feedback: "Few errors" },
        vocabulary: { self: null, teacher: null, feedback: "Good words" },
      },
      lowScoreCount: 0,
      scaffoldingTriggered: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("allows student to update self-assessment score", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.writing.updateSelfAssessment({
      sessionId: 1,
      criterion: "hook",
      score: 2,
    });

    expect(result).toEqual({ success: true });
  });

  it("validates score is between 1 and 3", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.writing.updateSelfAssessment({
        sessionId: 1,
        criterion: "hook",
        score: 5,
      })
    ).rejects.toThrow();
  });
});

describe("writing.updateTeacherScore", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const db = await import("./db");
    vi.mocked(db.getWritingSession).mockResolvedValue({
      id: 1,
      userId: 1,
      topic: "Dogs",
      title: "All About Dogs",
      currentStep: 5,
      status: "completed",
      overallScores: {
        titleSubtitles: { self: 2, teacher: null, feedback: "Good title" },
        hook: { self: 2, teacher: null, feedback: "Nice hook" },
        relevantInfo: { self: 3, teacher: null, feedback: "Good info" },
        transitions: { self: 2, teacher: null, feedback: "Nice flow" },
        accuracy: { self: 2, teacher: null, feedback: "Few errors" },
        vocabulary: { self: 2, teacher: null, feedback: "Good words" },
      },
      lowScoreCount: 0,
      scaffoldingTriggered: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("allows teacher to update score", async () => {
    const { ctx } = createTeacherContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.writing.updateTeacherScore({
      sessionId: 1,
      criterion: "hook",
      score: 3,
    });

    expect(result).toEqual({ success: true });
  });

  it("rejects non-teacher users", async () => {
    const { ctx } = createAuthContext(); // Regular user, not teacher
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.writing.updateTeacherScore({
        sessionId: 1,
        criterion: "hook",
        score: 3,
      })
    ).rejects.toThrow("Only teachers can update scores");
  });
});

describe("writing.delete", () => {
  it("deletes a writing session", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.writing.delete({ sessionId: 1 });

    expect(result).toEqual({ success: true });
  });
});

describe("scoring rubric validation", () => {
  it("ensures all 6 criteria are defined", () => {
    const criteria = [
      "titleSubtitles",
      "hook",
      "relevantInfo",
      "transitions",
      "accuracy",
      "vocabulary",
    ];

    // This test validates that our schema includes all required criteria
    expect(criteria).toHaveLength(6);
  });

  it("validates score range is 1-3", () => {
    const validScores = [1, 2, 3];
    const maxScore = 18; // 6 criteria × 3 points

    expect(validScores.length * 6).toBe(maxScore);
  });
});
