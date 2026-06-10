import { useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useGetSession, useGenerateReport, ScreeningResult } from "@workspace/api-client-react";
import { generateReportPdf } from "@/lib/pdf-generator";
import { Heart, MessageCircle, FileText, AlertTriangle, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ResultsPage() {
  const [, params] = useRoute("/results/:sessionId");
  const sessionId = params?.sessionId ? parseInt(params.sessionId) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: session, isLoading, error } = useGetSession(sessionId, {
    query: { enabled: !!sessionId, queryKey: ['session', sessionId] }
  });

  const generateReport = useGenerateReport();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Heart className="w-8 h-8 text-primary animate-bounce" />
          <p className="text-muted-foreground">Preparing your insights...</p>
        </div>
      </div>
    );
  }

  if (error || !session || !session.results) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full glass-panel">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Something went wrong</h2>
            <p className="text-muted-foreground">We couldn't load your results.</p>
            <Button onClick={() => setLocation("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const results = session.results as unknown as ScreeningResult;

  const handleGenerateReport = () => {
    generateReportPdf(session);
    generateReport.mutate({ id: sessionId }, {
      onSuccess: () => {
        toast({ title: "Report generated", description: "Your PDF has been downloaded and sent securely." });
      }
    });
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "High Risk": return "text-destructive border-destructive/20 bg-destructive/10";
      case "Needs Attention": return "text-orange-600 border-orange-500/20 bg-orange-500/10 dark:text-orange-400";
      case "Keep an Eye On It": return "text-yellow-600 border-yellow-500/20 bg-yellow-500/10 dark:text-yellow-400";
      default: return "text-emerald-600 border-emerald-500/20 bg-emerald-500/10 dark:text-emerald-400";
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Hey {session.name}, here's where you're at.</h1>
          <p className="text-muted-foreground text-lg">Thank you for being honest. It takes courage.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleGenerateReport} className="rounded-xl border-white/20 bg-white/40 dark:bg-black/40 backdrop-blur-md">
            <FileText className="w-4 h-4 mr-2" />
            Generate My Report
          </Button>
          <Link href={`/chat/${session.conversationId || 'new'}?sessionId=${session.id}`}>
            <Button className="rounded-xl shadow-lg">
              <MessageCircle className="w-4 h-4 mr-2" />
              Talk to MindBot
            </Button>
          </Link>
        </div>
      </div>

      {results.safetyAlert && (
        <div className="bg-destructive/10 border-l-4 border-destructive p-6 rounded-r-2xl animate-in slide-in-from-left-4">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />
            <div>
              <h3 className="font-bold text-destructive text-lg">We noticed you're in a tough spot</h3>
              <p className="text-destructive/80 mt-1">Some of your answers indicate you might be thinking about self-harm. You matter, and there is help available right now.</p>
              <div className="mt-4 flex gap-4">
                <Button variant="destructive" className="rounded-xl font-bold">Call 988</Button>
                <Button variant="outline" className="rounded-xl border-destructive/20 text-destructive hover:bg-destructive/20">Text HOME to 741741</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 glass-panel border-0 shadow-xl overflow-hidden flex flex-col justify-center items-center text-center p-8">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Overall Vibe</h3>
          <div className={`text-3xl font-display font-bold px-6 py-3 rounded-2xl border ${getRiskColor(results.riskLevel)} mb-4`}>
            {results.riskLevel}
          </div>
          <p className="text-muted-foreground">Based on your responses across all modules.</p>
        </Card>

        <Card className="md:col-span-2 glass-panel border-0 shadow-xl overflow-hidden">
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Small steps you can take today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/40 dark:bg-black/40 p-4 rounded-2xl border border-white/10">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-sm font-bold mt-0.5">{i + 1}</div>
                <p className="text-foreground/90">{rec}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-display font-bold">The Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.modules.map(m => (
            <Card key={m.name} className="glass-panel border-0 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg">{m.name}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getRiskColor(m.riskLevel)}`}>
                    {m.riskLevel}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Score</span>
                    <span className="font-medium">{m.score} / {m.maxScore}</span>
                  </div>
                  <div className="h-2 w-full bg-white/50 dark:bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000" 
                      style={{ width: `${m.riskPercent}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}