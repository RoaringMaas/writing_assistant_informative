import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import {
  Loader2,
  PenLine,
  Home,
  Trash2,
  Eye,
  Calendar,
  FileText,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SessionHistory() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: sessions, isLoading, refetch } = trpc.writing.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  const deleteMutation = trpc.writing.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Writing deleted! 🗑️");
    },
    onError: () => {
      toast.error("Couldn't delete. Try again!");
    },
  });
  
  const createSession = trpc.writing.create.useMutation({
    onSuccess: (data) => {
      setLocation(`/write/${data.sessionId}`);
    },
  });
  
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
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Card className="card-playful max-w-md text-center">
          <CardHeader>
            <CardTitle>Sign In First! 🔐</CardTitle>
            <CardDescription>
              You need to sign in to see your writing history.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => window.location.href = getLoginUrl()} className="w-full">
              Sign In
            </Button>
            <Button variant="outline" onClick={() => setLocation("/")} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[var(--success)] text-[var(--success-foreground)]">
            ✓ Completed
          </span>
        );
      case "reviewed":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
            ⭐ Reviewed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[var(--warning)] text-[var(--warning-foreground)]">
            ✏️ In Progress
          </span>
        );
    }
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="container py-6">
        <nav className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation("/")} className="gap-2">
            <Home className="w-4 h-4" />
            Home
          </Button>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {user?.name?.charAt(0) || "S"}
              </span>
            </div>
            <span className="text-sm font-medium">{user?.name || "Student"}</span>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container py-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Writing 📚</h1>
            <p className="text-muted-foreground mt-1">
              All your writing projects in one place
            </p>
          </div>
          
          <Button
            onClick={() => createSession.mutate()}
            disabled={createSession.isPending}
            className="btn-fun gap-2"
          >
            {createSession.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PenLine className="w-4 h-4" />
            )}
            New Writing
          </Button>
        </div>
        
        {sessions && sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card key={session.id} className="card-playful hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                        <h3 className="text-lg font-bold truncate">
                          {session.title || session.topic || "Untitled Writing"}
                        </h3>
                        {getStatusBadge(session.status)}
                      </div>
                      
                      {session.topic && session.topic !== session.title && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Topic: {session.topic}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(session.createdAt)}
                        </span>
                        <span>Step {session.currentStep} of 5</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/write/${session.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {session.status === "in_progress" ? "Continue" : "View"}
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertCircle className="w-5 h-5 text-destructive" />
                              Delete this writing?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{session.title || session.topic || "this writing"}". 
                              You can't undo this!
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate({ sessionId: session.id })}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="card-playful text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-bold mb-2">No writing yet!</h3>
              <p className="text-muted-foreground mb-6">
                Start your first writing project and become a super writer!
              </p>
              <Button
                onClick={() => createSession.mutate()}
                disabled={createSession.isPending}
                className="btn-fun"
              >
                {createSession.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <PenLine className="w-4 h-4 mr-2" />
                )}
                Start Writing!
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
