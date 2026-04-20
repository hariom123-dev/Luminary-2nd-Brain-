import React, { useState } from 'react';
import { 
  Zap, 
  TrendingUp, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Mic, 
  ArrowRight,
  Sparkles,
  BookOpen,
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  Activity,
  Bookmark,
  Loader2,
  Trash2
} from 'lucide-react';
import { Note, Insight, User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { processCapture, generateInsights } from '../ai';
import { saveNote, deleteNote, saveInsight, clearOldInsights } from '../firebase';

interface DashboardProps {
  user: User;
  notes: Note[];
  insights: Insight[];
}

export const Dashboard: React.FC<DashboardProps> = ({ user, notes, insights }) => {
  const [quickCapture, setQuickCapture] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshingInsights, setIsRefreshingInsights] = useState(false);

  const handleProcessThought = async () => {
    if (!quickCapture.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      const processed = await processCapture(quickCapture);
      await saveNote(user.id!, {
        title: processed.title,
        content: quickCapture,
        summary: processed.summary,
        topic: processed.topic,
        type: quickCapture.trim().startsWith('http') ? 'article' : 'note',
        tags: processed.tags,
        linkedNodes: []
      });
      setQuickCapture('');
      
      // Auto-trigger insights update if we have enough notes
      if (notes.length > 0 && notes.length % 3 === 0) {
        refreshInsights();
      }
    } catch (err) {
      console.error("Processing failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const refreshInsights = async () => {
    if (isRefreshingInsights || notes.length < 2) return;
    setIsRefreshingInsights(true);
    try {
      const newInsights = await generateInsights(notes);
      if (newInsights.length > 0) {
        await clearOldInsights(user.id!);
        for (const ins of newInsights) {
          await saveInsight(user.id!, ins);
        }
      }
    } catch (err) {
      console.error("Insight generation failed:", err);
    } finally {
      setIsRefreshingInsights(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (confirm("Permanently archive this synthesis?")) {
      await deleteNote(user.id!, noteId);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-brand-bg px-10 pb-20">
      <div className="pt-10 mb-12">
        <p className="text-[10px] font-bold text-brand-accent uppercase tracking-[0.25em] mb-2">Neural Dashboard</p>
        <div className="flex items-start justify-between">
          <h2 className="text-6xl font-display font-semibold text-brand-text leading-tight">
            Good Morning,<br />
            <span className="text-brand-primary">{user.name.split(' ')[0]}.</span>
          </h2>
          
          <div className="flex gap-4">
            <StatCard label="SYNAPSES" value={(notes.length * 42).toLocaleString()} icon={<Zap size={18} fill="currentColor" />} color="text-brand-primary bg-brand-secondary/10" />
            <StatCard label="EFFICIENCY" value={`${Math.min(100, Math.round((notes.length / 10) * 100))}%`} icon={<TrendingUp size={18} />} color="text-brand-primary bg-brand-secondary/10" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-12">
          {/* Quick Capture */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-white shadow-xl shadow-brand-primary/5 p-10 group"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center">
                <FileText size={20} />
              </div>
              <h3 className="text-xl font-display font-bold text-brand-text">Quick Capture</h3>
            </div>
            
            <textarea 
              value={quickCapture}
              onChange={(e) => setQuickCapture(e.target.value)}
              disabled={isProcessing}
              placeholder="Paste a link, jot a thought, or upload a research paper..."
              className="w-full h-40 bg-brand-bg/50 border border-brand-border rounded-3xl p-6 text-lg font-medium focus:outline-hidden focus:bg-white focus:border-brand-primary transition-all resize-none mb-6"
            />
            
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button className="btn-secondary px-4 py-2 bg-brand-bg/50 border-none text-[11px] font-bold uppercase tracking-widest text-brand-muted hover:text-brand-primary">
                  <LinkIcon size={14} /> URL
                </button>
                <button className="btn-secondary px-4 py-2 bg-brand-bg/50 border-none text-[11px] font-bold uppercase tracking-widest text-brand-muted hover:text-brand-primary">
                  <ImageIcon size={14} /> IMAGE
                </button>
                <button className="btn-secondary px-4 py-2 bg-brand-bg/50 border-none text-[11px] font-bold uppercase tracking-widest text-brand-muted hover:text-brand-primary">
                  <Mic size={14} /> AUDIO
                </button>
              </div>
              
              <button 
                onClick={handleProcessThought}
                disabled={!quickCapture.trim() || isProcessing}
                className="btn-primary px-8 h-12 shadow-md shadow-brand-primary/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm font-bold uppercase tracking-widest">Analyzing...</span>
                  </>
                ) : (
                  <span className="text-sm font-bold uppercase tracking-widest">Process Thought</span>
                )}
              </button>
            </div>
          </motion.div>

          {/* Recent Syntheses */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-display font-bold text-brand-text">Recent Syntheses</h3>
              <button className="text-brand-primary text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1">
                View All Library <ChevronRight size={14} />
              </button>
            </div>
            
            <div className="space-y-8">
              {notes.length === 0 ? (
                <div className="card bg-white p-12 text-center text-brand-muted border-dashed">
                  <Sparkles size={32} className="mx-auto mb-4 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">No syntheses yet. Capture a thought to begin.</p>
                </div>
              ) : (
                notes.map((note, idx) => (
                  <SynthesisCard key={note.id} note={note} index={idx} onDelete={() => handleDelete(note.id!)} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-10">
          {/* AI Insights */}
          <div className="card border-none bg-brand-surface shadow-sm space-y-8">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-highlight/20 text-brand-accent flex items-center justify-center">
                    <Sparkles size={20} fill="currentColor" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-brand-text">AI Insights</h3>
                </div>
                <button 
                  onClick={refreshInsights}
                  disabled={isRefreshingInsights || notes.length < 2}
                  className="text-[10px] font-bold text-brand-primary uppercase tracking-widest hover:underline disabled:opacity-30"
                >
                  {isRefreshingInsights ? 'Analyzing...' : 'Refresh'}
                </button>
             </div>
             
             <div className="space-y-6">
                {insights.length === 0 ? (
                  <p className="text-xs font-bold text-brand-muted text-center py-4">Luminary is analyzing your network...</p>
                ) : (
                  insights.map((insight, idx) => (
                    <InsightItem key={insight.id} insight={insight} />
                  ))
                )}
             </div>
          </div>

          {/* Memory Reinforcement */}
          <div className="card p-8 bg-brand-primary text-white overflow-hidden relative group cursor-pointer hover:bg-brand-primary/90 transition-all border-none">
             <div className="relative z-10">
               <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-xl bg-white/10 text-brand-highlight flex items-center justify-center">
                   <Activity size={20} />
                 </div>
                 <p className="text-xs font-bold uppercase tracking-widest text-white/60">Memory Reinforcement</p>
               </div>
               <h4 className="text-xl font-display font-medium mb-4 pr-10">
                 {notes.length > 5 ? "You haven't reviewed 'Quantum Ethics' in 14 days." : "Start capturing metadata to build your neural network."}
               </h4>
               <button className="flex items-center gap-2 text-[10px] font-black text-brand-highlight uppercase tracking-[0.2em] group-hover:gap-3 transition-all">
                 Reinforce Memory <ArrowRight size={12} />
               </button>
             </div>
             <div className="absolute right-0 bottom-0 opacity-10 blur-xl pointer-events-none transform translate-x-10 translate-y-10 group-hover:scale-110 transition-transform">
                <Brain size={160} />
             </div>
          </div>

          <button className="w-full h-16 bg-brand-accent text-white rounded-[1.5rem] flex items-center justify-center gap-3 font-bold text-sm tracking-wide hover:opacity-90 transition-all shadow-xl shadow-brand-accent/20">
             <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
             Consult Luminary AI
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) => (
  <div className="bg-white border border-brand-border rounded-2xl flex items-center p-4 gap-4 shadow-xs min-w-[140px]">
    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-black text-brand-muted uppercase tracking-[0.1em]">{label}</p>
      <p className="text-xl font-display font-bold text-brand-text -mt-1">{value}</p>
    </div>
  </div>
);

const SynthesisCard = ({ note, index, onDelete }: { note: Note, index: number, onDelete: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    className="card bg-white shadow-xs p-10 flex flex-col md:flex-row gap-10 group cursor-pointer hover:shadow-lg hover:border-brand-primary/30 transition-all"
  >
    <div className="w-full md:w-80 h-64 rounded-[2rem] overflow-hidden bg-brand-bg relative shrink-0">
      <img 
        src={`https://images.unsplash.com/photo-${index % 2 === 0 ? '1614741480742-ac749ad7db1a' : '1550751827-4bd374c3f58b'}?q=80&w=800&auto=format&fit=crop`} 
        alt={note.title} 
        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" 
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
      <div className="absolute top-6 left-6 flex gap-2">
        <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-widest">{note.topic}</span>
      </div>
    </div>
    
    <div className="flex-1 py-2 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">{note.date || 'Just now'}</span>
        <div className="flex items-center gap-3">
          <button className="text-brand-muted hover:text-brand-primary transition-colors">
            <Bookmark size={18} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-brand-muted hover:text-red-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      
      <h4 className="text-3xl font-display font-bold text-brand-text mb-6 leading-tight group-hover:text-brand-primary transition-colors line-clamp-2">
        {note.title}
      </h4>
      
      <p className="text-brand-muted text-lg leading-relaxed mb-8 flex-1 line-clamp-3">
        {note.content}
      </p>
      
      <div className="flex items-center gap-6 mt-auto">
        <div className="flex -space-x-2">
          {[1, 2].map(i => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-brand-bg flex items-center justify-center text-[10px] font-bold text-brand-muted uppercase">
              {i === 1 ? 'AI' : 'ME'}
            </div>
          ))}
        </div>
        
        {note.tags && (
          <div className="flex gap-2">
            {note.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">#{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

const InsightItem = ({ insight }: { insight: Insight }) => (
  <div className="relative pl-6">
    <div className={cn(
      "absolute left-0 top-0 bottom-0 w-1 rounded-full",
      insight.type === 'correlation' ? "bg-amber-400" : insight.type === 'lead' ? "bg-blue-400" : "bg-brand-primary"
    )} />
    
    <p className={cn(
      "text-[10px] font-black uppercase tracking-[0.2em] mb-2",
      insight.type === 'correlation' ? "text-amber-600" : insight.type === 'lead' ? "text-blue-600" : "text-brand-primary"
    )}>
      {insight.title}
    </p>
    
    <p className="text-sm font-medium text-brand-text mb-4 leading-relaxed">
      {insight.content}
    </p>
    
    <button className="text-brand-primary text-[11px] font-bold uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all group">
      {insight.actionText} 
      {insight.type === 'lead' ? <Sparkles size={12} /> : insight.type === 'gap' ? <Search size={12} /> : <ArrowRight size={12} />}
    </button>
  </div>
);

import { Share2, Clock, Brain } from 'lucide-react';
