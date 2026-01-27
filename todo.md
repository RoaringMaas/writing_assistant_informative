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
