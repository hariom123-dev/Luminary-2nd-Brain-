export type ViewType = 'dashboard' | 'research' | 'neural-map' | 'collections' | 'library';

export interface User {
  id?: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  synapses: number;
  efficiency: number;
}

export interface Note {
  id?: string;
  userId?: string;
  title: string;
  topic: string;
  content: string;
  summary: string;
  type: 'note' | 'article' | 'pdf' | 'video';
  tags: string[];
  date?: string;
  readTime?: string;
  files?: number;
  links?: number;
  linkedNodes: string[]; // IDs of related notes
}

export interface Insight {
  id?: string;
  userId?: string;
  type: 'correlation' | 'lead' | 'gap';
  title: string;
  content: string;
  sourceLabel?: string;
  actionText: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[]; // IDs of notes referenced
}

export interface ResearchSession {
  id: string;
  title: string;
  status: 'active' | 'archived';
  lastActive: string;
  messages: ChatMessage[];
}

export interface KnowledgeGraphData {
  nodes: { id: string; name: string; type: string }[];
  links: { source: string; target: string }[];
}
