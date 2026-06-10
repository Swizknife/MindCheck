import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSubmitSession } from "@workspace/api-client-react";
import { HeartPulse, ArrowRight, ShieldAlert } from "lucide-react";
import { PHASE_1_QUESTIONS, ISSUE_MODULES, SAFETY_MODULE, LIKERT_OPTIONS, Question, Module, calculateScore } from "@/lib/screening-algorithm";

export default function ScreeningPage() {
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<number | null>(null);
  
  useEffect(() => {
    const id = localStorage.getItem("mindcheck_session");
    if (id) {
      setSessionId(parseInt(id));
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  const [answers, setAnswers] = useState<Record<string, number>>({});
  
  const [phase, setPhase] = useState<1 | 2 | 3>(1); // 1 = mood, 2 = modules, 3 = safety
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [activeModules, setActiveModules] = useState<Module[]>([]);
  
  const submitSession = useSubmitSession();

  const handleAnswer = (val: number) => {
    let currentQ: Question;
    if (phase === 1) {
      currentQ = PHASE_1_QUESTIONS[currentQuestionIndex];
    } else if (phase === 2) {
      currentQ = activeModules[currentModuleIndex].questions[currentQuestionIndex];
    } else {
      currentQ = SAFETY_MODULE.questions[currentQuestionIndex];
    }

    const newAnswers = { ...answers, [currentQ.id]: val };
    setAnswers(newAnswers);

    // Advance to next
    if (phase === 1) {
      if (currentQuestionIndex < PHASE_1_QUESTIONS.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        const moodScore = calculateScore(newAnswers, PHASE_1_QUESTIONS);
        if (moodScore >= 5) {
          setActiveModules(ISSUE_MODULES);
          setPhase(2);
          setCurrentModuleIndex(0);
          setCurrentQuestionIndex(0);
        } else {
          submit(newAnswers);
        }
      }
    } else if (phase === 2) {
      if (currentQuestionIndex < activeModules[currentModuleIndex].questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        if (currentModuleIndex < activeModules.length - 1) {
          setCurrentModuleIndex(prev => prev + 1);
          setCurrentQuestionIndex(0);
        } else {
          const depScore = calculateScore(newAnswers, ISSUE_MODULES.find(m => m.id === 'depression')?.questions || []);
          // Hopefulness is part of depression/mood usually, let's just use depression for safety check
          if (depScore > 7) {
            setPhase(3);
            setCurrentQuestionIndex(0);
          } else {
            submit(newAnswers);
          }
        }
      }
    } else if (phase === 3) {
      if (currentQuestionIndex < SAFETY_MODULE.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        submit(newAnswers);
      }
    }
  };

  const submit = (finalAnswers: Record<string, number>) => {
    if (!sessionId) return;
    const formatted = Object.entries(finalAnswers).map(([k, v]) => ({ questionId: k, score: v }));
    submitSession.mutate({ id: sessionId, data: { answers: formatted } }, {
      onSuccess: () => {
        setLocation(`/results/${sessionId}`);
      }
    });
  };

  let currentQuestion: Question | null = null;
  let progress = 0;
  let headerText = "Just checking in";
  
  if (phase === 1) {
    currentQuestion = PHASE_1_QUESTIONS[currentQuestionIndex];
    progress = (currentQuestionIndex / PHASE_1_QUESTIONS.length) * 20;
    headerText = "Universal Mood Check";
  } else if (phase === 2) {
    currentQuestion = activeModules[currentModuleIndex].questions[currentQuestionIndex];
    const totalModuleQs = activeModules.reduce((acc, m) => acc + m.questions.length, 0);
    const passedQs = activeModules.slice(0, currentModuleIndex).reduce((acc, m) => acc + m.questions.length, 0) + currentQuestionIndex;
    progress = 20 + (passedQs / totalModuleQs) * 75;
    headerText = activeModules[currentModuleIndex].name;
  } else if (phase === 3) {
    currentQuestion = SAFETY_MODULE.questions[currentQuestionIndex];
    progress = 95 + (currentQuestionIndex / SAFETY_MODULE.questions.length) * 5;
    headerText = "Safety Check";
  }

  if (!sessionId || !currentQuestion) return null;

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-3xl mx-auto w-full">
      {phase === 3 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6 flex items-start gap-3 animate-in slide-in-from-top-4">
          <ShieldAlert className="w-5 h-5 text-destructive mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">You're not alone.</p>
            <p className="text-sm text-destructive/80">If you're in distress, please call or text the Crisis Line at 988.</p>
          </div>
        </div>
      )}

      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground font-medium">
          <span className="bg-white/50 dark:bg-black/50 px-3 py-1 rounded-full">{headerText}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2 bg-white/50 dark:bg-black/50" />
      </div>

      <Card className="w-full glass-panel border-0 shadow-xl overflow-hidden relative">
        <CardContent className="p-8 md:p-12 min-h-[300px] flex flex-col justify-center animate-in fade-in zoom-in-95 duration-500" key={currentQuestion.id}>
          <h2 className="text-2xl md:text-3xl font-display font-medium text-center mb-12">
            {currentQuestion.text}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {LIKERT_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant="outline"
                className="h-auto py-4 px-2 flex flex-col items-center gap-2 rounded-2xl border-white/20 bg-white/40 dark:bg-black/40 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group"
                onClick={() => handleAnswer(opt.value)}
              >
                <div className="w-8 h-8 rounded-full bg-background/50 group-hover:bg-white/20 flex items-center justify-center text-xs font-bold">
                  {opt.value}
                </div>
                <span className="text-xs font-medium text-center whitespace-normal">{opt.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {submitSession.isPending && (
        <div className="text-center mt-8 text-muted-foreground animate-pulse">
          Analyzing your responses...
        </div>
      )}
    </div>
  );
}