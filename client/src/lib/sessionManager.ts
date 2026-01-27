/**
 * LocalStorage-based session management for anonymous writing sessions
 * No authentication or database required
 */

export interface BodyParagraph {
  id: number;
  topicSentence: string;
  supportingDetails: string;
  orderIndex: number;
}

export interface WritingSession {
  sessionId: string;
  topic: string;
  title: string;
  hook: string;
  bodyParagraphs: BodyParagraph[];
  conclusion: string;
  currentStep: number;
  overallScores: {
    titleSubtitles: number;
    hook: number;
    relevantInfo: number;
    transitions: number;
    accuracy: number;
    vocabulary: number;
  } | null;
  overallFeedback: {
    titleSubtitles: string;
    hook: string;
    relevantInfo: string;
    transitions: string;
    accuracy: string;
    vocabulary: string;
  } | null;
  selfAssessment: {
    titleSubtitles: number | null;
    hook: number | null;
    relevantInfo: number | null;
    transitions: number | null;
    accuracy: number | null;
    vocabulary: number | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "writing_session";

// Generate a random session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create a new session
export function createSession(): WritingSession {
  const session: WritingSession = {
    sessionId: generateSessionId(),
    topic: "",
    title: "",
    hook: "",
    bodyParagraphs: [],
    conclusion: "",
    currentStep: 1,
    overallScores: null,
    overallFeedback: null,
    selfAssessment: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  saveSession(session);
  return session;
}

// Get current session from localStorage
export function getSession(): WritingSession | null {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  
  try {
    return JSON.parse(data) as WritingSession;
  } catch {
    return null;
  }
}

// Save session to localStorage
export function saveSession(session: WritingSession): void {
  session.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

// Update session fields
export function updateSession(updates: Partial<WritingSession>): WritingSession | null {
  const session = getSession();
  if (!session) return null;
  
  const updated = { ...session, ...updates };
  saveSession(updated);
  return updated;
}

// Clear current session
export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Add a body paragraph
export function addBodyParagraph(session: WritingSession): BodyParagraph {
  const newId = session.bodyParagraphs.length > 0
    ? Math.max(...session.bodyParagraphs.map(p => p.id)) + 1
    : 1;
  
  const newParagraph: BodyParagraph = {
    id: newId,
    topicSentence: "",
    supportingDetails: "",
    orderIndex: session.bodyParagraphs.length,
  };
  
  session.bodyParagraphs.push(newParagraph);
  saveSession(session);
  return newParagraph;
}

// Update a body paragraph
export function updateBodyParagraph(
  session: WritingSession,
  paragraphId: number,
  updates: Partial<BodyParagraph>
): void {
  const paragraph = session.bodyParagraphs.find(p => p.id === paragraphId);
  if (paragraph) {
    Object.assign(paragraph, updates);
    saveSession(session);
  }
}

// Get full article text
export function getFullArticleText(session: WritingSession): string {
  const parts: string[] = [];
  
  if (session.hook) parts.push(session.hook);
  
  session.bodyParagraphs.forEach(p => {
    if (p.topicSentence) parts.push(p.topicSentence);
    if (p.supportingDetails) parts.push(p.supportingDetails);
  });
  
  if (session.conclusion) parts.push(session.conclusion);
  
  return parts.join(" ");
}

// Count total words in the article
export function getTotalWordCount(session: WritingSession): number {
  const text = getFullArticleText(session);
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}
