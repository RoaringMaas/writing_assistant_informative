import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Loader2, PenLine, BookOpen, Star, Sparkles, History } from "lucide-react";

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  const createSession = trpc.writing.create.useMutation({
    onSuccess: (data) => {
      setLocation(`/write/${data.sessionId}`);
    },
  });

  const handleStartWriting = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    createSession.mutate();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

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
          
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/history")}
                  className="gap-2"
                >
                  <History className="w-4 h-4" />
                  My Writing
                </Button>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {user?.name?.charAt(0) || "S"}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{user?.name || "Student"}</span>
                </div>
              </>
            ) : (
              <Button onClick={() => window.location.href = getLoginUrl()}>
                Sign In
              </Button>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container py-12">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent-foreground mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Learn to Write Amazing Stories!</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 leading-tight">
            Become a{" "}
            <span className="text-primary">Super Writer</span>{" "}
            Today! ✨
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            I'll help you write amazing informational texts step by step. 
            It's easy and fun!
          </p>
          
          <Button
            size="lg"
            onClick={handleStartWriting}
            disabled={createSession.isPending}
            className="btn-fun text-lg px-8 py-6 gap-3"
          >
            {createSession.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Getting Ready...
              </>
            ) : (
              <>
                <PenLine className="w-5 h-5" />
                Start Writing!
              </>
            )}
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
    </div>
  );
}
