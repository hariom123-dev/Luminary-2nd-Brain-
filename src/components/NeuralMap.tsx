import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Note } from '../types';
import { motion } from 'framer-motion';
import { Maximize2, ZoomIn, ZoomOut, RefreshCw, Filter, Sparkles, Share2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface NeuralMapProps {
  notes: Note[];
}

export const NeuralMap: React.FC<NeuralMapProps> = ({ notes }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    if (!svgRef.current || !notes.length) return;

    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    // Prepare data
    const nodes = notes.map(n => ({
      id: n.id,
      name: n.title,
      type: n.type,
      topic: n.topic,
      tags: n.tags
    }));

    const links: any[] = [];
    notes.forEach((note, i) => {
      // Explicit links
      if (note.linkedNodes) {
        note.linkedNodes.forEach(targetId => {
          links.push({ source: note.id, target: targetId, type: 'explicit' });
        });
      }
      
      // Implicit links by tags
      notes.forEach((otherNote, j) => {
        if (i >= j) return;
        if (note.id === otherNote.id) return;
        
        const commonTags = note.tags.filter(t => otherNote.tags.includes(t));
        if (commonTags.length >= 2) {
          links.push({ source: note.id, target: otherNote.id, type: 'implicit' });
        }
      });
    });

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX())
      .force("y", d3.forceY());

    // Links
    const link = g.append("g")
      .attr("stroke", "#CBD5E1")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.5);

    // Nodes
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (event, d: any) => {
        setSelectedNode(d);
        // Highlight logic could go here
      })
      .call(d3.drag<SVGGElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.append("circle")
      .attr("r", 8)
      .attr("fill", (d: any) => d.type === 'note' ? "#005BD3" : d.type === 'article' ? "#3B82F6" : "#F59E0B")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("x", 12)
      .attr("y", 4)
      .text((d: any) => d.name)
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .attr("fill", "#64748B")
      .attr("class", "pointer-events-none select-none");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [notes]);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative" ref={containerRef}>
      {/* Overlay Controls */}
      <div className="absolute top-10 left-10 z-10 space-y-4">
        <div className="bg-white border border-brand-border rounded-2xl p-2 flex flex-col gap-2 shadow-sm">
           <button className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-500"><ZoomIn size={18} /></button>
           <button className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-500"><ZoomOut size={18} /></button>
           <div className="h-px bg-slate-100" />
           <button className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-500"><RefreshCw size={18} /></button>
        </div>
        
        <button className="bg-white border border-brand-border h-12 px-6 rounded-2xl flex items-center gap-3 shadow-sm font-bold text-xs uppercase tracking-widest text-slate-600 hover:border-brand-primary transition-all">
           <Filter size={16} /> Filters
        </button>
      </div>

      <div className="absolute top-10 right-10 z-10 w-80">
        <div className="card bg-white/80 backdrop-blur-md p-6 border-2 border-brand-primary/10">
           {selectedNode ? (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-2 text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-4">
                   <Sparkles size={12} fill="currentColor" /> Neural Node
                </div>
                <h4 className="text-xl font-display font-bold text-brand-text mb-2 leading-tight">{selectedNode.name}</h4>
                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-6">{selectedNode.topic}</p>
                
                <div className="space-y-4">
                   <div className="flex items-center justify-between text-xs font-bold text-brand-muted uppercase">
                      <span>Connections</span>
                      <span className="text-brand-primary">4 Found</span>
                   </div>
                   <div className="p-4 bg-brand-bg rounded-xl text-xs font-medium text-slate-600 leading-relaxed italic">
                      "Conceptually bridges Ethical frameworks with Quantum Security."
                   </div>
                   <button className="w-full btn-primary h-11 text-xs">Examine Full Synthesis</button>
                </div>
             </motion.div>
           ) : (
             <div className="text-center py-10 text-brand-muted">
                <Share2 size={32} className="mx-auto mb-4 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">Select a synapse to analyze density</p>
             </div>
           )}
        </div>
      </div>

      <svg ref={svgRef} className="w-full h-full" />
      
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-white/80 backdrop-blur-md border border-brand-border rounded-full flex items-center gap-8 shadow-xl">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-primary" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Manual Node</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Web Article</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Document</span>
         </div>
      </div>
    </div>
  );
};
