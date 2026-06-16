/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PopulatedPaper } from "../types.js";
import { Network, BarChart2, Hash, AlertTriangle, Users, Award, ExternalLink, HelpCircle, HeartHandshake } from "lucide-react";

interface DashboardAnalyticsProps {
  papers: PopulatedPaper[];
  onSelectPaper: (paper: PopulatedPaper) => void;
  onComparePapers: (p1: PopulatedPaper, p2: PopulatedPaper) => void;
}

export default function DashboardAnalytics({ papers, onSelectPaper, onComparePapers }: DashboardAnalyticsProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ p1: string; p2: string; score: number } | null>(null);

  if (papers.length === 0) {
    return (
      <div className="text-center py-20 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm">
        <div className="p-3 bg-indigo-50 rounded-full inline-block text-indigo-500">
          <Network size={28} />
        </div>
        <h3 className="text-base font-semibold text-slate-800">No Analytics Available</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Please upload research papers to seed the relational database. Our models will compute structural TF-IDF similarities and map dashboard analytics.
        </p>
      </div>
    );
  }

  // --- STATS COMPUTATION ---
  const totalPapers = papers.length;
  
  // Plagiarism alerts
  const plagiarismAlerts = papers.filter(p => p.plagiarism_percentage >= 35).length;

  // Unpack unique authors
  const uniqueAuthors = Array.from(new Set(papers.flatMap(p => p.author_records.map(a => a.name))));

  // Unpack unique keywords & counts
  const keywordCounts: Record<string, number> = {};
  papers.flatMap(p => p.keyword_records.map(k => k.keyword_text)).forEach(kw => {
    keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
  });
  const sortedKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8); // Top 8 keywords for visual clutter reduction

  // Calculate Average similarity
  let totalSim = 0;
  let countSim = 0;
  papers.forEach(p => {
    p.similarity_records.forEach(s => {
      // Avoid double counting by matching target_paper_id alphabetically
      if (p.paper_id < s.target_paper_id) {
        totalSim += s.score;
        countSim++;
      }
    });
  });
  const avgSimilarity = countSim > 0 ? (totalSim / countSim) * 100 : 0;

  // Find Top Conference Channel
  const conferenceCounts: Record<string, number> = {};
  papers.flatMap(p => p.recommendations.map(r => r.conference_name)).forEach(conf => {
    conferenceCounts[conf] = (conferenceCounts[conf] || 0) + 1;
  });
  const topConference = Object.entries(conferenceCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || "IEEE / ACM journals";


  // --- CLUSTER GRAPH COORDINATES (N-gon placement for clean edges) ---
  const SVG_SIZE = 400;
  const CENTER = SVG_SIZE / 2;
  const RADIUS = 130;

  const nodePositions = papers.map((paper, idx) => {
    const angle = (2 * Math.PI * idx) / totalPapers - Math.PI / 2; // Offset first node at top
    return {
      paper_id: paper.paper_id,
      title: paper.title,
      x: CENTER + RADIUS * Math.cos(angle),
      y: CENTER + RADIUS * Math.sin(angle),
      paper
    };
  });


  // --- MATRIX CELL HOVER HANDLERS ---
  const handleCellHover = (p1Id: string, p2Id: string, score: number) => {
    const paper1 = papers.find(p => p.paper_id === p1Id);
    const paper2 = papers.find(p => p.paper_id === p2Id);
    if (paper1 && paper2) {
      setHoveredCell({ p1: paper1.title, p2: paper2.title, score });
    } else {
      setHoveredCell(null);
    }
  };


  return (
    <div className="space-y-6">
      
      {/* 5-Column Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Hash size={13} className="text-indigo-500" />
            Total Papers
          </div>
          <div className="text-2xl font-bold text-slate-800 font-mono tracking-tight">{totalPapers}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Network size={13} className="text-violet-500" />
            Avg. Similarity
          </div>
          <div className="text-2xl font-bold text-indigo-600 font-mono tracking-tight">{avgSimilarity.toFixed(1)}%</div>
        </div>

        <div className={`p-5 rounded-xl border shadow-sm flex flex-col justify-between transition-colors ${
          plagiarismAlerts > 0 ? "border-red-200 bg-red-50/10" : "border-slate-200 bg-white"
        }`}>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertTriangle size={13} className={plagiarismAlerts > 0 ? "text-red-500" : "text-slate-400"} />
            Plagiarism Flags
          </div>
          <div className={`text-2xl font-semibold font-mono tracking-tight ${plagiarismAlerts > 0 ? "text-red-650 font-extrabold" : "text-slate-800"}`}>
            {plagiarismAlerts}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users size={13} className="text-blue-500" />
            Unique Scholars
          </div>
          <div className="text-2xl font-bold text-slate-800 font-mono tracking-tight">{uniqueAuthors.length}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 truncate">
            <Award size={13} className="text-emerald-500 shrink-0" />
            Hot Venue
          </div>
          <div className="text-sm font-extrabold text-slate-700 truncate capitalize" title={topConference}>
            {topConference.split("(")[1]?.replace(")","") || topConference}
          </div>
        </div>

      </div>

      {/* Primary Analytics Section: Heatmap vs Clustering Network */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Dynamic Similarity Matrix Heatmap */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-semibold text-slate-850 flex items-center gap-1.5 leading-none">
                  <BarChart2 size={16} className="text-slate-500" />
                  Pairwise Semantic Heatmap
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Intersection grid showing local relative similarity percentages. Hover elements to review crossing pairs.
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 select-none bg-slate-50 border border-slate-100 px-2 py-0.5 rounded leading-none">
                TF-IDF Multipliers
              </span>
            </div>

            {/* Simulated Heatmap Matrix Table or SVG */}
            <div className="relative pt-6 overflow-x-auto">
              <table className="w-full text-right border-collapse select-none">
                <thead>
                  <tr>
                    <th className="p-1 text-[9px] font-mono text-slate-400 text-left truncate max-w-[80px]">Papers</th>
                    {papers.map((p, idx) => (
                      <th key={p.paper_id} className="p-1 text-[10px] font-mono text-slate-500 text-center uppercase" title={p.title}>
                        P-{idx+1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {papers.map((rowPaper, rIdx) => (
                    <tr key={rowPaper.paper_id} className="border-t border-slate-100">
                      <td className="p-1 px-1.5 text-[10px] font-bold text-slate-700 text-left truncate max-w-[110px]" title={rowPaper.title}>
                        P-{rIdx+1} <span className="font-normal text-[9px] text-slate-400">{rowPaper.title.substring(0, 16)}...</span>
                      </td>
                      {papers.map(colPaper => {
                        const isSelf = rowPaper.paper_id === colPaper.paper_id;
                        
                        // Find matching score
                        let score = 0;
                        if (isSelf) {
                          score = 1.0;
                        } else {
                          const exactMatch = rowPaper.similarity_records.find(s => s.target_paper_id === colPaper.paper_id);
                          score = exactMatch ? exactMatch.score : 0;
                        }

                        // Style scaling: high value gets deep indigo, low gets white/soft grey
                        const colorHex = isSelf 
                          ? "rgba(99, 102, 241, 0.15)"
                          : score > 0.4
                          ? `rgba(99, 102, 241, ${score * 1.5})`
                          : score > 0.1
                          ? `rgba(99, 102, 241, ${score * 0.9})`
                          : "rgba(241, 245, 249, 0.3)";

                        const textColor = score > 0.4 ? "text-indigo-950 font-bold" : "text-slate-500";

                        return (
                          <td
                            key={colPaper.paper_id}
                            className="p-1.5 text-center transition-all cursor-pointer relative"
                            style={{ backgroundColor: colorHex }}
                            onMouseEnter={() => handleCellHover(rowPaper.paper_id, colPaper.paper_id, score)}
                            onMouseLeave={() => setHoveredCell(null)}
                            onClick={() => !isSelf && onComparePapers(rowPaper, colPaper)}
                          >
                            <span className={`text-[10px] font-mono font-medium ${textColor}`}>
                              {(score * 100).toFixed(0)}%
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Heatmap Tooltip Display */}
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg min-h-[58px] flex items-center justify-center">
            {hoveredCell ? (
              <div className="text-center font-sans space-y-0.5">
                <p className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Intersection Selected</p>
                <div className="text-xs font-semibold text-slate-800 leading-tight">
                  <span className="text-indigo-600 truncate inline-block max-w-[140px] align-bottom" title={hoveredCell.p1}>
                    {hoveredCell.p1.substring(0, 24)}...
                  </span>
                  {" ↔ "}
                  <span className="text-indigo-600 truncate inline-block max-w-[140px] align-bottom" title={hoveredCell.p2}>
                    {hoveredCell.p2.substring(0, 24)}...
                  </span>
                </div>
                <p className="text-xs font-mono font-bold text-slate-700">Cosine Closeness Rating: {(hoveredCell.score * 100).toFixed(1)}%</p>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic text-center">
                Hover over grid intersections to analyze comparative score channels or click cells to compare.
              </p>
            )}
          </div>
        </div>

        {/* Semantic Cluster Relations Graph */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-850 flex items-center gap-1.5 leading-none">
              <Network size={16} className="text-slate-500" />
              Dynamic Relational Network Coordinates
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Nodes show publications; edge threads indicate cosine scores of intersecting keywords and concepts.
            </p>
          </div>

          <div className="flex justify-center bg-slate-50 border border-slate-100 rounded-xl p-2.5 relative">
            
            {/* SVG Visual Stage */}
            <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="w-full max-w-[340px] aspect-square">
              {/* Draw Edges FIRST (so nodes sit on top of lines) */}
              {papers.map((p1, idx1) => {
                const pos1 = nodePositions.find(n => n.paper_id === p1.paper_id)!;
                return p1.similarity_records.map(s => {
                  const pos2 = nodePositions.find(n => n.paper_id === s.target_paper_id);
                  if (!pos2) return null;

                  // Unique key for line segment
                  const edgeKey = `${p1.paper_id}-${s.target_paper_id}`;
                  
                  // Only draw line once to optimize layer performance
                  if (p1.paper_id > s.target_paper_id) return null;

                  const isHighlighted = hoveredNode === null || hoveredNode === p1.paper_id || hoveredNode === s.target_paper_id;
                  
                  // Stroke weight scales with similarity
                  const strokeWidth = s.score > 0.4 ? 4.5 : s.score > 0.15 ? 2.5 : 1;
                  const strokeColor = s.score > 0.4 ? "#6366f1" : s.score > 0.2 ? "#818cf8" : "#cbd5e1";
                  const opacity = isHighlighted 
                    ? s.score > 0.4 ? 0.85 : s.score > 0.15 ? 0.6 : 0.2
                    : 0.04; // Dampened when another node is hovered

                  return (
                    <line
                      key={edgeKey}
                      x1={pos1.x}
                      y1={pos1.y}
                      x2={pos2.x}
                      y2={pos2.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeOpacity={opacity}
                      className="transition-all duration-350"
                    />
                  );
                });
              })}

              {/* Draw Node Circles */}
              {nodePositions.map((node, index) => {
                const isHovered = hoveredNode === node.paper_id;
                const isDampened = hoveredNode !== null && hoveredNode !== node.paper_id;
                
                // Color nodes by plagiarism risk to pack double the info!
                const riskColor = node.paper.plagiarism_percentage >= 50 
                  ? "#ef4444" // red
                  : node.paper.plagiarism_percentage >= 25
                  ? "#f59e0b" // amber
                  : "#4f46e5"; // indigo

                return (
                  <g 
                    key={node.paper_id} 
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredNode(node.paper_id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => onSelectPaper(node.paper)}
                  >
                    {/* Pulsing Back Glow */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isHovered ? 18 : 11}
                      fill={riskColor}
                      fillOpacity={isHovered ? 0.15 : 0.0}
                      className="transition-all duration-300"
                    />

                    {/* True Circle */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isHovered ? 12 : 8}
                      fill={riskColor}
                      opacity={isDampened ? 0.4 : 1.0}
                      stroke="#ffffff"
                      strokeWidth={2}
                      className="shadow-sm transition-all duration-300"
                    />

                    {/* Numeric Node ID Label */}
                    <text
                      x={node.x}
                      y={node.y + 4}
                      fill="#ffffff"
                      fontSize="9px"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                      opacity={isDampened ? 0.4 : 1.0}
                    >
                      {index + 1}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Quick Node Overlay Legend */}
            <div className="absolute bottom-2 left-2 bg-white/95 border border-slate-200/50 rounded p-1.5 space-y-1 select-none font-mono text-[9px] text-slate-500">
              <div className="font-semibold px-0.5 border-b border-slate-100 pb-0.5">Plagiarism Risk Tiers</div>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block" /> Low Risk (&lt;25%)</div>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" /> Moderate Risk (25-49%)</div>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> High Risk (&ge;50%)</div>
            </div>
          </div>

          {/* Dynamic Relations context details box */}
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 min-h-[58px]">
            {hoveredNode ? (
              (() => {
                const hNode = papers.find(p => p.paper_id === hoveredNode);
                if (!hNode) return null;
                const idx = papers.indexOf(hNode) + 1;
                return (
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-indigo-600 font-mono font-bold">NODE {idx}: {hNode.title.substring(0, 36)}...</p>
                    <p className="text-xs text-slate-500 line-clamp-1 leading-normal">
                      <strong>Authors:</strong> {hNode.author_records.map(a => a.name).join(", ")}
                    </p>
                    <div className="flex gap-2 text-[10px] text-slate-400 font-mono">
                      <span>Plagiarism Rating: {hNode.plagiarism_percentage}%</span>
                      <span>•</span>
                      <span>Co-scores parsed: {hNode.similarity_records.length} items</span>
                    </div>
                  </div>
                );
              })()
            ) : (
              <p className="text-[11px] text-slate-400 italic text-center pt-2 select-none">
                Hover coordinates nodes to focus connection webs or hover other segments.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Secondary Row: Keywords Frequency cloud vs Plagiarism High Risk Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Keyword Frequency Histogram */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-850 flex items-center gap-1.5">
              <Hash size={16} className="text-slate-500" />
              Primary Keyword Cloud Frequencies
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Frequency distribution detailing standard academic clusters stored in databases.
            </p>
          </div>

          <div className="space-y-3">
            {sortedKeywords.map(([word, freq]) => {
              const maxFreq = Math.max(...Object.values(keywordCounts));
              const percentOfMax = maxFreq > 0 ? (freq / maxFreq) * 100 : 0;
              return (
                <div key={word} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-700 capitalize font-mono">{word}</span>
                    <span className="text-slate-400 font-mono font-medium">{freq} {freq === 1 ? "paper" : "papers"}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500/80 rounded-full transition-all duration-300"
                      style={{ width: `${percentOfMax}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plagiarism Risk Ledger */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-850 flex items-center gap-1.5">
              <AlertTriangle size={16} className="text-slate-500" />
              ScholarSync Integrity Audits
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Integrity index classifying papers by standard copy risk tiers. Overlaps are flagged automatically.
            </p>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
            {papers.map((paper, idx) => {
              const isHigh = paper.plagiarism_percentage >= 50;
              const isMod = paper.plagiarism_percentage >= 20 && paper.plagiarism_percentage < 50;
              const statusClass = isHigh 
                ? "bg-red-50 text-red-700 border-red-100" 
                : isMod 
                ? "bg-amber-50 text-amber-700 border-amber-100" 
                : "bg-emerald-50 text-emerald-700 border-emerald-100";

              return (
                <div 
                  key={paper.paper_id} 
                  className={`flex items-center justify-between p-2.5 border rounded-lg transition-all ${statusClass}`}
                >
                  <div className="truncate pr-3 space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800 truncate leading-none flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400">#{idx+1}</span>
                      {paper.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 truncate leading-none">
                      Author: {paper.author_records[0]?.name || "Unknown"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono font-bold uppercase">
                      {isHigh ? "High Overlap" : isMod ? "Moderate" : "Secure"}
                    </span>
                    <button
                      onClick={() => onSelectPaper(paper)}
                      className="p-1 hover:bg-white/60 text-slate-500 rounded transition-colors"
                      title="Inspect Paper Details"
                    >
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <div className="bg-indigo-50/30 border border-indigo-100/30 rounded-xl p-4 flex items-center gap-3.5 mt-4">
        <HeartHandshake className="text-indigo-600 shrink-0" size={20} />
        <div className="text-xs text-slate-500 leading-relaxed">
          <strong>Pro-tip on Similarity Mathematics:</strong> Cosine Similarity values range between <code>0.0 (total separation)</code> and <code>1.0 (exact text duplication)</code>. ScholarSync calculates vectors computed dynamically during document submissions across the entire active SQLite-JSON repository pipeline.
        </div>
      </div>

    </div>
  );
}
