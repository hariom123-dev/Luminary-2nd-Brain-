import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  Share2, 
  Library, 
  Plus, 
  Settings, 
  Bell,
  ChevronRight,
  LogOut,
  Bookmark,
  Trash2
} from 'lucide-react';
import { ViewType, User, Note } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  user: User;
  onLogout: () => void;
  onQuickCapture: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, user, onLogout, onQuickCapture }) => {
  const menuItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'research', label: 'RESEARCH', icon: Search },
    { id: 'neural-map', label: 'NEURAL MAP', icon: Share2 },
    { id: 'collections', label: 'COLLECTIONS', icon: Library },
    { id: 'library', label: 'LIBRARY', icon: Library },
  ];

  return (
    <div className="w-72 h-screen flex flex-col bg-brand-primary text-white border-r border-white/5">
      <div className="p-10 flex flex-col items-start gap-1">
        <h1 className="text-2xl font-display font-bold text-white tracking-tight">Luminary</h1>
        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">AI Second Brain</p>
      </div>

      <div className="flex-1 mt-4 space-y-1">
        <div className="px-6 mb-10">
          <button 
             onClick={onQuickCapture}
             className="w-full h-12 bg-brand-accent text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-brand-accent/20 hover:opacity-90 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span className="text-sm uppercase tracking-widest">Capture</span>
          </button>
        </div>

        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as ViewType)}
            className={cn(
              "flex items-center gap-3 px-8 py-4 transition-all group w-full",
              currentView === item.id ? "bg-white/10 border-r-4 border-brand-accent" : "hover:bg-white/5"
            )}
          >
            <item.icon size={20} className={cn(
               currentView === item.id ? "text-brand-accent" : "text-white/40 group-hover:text-white"
            )} />
            <span className={cn(
               "text-[11px] font-bold uppercase tracking-[0.2em]",
               currentView === item.id ? "text-white" : "text-white/40 group-hover:text-white"
            )}>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="p-8 border-t border-white/5 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 p-0.5">
            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{user.name}</p>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{user.role}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-between px-4 py-2 text-white/40 hover:text-brand-accent transition-colors text-[10px] font-bold uppercase tracking-widest border border-white/10 rounded-xl"
        >
          Logout <LogOut size={14} />
        </button>
      </div>
    </div>
  );
};

import { searchNotes } from '../firebase';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onSearchResults?: (results: Note[]) => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, onSearchResults }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim() || !onSearchResults) return;
    
    setIsSearching(true);
    try {
      const results = await searchNotes(user.id!, searchTerm);
      onSearchResults(results);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <header className="h-20 flex items-center justify-between px-10 bg-brand-bg/80 backdrop-blur-md sticky top-0 z-40">
      <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative">
        <Search className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
          isSearching ? "text-brand-accent animate-pulse" : "text-brand-secondary"
        )} size={18} />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search your neural network..."
          className="w-full h-12 bg-white border border-brand-border rounded-2xl pl-12 pr-4 focus:outline-hidden focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/5 transition-all text-sm font-medium shadow-sm shadow-brand-primary/5"
        />
        {searchTerm && (
          <button 
            type="button"
            onClick={() => { setSearchTerm(''); onSearchResults?.([]); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-muted uppercase"
          >
            Clear
          </button>
        )}
      </form>
      <div className="flex items-center gap-6">
        <button className="text-brand-muted hover:text-brand-primary transition-colors">
          <Bell size={20} />
        </button>
        <button className="text-brand-muted hover:text-brand-primary transition-colors">
          <Settings size={20} />
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden border border-brand-border cursor-pointer">
          <img src={user.avatar} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      </div>
    </header>
  );
};
