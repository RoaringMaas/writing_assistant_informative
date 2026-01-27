import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Loader2, Home, Download, Sparkles } from "lucide-react";
import { getSession, type WritingSession } from "@/lib/sessionManager";

export default function ArticleDisplay() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<WritingSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadedSession = getSession();
    if (loadedSession && loadedSession.sessionId === sessionId) {
      setSession(loadedSession);
    }
    setLoading(false);
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Session not found</p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      {/* Header - hidden when printing */}
      <div className="print:hidden max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setLocation("/")}
          className="gap-2"
        >
          <Home className="w-4 h-4" />
          Home
        </Button>
        <Button onClick={handlePrint} className="gap-2">
          <Download className="w-4 h-4" />
          Print Article
        </Button>
      </div>

      {/* Paper-like article display */}
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 md:p-12 bg-white shadow-2xl article-paper">
          {/* Decorative header */}
          <div className="text-center mb-8 pb-6 border-b-2 border-primary/20">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-6 h-6 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold text-primary">
                {session.title || "My Article"}
              </h1>
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              By Young Writer • {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Introduction */}
          {session.hook && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-3 flex items-center gap-2">
                <span className="text-2xl">🎣</span>
                Introduction
              </h2>
              <p className="text-lg leading-relaxed indent-8">{session.hook}</p>
            </div>
          )}

          {/* Body Paragraphs */}
          {session.bodyParagraphs && session.bodyParagraphs.length > 0 && (
            <div className="mb-8 space-y-6">
              <h2 className="text-xl font-semibold text-primary mb-3 flex items-center gap-2">
                <span className="text-2xl">📚</span>
                Main Ideas
              </h2>
              {session.bodyParagraphs.map((para, index) => (
                <div key={para.id} className="space-y-2">
                  {para.topicSentence && (
                    <p className="text-lg leading-relaxed indent-8 font-medium">
                      {para.topicSentence}
                    </p>
                  )}
                  {para.supportingDetails && (
                    <p className="text-lg leading-relaxed indent-8">
                      {para.supportingDetails}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Conclusion */}
          {session.conclusion && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-3 flex items-center gap-2">
                <span className="text-2xl">🎁</span>
                Conclusion
              </h2>
              <p className="text-lg leading-relaxed indent-8">{session.conclusion}</p>
            </div>
          )}

          {/* Decorative footer */}
          <div className="mt-12 pt-6 border-t-2 border-primary/20 text-center">
            <p className="text-sm text-muted-foreground italic">
              ✨ Written with care and creativity ✨
            </p>
          </div>
        </Card>
      </div>

      <style>{`
        @media print {
          body {
            background: white !important;
          }
          .article-paper {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 2rem !important;
          }
        }
        
        .indent-8 {
          text-indent: 2rem;
        }
      `}</style>
    </div>
  );
}
