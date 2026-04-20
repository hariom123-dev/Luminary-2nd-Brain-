import React, { useState } from 'react';
import { Note } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Bookmark, 
  Trash2, 
  ArrowRight, 
  Inbox, 
  X, 
  Sparkles, 
  FileText, 
  Zap, 
  MessageSquare,
  Clock,
  Share2,
  Library
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface LibraryProps {
  currentView: string;
  notes: Note[];
  onDelete: (id: string) => void;
}

export const KnowledgeLibrary: React.FC<LibraryProps> = ({ currentView, notes, onDelete }) => {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto p-10">
        <div className="flex items-center justify-between mb-12">
           <div>
             <h2 className="text-4xl font-display font-bold text-brand-text capitalize tracking-tight">
               {currentView === 'search-results' ? 'Neural Search Results' : currentView}
             </h2>
             <p className="text-sm font-bold text-brand-muted uppercase tracking-widest mt-2">{notes.length} syntheses stored</p>
           </div>
           <div className="flex gap-4">
              <div className="bg-white border border-brand-border rounded-xl px-4 py-2 flex items-center gap-3 text-brand-muted shadow-xs">
                 <Search size={16} />
                 <input type="text" placeholder="Filter memory..." className="bg-transparent border-none focus:ring-0 text-sm font-medium" />
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {notes.map((note) => (
             <motion.div 
               layoutId={note.id}
               key={note.id} 
               onClick={() => setSelectedNote(note)}
               className="card bg-white p-6 hover:border-brand-accent group cursor-pointer transition-all hover:shadow-xl hover:shadow-brand-primary/5 active:scale-98"
             >
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-2">
                     <span className="px-3 py-1 bg-brand-highlight/10 rounded-lg text-[9px] font-black text-brand-accent uppercase tracking-widest">{note.topic}</span>
                     {note.type === 'article' && <Globe size={10} className="text-brand-muted" />}
                   </div>
                   <div className="flex gap-2">
                     <button 
                       onClick={(e) => { e.stopPropagation(); onDelete(note.id!); }}
                       className="text-brand-muted hover:text-red-500 transition-colors"
                     >
                       <Trash2 size={14} />
                     </button>
                   </div>
                </div>
                <h4 className="text-lg font-display font-bold text-brand-text mb-2 line-clamp-2 transition-colors group-hover:text-brand-accent leading-tight">{note.title}</h4>
                <p className="text-sm text-brand-muted line-clamp-3 mb-6 leading-relaxed flex-1">{note.summary}</p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-brand-border">
                   <div className="flex items-center gap-2 text-[10px] font-bold text-brand-muted uppercase tracking-widest">
                      <Clock size={12} /> {note.readTime || '3m'}
                   </div>
                   <button className="text-brand-accent text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">Expand <ArrowRight size={12} /></button>
                </div>
             </motion.div>
           ))}
           
           <button className="card border-2 border-dashed border-brand-border bg-transparent flex flex-col items-center justify-center gap-4 group hover:border-brand-accent transition-all py-20 min-h-[250px]">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-brand-muted group-hover:text-brand-accent transition-colors shadow-sm">
                 <Inbox size={24} />
              </div>
              <span className="text-xs font-bold text-brand-muted uppercase tracking-[0.2em] group-hover:text-brand-accent transition-colors text-center">Capture New<br/>Thought</span>
           </button>
        </div>
      </div>

      <AnimatePresence>
        {selectedNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNote(null)}
              className="absolute inset-0 bg-brand-primary/60 backdrop-blur-md"
            />
            
            <motion.div 
              layoutId={selectedNote.id}
              className="relative w-full max-w-5xl h-[85vh] bg-white rounded-[3rem] shadow-2xl flex overflow-hidden border border-brand-primary/10"
            >
               <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                  <header className="mb-12">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center text-brand-accent">
                          {selectedNote.type === 'article' ? <Globe size={20} /> : <FileText size={20} />}
                        </div>
                        <p className="text-xs font-black text-brand-accent uppercase tracking-widest">{selectedNote.topic}</p>
                     </div>
                     <h2 className="text-5xl font-display font-bold text-brand-text mb-8 leading-tight">{selectedNote.title}</h2>
                     <div className="flex flex-wrap gap-2">
                        {selectedNote.tags.map(tag => (
                          <span key={tag} className="px-4 py-1.5 bg-brand-bg rounded-full text-[10px] font-bold text-brand-muted uppercase tracking-widest border border-brand-border flex items-center gap-1.5 hover:bg-brand-highlight/20 transition-colors cursor-pointer">
                             # {tag}
                          </span>
                        ))}
                     </div>
                  </header>

                  <div className="prose prose-lg prose-slate max-w-none prose-headings:font-display prose-headings:font-bold prose-p:text-brand-text/80 prose-p:leading-relaxed">
                     <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
                  </div>
               </div>

               <aside className="w-96 bg-brand-bg/30 border-l border-brand-border flex flex-col">
                  <div className="p-10 border-b border-brand-border">
                     <button onClick={() => setSelectedNote(null)} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-muted hover:text-brand-accent transition-all shadow-sm mb-12">
                        <X size={24} />
                     </button>

                     <h5 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-6">AI Summary</h5>
                     <div className="p-6 bg-brand-primary text-white rounded-[2rem] text-sm leading-relaxed font-medium shadow-xl shadow-brand-primary/10 relative overflow-hidden group">
                        {selectedNote.summary}
                        <Sparkles size={40} className="absolute -right-4 -bottom-4 opacity-10 rotate-12 group-hover:scale-110 transition-transform" />
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 space-y-10">
                     <div>
                        <h5 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-4">Contextual Tools</h5>
                        <div className="grid grid-cols-2 gap-3">
                           <ToolButton icon={<Zap size={14} />} label="Analyze" />
                           <ToolButton icon={<MessageSquare size={14} />} label="Discuss" />
                           <ToolButton icon={<Library size={14} />} label="Connect" />
                           <ToolButton icon={<Share2 size={14} />} label="Export" />
                        </div>
                     </div>

                     <div>
                        <h5 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-4">Neural Proximity</h5>
                        <div className="space-y-4">
                           {[1, 2].map(i => (
                             <div key={i} className="flex items-center gap-4 group cursor-pointer">
                                <div className="w-2 h-2 rounded-full bg-brand-accent/30 group-hover:bg-brand-accent transition-all" />
                                <span className="text-xs font-bold text-brand-muted group-hover:text-brand-text transition-all truncate">Related Thesis Node {i}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="p-8 border-t border-brand-border">
                     <button className="w-full h-12 rounded-2xl bg-white border border-brand-border font-bold text-[10px] uppercase tracking-[0.2em] text-brand-muted hover:border-brand-accent hover:text-brand-accent transition-all shadow-sm">
                        Edit Synthesis
                     </button>
                  </div>
               </aside>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ToolButton = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <button className="h-10 bg-white border border-brand-border rounded-xl flex items-center justify-center gap-2 text-[10px] font-black text-brand-muted uppercase tracking-widest hover:border-brand-accent hover:text-brand-accent transition-all shadow-xs">
    {icon} {label}
  </button>
);

import { Globe } from 'lucide-react';
