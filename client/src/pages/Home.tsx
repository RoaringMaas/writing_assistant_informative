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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <PenLine className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Writing Helper</h1>
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
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-block px-4 py-2 rounded-full bg-accent/20 text-accent-foreground text-sm font-medium">
            ✨ Learn to Write Amazing Stories!
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold text-foreground">
            Become a <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">Super Writer</span> Today! <span className="text-4xl">✨</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            I'll help you write amazing informational texts step by step.
          </p>
          
          <Button
            onClick={handleStartWriting}
            size="lg"
            className="gap-2 text-lg h-12 px-8"
          >
            <PenLine className="w-5 h-5" />
            Start Writing!
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Step by Step */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Step by Step</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                I'll guide you through each part of your writing
              </CardDescription>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">1</span>
                  <span>Pick your topic</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">2</span>
                  <span>Write a hook</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Get Stars */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Get Stars!</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Earn points for great writing
              </CardDescription>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 font-bold text-xs">⭐ 3</span>
                  <span className="text-muted-foreground">Amazing work!</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-bold text-xs">⭐ 2</span>
                  <span className="text-muted-foreground">Good job!</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Get Help */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Get Help!</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                I'll give you tips when you need them
              </CardDescription>
              <div className="mt-4 p-3 rounded-lg bg-purple-50 border border-purple-200">
                <p className="text-sm font-semibold text-purple-900 mb-1">💡 Helpful Tip:</p>
                <p className="text-sm text-purple-800">
                  "Start with a question to grab your reader's attention!"
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
