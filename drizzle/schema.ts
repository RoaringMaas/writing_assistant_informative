import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "teacher"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Writing sessions - stores each student's writing project
 */
export const writingSessions = mysqlTable("writing_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  topic: varchar("topic", { length: 255 }),
  title: varchar("title", { length: 255 }),
  currentStep: int("currentStep").default(1).notNull(),
  status: mysqlEnum("status", ["in_progress", "completed", "reviewed"]).default("in_progress").notNull(),
  
  // Introduction content
  hook: text("hook"),
  
  // Conclusion content
  conclusion: text("conclusion"),
  
  // Overall scores (JSON object with self and teacher scores)
  overallScores: json("overallScores").$type<{
    titleSubtitles: { self: number | null; teacher: number | null; feedback: string };
    hook: { self: number | null; teacher: number | null; feedback: string };
    relevantInfo: { self: number | null; teacher: number | null; feedback: string };
    transitions: { self: number | null; teacher: number | null; feedback: string };
    accuracy: { self: number | null; teacher: number | null; feedback: string };
    vocabulary: { self: number | null; teacher: number | null; feedback: string };
  }>(),
  
  // Scaffolding tracking
  lowScoreCount: int("lowScoreCount").default(0).notNull(),
  scaffoldingTriggered: int("scaffoldingTriggered").default(0).notNull(),
  
  // AI feedback
  aiFeedback: text("aiFeedback"),
  strengthsAndGrowth: text("strengthsAndGrowth"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WritingSession = typeof writingSessions.$inferSelect;
export type InsertWritingSession = typeof writingSessions.$inferInsert;

/**
 * Body paragraphs - each session can have multiple paragraphs
 */
export const bodyParagraphs = mysqlTable("body_paragraphs", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  orderIndex: int("orderIndex").notNull(),
  
  // Paragraph content
  topicSentence: text("topicSentence"),
  supportingDetails: text("supportingDetails"),
  
  // Section scores
  relevantInfoScore: int("relevantInfoScore"),
  transitionScore: int("transitionScore"),
  
  // Feedback
  feedback: text("feedback"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BodyParagraph = typeof bodyParagraphs.$inferSelect;
export type InsertBodyParagraph = typeof bodyParagraphs.$inferInsert;

/**
 * Section revisions - track revision history
 */
export const sectionRevisions = mysqlTable("section_revisions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  sectionType: mysqlEnum("sectionType", ["hook", "body", "conclusion"]).notNull(),
  paragraphId: int("paragraphId"),
  previousContent: text("previousContent"),
  newContent: text("newContent"),
  previousScore: int("previousScore"),
  newScore: int("newScore"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SectionRevision = typeof sectionRevisions.$inferSelect;
export type InsertSectionRevision = typeof sectionRevisions.$inferInsert;

/**
 * Saved sessions - anonymous code-based save/load system
 */
export const savedSessions = mysqlTable("saved_sessions", {
  id: int("id").autoincrement().primaryKey(),
  saveCode: varchar("saveCode", { length: 10 }).notNull().unique(),
  sessionData: json("sessionData").$type<{
    sessionId: string;
    topic: string;
    title: string;
    currentStep: number;
    hook: string;
    bodyParagraphs: Array<{
      id: string;
      topicSentence: string;
      supportingDetails: string;
    }>;
    conclusion: string;
    overallScores: any;
  }>().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SavedSession = typeof savedSessions.$inferSelect;
export type InsertSavedSession = typeof savedSessions.$inferInsert;
