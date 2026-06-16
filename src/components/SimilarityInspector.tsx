/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { PopulatedPaper } from "../types.js";
import { X, Network, FileText, ArrowLeftRight, CheckCircle2, User, HelpCircle, Tag } from "lucide-react";

interface SimilarityInspectorProps {
  paperA: PopulatedPaper;
  paperB: PopulatedPaper;
  onClose: () => void;
}

// Simple internal stopwords to find clean common tokens
const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "as", "at", 
  "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "could", "did", "do", 
  "does", "doing", "for", "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers", 
  "him", "his", "how", "i", "if", "in", "into", "is", "it", "its", "me", "more", "most", "my", "no", "nor", 
  "not", "of", "off", "on", "once", "only", "or", "other", "our", "ours", "out", "over", "own", "same", "she", 
  "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then", 
  "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", 
  "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "with", "you", "your", "yours"
]);

export default function SimilarityInspector({ paperA, paperB, onClose }: SimilarityInspectorProps) {
  
  // Calculate abstract term intersections in real-time
  const getCommonAbstractWords = () => {
    const cleanTokens = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(w => w.length > 3 && !STOP_WORDS.has(w));
    };

    const tokensA = new Set(cleanTokens(paperA.abstract));
    const tokensB = cleanTokens(paperB.abstract);
    const intersection = new Set(tokensB.filter(t => tokensA.has(t)));
    return Array.from(intersection).slice(0, 15); // Show top 15 intersecting words
  };

  const commonWords = getCommonAbstractWords();

  // Find overlapping keywords/conceptual tags
  const tagsA = paperA.keyword_records.map(k => k.keyword_text.toLowerCase());
  const tagsB = paperB.keyword_records.map(k => k.keyword_text.toLowerCase());
  const commonTags = tagsB.filter(t => tagsA.includes(t));

  // Determine current matching score
  const matchingRecord = paperA.similarity_records.find(s => s.target_paper_id === paperB.paper_id);
  const similarityScore = matchingRecord ? matchingRecord.score : 0;
  
  const isHighMatch = similarityScore >= 0.45;
  const isModerateMatch = similarityScore >= 0.15 && similarityScore < 0.45;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
      
      {/* Header bar */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowLeftRight size={20} className="text-indigo-600" />
            ScholarSync Comparative Inspector
          </h2>
          <p className="text-xs text-slate-500">
            Evaluating vocabulary intersections and conceptual overlaps side-by-side using TF-IDF matching rules.
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 px-3 py-1.5 border border-slate-200 text-slate-500 hover:text-slate-800 rounded bg-slate-50 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 transition-all"
        >
          <X size={14} /> Exit Comparator
        </button>
      </div>

      {/* Main comparative block */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-6 items-start">
        
        {/* Paper A Panel */}
        <div className="md:col-span-5 bg-slate-50/40 border border-slate-200/60 rounded-xl p-5 space-y-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-100/50 px-2 py-0.5 rounded uppercase font-semibold">
              Source Paper A
            </span>
            <h3 className="text-sm font-bold text-slate-800 leading-snug underline decoration-indigo-200 decoration-2 select-all">
              {paperA.title}
            </h3>
          </div>

          <div className="space-y-1">
            <h4 className="text-[10px] font-mono text-slate-400 font-semibold uppercase">Authors</h4>
            <p className="text-xs text-slate-600 font-medium flex items-center gap-1">
              <User size={12} className="text-slate-400" />
              {paperA.author_records.map(a => a.name).join(", ")}
            </p>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed text-justify bg-white border border-slate-100 p-3 rounded-lg max-h-48 overflow-y-auto">
            {paperA.abstract}
          </p>
        </div>

        {/* Visual Cosine similarity Gauge Column */}
        <div className="md:col-span-1 flex flex-col items-center justify-center py-6 md:py-16 space-y-2">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
            <Network className="animate-pulse" size={24} />
          </div>
          
          <div className="text-center">
            <div className={`text-xl font-extrabold font-mono ${
              isHighMatch ? "text-indigo-600" : isModerateMatch ? "text-indigo-500" : "text-slate-400"
            }`}>
              {(similarityScore * 100).toFixed(0)}%
            </div>
            <div className="text-[9px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
              Cosine Close
            </div>
          </div>
        </div>

        {/* Paper B Panel */}
        <div className="md:col-span-5 bg-slate-50/40 border border-slate-200/60 rounded-xl p-5 space-y-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-100/50 px-2 py-0.5 rounded uppercase font-semibold">
              Compare Paper B
            </span>
            <h3 className="text-sm font-bold text-slate-800 leading-snug underline decoration-indigo-200 decoration-2 select-all">
              {paperB.title}
            </h3>
          </div>

          <div className="space-y-1">
            <h4 className="text-[10px] font-mono text-slate-400 font-semibold uppercase">Authors</h4>
            <p className="text-xs text-slate-600 font-medium flex items-center gap-1">
              <User size={12} className="text-slate-400" />
              {paperB.author_records.map(a => a.name).join(", ")}
            </p>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed text-justify bg-white border border-slate-100 p-3 rounded-lg max-h-48 overflow-y-auto">
            {paperB.abstract}
          </p>
        </div>

      </div>

      {/* Overlaps and Intersection Intelligence Analysis */}
      <div className="bg-indigo-50/15 border border-indigo-100/50 rounded-xl p-5 md:p-6 space-y-4">
        <h3 className="text-xs font-mono uppercase text-indigo-600 font-bold tracking-wider">
          Intersection Intelligence Summary
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          
          {/* Overlapping Key Words */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-indigo-600" />
              Abstract Term Overlaps ({commonWords.length})
            </h4>
            
            {commonWords.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No shared critical words parsed from abstracts.</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {commonWords.map(word => (
                  <span key={word} className="text-[10px] font-mono font-medium tracking-normal text-slate-600 hover:text-indigo-600 bg-white border border-slate-200/60 p-1 px-2 rounded-md">
                    {word}
                  </span>
                ))}
              </div>
            )}
            <p className="text-[10px] text-slate-500 leading-normal">
              Refers to specific, non-stopword tokens occurring in both summaries.
            </p>
          </div>

          {/* Overlapping Tags */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Tag size={14} className="text-indigo-600" />
              Shared Database Keywords ({commonTags.length})
            </h4>

            {commonTags.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No common explicit keywords annotated in relation links.</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {commonTags.map(tag => (
                  <span key={tag} className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-2 py-0.5">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <p className="text-[10px] text-slate-500 leading-normal">
              Shared exact conceptual keyword tags assigned during parsing or review operations.
            </p>
          </div>

        </div>

        {/* Narrative Comparison */}
        <div className="border-t border-slate-200/50 pt-4 mt-2">
          <p className="text-xs text-slate-500 leading-relaxed text-justify">
            <strong>ScholarSync System Diagnostic:</strong> Overlapping content sets establish a 
            {" "}<strong className="text-indigo-600">{(similarityScore * 100).toFixed(1)}% similarity</strong> coefficient. 
            {isHighMatch 
              ? " This represents a HIGH density semantic intersection. The core research vectors, theoretical underpinnings, or methodologies overlap aggressively. It is recommended to check references to prevent peer publication double-billing reviews."
              : isModerateMatch
              ? " This represents a MODERATE degree of common ground. The papers share conceptual vocabularies, keywords or domains (e.g. machine learning pipelines), but target distinct physical applications, resulting in healthy cross-academic validation paths."
              : " This represents a SECURE, LOW overlap profile. The publications occupy disparate scientific branches, sharing minimal linguistic coordinates besides generic preambles."}
          </p>
        </div>

      </div>

    </div>
  );
}
