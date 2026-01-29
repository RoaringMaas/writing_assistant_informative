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
  const loadMutation = trpc.loadSessionByCodeAnonymous.useMutation();

  const handleStartWriting = () => {
    const session = createSession();
    setLocation(`/write/${session.sessionId}`);
  };

  const handleLoadSession = () => {
    if (!loadCode.trim()) {
      toast.error("Please enter a save code");
      return;
    }

    loadMutation.mutate(
      { saveCode: loadCode.trim().toUpperCase() },
      {
        onSuccess: (result: any) => {
          if (!result.success || !result.data) {
            toast.error(result.message || "Failed to load session");
            return;
          }

          const sessionToStore = {
            sessionId: result.data.sessionId || "",
            studentName: result.data.studentName || "",
            topic: result.data.topic || "",
            title: result.data.title || "",
            hook: result.data.hook || "",
            bodyParagraphs: result.data.bodyParagraphs || [],
            conclusion: result.data.conclusion || "",
            currentStep: result.data.currentStep || 1,
            overallScores: result.data.overallScores || null,
            overallFeedback: result.data.overallFeedback || null,
            selfAssessment: result.data.selfAssessment || null,
            createdAt: result.data.createdAt || new Date().toISOString(),
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
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Writing Assistant</h1>
          <p className="text-xl text-gray-600">Improve your writing skills with instant feedback</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenLine className="w-5 h-5" />
                Start Writing
              </CardTitle>
              <CardDescription>Begin a new writing session</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Create a new article and get instant feedback on your writing.</p>
              <Button onClick={handleStartWriting} className="w-full">
                Start Writing
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Load My Work
              </CardTitle>
              <CardDescription>Continue a previous session</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Enter your save code to continue working on your article.</p>
              <Button onClick={() => setShowLoadDialog(true)} variant="outline" className="w-full">
                Load My Work
              </Button>
            </CardContent>
          </Card>
        </div>

        <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Load Your Work</DialogTitle>
              <DialogDescription>Enter the save code from your previous session</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Enter your save code"
                value={loadCode}
                onChange={(e) => setLoadCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loadMutation.isPending) {
                    handleLoadSession();
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowLoadDialog(false)}
                  disabled={loadMutation.isPending}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleLoadSession}
                  disabled={loadMutation.isPending || !loadCode.trim()}
                  className="flex-1"
                >
                  {loadMutation.isPending ? "Loading..." : "Load Session"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
