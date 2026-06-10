import { useState, useRef, useEffect } from "react";
import { useRoute, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetOpenaiConversation, useListOpenaiMessages, useCreateOpenaiConversation } from "@workspace/api-client-react";
import { Send, Sparkles, Loader2, ArrowLeft, FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ChatPage() {
  const [, params] = useRoute("/chat/:conversationId");
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const sessionId = searchParams.get('sessionId') ? parseInt(searchParams.get('sessionId')!) : null;
  const [, setLocation] = useLocation();

  const conversationIdStr = params?.conversationId;
  const isNew = !conversationIdStr || conversationIdStr === 'new';
  const conversationId = isNew ? null : parseInt(conversationIdStr);

  const [localMessages, setLocalMessages] = useState<Array<{role: string, content: string, id: number}>>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const createConv = useCreateOpenaiConversation();
  
  const { data: conversation } = useGetOpenaiConversation(conversationId!, {
    query: { enabled: !!conversationId, queryKey: ['conv', conversationId] }
  });

  const { data: serverMessages } = useListOpenaiMessages(conversationId!, {
    query: { enabled: !!conversationId, queryKey: ['messages', conversationId] }
  });

  useEffect(() => {
    if (serverMessages) {
      setLocalMessages(serverMessages);
    }
  }, [serverMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages, isStreaming]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    
    const userMsg = input.trim();
    setInput("");
    
    let activeConvId = conversationId;

    if (!activeConvId) {
      const conv = await createConv.mutateAsync({ data: { title: "MindBot Session" } });
      activeConvId = conv.id;
      setLocation(`/chat/${conv.id}${sessionId ? `?sessionId=${sessionId}` : ''}`);
      // Wait for redirect to take effect ideally, but we can proceed
    }

    const tempId = Date.now();
    setLocalMessages(prev => [...prev, { id: tempId, role: 'user', content: userMsg }]);
    setIsStreaming(true);

    try {
      const response = await fetch(`/api/openai/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMsg, sessionId })
      });

      if (!response.body) throw new Error("No body");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let botMsgContent = "";
      const botTempId = Date.now() + 1;
      setLocalMessages(prev => [...prev, { id: botTempId, role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                botMsgContent += data.content;
                setLocalMessages(prev => 
                  prev.map(m => m.id === botTempId ? { ...m, content: botMsgContent } : m)
                );
              }
            } catch (e) {
              console.error("SSE parse error", e);
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100dvh-4rem)] max-w-4xl mx-auto w-full p-4">
      <div className="flex items-center justify-between mb-4 glass-panel p-4 rounded-2xl">
        <Button variant="ghost" size="sm" onClick={() => sessionId ? setLocation(`/results/${sessionId}`) : setLocation('/')} className="rounded-xl">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-display font-medium text-lg">MindBot</span>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl border-white/20">
          <FileText className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Generate PDF</span>
        </Button>
      </div>

      <div className="flex-1 glass-panel rounded-3xl mb-4 overflow-hidden flex flex-col shadow-xl border-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {localMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <Sparkles className="w-12 h-12 mb-4" />
              <p className="text-lg">I'm here to listen. How are you feeling right now?</p>
            </div>
          )}
          
          {localMessages.map((msg, i) => (
            <div key={msg.id || i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <Avatar className="w-8 h-8 mt-1 border border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs"><Sparkles className="w-4 h-4"/></AvatarFallback>
                </Avatar>
              )}
              
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-md' 
                  : 'bg-white/60 dark:bg-black/60 border border-white/20 rounded-tl-sm shadow-sm'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>

              {msg.role === 'user' && (
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">Me</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isStreaming && !localMessages.find(m => m.content === '' && m.role === 'assistant') && (
             <div className="flex gap-3 justify-start">
               <Avatar className="w-8 h-8 mt-1 border border-primary/20">
                 <AvatarFallback className="bg-primary/10 text-primary text-xs"><Sparkles className="w-4 h-4"/></AvatarFallback>
               </Avatar>
               <div className="bg-white/60 dark:bg-black/60 border border-white/20 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex gap-1 items-center">
                 <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" />
                 <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]" />
                 <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
               </div>
             </div>
          )}
        </div>

        <div className="p-4 bg-white/40 dark:bg-black/40 border-t border-white/10">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2 relative"
          >
            <Input 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isStreaming}
              className="h-14 rounded-2xl bg-white/50 dark:bg-black/50 border-white/20 pr-14 text-base focus-visible:ring-primary shadow-inner"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim() || isStreaming}
              className="absolute right-2 top-2 h-10 w-10 rounded-xl"
            >
              {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}