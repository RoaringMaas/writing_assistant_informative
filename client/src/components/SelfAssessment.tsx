import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";

interface SelfAssessmentProps {
  sessionId: number;
  criterion: "titleSubtitles" | "hook" | "relevantInfo" | "transitions" | "accuracy" | "vocabulary";
  label: string;
  currentSelfScore: number | null;
  currentTeacherScore: number | null;
  aiScore: number;
  feedback: string;
  isTeacher?: boolean;
  onUpdate?: () => void;
}

const criteriaDescriptions: Record<string, { 3: string; 2: string; 1: string }> = {
  titleSubtitles: {
    3: "Clear, relevant title that tells what the writing is about",
    2: "Title is there but could be better",
    1: "Missing or doesn't match the topic",
  },
  hook: {
    3: "Grabs attention and makes readers want to read more",
    2: "Starts okay but could be more interesting",
    1: "Doesn't catch the reader's attention",
  },
  relevantInfo: {
    3: "Lots of good facts and details about the topic",
    2: "Some facts but needs more details",
    1: "Not enough information about the topic",
  },
  transitions: {
    3: "Ideas flow smoothly with connecting words",
    2: "Some connecting words but could be smoother",
    1: "Ideas feel choppy and disconnected",
  },
  accuracy: {
    3: "Very few spelling or grammar mistakes",
    2: "Some mistakes but still easy to read",
    1: "Many mistakes that make it hard to read",
  },
  vocabulary: {
    3: "Uses interesting and varied words",
    2: "Uses basic words, could try more variety",
    1: "Uses very simple or wrong words",
  },
};

export function SelfAssessment({
  sessionId,
  criterion,
  label,
  currentSelfScore,
  currentTeacherScore,
  aiScore,
  feedback,
  isTeacher = false,
  onUpdate,
}: SelfAssessmentProps) {
  const [selectedScore, setSelectedScore] = useState<number | null>(
    isTeacher ? currentTeacherScore : currentSelfScore
  );
  const [isEditing, setIsEditing] = useState(false);
  
  const updateSelfMutation = trpc.writing.updateSelfAssessment.useMutation({
    onSuccess: () => {
      toast.success("Score saved! ⭐");
      setIsEditing(false);
      onUpdate?.();
    },
    onError: () => {
      toast.error("Couldn't save score. Try again!");
    },
  });
  
  const updateTeacherMutation = trpc.writing.updateTeacherScore.useMutation({
    onSuccess: () => {
      toast.success("Teacher score saved! ✓");
      setIsEditing(false);
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error.message || "Couldn't save score. Try again!");
    },
  });
  
  const handleSave = () => {
    if (selectedScore === null) {
      toast.error("Please select a score first!");
      return;
    }
    
    if (isTeacher) {
      updateTeacherMutation.mutate({
        sessionId,
        criterion,
        score: selectedScore,
      });
    } else {
      updateSelfMutation.mutate({
        sessionId,
        criterion,
        score: selectedScore,
      });
    }
  };
  
  const isPending = updateSelfMutation.isPending || updateTeacherMutation.isPending;
  const descriptions = criteriaDescriptions[criterion];
  
  return (
    <Card className="card-playful">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{label}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">AI Score:</span>
            <span className={`score-badge score-${aiScore}`}>
              {aiScore === 3 ? "⭐" : aiScore === 2 ? "👍" : "💪"} {aiScore}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{feedback}</p>
      </CardHeader>
      <CardContent>
        {/* Score selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">
              {isTeacher ? "Teacher Score:" : "How do you think you did?"}
            </span>
            {(isTeacher ? currentTeacherScore : currentSelfScore) !== null && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-xs"
              >
                Change
              </Button>
            )}
          </div>
          
          {(isEditing || (isTeacher ? currentTeacherScore : currentSelfScore) === null) ? (
            <>
              <div className="grid gap-2">
                {[3, 2, 1].map((score) => (
                  <button
                    key={score}
                    onClick={() => setSelectedScore(score)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      selectedScore === score
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`score-badge score-${score}`}>
                        {score === 3 ? "⭐" : score === 2 ? "👍" : "💪"} {score}
                      </span>
                      <span className="text-sm">{descriptions?.[score as 1 | 2 | 3]}</span>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2">
                {isEditing && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedScore(isTeacher ? currentTeacherScore : currentSelfScore);
                    }}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={isPending || selectedScore === null}
                  className="flex-1"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Star className="w-4 h-4 mr-2" />
                  )}
                  Save My Score
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/50">
              <span className="text-sm text-muted-foreground">
                {isTeacher ? "Teacher gave:" : "You gave yourself:"}
              </span>
              <span className={`score-badge score-${isTeacher ? currentTeacherScore : currentSelfScore}`}>
                {(isTeacher ? currentTeacherScore : currentSelfScore) === 3
                  ? "⭐"
                  : (isTeacher ? currentTeacherScore : currentSelfScore) === 2
                  ? "👍"
                  : "💪"}{" "}
                {isTeacher ? currentTeacherScore : currentSelfScore}
              </span>
            </div>
          )}
        </div>
        
        {/* Show both scores if available */}
        {currentSelfScore !== null && currentTeacherScore !== null && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Self:</span>
              <span className={`score-badge score-${currentSelfScore}`}>{currentSelfScore}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Teacher:</span>
              <span className={`score-badge score-${currentTeacherScore}`}>{currentTeacherScore}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">AI:</span>
              <span className={`score-badge score-${aiScore}`}>{aiScore}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
