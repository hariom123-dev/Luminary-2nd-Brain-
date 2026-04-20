import React, { useState, useRef, useEffect } from 'react';
import { 
  Paperclip, 
  Mic, 
  SendHorizonal, 
  Sparkles, 
  FileText, 
  Bookmark,
  Zap,
  CheckCircle2,
  Share2,
  Lightbulb,
  Maximize2,
  History,
  LayoutGrid,
  ChevronRight,
  ArrowUp
} from 'lucide-react';
import { ResearchSession, ChatMessage, Note, User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { generateQueryResponse } from '../ai';

interface ResearchProps {
  sessions: ResearchSession[];
  notes: Note[];
  user: User;
}

export const Research: React.FC<ResearchProps> = ({ sessions, notes, user }) => {
  const [activeSession, setActiveSession] = useState(sessions[0]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showConnection, setShowConnection] = useState(false);
  const [connectedNode, setConnectedNode] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession.messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setActiveSession(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));
    setInput('');
    setIsTyping(true);

    try {
      const context = notes.map(n => `Title: ${n.title}\nSummary: ${n.summary}`).join('\n\n');
      const text = await generateQueryResponse(input, context);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: text || "I'm sorry, I couldn't process that.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: notes.length > 0 ? [notes[Math.floor(Math.random() * notes.length)].id] : []
      };

      setActiveSession(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage]
      }));

      // Logic to trigger "Neural Connection" popup
      if (notes.length > 1) {
        const randomNote = notes[Math.floor(Math.random() * notes.length)];
        setConnectedNode(randomNote.title);
        setTimeout(() => setShowConnection(true), 1500);
        setTimeout(() => setShowConnection(false), 6500);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 relative overflow-hidden">
      <header className="h-20 bg-white border-b border-brand-border flex items-center justify-between px-10 shrink-0">
        <div className="flex flex-col">
          <h3 className="text-lg font-display font-bold text-brand-text truncate max-w-md">{activeSession.title}</h3>
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Neural Link Active
          </p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex -space-x-2 mr-4">
              {[1, 2].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 overflow-hidden">
                  {i === 1 ? <img src={user.avatar} className="w-full h-full" referrerPolicy="no-referrer" /> : 'AI'}
                </div>
              ))}
           </div>
           <button className="btn-secondary h-10 px-4 text-xs font-bold uppercase tracking-widest">
              <Share2 size={14} /> Neural Map
           </button>
           <button className="btn-secondary w-10 h-10 p-0">
              <History size={16} />
           </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-10 space-y-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {activeSession.messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex flex-col",
                msg.role === 'user' ? "items-end" : "items-start"
              )}
            >
              <div className="flex items-center gap-3 mb-2 px-2">
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-brand-primary flex items-center justify-center text-white">
                    <Sparkles size={14} fill="white" />
                  </div>
                )}
                <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">
                  {msg.role === 'user' ? 'Me' : 'Luminary AI'} • {msg.timestamp}
                </span>
              </div>
              
              <div className={cn(
                "max-w-2xl px-8 py-6 rounded-[2rem]",
                msg.role === 'user' 
                  ? "bg-brand-primary text-white rounded-tr-none shadow-xl shadow-brand-primary/20" 
                  : "bg-white border border-brand-border text-brand-text rounded-tl-none shadow-sm"
              )}>
                <div className="prose prose-slate max-w-none prose-sm leading-relaxed">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                
                {msg.role === 'user' && (
                  <div className="mt-4 flex justify-end">
                    <CheckCircle2 size={14} className="text-white/60" />
                    <span className="text-[9px] font-black uppercase tracking-widest ml-2 opacity-60">Synthesized</span>
                  </div>
                )}
              </div>

              {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                 <div className="mt-6 border-l-2 border-brand-primary/20 pl-8 space-y-6">
                    <div className="flex items-center gap-2 text-[10px] font-black text-brand-muted uppercase tracking-widest mb-4">
                       <LayoutGrid size={12} /> Referenced Memories
                    </div>
                    <div className="flex flex-wrap gap-4">
                       {msg.sources.map(sId => {
                         const sourceNote = notes.find(n => n.id === sId);
                         if (!sourceNote) return null;
                         return (
                           <motion.div 
                             key={sId}
                             whileHover={{ y: -2 }}
                             className="bg-white border border-brand-border rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-brand-primary/30 transition-all shadow-xs"
                           >
                             <div className="w-8 h-8 rounded-lg bg-brand-bg flex items-center justify-center text-brand-primary">
                               <FileText size={16} />
                             </div>
                             <div>
                               <p className="text-xs font-bold text-brand-text truncate w-40">{sourceNote.title}</p>
                               <p className="text-[9px] font-bold text-brand-muted uppercase tracking-widest">{sourceNote.topic}</p>
                             </div>
                           </motion.div>
                         );
                       })}
                    </div>
                 </div>
              )}
            </motion.div>
          ))}
          
          {isTyping && (
             <div className="flex flex-col items-start">
               <div className="flex items-center gap-3 mb-2 px-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-primary flex items-center justify-center text-white">
                    <Sparkles size={14} fill="white" />
                  </div>
                  <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest animate-pulse">
                    Scanning Neural Network...
                  </span>
               </div>
               <div className="w-20 h-10 bg-white border border-brand-border rounded-2xl flex items-center justify-center gap-1 shadow-sm">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="p-8 bg-linear-to-t from-slate-50 via-slate-50 to-transparent shrink-0">
        <div className="max-w-4xl mx-auto relative">
          <div className="card bg-white shadow-2xl p-4 flex flex-col gap-4">
             <div className="flex items-center gap-4">
                <button className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400">
                  <Paperclip size={20} />
                </button>
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Ask your Second Brain..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-brand-text font-medium text-lg placeholder:text-slate-300 resize-none py-2 h-14"
                />
                <button className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400">
                  <Mic size={20} />
                </button>
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                    input.trim() ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/30" : "bg-slate-100 text-slate-300"
                  )}
                >
                  <ArrowUp size={20} strokeWidth={3} />
                </button>
             </div>
             
             <div className="flex items-center gap-4 h-8 border-t border-brand-border pt-4 mt-2">
                <button className="text-[10px] font-bold text-brand-muted uppercase tracking-widest hover:text-brand-primary flex items-center gap-1.5">
                   <Zap size={12} className="text-brand-accent" /> ENHANCE PROMPT
                </button>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <button className="text-[10px] font-bold text-brand-muted uppercase tracking-widest hover:text-brand-primary flex items-center gap-1.5">
                   <Bookmark size={12} /> CITED MODE
                </button>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <button className="text-[10px] font-bold text-brand-muted uppercase tracking-widest hover:text-brand-primary flex items-center gap-1.5">
                   <LayoutGrid size={12} /> BENTO SUMMARY
                </button>
             </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showConnection && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.9, x: 20 }}
             animate={{ opacity: 1, scale: 1, x: 0 }}
             exit={{ opacity: 0, scale: 0.9, x: 20 }}
             className="absolute right-20 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
           >
              <div className="card p-6 bg-white shadow-2xl flex items-center gap-6 border-2 border-amber-100">
                 <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 relative">
                    <Lightbulb size={24} fill="currentColor" />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 rounded-full border-2 border-amber-400" 
                    />
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Neural Connection Found:</p>
                    <p className="text-sm font-bold text-brand-text truncate max-w-[180px]">{connectedNode}</p>
                    <div className="mt-2 w-full h-1 bg-amber-100 rounded-full overflow-hidden">
                       <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 4 }} className="h-full bg-amber-400" />
                    </div>
                 </div>
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
