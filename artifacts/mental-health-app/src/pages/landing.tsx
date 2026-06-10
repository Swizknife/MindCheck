import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateSession } from "@workspace/api-client-react";
import { Sparkles, HeartPulse, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");

  const createSession = useCreateSession();

  const handleStart = () => {
    if (!name.trim()) return;
    
    createSession.mutate(
      {
        data: {
          name: name.trim(),
          age: age ? parseInt(age) : null,
          email: email.trim() || null,
        }
      },
      {
        onSuccess: (session) => {
          localStorage.setItem("mindcheck_session", session.id.toString());
          setLocation("/screening");
        }
      }
    );
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-4xl mx-auto w-full">
      <div className="text-center mb-10 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
          <HeartPulse className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground">
          Let's check in with <span className="text-primary">you.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          No judgment. No clinical jargon. Just a safe space to understand what's going on in your head right now.
        </p>
      </div>

      <Card className="w-full max-w-md glass-panel border-0 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-secondary" />
            Ready to start?
          </CardTitle>
          <CardDescription className="text-base">
            It's okay, this is a safe space. Tell us a bit about yourself.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">What should we call you?</Label>
            <Input 
              id="name" 
              placeholder="Your name or nickname" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl bg-white/50 dark:bg-black/50 border-white/20 focus-visible:ring-primary"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age" className="text-sm font-medium">Age (Optional)</Label>
              <Input 
                id="age" 
                type="number" 
                placeholder="18" 
                value={age} 
                onChange={(e) => setAge(e.target.value)}
                className="h-12 rounded-xl bg-white/50 dark:bg-black/50 border-white/20 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email (Optional)</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl bg-white/50 dark:bg-black/50 border-white/20 focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <Button 
              size="lg" 
              className="w-full h-14 rounded-xl text-lg font-medium shadow-lg hover:shadow-xl transition-all"
              disabled={!name.trim() || createSession.isPending}
              onClick={handleStart}
            >
              {createSession.isPending ? "Setting up a safe space..." : "Let's Go"}
            </Button>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4" />
              <span>Your responses are private and secure.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}