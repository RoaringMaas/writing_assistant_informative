import { Button } from "@/components/ui/button";
import { VoiceInput } from "@/components/VoiceInput";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";
import {
  Loader2,
  PenLine,
  ChevronRight,
  ChevronLeft,
  Plus,
  Sparkles,
  CheckCircle2,
  Home,
  Lightbulb,
  Save,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSession,
  saveSession,
  updateSession,
  addBodyParagraph,
  updateBodyParagraph,
  getTotalWordCount,
  type WritingSession as WritingSessionType,
  type BodyParagraph,
} from "@/lib/sessionManager";
import { trpc } from "@/lib/trpc";

// Step configuration
const STEPS = [
  { id: 1, title: "Topic", description: "What will you write about?" },
  { id: 2, title: "Hook", description: "Grab your reader's attention!" },
  { id: 3, title: "Body", description: "Share your facts and details" },
  { id: 4, title: "Conclusion", description: "Wrap up your writing" },
  { id: 5, title: "Review", description: "See how you did!" },
];

interface ScoreDisplayProps {
  score: number;
  label: string;
  feedback?: string;
}

function ScoreDisplay({ score, label, feedback }: ScoreDisplayProps) {
  const scoreClass = score === 3 ? "score-3" : score === 2 ? "score-2" : "score-1";
  const emoji = score === 3 ? "⭐" : score === 2 ? "👍" : "💪";
  const message = score === 3 ? "Amazing!" : score === 2 ? "Good job!" : "Keep trying!";
  
  return (
    <div className="encouragement">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{label}</span>
        <span className={`score-badge ${scoreClass}`}>
          {emoji} {score}/3
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      {feedback && (
        <p className="text-sm mt-2 text-foreground">{feedback}</p>
      )}
    </div>
  );
}

interface ScaffoldingPromptProps {
  prompts: string[];
  onDismiss: () => void;
}

function ScaffoldingPrompt({ prompts, onDismiss }: ScaffoldingPromptProps) {
  if (!prompts.length) return null;
  
  return (
    <Card className="border-2 border-primary/30 bg-primary/5 mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary animate-pulse" />
          <CardTitle className="text-lg">Need some help? 💡</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 mb-4">
          {prompts.map((prompt, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-primary font-bold">•</span>
              {prompt}
            </li>
          ))}
        </ul>
        <Button variant="outline" size="sm" onClick={onDismiss}>
          Got it! ✓
        </Button>
      </CardContent>
    </Card>
  );
}

export default function WritingSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [, setLocation] = useLocation();
  
  // Session state
  const [session, setSession] = useState<WritingSessionType | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [hook, setHook] = useState("");
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [currentParagraph, setCurrentParagraph] = useState({ topicSentence: "", supportingDetails: "" });
  const [conclusion, setConclusion] = useState("");
  const [showAddAnotherPrompt, setShowAddAnotherPrompt] = useState(false);
  
  // Score preview state
  const [hookPreviewScore, setHookPreviewScore] = useState<{
    score: number;
    feedback: string;
    scaffolding?: string[];
    aiFeedback?: string;
  } | null>(null);
  const [bodyPreviewScore, setBodyPreviewScore] = useState<{
    score: number;
    feedback: string;
    scaffolding?: string[];
    aiFeedback?: string;
  } | null>(null);
  const [conclusionPreviewScore, setConclusionPreviewScore] = useState<{
    score: number;
    feedback: string;
    scaffolding?: string[];
    aiFeedback?: string;
  } | null>(null);
  
  // UI state
  const [scaffoldingPrompts, setScaffoldingPrompts] = useState<string[]>([]);
  const [showScaffolding, setShowScaffolding] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [helpContent, setHelpContent] = useState<{ tips: string[]; feedback?: string }>({ tips: [] });
  const [showWordBank, setShowWordBank] = useState(false);
  const [wordBank, setWordBank] = useState<string[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveCode, setSaveCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Backend mutations (still using tRPC for LLM scoring)
  const previewScoreMutation = trpc.writing.previewScoreAnonymous.useMutation();
  const intelligentFeedbackMutation = trpc.writing.getIntelligentFeedbackAnonymous.useMutation();
  const wordBankMutation = trpc.writing.getWordBankAnonymous.useMutation();
  const assessmentMutation = trpc.writing.performOverallAssessmentAnonymous.useMutation();
  const saveSessionMutation = trpc.writing.saveSessionAnonymous.useMutation();
  
  // Load session from localStorage
  useEffect(() => {
    const loadedSession = getSession();
    if (loadedSession && loadedSession.sessionId === sessionId) {
      setSession(loadedSession);
      setTopic(loadedSession.topic);
      setTitle(loadedSession.title);
      setHook(loadedSession.hook);
      setConclusion(loadedSession.conclusion);
      
      // Load current paragraph if editing
      if (loadedSession.bodyParagraphs.length > 0) {
        const currentPara = loadedSession.bodyParagraphs[currentParagraphIndex];
        if (currentPara) {
          setCurrentParagraph({
            topicSentence: currentPara.topicSentence,
            supportingDetails: currentPara.supportingDetails,
          });
        }
      }
    }
    setLoading(false);
  }, [sessionId, currentParagraphIndex]);
  
  // Load word bank when topic is set
  useEffect(() => {
    if (session?.topic && session.currentStep >= 2 && session.currentStep <= 4) {
      wordBankMutation.mutate(
        { topic: session.topic },
        {
          onSuccess: (data) => {
            setWordBank(data.words || []);
          },
        }
      );
    }
  }, [session?.topic, session?.currentStep]);
  
  // Handle topic submission
  const handleTopicSubmit = () => {
    if (!topic.trim() || !title.trim()) {
      toast.error("Please fill in both topic and title!");
      return;
    }
    
    const updated = updateSession({
      topic: topic.trim(),
      title: title.trim(),
      currentStep: 2,
    });
    
    if (updated) {
      setSession(updated);
      toast.success("Great topic! Let's write! ✨");
    }
  };
  
  // Check hook score
  const handleCheckHookScore = async () => {
    if (!hook.trim() || !session) {
      toast.error("Please write your hook first!");
      return;
    }
    
    try {
      const fullText = hook + " " + session.bodyParagraphs.map(p => 
        `${p.topicSentence} ${p.supportingDetails}`
      ).join(" ") + " " + session.conclusion;
      
      const totalWords = fullText.trim().split(/\s+/).filter(w => w.length > 0).length;
      
      const scoreResult = await previewScoreMutation.mutateAsync({
        topic: session.topic,
        title: session.title,
        currentSection: "hook",
        currentContent: hook,
        totalWordCount: totalWords,
      });
      
      let aiFeedback: string | undefined;
      try {
        const feedbackResult = await intelligentFeedbackMutation.mutateAsync({
          topic: session.topic,
          title: session.title,
          hook: session.hook,
          bodyParagraphs: session.bodyParagraphs.map(p => ({
            topicSentence: p.topicSentence,
            supportingDetails: p.supportingDetails,
          })),
          conclusion: session.conclusion,
          currentSection: "hook",
          currentContent: hook,
        });
        aiFeedback = typeof feedbackResult.feedback === 'string' ? feedbackResult.feedback : undefined;
      } catch (error) {
        // AI feedback is optional
      }
      
      setHookPreviewScore({
        score: scoreResult.score,
        feedback: scoreResult.feedback,
        scaffolding: scoreResult.scaffoldingPrompts,
        aiFeedback,
      });
      
      if (scoreResult.score === 1 && scoreResult.scaffoldingPrompts && scoreResult.scaffoldingPrompts.length > 0) {
        setScaffoldingPrompts(scoreResult.scaffoldingPrompts);
        setShowScaffolding(true);
      }
    } catch (error) {
      toast.error("Couldn't check score. Try again!");
    }
  };
  
  // Save hook and move to next step
  const handleSaveHook = () => {
    if (!hook.trim()) {
      toast.error("Please write your hook first!");
      return;
    }
    
    const updated = updateSession({
      hook: hook.trim(),
      currentStep: 3,
    });
    
    if (updated) {
      setSession(updated);
      toast.success("Great hook! Now let's add body paragraphs! 📝");
    }
  };
  
  // Check body score
  const handleCheckBodyScore = async () => {
    if (!currentParagraph.topicSentence.trim() || !currentParagraph.supportingDetails.trim() || !session) {
      toast.error("Please write both topic sentence and details!");
      return;
    }
    
    try {
      const fullText = session.hook + " " + session.bodyParagraphs.map(p => 
        `${p.topicSentence} ${p.supportingDetails}`
      ).join(" ") + " " + currentParagraph.topicSentence + " " + currentParagraph.supportingDetails + " " + session.conclusion;
      
      const totalWords = fullText.trim().split(/\s+/).filter(w => w.length > 0).length;
      
      const scoreResult = await previewScoreMutation.mutateAsync({
        topic: session.topic,
        title: session.title,
        currentSection: "body",
        currentContent: currentParagraph.topicSentence + " " + currentParagraph.supportingDetails,
        totalWordCount: totalWords,
      });
      
      let aiFeedback: string | undefined;
      try {
        const feedbackResult = await intelligentFeedbackMutation.mutateAsync({
          topic: session.topic,
          title: session.title,
          hook: session.hook,
          bodyParagraphs: session.bodyParagraphs.map(p => ({
            topicSentence: p.topicSentence,
            supportingDetails: p.supportingDetails,
          })),
          conclusion: session.conclusion,
          currentSection: "body",
          currentContent: currentParagraph.topicSentence + " " + currentParagraph.supportingDetails,
        });
        aiFeedback = typeof feedbackResult.feedback === 'string' ? feedbackResult.feedback : undefined;
      } catch (error) {
        // AI feedback is optional
      }
      
      setBodyPreviewScore({
        score: scoreResult.score,
        feedback: scoreResult.feedback,
        scaffolding: scoreResult.scaffoldingPrompts,
        aiFeedback,
      });
      
      if (scoreResult.score === 1 && scoreResult.scaffoldingPrompts && scoreResult.scaffoldingPrompts.length > 0) {
        setScaffoldingPrompts(scoreResult.scaffoldingPrompts);
        setShowScaffolding(true);
      }
    } catch (error) {
      toast.error("Couldn't check score. Try again!");
    }
  };
  
  // Save body paragraph
  const handleSaveBodyParagraph = () => {
    if (!currentParagraph.topicSentence.trim() || !currentParagraph.supportingDetails.trim() || !session) {
      toast.error("Please write both topic sentence and details!");
      return;
    }
    
    const updatedSession = { ...session };
    
    if (currentParagraphIndex < updatedSession.bodyParagraphs.length) {
      // Update existing paragraph
      updatedSession.bodyParagraphs[currentParagraphIndex] = {
        ...updatedSession.bodyParagraphs[currentParagraphIndex],
        topicSentence: currentParagraph.topicSentence.trim(),
        supportingDetails: currentParagraph.supportingDetails.trim(),
      };
    } else {
      // Add new paragraph
      const newParagraph: BodyParagraph = {
        id: updatedSession.bodyParagraphs.length + 1,
        topicSentence: currentParagraph.topicSentence.trim(),
        supportingDetails: currentParagraph.supportingDetails.trim(),
        orderIndex: updatedSession.bodyParagraphs.length,
      };
      updatedSession.bodyParagraphs.push(newParagraph);
    }
    
    saveSession(updatedSession);
    setSession(updatedSession);
    setCurrentParagraph({ topicSentence: "", supportingDetails: "" });
    toast.success("Paragraph saved! 📝");
    
    // Show prompt to add another paragraph after every save
    setShowAddAnotherPrompt(true);
  };
  
  // Add another paragraph
  const handleAddAnotherParagraph = () => {
    if (!session) return;
    
    if (currentParagraph.topicSentence.trim() || currentParagraph.supportingDetails.trim()) {
      toast.error("Please save or clear the current paragraph first!");
      return;
    }
    
    setCurrentParagraphIndex(session.bodyParagraphs.length);
    setCurrentParagraph({ topicSentence: "", supportingDetails: "" });
    setShowAddAnotherPrompt(false);
    toast.success("New paragraph ready! Keep writing! 📝");
  };
  
  // Move to conclusion
  const handleMoveToConclusion = () => {
    if (!session) return;
    
    if (session.bodyParagraphs.length === 0) {
      toast.error("Please write at least one body paragraph!");
      return;
    }
    
    const updated = updateSession({ currentStep: 4 });
    if (updated) {
      setSession(updated);
    }
  };
  
  // Check conclusion score
  const handleCheckConclusionScore = async () => {
    if (!conclusion.trim() || !session) {
      toast.error("Please write your conclusion first!");
      return;
    }
    
    try {
      const fullText = session.hook + " " + session.bodyParagraphs.map(p => 
        `${p.topicSentence} ${p.supportingDetails}`
      ).join(" ") + " " + conclusion;
      
      const totalWords = fullText.trim().split(/\s+/).filter(w => w.length > 0).length;
      
      const scoreResult = await previewScoreMutation.mutateAsync({
        topic: session.topic,
        title: session.title,
        currentSection: "conclusion",
        currentContent: conclusion,
        totalWordCount: totalWords,
      });
      
      let aiFeedback: string | undefined;
      try {
        const feedbackResult = await intelligentFeedbackMutation.mutateAsync({
          topic: session.topic,
          title: session.title,
          hook: session.hook,
          bodyParagraphs: session.bodyParagraphs.map(p => ({
            topicSentence: p.topicSentence,
            supportingDetails: p.supportingDetails,
          })),
          conclusion: session.conclusion,
          currentSection: "conclusion",
          currentContent: conclusion,
        });
        aiFeedback = typeof feedbackResult.feedback === 'string' ? feedbackResult.feedback : undefined;
      } catch (error) {
        // AI feedback is optional
      }
      
      setConclusionPreviewScore({
        score: scoreResult.score,
        feedback: scoreResult.feedback,
        scaffolding: scoreResult.scaffoldingPrompts,
        aiFeedback,
      });
      
      if (scoreResult.score === 1 && scoreResult.scaffoldingPrompts && scoreResult.scaffoldingPrompts.length > 0) {
        setScaffoldingPrompts(scoreResult.scaffoldingPrompts);
        setShowScaffolding(true);
      }
    } catch (error) {
      toast.error("Couldn't check score. Try again!");
    }
  };
  
  // Save conclusion and move to review
  const handleSaveConclusion = () => {
    if (!conclusion.trim()) {
      toast.error("Please write your conclusion first!");
      return;
    }
    
    const updated = updateSession({
      conclusion: conclusion.trim(),
      currentStep: 5,
    });
    
    if (updated) {
      setSession(updated);
      toast.success("Great conclusion! Let's see your final score! 🎉");
    }
  };
  
  // Save session with code
  const handleSaveSession = async () => {
    if (!session) return;
    
    try {
      const result = await saveSessionMutation.mutateAsync({
        sessionData: {
          sessionId: session.sessionId,
          topic: session.topic,
          title: session.title,
          currentStep: session.currentStep,
          hook: session.hook,
          bodyParagraphs: session.bodyParagraphs.map(p => ({
            id: String(p.id),
            topicSentence: p.topicSentence,
            supportingDetails: p.supportingDetails,
          })),
          conclusion: session.conclusion,
          overallScores: session.overallScores,
        },
      });
      
      setSaveCode(result.saveCode);
      setShowSaveDialog(true);
      toast.success("Your work has been saved!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save session");
    }
  };
  
  const handleCopyCode = () => {
    if (saveCode) {
      navigator.clipboard.writeText(saveCode);
      setCopied(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get help
  const handleGetHelp = async () => {
    if (!session) return;
    
    const currentSectionContent = 
      session.currentStep === 2 ? hook :
      session.currentStep === 3 ? currentParagraph.topicSentence + " " + currentParagraph.supportingDetails :
      session.currentStep === 4 ? conclusion :
      "";
    
    const currentSectionName =
      session.currentStep === 2 ? "hook" :
      session.currentStep === 3 ? "body" :
      session.currentStep === 4 ? "conclusion" :
      "general";
    
    try {
      const result = await intelligentFeedbackMutation.mutateAsync({
        topic: session.topic,
        title: session.title,
        hook: session.hook,
        bodyParagraphs: session.bodyParagraphs.map(p => ({
          topicSentence: p.topicSentence,
          supportingDetails: p.supportingDetails,
        })),
        conclusion: session.conclusion,
        currentSection: currentSectionName,
        currentContent: currentSectionContent,
      });
      
      setHelpContent({
        tips: [],
        feedback: typeof result.feedback === 'string' ? result.feedback : "Keep writing! You're doing great!",
      });
      setShowHelpDialog(true);
    } catch (error) {
      toast.error("Couldn't get help. Try again!");
    }
  };
  
  // Perform final assessment
  const handleFinalAssessment = async () => {
    if (!session) return;
    
    try {
      const result = await assessmentMutation.mutateAsync({
        topic: session.topic,
        title: session.title,
        hook: session.hook,
        bodyParagraphs: session.bodyParagraphs.map(p => ({
          topicSentence: p.topicSentence,
          supportingDetails: p.supportingDetails,
        })),
        conclusion: session.conclusion,
      });
      
      const updated = updateSession({
        overallScores: {
          titleSubtitles: result.titleSubtitles,
          hook: result.hook,
          relevantInfo: result.relevantInfo,
          transitions: result.transitions,
          accuracy: result.accuracy,
          vocabulary: result.vocabulary,
        },
        overallFeedback: {
          titleSubtitles: result.feedback.titleSubtitles,
          hook: result.feedback.hook,
          relevantInfo: result.feedback.relevantInfo,
          transitions: result.feedback.transitions,
          accuracy: result.feedback.accuracy,
          vocabulary: result.feedback.vocabulary,
        },
      });
      
      if (updated) {
        setSession(updated);
      }
    } catch (error) {
      toast.error("Couldn't complete assessment. Try again!");
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading your writing...</p>
        </div>
      </div>
    );
  }
  
  // Session not found
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Card className="card-playful max-w-md">
          <CardHeader>
            <CardTitle>Oops! 😅</CardTitle>
            <CardDescription>We couldn't find this writing session.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const currentStep = session.currentStep;
  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;
  const totalWords = getTotalWordCount(session);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="container py-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation("/")} className="gap-2">
            <Home className="w-4 h-4" />
            Home
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Step {currentStep} of {STEPS.length}
              </p>
              <p className="text-lg font-bold text-foreground">
                {STEPS[currentStep - 1]?.title}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {currentStep >= 2 && currentStep <= 4 && (
              <Button
                variant="outline"
                onClick={() => setShowWordBank(!showWordBank)}
                className="gap-2"
              >
                📚 Word Bank
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleGetHelp}
              disabled={intelligentFeedbackMutation.isPending}
              className="gap-2"
            >
              {intelligentFeedbackMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Get Help
            </Button>
            <Button
              variant="default"
              onClick={handleSaveSession}
              disabled={saveSessionMutation.isPending || !topic}
              className="gap-2"
            >
              {saveSessionMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save My Work
            </Button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  step.id <= currentStep ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`step-indicator ${
                    step.id < currentStep
                      ? "step-completed"
                      : step.id === currentStep
                      ? "step-active"
                      : "step-pending"
                  }`}
                >
                  {step.id < currentStep ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 max-w-3xl mx-auto">
        {/* Scaffolding Prompt */}
        {showScaffolding && (
          <ScaffoldingPrompt
            prompts={scaffoldingPrompts}
            onDismiss={() => setShowScaffolding(false)}
          />
        )}
        
        {/* Word Bank Panel */}
        {showWordBank && currentStep >= 2 && currentStep <= 4 && (
          <Card className="mb-6 card-playful border-2 border-primary/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  📚 Word Bank: {session.topic}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWordBank(false)}
                >
                  Close
                </Button>
              </div>
              <CardDescription>
                Click any word to help with spelling!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {wordBank.map((word: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => {
                      navigator.clipboard.writeText(word);
                      toast.success(`Copied "${word}" to clipboard!`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-sm font-medium transition-colors border border-primary/20 hover:border-primary/40"
                  >
                    {word}
                  </button>
                ))}
              </div>
              {wordBank.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Loading helpful words...
                </p>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Step 1: Topic Selection */}
        {currentStep === 1 && (
          <Card className="card-playful">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="step-indicator step-active">1</span>
                What will you write about? 🤔
              </CardTitle>
              <CardDescription>
                Pick something you know a lot about!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Topic
                </label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Example: Dogs, Space, Dinosaurs..."
                  className="text-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Title
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Example: All About Dogs"
                  className="text-lg"
                />
              </div>
              
              <Button
                onClick={handleTopicSubmit}
                className="w-full btn-fun text-lg py-6"
              >
                <ChevronRight className="w-5 h-5 mr-2" />
                Next Step!
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Step 2: Hook */}
        {currentStep === 2 && (
          <Card className="card-playful">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="step-indicator step-active">2</span>
                Write a Hook! 🎣
              </CardTitle>
              <CardDescription>
                Grab your reader's attention about{" "}
                <span className="font-bold text-primary">{session.topic}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="encouragement">
                <p className="text-sm">
                  💡 <strong>Tip:</strong> Start with a question or interesting fact!
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    Your Hook
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {hook.trim().split(/\s+/).filter(w => w.length > 0).length} words
                  </span>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={hook}
                    onChange={(e) => setHook(e.target.value)}
                    placeholder="Write an interesting sentence to grab your reader's attention..."
                    className="writing-area flex-1"
                    rows={4}
                  />
                  <VoiceInput
                    onTranscript={(text) => setHook((prev) => prev ? `${prev} ${text}` : text)}
                    disabled={previewScoreMutation.isPending}
                  />
                </div>
              </div>
              
              {/* Check My Score Button */}
              <Button
                variant="outline"
                onClick={handleCheckHookScore}
                disabled={previewScoreMutation.isPending || !hook.trim()}
                className="w-full"
              >
                {previewScoreMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Check My Score
                  </>
                )}
              </Button>
              
              {/* Score Preview */}
              {hookPreviewScore && (
                <div className="space-y-3 p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <ScoreDisplay
                    score={hookPreviewScore.score}
                    label="Hook Score"
                    feedback={hookPreviewScore.feedback}
                  />
                  {hookPreviewScore.aiFeedback && (
                    <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-sm font-medium mb-1">✨ AI Feedback:</p>
                      <p className="text-sm text-foreground">{hookPreviewScore.aiFeedback}</p>
                    </div>
                  )}
                </div>
              )}
              
              <Button
                onClick={handleSaveHook}
                disabled={!hook.trim()}
                className="w-full btn-fun text-lg py-6"
              >
                <ChevronRight className="w-5 h-5 mr-2" />
                Next Step!
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Step 3: Body Paragraphs */}
        {currentStep === 3 && (
          <Card className="card-playful">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="step-indicator step-active">3</span>
                Body Paragraph {session.bodyParagraphs.length + 1} 📝
              </CardTitle>
              <CardDescription>
                Share facts and details about{" "}
                <span className="font-bold text-primary">{session.topic}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="encouragement">
                <p className="text-sm">
                  💡 <strong>Tip:</strong> Start with a topic sentence, then add 2-3 supporting details!
                </p>
              </div>
              
              {/* Saved paragraphs */}
              {session.bodyParagraphs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Saved Paragraphs:</p>
                  {session.bodyParagraphs.map((para, index) => (
                    <div key={para.id} className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                      <p className="text-sm font-medium">Paragraph {index + 1}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {para.topicSentence.substring(0, 50)}...
                      </p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Prompt to add another paragraph after every save */}
              {showAddAnotherPrompt && session.bodyParagraphs.length >= 1 && (
                <div className="p-4 bg-primary/10 border-2 border-primary rounded-lg animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Plus className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground mb-1">
                        Paragraph saved! 🎉
                      </p>
                      <p className="text-sm text-muted-foreground mb-3">
                        Want to add more details? Click "Add Another" below to write your next paragraph, or click "Write Conclusion" when you're done!
                      </p>
                      <Button
                        onClick={handleAddAnotherParagraph}
                        size="sm"
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Another Paragraph
                      </Button>
                    </div>
                    <button
                      onClick={() => setShowAddAnotherPrompt(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    Topic Sentence
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {currentParagraph.topicSentence.trim().split(/\s+/).filter(w => w.length > 0).length} words
                  </span>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={currentParagraph.topicSentence}
                    onChange={(e) => setCurrentParagraph(prev => ({ ...prev, topicSentence: e.target.value }))}
                    placeholder="Write your main idea for this paragraph..."
                    className="writing-area flex-1"
                    rows={2}
                  />
                  <VoiceInput
                    onTranscript={(text) => setCurrentParagraph(prev => ({
                      ...prev,
                      topicSentence: prev.topicSentence ? `${prev.topicSentence} ${text}` : text
                    }))}
                    disabled={previewScoreMutation.isPending}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    Supporting Details
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {currentParagraph.supportingDetails.trim().split(/\s+/).filter(w => w.length > 0).length} words
                  </span>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={currentParagraph.supportingDetails}
                    onChange={(e) => setCurrentParagraph(prev => ({ ...prev, supportingDetails: e.target.value }))}
                    placeholder="Add 2-3 facts or details to support your topic sentence..."
                    className="writing-area flex-1"
                    rows={4}
                  />
                  <VoiceInput
                    onTranscript={(text) => setCurrentParagraph(prev => ({
                      ...prev,
                      supportingDetails: prev.supportingDetails ? `${prev.supportingDetails} ${text}` : text
                    }))}
                    disabled={previewScoreMutation.isPending}
                  />
                </div>
              </div>
              
              {/* Check My Score Button */}
              <Button
                variant="outline"
                onClick={handleCheckBodyScore}
                disabled={previewScoreMutation.isPending || !currentParagraph.topicSentence.trim() || !currentParagraph.supportingDetails.trim()}
                className="w-full"
              >
                {previewScoreMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Check My Score
                  </>
                )}
              </Button>
              
              {/* Score Preview */}
              {bodyPreviewScore && (
                <div className="space-y-3 p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <ScoreDisplay
                    score={bodyPreviewScore.score}
                    label="Body Paragraph Score"
                    feedback={bodyPreviewScore.feedback}
                  />
                  {bodyPreviewScore.aiFeedback && (
                    <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-sm font-medium mb-1">✨ AI Feedback:</p>
                      <p className="text-sm text-foreground">{bodyPreviewScore.aiFeedback}</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveBodyParagraph}
                  disabled={!currentParagraph.topicSentence.trim() || !currentParagraph.supportingDetails.trim()}
                  className="flex-1"
                >
                  Save Paragraph
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAddAnotherParagraph}
                  disabled={currentParagraph.topicSentence.trim() !== "" || currentParagraph.supportingDetails.trim() !== ""}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another
                </Button>
              </div>
              
              {session.bodyParagraphs.length > 0 && (
                <Button
                  onClick={handleMoveToConclusion}
                  className="w-full btn-fun text-lg py-6"
                >
                  <ChevronRight className="w-5 h-5 mr-2" />
                  Write Conclusion
                </Button>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Step 4: Conclusion */}
        {currentStep === 4 && (
          <Card className="card-playful">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="step-indicator step-active">4</span>
                Write a Conclusion! 🎯
              </CardTitle>
              <CardDescription>
                Wrap up your writing about{" "}
                <span className="font-bold text-primary">{session.topic}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="encouragement">
                <p className="text-sm">
                  💡 <strong>Tip:</strong> Remind readers what you taught them!
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    Your Conclusion
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {conclusion.trim().split(/\s+/).filter(w => w.length > 0).length} words
                  </span>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                    placeholder="Wrap up your writing and remind readers what they learned..."
                    className="writing-area flex-1"
                    rows={4}
                  />
                  <VoiceInput
                    onTranscript={(text) => setConclusion((prev) => prev ? `${prev} ${text}` : text)}
                    disabled={previewScoreMutation.isPending}
                  />
                </div>
              </div>
              
              {/* Check My Score Button */}
              <Button
                variant="outline"
                onClick={handleCheckConclusionScore}
                disabled={previewScoreMutation.isPending || !conclusion.trim()}
                className="w-full"
              >
                {previewScoreMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Check My Score
                  </>
                )}
              </Button>
              
              {/* Score Preview */}
              {conclusionPreviewScore && (
                <div className="space-y-3 p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <ScoreDisplay
                    score={conclusionPreviewScore.score}
                    label="Conclusion Score"
                    feedback={conclusionPreviewScore.feedback}
                  />
                  {conclusionPreviewScore.aiFeedback && (
                    <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-sm font-medium mb-1">✨ AI Feedback:</p>
                      <p className="text-sm text-foreground">{conclusionPreviewScore.aiFeedback}</p>
                    </div>
                  )}
                </div>
              )}
              
              <Button
                onClick={handleSaveConclusion}
                disabled={!conclusion.trim()}
                className="w-full btn-fun text-lg py-6"
              >
                <ChevronRight className="w-5 h-5 mr-2" />
                See My Score!
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Step 5: Review */}
        {currentStep === 5 && (
          <Card className="card-playful">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="step-indicator step-active">5</span>
                Your Final Score! 🎉
              </CardTitle>
              <CardDescription>
                Let's see how you did!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!session.overallScores ? (
                <Button
                  onClick={handleFinalAssessment}
                  disabled={assessmentMutation.isPending}
                  className="w-full btn-fun text-lg py-6"
                >
                  {assessmentMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Get My Final Score!
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="text-center p-6 bg-primary/10 rounded-lg border-2 border-primary/20">
                    <p className="text-4xl font-bold text-primary mb-2">
                      {session.overallScores.titleSubtitles + session.overallScores.hook + session.overallScores.relevantInfo + session.overallScores.transitions + session.overallScores.accuracy + session.overallScores.vocabulary}/18
                    </p>
                    <p className="text-lg text-muted-foreground">Total Score</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Total Words: {totalWords}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <ScoreDisplay score={session.overallScores.titleSubtitles} label="Title & Subtitles" feedback={session.overallFeedback?.titleSubtitles} />
                    <ScoreDisplay score={session.overallScores.hook} label="Hook" feedback={session.overallFeedback?.hook} />
                    <ScoreDisplay score={session.overallScores.relevantInfo} label="Relevant Information" feedback={session.overallFeedback?.relevantInfo} />
                    <ScoreDisplay score={session.overallScores.transitions} label="Transitions" feedback={session.overallFeedback?.transitions} />
                    <ScoreDisplay score={session.overallScores.accuracy} label="Accuracy" feedback={session.overallFeedback?.accuracy} />
                    <ScoreDisplay score={session.overallScores.vocabulary} label="Vocabulary" feedback={session.overallFeedback?.vocabulary} />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setLocation(`/article/${sessionId}`)}
                      className="flex-1"
                    >
                      <PenLine className="w-4 h-4 mr-2" />
                      View Article
                    </Button>
                    
                    {(session.overallScores.titleSubtitles + session.overallScores.hook + session.overallScores.relevantInfo + session.overallScores.transitions + session.overallScores.accuracy + session.overallScores.vocabulary) >= 14 && (
                      <Button
                        onClick={() => setLocation(`/certificate/${sessionId}`)}
                        className="flex-1 btn-fun"
                      >
                        🏆 Get Certificate
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/")}
                    className="w-full"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Start New Writing
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
      
      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Writing Help 💡</DialogTitle>
            <DialogDescription>
              Here are some tips to help you!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {helpContent.feedback && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-sm">{helpContent.feedback}</p>
              </div>
            )}
            {helpContent.tips.length > 0 && (
              <ul className="space-y-2">
                {helpContent.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary font-bold">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Session Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Work is Saved! 🎉</DialogTitle>
            <DialogDescription>
              Use this code to load your work later. Keep it safe!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-6 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Your Save Code:</p>
              <p className="text-4xl font-bold font-mono tracking-wider text-primary">
                {saveCode}
              </p>
            </div>
            <Button
              onClick={handleCopyCode}
              className="w-full gap-2"
              variant={copied ? "outline" : "default"}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Code
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              This code will expire in 30 days. Write it down or take a screenshot!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
