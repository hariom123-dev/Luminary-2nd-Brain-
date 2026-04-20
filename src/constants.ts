import { Note, Insight, ResearchSession } from './types';

export const INITIAL_USER = {
  name: "Architect",
  role: "Pro Researcher",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AlexChan",
  synapses: 1284,
  efficiency: 94
};

export const INITIAL_NOTES: Note[] = [
  {
    id: '1',
    title: 'The Alignment Problem: Synthetic Superintelligence vs Human Values',
    topic: 'AI ETHICS',
    content: 'A comprehensive summary of recent developments in LLM alignment, focusing on the RLHF limitations discovered in the...',
    summary: 'Exploration of how to ensure AI systems align with human intent and long-term values.',
    type: 'article',
    tags: ['AI', 'Ethics', 'Alignment'],
    date: '2 hours ago',
    linkedNodes: ['2']
  },
  {
    id: '2',
    title: 'Carbon Sequestration Trends 2024',
    topic: 'QUICK NOTE',
    content: 'Summary of the oceanic thermal exchange model proposed by the...',
    summary: 'Analysis of emerging technologies for atmospheric carbon removal.',
    type: 'note',
    tags: ['Sustainability', 'Climate'],
    date: 'Yesterday',
    files: 3,
    links: 12,
    linkedNodes: ['1']
  },
  {
    id: '3',
    title: 'Post-Quantum Cryptography Architectures',
    topic: 'RESEARCH',
    content: 'Initial findings on lattice-based encryption protocols and their...',
    summary: 'Technical deep dive into security standards for the quantum era.',
    type: 'pdf',
    tags: ['Security', 'Quantum'],
    date: '3 days ago',
    readTime: 'Read 4m',
    linkedNodes: []
  }
];

export const INITIAL_INSIGHTS: Insight[] = [
  {
    id: 'i1',
    type: 'correlation',
    title: 'CORRELATION FOUND',
    content: 'Your notes on "Lattice Cryptography" and "Quantum Mechanics" share a 68% conceptual overlap.',
    actionText: 'Generate Neural Bridge',
    sourceLabel: 'Neural Linker'
  },
  {
    id: 'i2',
    type: 'lead',
    title: 'RESEARCH LEAD',
    content: 'A new paper from Stanford matches your current collection on "AI Alignment".',
    actionText: 'Summarize Paper',
    sourceLabel: 'ArXiv Watcher'
  },
  {
    id: 'i3',
    type: 'gap',
    title: 'KNOWLEDGE GAP',
    content: 'You haven\'t added any sources to the "Ethical Frameworks" collection in 14 days.',
    actionText: 'Find Sources',
    sourceLabel: 'Smart Planner'
  }
];

export const INITIAL_SESSIONS: ResearchSession[] = [
  {
    id: 's1',
    title: 'Quantum Computing Crossroads',
    status: 'active',
    lastActive: '42m',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Can you analyze the intersection of room-temperature superconductors and recent breakthroughs in topological quantum computing? I need a summary for my research proposal.',
        timestamp: '14:32'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: `Recent developments suggest a significant synergy between these two fields. The discovery of potential room-temperature superconductors could drastically reduce the cooling requirements for topological qubits.

### Key Insights
01. **Material stability** at higher temperatures reduces noise interference in Majorana fermions.
02. **Energy consumption** for cryogenic systems could be cut by up to 94%.`,
        timestamp: '14:33',
        sources: ['3']
      }
    ]
  }
];
