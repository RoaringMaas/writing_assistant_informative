import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  PenLine,
  ChevronRight,
  ChevronLeft,
  Plus,
  Sparkles,
  CheckCircle2,
  Home,
  RefreshCw,
  Lightbulb,
  Award,
} from "lucide-react";
import { toast } from "sonner";

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
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  // Form state
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  
  // Check My Score state
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
  const [hook, setHook] = useState("");
  const [currentParagraph, setCurrentParagraph] = useState({ topicSentence: "", supportingDetails: "" });
  const [conclusion, setConclusion] = useState("");
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  
  // UI state
  const [scaffoldingPrompts, setScaffoldingPrompts] = useState<string[]>([]);
  const [showScaffolding, setShowScaffolding] = useState(false);
  const [lastScore, setLastScore] = useState<{ score: number; feedback: string; label: string } | null>(null);
  const [isRevising, setIsRevising] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [helpContent, setHelpContent] = useState<{ tips: string[]; feedback?: string }>({ tips: [] });
  const [showWordBank, setShowWordBank] = useState(false);
  
  // Fetch session data
  const { data: sessionData, isLoading, refetch } = trpc.writing.get.useQuery(
    { sessionId: parseInt(sessionId || "0") },
    { enabled: !!sessionId && isAuthenticated }
  );
  
  const session = sessionData?.session;
  const paragraphs = sessionData?.paragraphs || [];
  const currentStep = session?.currentStep || 1;
  
  // Word bank query
  const { data: wordBankData } = trpc.writing.getWordBank.useQuery(
    { topic: session?.topic || "" },
    { enabled: !!session?.topic && currentStep >= 2 }
  );
  const wordBank = wordBankData?.words || [];
  
  // Mutations
  const setTopicMutation = trpc.writing.setTopic.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Great topic! Let's write! ✨");
    },
  });
  
  const saveHookMutation = trpc.writing.saveHook.useMutation({
    onSuccess: (data) => {
      setLastScore({ score: data.score, feedback: data.feedback, label: "Hook" });
      if (data.needsScaffolding && data.scaffoldingPrompts.length) {
        setScaffoldingPrompts(data.scaffoldingPrompts);
        setShowScaffolding(true);
      }
      refetch();
    },
  });
  
  const saveBodyMutation = trpc.writing.saveBodyParagraph.useMutation({
    onSuccess: (data) => {
      const avgScore = Math.round((data.relevantInfoScore + data.transitionScore) / 2);
      setLastScore({ 
        score: avgScore, 
        feedback: `${data.relevantInfoFeedback} ${data.transitionFeedback}`, 
        label: "Body Paragraph" 
      });
      if (data.needsScaffolding && data.scaffoldingPrompts.length) {
        setScaffoldingPrompts(data.scaffoldingPrompts);
        setShowScaffolding(true);
      }
      setCurrentParagraph({ topicSentence: "", supportingDetails: "" });
      refetch();
    },
  });
  
  const addParagraphMutation = trpc.writing.addParagraph.useMutation({
    onSuccess: (data) => {
      setCurrentParagraphIndex(data.orderIndex);
      setCurrentParagraph({ topicSentence: "", supportingDetails: "" });
      refetch();
      toast.success("New paragraph added! Keep writing! 📝");
    },
  });
  
  const moveToConclusionMutation = trpc.writing.moveToConclusion.useMutation({
    onSuccess: () => {
      refetch();
    },
  });
  
  const saveConclusionMutation = trpc.writing.saveConclusion.useMutation({
    onSuccess: (data) => {
      setLastScore({ score: data.score, feedback: data.feedback, label: "Conclusion" });
      refetch();
    },
  });
  
  const getAssessmentMutation = trpc.writing.getOverallAssessment.useMutation();
  
  const getIntelligentFeedbackMutation = trpc.writing.getIntelligentFeedback.useMutation();
  
  // Check My Score mutations
  const checkHookScoreMutation = trpc.writing.previewScore.useMutation({
    onSuccess: async (data) => {
      let aiFeedback: string | undefined;
      try {
        const result = await getIntelligentFeedbackMutation.mutateAsync({
          sessionId: parseInt(sessionId || "0"),
          currentSection: "hook",
          currentContent: hook,
        });
        aiFeedback = typeof result.feedback === 'string' ? result.feedback : undefined;
      } catch (error) {
        // If AI feedback fails, just use scaffolding prompts
      }
      
      setHookPreviewScore({
        score: data.score,
        feedback: data.feedback,
        scaffolding: data.scaffoldingPrompts,
        aiFeedback,
      });
      if (data.score === 1 && data.scaffoldingPrompts.length > 0) {
        setScaffoldingPrompts(data.scaffoldingPrompts);
        setShowScaffolding(true);
      }
    },
    onError: () => {
      toast.error("Couldn't check score. Try again!");
    },
  });
  
  const checkBodyScoreMutation = trpc.writing.previewScore.useMutation({
    onSuccess: async (data) => {
      let aiFeedback: string | undefined;
      try {
        const result = await getIntelligentFeedbackMutation.mutateAsync({
          sessionId: parseInt(sessionId || "0"),
          currentSection: "body",
          currentContent: currentParagraph.topicSentence + " " + currentParagraph.supportingDetails,
        });
        aiFeedback = typeof result.feedback === 'string' ? result.feedback : undefined;
      } catch (error) {
        // If AI feedback fails, just use scaffolding prompts
      }
      
      setBodyPreviewScore({
        score: data.score,
        feedback: data.feedback,
        scaffolding: data.scaffoldingPrompts,
        aiFeedback,
      });
      if (data.score === 1 && data.scaffoldingPrompts.length > 0) {
        setScaffoldingPrompts(data.scaffoldingPrompts);
        setShowScaffolding(true);
      }
    },
    onError: () => {
      toast.error("Couldn't check score. Try again!");
    },
  });
  
  const checkConclusionScoreMutation = trpc.writing.previewScore.useMutation({
    onSuccess: async (data) => {
      let aiFeedback: string | undefined;
      try {
        const result = await getIntelligentFeedbackMutation.mutateAsync({
          sessionId: parseInt(sessionId || "0"),
          currentSection: "conclusion",
          currentContent: conclusion,
        });
        aiFeedback = typeof result.feedback === 'string' ? result.feedback : undefined;
      } catch (error) {
        // If AI feedback fails, just use scaffolding prompts
      }
      
      setConclusionPreviewScore({
        score: data.score,
        feedback: data.feedback,
        scaffolding: data.scaffoldingPrompts,
        aiFeedback,
      });
      if (data.score === 1 && data.scaffoldingPrompts.length > 0) {
        setScaffoldingPrompts(data.scaffoldingPrompts);
        setShowScaffolding(true);
      }
    },
    onError: () => {
      toast.error("Couldn't check score. Try again!");
    },
  });
  
  const reviseSectionMutation = trpc.writing.reviseSection.useMutation({
    onSuccess: (data) => {
      setLastScore({ score: data.score, feedback: data.feedback, label: "Revised Section" });
      setIsRevising(false);
      refetch();
      toast.success("Great revision! 🌟");
    },
  });
  
  // Load existing data into form
  useEffect(() => {
    if (session) {
      if (session.topic) setTopic(session.topic);
      if (session.title) setTitle(session.title);
      if (session.hook) setHook(session.hook);
      if (session.conclusion) setConclusion(session.conclusion);
    }
  }, [session]);
  
  // Load current paragraph data
  useEffect(() => {
    if (paragraphs.length > 0 && currentParagraphIndex < paragraphs.length) {
      const p = paragraphs[currentParagraphIndex];
      if (p.topicSentence || p.supportingDetails) {
        setCurrentParagraph({
          topicSentence: p.topicSentence || "",
          supportingDetails: p.supportingDetails || "",
        });
      }
    }
  }, [paragraphs, currentParagraphIndex]);
  
  // Auto-save with debounce
  const autoSave = useCallback(() => {
    // Auto-save is handled by the mutations
  }, []);
  
  // Get intelligent feedback
  const handleGetHelp = async () => {
    if (!session) return;
    
    // General tips for each step
    const generalTips: Record<number, string[]> = {
      1: [
        "Pick a topic you know a lot about!",
        "Your title should tell readers what your writing is about.",
        "Think about what makes your topic interesting or special.",
      ],
      2: [
        "Start with a question to make readers curious.",
        "Share an amazing fact about your topic.",
        "Use words like 'Did you know...' or 'Imagine...' to grab attention.",
        "Make sure your hook connects to your topic.",
      ],
      3: [
        "Start each paragraph with a main idea about your topic.",
        "Add facts and details to support your main idea.",
        "Use words like 'first,' 'next,' and 'also' to connect ideas.",
        "Make sure all your information is about your topic.",
      ],
      4: [
        "Remind readers what your writing was about.",
        "End with a strong sentence that wraps up your ideas.",
        "Try starting with 'In conclusion...' or 'That's why...'",
        "Leave readers thinking about your topic.",
      ],
      5: [
        "Read through your whole writing.",
        "Check if all parts connect to your topic.",
        "Be proud of your hard work!",
      ],
    };
    
    let currentContent = "";
    let currentSection = "";
    
    if (currentStep === 2) {
      currentContent = hook;
      currentSection = "introduction hook";
    } else if (currentStep === 3) {
      currentContent = `${currentParagraph.topicSentence}\n${currentParagraph.supportingDetails}`;
      currentSection = "body paragraph";
    } else if (currentStep === 4) {
      currentContent = conclusion;
      currentSection = "conclusion";
    }
    
    // Show general tips first
    const tips = generalTips[currentStep] || [];
    
    // If they have content, get AI feedback too
    let aiFeedback: string | undefined;
    if (currentContent.trim() && currentStep >= 2 && currentStep <= 4) {
      try {
        const result = await getIntelligentFeedbackMutation.mutateAsync({
          sessionId: parseInt(sessionId || "0"),
          currentSection,
          currentContent,
        });
        aiFeedback = typeof result.feedback === 'string' ? result.feedback : undefined;
      } catch (error) {
        // If AI feedback fails, just show general tips
      }
    }
    
    setHelpContent({ tips, feedback: aiFeedback });
    setShowHelpDialog(true);
  };
  
  // Handle step submissions
  const handleTopicSubmit = () => {
    if (!topic.trim() || !title.trim()) {
      toast.error("Please enter both a topic and title!");
      return;
    }
    setTopicMutation.mutate({
      sessionId: parseInt(sessionId || "0"),
      topic: topic.trim(),
      title: title.trim(),
    });
  };
  
  const handleHookSubmit = () => {
    if (!hook.trim()) {
      toast.error("Please write your hook first!");
      return;
    }
    saveHookMutation.mutate({
      sessionId: parseInt(sessionId || "0"),
      hook: hook.trim(),
    });
  };
  
  const handleBodySubmit = () => {
    if (!currentParagraph.topicSentence.trim() || !currentParagraph.supportingDetails.trim()) {
      toast.error("Please fill in both parts!");
      return;
    }
    
    const currentParagraphId = paragraphs[currentParagraphIndex]?.id;
    if (!currentParagraphId) {
      toast.error("Something went wrong. Please try again.");
      return;
    }
    
    saveBodyMutation.mutate({
      sessionId: parseInt(sessionId || "0"),
      paragraphId: currentParagraphId,
      topicSentence: currentParagraph.topicSentence.trim(),
      supportingDetails: currentParagraph.supportingDetails.trim(),
    });
  };
  
  const handleAddAnotherParagraph = () => {
    addParagraphMutation.mutate({ sessionId: parseInt(sessionId || "0") });
  };
  
  const handleMoveToConclusion = () => {
    moveToConclusionMutation.mutate({ sessionId: parseInt(sessionId || "0") });
  };
  
  const handleConclusionSubmit = () => {
    if (!conclusion.trim()) {
      toast.error("Please write your conclusion first!");
      return;
    }
    saveConclusionMutation.mutate({
      sessionId: parseInt(sessionId || "0"),
      conclusion: conclusion.trim(),
    });
  };
  
  const handleGetAssessment = () => {
    getAssessmentMutation.mutate({ sessionId: parseInt(sessionId || "0") });
  };
  
  // Revision handlers
  const handleReviseHook = () => {
    setIsRevising(true);
  };
  
  const handleSubmitRevision = (sectionType: "hook" | "conclusion", content: string) => {
    reviseSectionMutation.mutate({
      sessionId: parseInt(sessionId || "0"),
      sectionType,
      newContent: content,
    });
  };
  
  // Loading states
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading your writing...</p>
        </div>
      </div>
    );
  }
  
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
  
  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;
  
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
              disabled={getIntelligentFeedbackMutation.isPending}
              className="gap-2"
            >
              {getIntelligentFeedbackMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Get Help
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
                  📚 Word Bank: {session?.topic}
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
        
        {/* Last Score Display */}
        {lastScore && currentStep < 5 && (
          <div className="mb-6">
            <ScoreDisplay
              score={lastScore.score}
              label={lastScore.label}
              feedback={lastScore.feedback}
            />
          </div>
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
                disabled={setTopicMutation.isPending}
                className="w-full btn-fun text-lg py-6"
              >
                {setTopicMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <ChevronRight className="w-5 h-5 mr-2" />
                )}
                Next Step!
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Step 2: Hook/Introduction */}
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
                <Textarea
                  value={hook}
                  onChange={(e) => setHook(e.target.value)}
                  placeholder="Write an interesting sentence to grab your reader's attention..."
                  className="writing-area"
                  rows={4}
                />
              </div>
              
              {isRevising && lastScore && lastScore.score === 1 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsRevising(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleSubmitRevision("hook", hook)}
                    disabled={reviseSectionMutation.isPending}
                  >
                    {reviseSectionMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Submit Revision
                  </Button>
                </div>
              )}
              
              {/* Preview Score Display */}
              {hookPreviewScore && (
                <div className="p-4 rounded-xl bg-muted/30 border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Your Score Preview</span>
                    <span className={`score-badge score-${hookPreviewScore.score}`}>
                      {hookPreviewScore.score === 3 ? "⭐" : hookPreviewScore.score === 2 ? "👍" : "💪"} {hookPreviewScore.score}/3
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{hookPreviewScore.feedback}</p>
                  {hookPreviewScore.aiFeedback && (
                    <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-xs font-medium text-primary mb-2">🤖 AI Feedback:</p>
                      <p className="text-xs leading-relaxed">{hookPreviewScore.aiFeedback}</p>
                    </div>
                  )}
                  {!hookPreviewScore.aiFeedback && hookPreviewScore.scaffolding && hookPreviewScore.scaffolding.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-xs font-medium text-primary mb-2">💡 Tips to improve:</p>
                      <ul className="space-y-1">
                        {hookPreviewScore.scaffolding.map((tip, i) => (
                          <li key={i} className="text-xs flex items-start gap-1">
                            <span className="text-primary">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {!isRevising && (
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!hook.trim()) {
                        toast.error("Write your hook first!");
                        return;
                      }
                      setHookPreviewScore(null);
                      checkHookScoreMutation.mutate({
                        sessionId: parseInt(sessionId || "0"),
                        sectionType: "hook",
                        content: hook,
                      });
                    }}
                    disabled={checkHookScoreMutation.isPending}
                    className="flex-1"
                  >
                    {checkHookScoreMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Check My Score
                  </Button>
                  <Button
                    onClick={handleHookSubmit}
                    disabled={saveHookMutation.isPending}
                    className="flex-1 btn-fun text-lg py-6"
                  >
                    {saveHookMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <ChevronRight className="w-5 h-5 mr-2" />
                    )}
                    Next Step!
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Step 3: Body Paragraphs */}
        {currentStep === 3 && (
          <Card className="card-playful">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="step-indicator step-active">3</span>
                Body Paragraph {currentParagraphIndex + 1} 📝
              </CardTitle>
              <CardDescription>
                Share facts and details about{" "}
                <span className="font-bold text-primary">{session.topic}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Show completed paragraphs */}
              {paragraphs.slice(0, currentParagraphIndex).map((p, i) => (
                <div key={p.id} className="p-4 rounded-xl bg-muted/50 border">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Paragraph {i + 1} ✓
                  </p>
                  <p className="text-sm">{p.topicSentence}</p>
                </div>
              ))}
              
              <div className="encouragement">
                <p className="text-sm">
                  💡 <strong>Tip:</strong> Use words like "first," "next," "also" to connect ideas!
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    What's one important thing about {session.topic}?
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {currentParagraph.topicSentence.trim().split(/\s+/).filter(w => w.length > 0).length} words
                  </span>
                </div>
                <Textarea
                  value={currentParagraph.topicSentence}
                  onChange={(e) =>
                    setCurrentParagraph((prev) => ({
                      ...prev,
                      topicSentence: e.target.value,
                    }))
                  }
                  placeholder="Write your main idea..."
                  className="writing-area"
                  rows={2}
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    Tell me more! What facts support this?
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {currentParagraph.supportingDetails.trim().split(/\s+/).filter(w => w.length > 0).length} words
                  </span>
                </div>
                <Textarea
                  value={currentParagraph.supportingDetails}
                  onChange={(e) =>
                    setCurrentParagraph((prev) => ({
                      ...prev,
                      supportingDetails: e.target.value,
                    }))
                  }
                  placeholder="Add details and facts..."
                  className="writing-area"
                  rows={4}
                />
              </div>
              
              {/* Preview Score Display */}
              {bodyPreviewScore && (
                <div className="p-4 rounded-xl bg-muted/30 border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Your Score Preview</span>
                    <span className={`score-badge score-${bodyPreviewScore.score}`}>
                      {bodyPreviewScore.score === 3 ? "⭐" : bodyPreviewScore.score === 2 ? "👍" : "💪"} {bodyPreviewScore.score}/3
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{bodyPreviewScore.feedback}</p>
                  {bodyPreviewScore.aiFeedback && (
                    <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-xs font-medium text-primary mb-2">🤖 AI Feedback:</p>
                      <p className="text-xs leading-relaxed">{bodyPreviewScore.aiFeedback}</p>
                    </div>
                  )}
                  {!bodyPreviewScore.aiFeedback && bodyPreviewScore.scaffolding && bodyPreviewScore.scaffolding.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-xs font-medium text-primary mb-2">💡 Tips to improve:</p>
                      <ul className="space-y-1">
                        {bodyPreviewScore.scaffolding.map((tip, i) => (
                          <li key={i} className="text-xs flex items-start gap-1">
                            <span className="text-primary">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    const content = `${currentParagraph.topicSentence} ${currentParagraph.supportingDetails}`.trim();
                    if (!content) {
                      toast.error("Write your paragraph first!");
                      return;
                    }
                    setBodyPreviewScore(null);
                    checkBodyScoreMutation.mutate({
                      sessionId: parseInt(sessionId || "0"),
                      sectionType: "body",
                      content,
                    });
                  }}
                  disabled={checkBodyScoreMutation.isPending}
                  className="flex-1"
                >
                  {checkBodyScoreMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Check My Score
                </Button>
                <Button
                  onClick={handleBodySubmit}
                  disabled={saveBodyMutation.isPending}
                  className="flex-1 btn-fun text-lg py-6"
                >
                  {saveBodyMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                  )}
                  Save Paragraph
                </Button>
              </div>
              
              {paragraphs.some(p => p.topicSentence && p.supportingDetails) && (
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleAddAnotherParagraph}
                    disabled={addParagraphMutation.isPending}
                    className="flex-1"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Paragraph
                  </Button>
                  <Button
                    onClick={handleMoveToConclusion}
                    disabled={moveToConclusionMutation.isPending}
                    className="flex-1"
                  >
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Write Conclusion
                  </Button>
                </div>
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
                Wrap It Up! 🎁
              </CardTitle>
              <CardDescription>
                Write a conclusion about{" "}
                <span className="font-bold text-primary">{session.topic}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="encouragement">
                <p className="text-sm">
                  💡 <strong>Tip:</strong> Remind readers why your topic is interesting!
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
                <Textarea
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  placeholder="Write a sentence or two to wrap up your writing..."
                  className="writing-area"
                  rows={4}
                />
              </div>
              
              {/* Preview Score Display */}
              {conclusionPreviewScore && (
                <div className="p-4 rounded-xl bg-muted/30 border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Your Score Preview</span>
                    <span className={`score-badge score-${conclusionPreviewScore.score}`}>
                      {conclusionPreviewScore.score === 3 ? "⭐" : conclusionPreviewScore.score === 2 ? "👍" : "💪"} {conclusionPreviewScore.score}/3
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{conclusionPreviewScore.feedback}</p>
                  {conclusionPreviewScore.aiFeedback && (
                    <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-xs font-medium text-primary mb-2">🤖 AI Feedback:</p>
                      <p className="text-xs leading-relaxed">{conclusionPreviewScore.aiFeedback}</p>
                    </div>
                  )}
                  {!conclusionPreviewScore.aiFeedback && conclusionPreviewScore.scaffolding && conclusionPreviewScore.scaffolding.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-xs font-medium text-primary mb-2">💡 Tips to improve:</p>
                      <ul className="space-y-1">
                        {conclusionPreviewScore.scaffolding.map((tip, i) => (
                          <li key={i} className="text-xs flex items-start gap-1">
                            <span className="text-primary">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!conclusion.trim()) {
                      toast.error("Write your conclusion first!");
                      return;
                    }
                    setConclusionPreviewScore(null);
                    checkConclusionScoreMutation.mutate({
                      sessionId: parseInt(sessionId || "0"),
                      sectionType: "conclusion",
                      content: conclusion,
                    });
                  }}
                  disabled={checkConclusionScoreMutation.isPending}
                  className="flex-1"
                >
                  {checkConclusionScoreMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Check My Score
                </Button>
                <Button
                  onClick={handleConclusionSubmit}
                  disabled={saveConclusionMutation.isPending}
                  className="flex-1 btn-fun text-lg py-6"
                >
                  {saveConclusionMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <ChevronRight className="w-5 h-5 mr-2" />
                  )}
                  See My Score!
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Step 5: Review/Assessment */}
        {currentStep === 5 && (
          <div className="space-y-6">
            {!getAssessmentMutation.data ? (
              <Card className="card-playful text-center">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    Ready to see how you did? 🌟
                  </CardTitle>
                  <CardDescription>
                    Click below to get your final score!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleGetAssessment}
                    disabled={getAssessmentMutation.isPending}
                    className="btn-fun text-lg px-8 py-6"
                  >
                    {getAssessmentMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Checking your writing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Get My Score!
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <AssessmentResults
                data={getAssessmentMutation.data}
                session={session}
                paragraphs={paragraphs}
                sessionId={parseInt(sessionId || "0")}
                onRefetch={refetch}
              />
            )}
          </div>
        )}
      </main>
      
      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              Writing Tips for {STEPS[currentStep - 1]?.title}
            </DialogTitle>
            <DialogDescription>
              Here are some tips to help you write better!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {helpContent.tips.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">🎯 General Tips:</p>
                <ul className="space-y-2">
                  {helpContent.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {helpContent.feedback && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm font-medium text-primary mb-1">🤖 AI Feedback:</p>
                <p className="text-sm">{helpContent.feedback}</p>
              </div>
            )}
            <Button onClick={() => setShowHelpDialog(false)} className="w-full">
              Got it! ✔️
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Assessment Results Component
interface AssessmentResultsProps {
  data: {
    scores: Record<string, number>;
    feedback: Record<string, string>;
    totalScore: number;
    maxScore: number;
    strengths: string[];
    areasForGrowth: string[];
    overallFeedback: string;
    needsScaffolding: boolean;
  };
  session: {
    topic: string | null;
    title: string | null;
    hook: string | null;
    conclusion: string | null;
  };
  paragraphs: Array<{
    topicSentence: string | null;
    supportingDetails: string | null;
  }>;
  sessionId: number;
  onRefetch: () => void;
}

function AssessmentResults({ data, session, paragraphs, sessionId, onRefetch }: AssessmentResultsProps) {
  const [showSelfAssessment, setShowSelfAssessment] = useState(false);
  const [, setLocation] = useLocation();
  const percentage = Math.round((data.totalScore / data.maxScore) * 100);
  const isHighScore = percentage >= 70;
  
  const criteriaLabels: Record<string, string> = {
    titleSubtitles: "Title",
    hook: "Hook",
    relevantInfo: "Facts & Details",
    transitions: "Connecting Words",
    accuracy: "Spelling & Grammar",
    vocabulary: "Word Choice",
  };
  
  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <Card className={`card-playful ${isHighScore ? "border-2 border-primary" : ""}`}>
        <CardHeader className="text-center">
          <div className={`text-6xl mb-4 ${isHighScore ? "animate-bounce-gentle" : ""}`}>
            {isHighScore ? "🎉" : "💪"}
          </div>
          <CardTitle className="text-3xl">
            {isHighScore ? "Amazing Work!" : "Great Effort!"}
          </CardTitle>
          <CardDescription className="text-lg">
            You scored <span className="font-bold text-primary">{data.totalScore}</span> out of{" "}
            <span className="font-bold">{data.maxScore}</span> points!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-muted rounded-full h-4 mb-4">
            <div
              className="h-4 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-center text-muted-foreground">{percentage}% complete!</p>
          
          {/* Perfect Score Certificate */}
          {data.totalScore >= 14 && (
            <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/30">
              <div className="text-center space-y-3">
                <p className="text-lg font-bold text-primary">🏆 Excellent Score! 🏆</p>
                <p className="text-sm text-muted-foreground">You've earned {data.totalScore} points! You're an Informational Text Expert!</p>
                <Button
                  onClick={() => setLocation(`/certificate/${sessionId}`)}
                  className="btn-fun"
                >
                  <Award className="w-4 h-4 mr-2" />
                  Get Your Certificate!
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Detailed Scores */}
      <Card className="card-playful">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Your Scores 📊</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSelfAssessment(!showSelfAssessment)}
            >
              {showSelfAssessment ? "Hide" : "Rate Yourself"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(data.scores).map(([key, score]) => (
            <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <div>
                <p className="font-medium">{criteriaLabels[key] || key}</p>
                <p className="text-sm text-muted-foreground">
                  {data.feedback[key]}
                </p>
              </div>
              <span className={`score-badge score-${score}`}>
                {score === 3 ? "⭐" : score === 2 ? "👍" : "💪"} {score}/3
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* Self Assessment Section */}
      {showSelfAssessment && (
        <Card className="card-playful border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="text-xl">Rate Yourself! ✏️</CardTitle>
            <CardDescription>
              How do you think you did? Compare your scores with the AI!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(data.scores).map(([key, aiScore]) => {
              const criterion = key as "titleSubtitles" | "hook" | "relevantInfo" | "transitions" | "accuracy" | "vocabulary";
              return (
                <SelfAssessmentItem
                  key={key}
                  sessionId={sessionId}
                  criterion={criterion}
                  label={criteriaLabels[key] || key}
                  aiScore={aiScore}
                  feedback={data.feedback[key]}
                  onUpdate={onRefetch}
                />
              );
            })}
          </CardContent>
        </Card>
      )}
      
      {/* Strengths & Growth */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="card-playful">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              ⭐ Your Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  {strength}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card className="card-playful">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              🎯 Keep Practicing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.areasForGrowth.map((area, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-accent-foreground mt-0.5 flex-shrink-0" />
                  {area}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      
      {/* Complete Writing */}
      <Card className="card-playful">
        <CardHeader>
          <CardTitle className="text-xl">Your Complete Writing 📄</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <h3 className="text-xl font-bold text-center mb-4">{session.title}</h3>
          
          <div className="mb-4">
            <p className="font-medium text-muted-foreground text-xs mb-1">Introduction</p>
            <p>{session.hook}</p>
          </div>
          
          {paragraphs.map((p, i) => (
            <div key={i} className="mb-4">
              <p className="font-medium text-muted-foreground text-xs mb-1">
                Body Paragraph {i + 1}
              </p>
              <p>
                {p.topicSentence} {p.supportingDetails}
              </p>
            </div>
          ))}
          
          <div>
            <p className="font-medium text-muted-foreground text-xs mb-1">Conclusion</p>
            <p>{session.conclusion}</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Overall Feedback */}
      <Card className="card-playful bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="pt-6">
          <p className="text-center text-lg">{data.overallFeedback}</p>
        </CardContent>
      </Card>
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          onClick={() => setLocation(`/article/${sessionId}`)}
          className="flex-1"
        >
          📄 View Full Article
        </Button>
        <Button
          variant="outline"
          onClick={() => setLocation("/history")}
          className="flex-1"
        >
          View All My Writing
        </Button>
        <Button
          onClick={() => setLocation("/")}
          className="flex-1 btn-fun"
        >
          <PenLine className="w-4 h-4 mr-2" />
          Write Something New!
        </Button>
      </div>
    </div>
  );
}


// Self Assessment Item Component
interface SelfAssessmentItemProps {
  sessionId: number;
  criterion: "titleSubtitles" | "hook" | "relevantInfo" | "transitions" | "accuracy" | "vocabulary";
  label: string;
  aiScore: number;
  feedback: string;
  onUpdate: () => void;
}

const criteriaDescriptions: Record<string, { 3: string; 2: string; 1: string }> = {
  titleSubtitles: {
    3: "Clear, relevant title",
    2: "Title is okay",
    1: "Needs a better title",
  },
  hook: {
    3: "Grabs attention!",
    2: "Starts okay",
    1: "Needs more interest",
  },
  relevantInfo: {
    3: "Lots of good facts",
    2: "Some facts",
    1: "Needs more info",
  },
  transitions: {
    3: "Ideas flow smoothly",
    2: "Some flow",
    1: "Choppy ideas",
  },
  accuracy: {
    3: "Very few mistakes",
    2: "Some mistakes",
    1: "Many mistakes",
  },
  vocabulary: {
    3: "Great word choices",
    2: "Basic words",
    1: "Very simple words",
  },
};

function SelfAssessmentItem({
  sessionId,
  criterion,
  label,
  aiScore,
  feedback,
  onUpdate,
}: SelfAssessmentItemProps) {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  
  const updateMutation = trpc.writing.updateSelfAssessment.useMutation({
    onSuccess: () => {
      setSaved(true);
      toast.success(`${label} score saved! ⭐`);
      onUpdate();
    },
    onError: () => {
      toast.error("Couldn't save. Try again!");
    },
  });
  
  const handleSave = (score: number) => {
    setSelectedScore(score);
    updateMutation.mutate({
      sessionId,
      criterion,
      score,
    });
  };
  
  const descriptions = criteriaDescriptions[criterion];
  
  return (
    <div className="p-4 rounded-xl bg-muted/30 border">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{feedback}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">AI:</span>
          <span className={`score-badge score-${aiScore}`}>
            {aiScore === 3 ? "⭐" : aiScore === 2 ? "👍" : "💪"} {aiScore}
          </span>
        </div>
      </div>
      
      {saved ? (
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span>You gave yourself: </span>
          <span className={`score-badge score-${selectedScore}`}>
            {selectedScore === 3 ? "⭐" : selectedScore === 2 ? "👍" : "💪"} {selectedScore}
          </span>
        </div>
      ) : (
        <div className="flex gap-2">
          {[3, 2, 1].map((score) => (
            <button
              key={score}
              onClick={() => handleSave(score)}
              disabled={updateMutation.isPending}
              className={`flex-1 p-2 rounded-lg border-2 text-center transition-all hover:border-primary/50 ${
                selectedScore === score ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <span className="block text-lg mb-1">
                {score === 3 ? "⭐" : score === 2 ? "👍" : "💪"}
              </span>
              <span className="text-xs">{descriptions?.[score as 1 | 2 | 3]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
