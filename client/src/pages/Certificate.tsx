import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useParams, useLocation } from "wouter";
import { Download, Home, Award, Star } from "lucide-react";

export default function Certificate() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [, setLocation] = useLocation();

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 p-4 md:p-8">
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
          Print Certificate
        </Button>
      </div>

      {/* Certificate */}
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 md:p-16 bg-white shadow-2xl certificate-paper relative overflow-hidden">
          {/* Decorative border */}
          <div className="absolute inset-4 border-4 border-double border-primary/30 rounded-lg pointer-events-none" />
          
          {/* Decorative corner stars */}
          <div className="absolute top-8 left-8 text-primary opacity-20">
            <Star className="w-12 h-12 fill-current" />
          </div>
          <div className="absolute top-8 right-8 text-primary opacity-20">
            <Star className="w-12 h-12 fill-current" />
          </div>
          <div className="absolute bottom-8 left-8 text-primary opacity-20">
            <Star className="w-12 h-12 fill-current" />
          </div>
          <div className="absolute bottom-8 right-8 text-primary opacity-20">
            <Star className="w-12 h-12 fill-current" />
          </div>

          {/* Content */}
          <div className="relative z-10 text-center space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <Award className="w-20 h-20 mx-auto text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold text-primary">
                Certificate of Achievement
              </h1>
              <div className="h-1 w-32 bg-gradient-to-r from-primary to-accent mx-auto rounded-full" />
            </div>

            {/* Main text */}
            <div className="space-y-6 py-8">
              <p className="text-xl text-muted-foreground">This certifies that</p>
              
              <div className="py-4 px-8 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg inline-block">
                <p className="text-3xl md:text-4xl font-bold text-primary">
                  Young Writer
                </p>
              </div>

              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                has successfully completed an informational writing project with{" "}
                <span className="font-bold text-primary">outstanding excellence</span>,
                earning a perfect score and demonstrating mastery of:
              </p>

              {/* Skills list */}
              <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left py-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">Engaging Hooks</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">Clear Organization</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">Relevant Information</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">Smooth Transitions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">Accurate Writing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">Rich Vocabulary</span>
                </div>
              </div>

              <div className="pt-6">
                <p className="text-2xl font-bold text-primary">
                  🏆 Informational Text Expert 🏆
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-8 space-y-4">
              <p className="text-sm text-muted-foreground">Awarded on</p>
              <p className="text-lg font-semibold">{currentDate}</p>
              
              <div className="pt-6 flex justify-center gap-16">
                <div className="text-center">
                  <div className="h-px w-32 bg-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">Teacher Signature</p>
                </div>
                <div className="text-center">
                  <div className="h-px w-32 bg-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">Date</p>
                </div>
              </div>
            </div>

            {/* Seal */}
            <div className="pt-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Star className="w-12 h-12 text-white fill-current" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <style>{`
        @media print {
          body {
            background: white !important;
          }
          .certificate-paper {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 3rem !important;
            page-break-after: avoid;
          }
        }
        
        @keyframes gentle-pulse {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.3;
          }
        }
        
        .certificate-paper .absolute.opacity-20 {
          animation: gentle-pulse 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
