import React, { useState, useEffect } from 'react';
import { ViewType, Note, Insight, ResearchSession, User } from './types';
import { INITIAL_USER, INITIAL_NOTES, INITIAL_INSIGHTS, INITIAL_SESSIONS } from './constants';
import { Dashboard } from './components/Dashboard';
import { Research } from './components/Research';
import { NeuralMap } from './components/NeuralMap';
import { Sidebar, Header } from './components/Navigation';
import { KnowledgeLibrary } from './components/KnowledgeLibrary';
import { CaptureOverlay } from './components/CaptureOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronRight } from 'lucide-react';
import { auth, loginWithGoogle, logout, subscribeToUserStats, deleteNote, subscribeToInsights, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [insights, setInsights] = useState<Insight[]>(INITIAL_INSIGHTS);
  const [sessions] = useState<ResearchSession[]>(INITIAL_SESSIONS);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<Note[] | null>(null);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Sync stats
        const unsubStats = subscribeToUserStats(firebaseUser.uid, (userData) => {
          setUser(userData);
        });
        
        // Sync insights
        const unsubInsights = subscribeToInsights(firebaseUser.uid, (newInsights) => {
          setInsights(newInsights);
        });

        // Live notes subscription
        const q = query(collection(db, 'users', firebaseUser.uid, 'notes'), orderBy('createdAt', 'desc'));
        const unsubNotes = onSnapshot(q, (snapshot) => {
          setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note)));
        });

        setLoading(false);
        return () => {
          unsubStats();
          unsubInsights();
          unsubNotes();
        };
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleDeleteNote = async (id: string) => {
    if (user?.id) {
       await deleteNote(user.id, id);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-brand-bg">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-2xl font-display font-bold text-brand-primary"
        >
          Luminary
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-brand-bg px-6">
        <div className="max-w-md w-full text-center space-y-8">
           <div className="space-y-2">
             <h1 className="text-5xl font-display font-bold text-brand-primary">Luminary</h1>
             <p className="text-brand-muted font-semibold uppercase tracking-widest text-xs">Your Personal Neural Network</p>
           </div>
           
           <div className="card p-10 bg-white shadow-2xl space-y-8">
              <div className="space-y-4">
                <h3 className="text-2xl font-display font-bold text-brand-text">Welcome Back</h3>
                <p className="text-brand-muted text-sm leading-relaxed">Connect your Google account to access your personal knowledge graph and insights.</p>
              </div>
              
              <button 
                onClick={loginWithGoogle}
                className="w-full h-14 bg-brand-accent text-white rounded-2xl flex items-center justify-center gap-3 font-bold text-sm tracking-wide shadow-xl shadow-brand-accent/20 hover:opacity-90 transition-all uppercase"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>

              <p className="text-[10px] text-brand-muted uppercase tracking-widest font-bold">
                Secured by Firebase Enterprise
              </p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-brand-bg select-none font-sans">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        user={user} 
        onLogout={logout}
        onQuickCapture={() => setIsCaptureOpen(true)}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} onLogout={logout} onSearchResults={(results) => {
          setSearchResults(results.length > 0 ? results : null);
          if (results.length > 0) setCurrentView('library');
        }} />
        
        <main className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            {currentView === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <Dashboard user={user} notes={notes} insights={insights} />
              </motion.div>
            )}
            
            {currentView === 'research' && (
              <motion.div key="research" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <Research sessions={sessions} notes={notes} user={user} />
              </motion.div>
            )}
            
            {currentView === 'neural-map' && (
              <motion.div key="neural-map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <NeuralMap notes={notes} />
              </motion.div>
            )}

            {(currentView === 'collections' || currentView === 'library') && (
              <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <KnowledgeLibrary 
                  currentView={searchResults ? 'search-results' : currentView} 
                  notes={searchResults || notes} 
                  onDelete={handleDeleteNote}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <CaptureOverlay 
        isOpen={isCaptureOpen} 
        onClose={() => setIsCaptureOpen(false)} 
        user={user} 
      />
    </div>
  );
}
