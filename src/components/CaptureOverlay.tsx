import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, Globe, FileText, Zap } from 'lucide-react';
import { processCapture } from '../ai';
import { saveNote } from '../firebase';
import { User } from '../types';
import { cn } from '../lib/utils';

interface CaptureOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const CaptureOverlay: React.FC<CaptureOverlayProps> = ({ isOpen, onClose, user }) => {
  const [content, setContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stage, setStage] = useState<'input' | 'processing' | 'done'>('input');

  const handleCapture = async () => {
    if (!content.trim() || isProcessing) return;
    setIsProcessing(true);
    setStage('processing');

    try {
      const processed = await processCapture(content);
      await saveNote(user.id!, {
        title: processed.title,
        content: content,
        summary: processed.summary,
        topic: processed.topic,
        type: content.trim().startsWith('http') ? 'article' : 'note',
        tags: processed.tags,
        linkedNodes: []
      });
      setStage('done');
      setTimeout(() => {
        onClose();
        setStage('input');
        setContent('');
      }, 2000);
    } catch (err) {
      console.error(err);
      setStage('input');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-primary/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                    <Zap size={20} fill="currentColor" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold text-brand-text">Quick Capture</h2>
                    <p className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em]">Universal Entry Node</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-brand-bg flex items-center justify-center text-brand-muted">
                  <X size={20} />
                </button>
              </div>

              {stage === 'input' && (
                <div className="space-y-6">
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste a URL, an idea, or research notes..."
                    autoFocus
                    className="w-full h-40 bg-brand-bg border-none rounded-2xl p-6 text-brand-text font-medium text-lg placeholder:text-brand-muted/40 focus:ring-2 focus:ring-brand-accent/20 resize-none transition-all"
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <button className="flex items-center gap-2 text-[10px] font-bold text-brand-muted uppercase tracking-widest hover:text-brand-primary">
                          <Globe size={14} /> Detect URL
                       </button>
                       <button className="flex items-center gap-2 text-[10px] font-bold text-brand-muted uppercase tracking-widest hover:text-brand-primary">
                          <FileText size={14} /> Auto Tag
                       </button>
                    </div>
                    
                    <button 
                      onClick={handleCapture}
                      disabled={!content.trim()}
                      className={cn(
                        "h-12 px-8 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-3 transition-all",
                        content.trim() ? "bg-brand-accent text-white shadow-lg shadow-brand-accent/30" : "bg-brand-border text-brand-muted shadow-none"
                      )}
                    >
                      <Send size={14} /> Process into Brain
                    </button>
                  </div>
                </div>
              )}

              {stage === 'processing' && (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="relative mb-8">
                     <motion.div 
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                        transition={{ repeat: Infinity, duration: 4 }}
                        className="w-16 h-16 rounded-full border-4 border-brand-primary/20 border-t-brand-primary"
                     />
                     <div className="absolute inset-0 flex items-center justify-center text-brand-primary">
                        <Sparkles size={24} />
                     </div>
                  </div>
                  <h3 className="text-xl font-display font-bold text-brand-text mb-2">Neural Synthesis in Progress</h3>
                  <p className="text-sm text-brand-muted">Extracting metadata and linking related vectors...</p>
                </div>
              )}

              {stage === 'done' && (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center mb-8"
                  >
                    <Sparkles size={24} fill="currentColor" />
                  </motion.div>
                  <h3 className="text-xl font-display font-bold text-brand-text mb-2">Synapse Successfully Created</h3>
                  <p className="text-sm text-brand-muted">Your thought is now part of your neural network.</p>
                </div>
              )}
            </div>
            
            <div className="bg-brand-bg p-6 flex justify-center border-t border-brand-border">
               <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={10} /> Powered by Gemini Knowledge Engine
               </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
