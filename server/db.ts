import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, writingSessions, bodyParagraphs, sectionRevisions, InsertWritingSession, InsertBodyParagraph, WritingSession, BodyParagraph } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Writing Session Queries

export async function createWritingSession(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(writingSessions).values({
    userId,
    currentStep: 1,
    status: "in_progress",
    lowScoreCount: 0,
    scaffoldingTriggered: 0,
  });
  
  return result[0].insertId;
}

export async function getWritingSession(sessionId: number, userId: number): Promise<WritingSession | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(writingSessions)
    .where(and(eq(writingSessions.id, sessionId), eq(writingSessions.userId, userId)))
    .limit(1);
  
  return result[0];
}

export async function getUserWritingSessions(userId: number): Promise<WritingSession[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(writingSessions)
    .where(eq(writingSessions.userId, userId))
    .orderBy(desc(writingSessions.updatedAt));
}

export async function updateWritingSession(sessionId: number, data: Partial<InsertWritingSession>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(writingSessions)
    .set(data)
    .where(eq(writingSessions.id, sessionId));
}

export async function deleteWritingSession(sessionId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete related paragraphs first
  const session = await getWritingSession(sessionId, userId);
  if (!session) throw new Error("Session not found");
  
  await db.delete(bodyParagraphs).where(eq(bodyParagraphs.sessionId, sessionId));
  await db.delete(sectionRevisions).where(eq(sectionRevisions.sessionId, sessionId));
  await db.delete(writingSessions).where(eq(writingSessions.id, sessionId));
}

// Body Paragraph Queries

export async function addBodyParagraph(sessionId: number, orderIndex: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(bodyParagraphs).values({
    sessionId,
    orderIndex,
  });
  
  return result[0].insertId;
}

export async function getBodyParagraphs(sessionId: number): Promise<BodyParagraph[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(bodyParagraphs)
    .where(eq(bodyParagraphs.sessionId, sessionId))
    .orderBy(bodyParagraphs.orderIndex);
}

export async function updateBodyParagraph(paragraphId: number, data: Partial<InsertBodyParagraph>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(bodyParagraphs)
    .set(data)
    .where(eq(bodyParagraphs.id, paragraphId));
}

export async function deleteBodyParagraph(paragraphId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(bodyParagraphs).where(eq(bodyParagraphs.id, paragraphId));
}

// Section Revision Queries

export async function addSectionRevision(data: {
  sessionId: number;
  sectionType: "hook" | "body" | "conclusion";
  paragraphId?: number;
  previousContent?: string;
  newContent?: string;
  previousScore?: number;
  newScore?: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(sectionRevisions).values(data);
}

export async function getSessionRevisions(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(sectionRevisions)
    .where(eq(sectionRevisions.sessionId, sessionId))
    .orderBy(desc(sectionRevisions.createdAt));
}
