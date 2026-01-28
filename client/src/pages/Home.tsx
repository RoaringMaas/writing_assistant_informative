import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { PenLine, BookOpen, Star, Sparkles, Download } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { createSession } from "@/lib/sessionManager";

export default function Home() {
  const [, setLocation] = useLocation();
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [loadCode, setLoadCode] = useState("");
  
  // Use mutation to load session - mutations can be called from event handlers
  const loadSessionMutation = trpc.writing.loadSessionAnonymous.useMutation({
    onSuccess: (result) => {
      if (!result.sessionData) {
        toast.error("Invalid session data received");
        return;
      }

      const sessionToStore = {
        sessionId: result.sessionData.sessionId || "",
        topic: result.sessionData.topic || "",
        title: result.sessionData.title || "",
        hook: result.sessionData.hook || "",
        bodyParagraphs: result.sessionData.bodyParagraphs || [],
        conclusion: result.sessionData.conclusion || "",
        currentStep: result.sessionData.currentStep || 1,
        overallScores: result.sessionData.overallScores || null,
        overallFeedback: result.sessionData.overallFeedback || null,
        selfAssessment: result.sessionData.selfAssessment || null,
        createdAt: result.sessionData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      localStorage.setItem("writing_session", JSON.stringify(sessionToStore));
      toast.success("Session loaded successfully!");
      setShowLoadDialog(false);
      setLoadCode("");
      setLocation(`/write/${sessionToStore.sessionId}`);
    },
    onError: (error: any) => {
      console.error("Load session error:", error);
      toast.error(error.message || "Failed to load session. Please check your code.");
    },
  });

  const handleStartWriting = () => {
    const session = createSession();
    setLocation(`/write/${session.sessionId}`);
  };

  const handleLoadSession = () => {
    if (!loadCode.trim()) {
      toast.error("Please enter a save code");
      return;
    }

    loadSessionMutation.mutate({
      saveCode: loadCode.trim().toUpperCase(),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="container py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <PenLine className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Writing Helper</h1>
              <p className="text-sm text-muted-foreground">For Young Writers</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowLoadDialog(true)}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Load My Work
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container py-12">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent-foreground mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Master the Art of Informative Writing!</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 leading-tight">
            Become a{" "}
            <span className="text-primary">Super Writer</span>{" "}
            Today! ✨
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            I'll help you write amazing informational texts step by step.
          </p>
          
          <Button
            onClick={handleStartWriting}
            size="lg"
            className="gap-2 text-lg px-8 py-6"
          >
            <PenLine className="w-5 h-5" />
            Start Writing!
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="card-playful hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-xl">Step by Step</CardTitle>
              <CardDescription>
                I'll guide you through each part of your writing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-xs">1</span>
                  Pick your topic
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-xs">2</span>
                  Write a hook
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-xs">3</span>
                  Add your facts
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-xs">4</span>
                  Finish strong!
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-playful hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                <Star className="w-7 h-7 text-accent-foreground" />
              </div>
              <CardTitle className="text-xl">Get Stars!</CardTitle>
              <CardDescription>
                Earn points for great writing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="score-badge score-3">⭐ 3</span>
                  <span className="text-sm">Amazing work!</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="score-badge score-2">⭐ 2</span>
                  <span className="text-sm">Good job!</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="score-badge score-1">⭐ 1</span>
                  <span className="text-sm">Keep trying!</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-playful hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-xl">Get Help!</CardTitle>
              <CardDescription>
                I'll give you tips when you need them
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="encouragement">
                <p className="text-sm font-medium text-foreground mb-2">
                  💡 Helpful Tip:
                </p>
                <p className="text-sm text-muted-foreground">
                  "Start with a question to grab your reader's attention!"
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* What You'll Learn */}
        <div className="mt-16 max-w-3xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-8">What You'll Learn 📚</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              "Writing great titles",
              "Catching attention",
              "Adding facts",
              "Using transitions",
              "Spelling & grammar",
              "Using cool words",
            ].map((skill, i) => (
              <div
                key={i}
                className="px-4 py-3 rounded-xl bg-card border text-sm font-medium"
              >
                ✓ {skill}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container py-8 mt-8 border-t">
        <p className="text-center text-sm text-muted-foreground">
          Made with 💜 for young writers everywhere
        </p>
      </footer>

      {/* Load Session Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load My Work</DialogTitle>
            <DialogDescription>
              Enter your 6-character save code to continue your writing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="e.g., ABC123"
              value={loadCode}
              onChange={(e) => setLoadCode(e.target.value.toUpperCase())}
              maxLength={6}
              disabled={loadSessionMutation.isPending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loadSessionMutation.isPending) {
                  handleLoadSession();
                }
              }}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowLoadDialog(false)}
                disabled={loadSessionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleLoadSession}
                disabled={loadSessionMutation.isPending || !loadCode.trim()}
                className="flex-1"
              >
                {loadSessionMutation.isPending ? "Loading..." : "Load Session"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
