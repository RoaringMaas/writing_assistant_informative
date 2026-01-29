# Lower Primary Writing Assistant - TODO

## Core Features
- [x] Database schema for writing sessions, paragraphs, and scores
- [x] Step 1: Topic selection with validation and storage
- [x] Step 2: Introduction section with hook prompt and scoring
- [x] Step 3: Repeatable body paragraphs with topic sentences and supporting details
- [x] Step 4: Conclusion section with wrap-up prompt
- [x] Step 5: Overall assessment with all 6 criteria

## Scoring System
- [x] 6-criteria rubric implementation (Title/Subtitles, Hook, Relevant Info, Transitions, Accuracy, Vocabulary)
- [x] 3-2-1 point scale scoring via LLM
- [x] Real-time scoring after each section
- [x] Self-assessment column for students
- [x] Teacher validation/override column

## Scaffolding & Support
- [x] Track low scores (1 point) across all criteria
- [x] Trigger scaffolding prompts when 3+ low scores
- [x] Criterion-specific scaffolding prompts (Title/Hook, Relevant Info, Transitions, Accuracy, Vocabulary)
- [x] Intelligent context-aware feedback using LLM

## User Interface
- [x] Elegant, age-appropriate design with simple language
- [x] Step indicator (Step X of Y)
- [x] One prompt at a time display
- [x] Visual feedback with emojis (✓, ⭐, 🎯)
- [x] Encouraging messages throughout
- [x] Short prompts under 15 words

## Revision & Navigation
- [x] Section revision capability for low-scoring sections
- [x] "Add another paragraph" loop for body paragraphs
- [x] Navigation between completed sections

## Final Output
- [x] Total score display (out of 18 points)
- [x] Celebration message for high scores
- [x] Improvement areas for lower scores
- [x] Complete formatted document generation
- [x] Section-by-section scores display
- [x] Strengths and growth recommendations

## Data Management
- [x] Auto-save functionality
- [x] Session state persistence
- [x] Writing history storage

## New Feature Requests (2026-01-22)
- [x] Add "Check My Score" button for Hook section with real-time scoring
- [x] Add "Check My Score" button for Body Paragraph section with real-time scoring
- [x] Add "Check My Score" button for Conclusion section with real-time scoring
- [x] Show scaffolding prompts when score is 1 point
- [x] Allow students to check score repeatedly with updated content
- [x] Implement Get Help button with context-aware tips for each step
- [x] Add general writing tips for Topic selection
- [x] Add general writing tips for Hook writing
- [x] Add general writing tips for Body paragraphs
- [x] Add general writing tips for Conclusion writing


## Feature Adjustments (2026-01-22)
- [x] Implement word count validation (120-300 words minimum/maximum)
- [x] Deduct points if content is below word count requirement
- [x] Show word count feedback to students during writing
- [x] Create article display page with paper-like template
- [x] Add engaging visuals to article display
- [x] Display full article with all sections formatted nicely
- [x] Add certificate generation for perfect scores (18/18 points)
- [x] Make certificate downloadable/printable
- [x] Add visual design to certificate (badge, decorative elements)


## Additional Enhancements (2026-01-26)
- [x] Add live word count tracker during writing (show current/target words)
- [x] Display word count in Hook section
- [x] Display word count in Body Paragraph section
- [x] Display word count in Conclusion section
- [x] Lower certificate eligibility threshold from 18/18 to 14+ points
- [x] Update certificate button logic
- [x] Implement topic-specific word bank feature
- [x] Generate relevant vocabulary based on student's topic using LLM
- [x] Display word bank in an accessible panel during writing
- [x] Make word bank clickable to copy words to clipboard


## Bug Fixes (2026-01-26)
- [x] Fix misleading word count tip in scaffolding prompts - clarify 120 words is total across all sections, not per section


## Feature Changes (2026-01-26)
- [x] Replace "Tips to improve" section with AI Feedback to make personalized suggestions more prominent
- [x] Remove generic scaffolding prompts from score display
- [x] Display AI Feedback as the primary improvement guidance


## Bug Reports (2026-01-26)
- [x] Fix scoring inconsistency: Score Preview shows different score than final assessment page for same content


## Scoring Adjustments (2026-01-26)
- [x] Remove word count penalty from individual section scoring (Hook, Body, Conclusion)
- [x] Keep word count penalty only for final overall assessment
- [x] Score each section based on quality alone, not word count


## Voice-to-Text Feature (2026-01-26)
- [x] Create voice-to-text component using Web Speech API
- [x] Set language to English only
- [x] Add microphone button next to Hook input field
- [x] Add microphone button next to Body Paragraph input field (topic sentence and supporting details)
- [x] Add microphone button next to Conclusion input field
- [x] Show "Listening..." indicator while recording
- [x] Display transcribed text in real-time
- [x] Add "Try again" button if transcription isn't clear
- [x] Handle microphone permission requests
- [x] Show error messages if browser doesn't support speech recognition
- [x] Add visual feedback (pulsing animation) during recording
- [x] Allow students to edit transcribed text before submitting


## Anonymous No-Login Version (2026-01-27)
- [x] Remove all authentication requirements (Manus OAuth)
- [x] Remove "My Writing" link from header
- [x] Remove user profile display
- [x] Implement localStorage-based session management
- [x] Remove all database calls from frontend
- [x] Keep LLM scoring/feedback backend endpoints (no user context needed)
- [x] Add anonymous backend procedures for scoring, feedback, word bank, and assessment
- [x] Rewrite WritingSession.tsx to use localStorage instead of tRPC database queries
- [x] Keep all writing features (Hook, Body, Conclusion, scoring, feedback)
- [x] Keep voice-to-text functionality
- [x] Keep real-time scoring with rubric
- [x] Keep certificate generation
- [x] Keep word bank feature
- [x] Sessions stored in browser localStorage (cleared on browser close)
- [x] Update ArticleDisplay.tsx to use localStorage
- [x] Update Certificate.tsx to use localStorage
- [x] Test anonymous version - all features working


## Bug Fixes (2026-01-27)
- [x] Fix VoiceInput component error: "recognition has already started" when clicking microphone button multiple times

- [x] Fix voice transcription: transcribed text sometimes doesn't appear in text field (intermittent issue) - Fixed by using useRef instead of state
- [ ] Fix voice recognition showing "no speech detected" even when user speaks to microphone


## Save/Load Feature (2026-01-27)
- [x] Design database schema for anonymous saved sessions with unique codes
- [x] Create backend endpoint to save session and generate unique 6-character code
- [x] Create backend endpoint to load session by code
- [x] Add "Save My Work" button to WritingSession page
- [x] Add "Load My Work" option on home page
- [x] Display the save code to students with copy-to-clipboard functionality
- [x] Add code expiration (30 days) to clean up old sessions

- [x] Fix save session error: body paragraph IDs are numbers instead of strings, causing validation failure

- [x] Fix load session error: "hooks[lastArg] is not a function" when loading a saved session - Fixed by storing with correct localStorage key

- [x] Fix load session: Added validation and proper field initialization
- [x] Add back button to Certificate page to return to final score page
- [x] Add back button to ArticleDisplay page to return to final score page

- [x] Fix "hooks[lastArg] is not a function" error in handleLoadSession - Changed from query to mutation

- [x] Fix tRPC procedure type mismatch: loadSessionAnonymous changed from query to mutation


## UI Improvements (2026-01-27)
- [x] Restore previous homepage UI with complete "Step by Step" items (all 4 steps visible)
- [x] Restore "Get Stars" section with all 3 stars (1, 2, 3 stars)
- [x] Add visual prompt after paragraph 1 completion to guide users to click "Add Another" before typing paragraph 2

- [x] Update paragraph prompt to appear after EVERY paragraph save (not just first one) to support students writing 3+ paragraphs


## Vercel Deployment Fix (2026-01-28)
- [x] Fix vercel.json schema validation error - remove invalid nodeVersion property
- [x] Fix vercel.json framework property - remove invalid "other" value, use minimal configuration


## Customizable Certificate Name (2026-01-28)
- [x] Add studentName field to session data structure in sessionManager.ts
- [x] Add name input field to WritingSession page (at the beginning or on topic step)
- [x] Update Certificate.tsx to use the custom student name instead of "Young Writer"
- [x] Update sessionData type definitions to include studentName

- [x] Fix name input field not working - can't type in the "Your Name" field on Topic Selection page


## Render Deployment (2026-01-29)
- [x] Create render.yaml configuration file
- [x] Create deployment documentation with step-by-step instructions (RENDER_DEPLOYMENT.md)
- [x] Create environment variables reference (ENV_VARIABLES.md)
- [x] Create quick deployment checklist (DEPLOYMENT_CHECKLIST.md)
- [x] Test build process locally
- [x] Prepare database migration instructions


## Cost-Free Version (2026-01-29)
- [x] Create simplified router without LLM calls (routers-no-llm.ts)
- [x] Implement static scoring based on word count and rules
- [x] Create predefined word banks for common topics
- [x] Create static tips for each writing section
- [x] Create comprehensive documentation (COST_FREE_VERSION.md)
- [x] Document feature comparison between versions
- [x] Provide customization examples
