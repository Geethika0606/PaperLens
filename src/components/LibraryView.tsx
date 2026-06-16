/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PopulatedPaper } from "../types.js";
import { Search, Tag, User as UserIcon, Calendar, Trash2, ArrowUpRight, Award, AlertTriangle } from "lucide-react";

interface LibraryViewProps {
  papers: PopulatedPaper[];
  onSelectPaper: (paper: PopulatedPaper) => void;
  onDeletePaper: (paperId: string) => void;
}

export default function LibraryView({ papers, onSelectPaper, onDeletePaper }: LibraryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKeywordFilter, setSelectedKeywordFilter] = useState<string | null>(null);

  // Get all unique keywords in library for convenient filter tags
  const allKeywords = Array.from(
    new Set(papers.flatMap(p => p.keyword_records.map(kw => kw.keyword_text)))
  ).sort();

  // Unified full-text styled client side filters
  const filteredPapers = papers.filter(paper => {
    const matchesSearch = 
      paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.author_records.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      paper.keyword_records.some(k => k.keyword_text.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesKeyword = selectedKeywordFilter 
      ? paper.keyword_records.some(k => k.keyword_text === selectedKeywordFilter)
      : true;

    return matchesSearch && matchesKeyword;
  });

  return (
    <div className="space-y-6">
      {/* Header and Search Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Active ScholarSync Library</h2>
          <p className="text-sm text-slate-500">Search and explore stored papers, author affiliations, and AI suggestions.</p>
        </div>

        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            placeholder="Search papers, authors, abstracts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Keyword Filter Pill Belt */}
      {allKeywords.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 py-1">
          <span className="text-xs font-medium text-slate-500 mr-1.5 flex items-center gap-1">
            <Tag size={12} className="text-slate-400" /> Filter:
          </span>
          <button
            onClick={() => setSelectedKeywordFilter(null)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              selectedKeywordFilter === null 
                ? "bg-indigo-50 text-indigo-600 border border-indigo-200/50" 
                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/40"
            }`}
          >
            All Fields
          </button>
          {allKeywords.slice(0, 15).map(kw => (
            <button
              key={kw}
              onClick={() => setSelectedKeywordFilter(selectedKeywordFilter === kw ? null : kw)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors capitalize ${
                selectedKeywordFilter === kw 
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 border border-transparent"
              }`}
            >
              {kw}
            </button>
          ))}
          {allKeywords.length > 15 && (
            <span className="text-xs text-slate-400 font-mono">+{allKeywords.length - 15} more</span>
          )}
        </div>
      )}

      {/* Filter Stats */}
      <div className="text-xs text-slate-400 flex justify-between items-center bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg font-mono">
        <span>Showing {filteredPapers.length} of {papers.length} indexing records</span>
        {selectedKeywordFilter && (
          <button 
            onClick={() => setSelectedKeywordFilter(null)}
            className="text-indigo-600 font-semibold hover:underline"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* Grid of Papers */}
      {filteredPapers.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-xl space-y-3">
          <div className="p-3 bg-slate-50 rounded-full inline-block text-slate-400">
            <Search size={22} />
          </div>
          <h3 className="text-sm font-medium text-slate-800">No indexing records found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Try refining your keyword constraints, searching for different authors, or uploading a new paper to search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPapers.map(paper => {
            const hasHighPlagiarism = paper.plagiarism_percentage >= 35;
            return (
              <div
                key={paper.paper_id}
                id={`paper-card-${paper.paper_id}`}
                className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all focus-within:ring-2 focus-within:ring-indigo-500/20"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  
                  {/* Left Column: Details */}
                  <div className="space-y-3.5 flex-1 cursor-pointer" onClick={() => onSelectPaper(paper)}>
                    {/* Header: Title and tags */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono font-medium tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded uppercase">
                          ID: {paper.paper_id}
                        </span>
                        {hasHighPlagiarism && (
                          <span className="text-[10px] font-mono font-semibold bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <AlertTriangle size={10} /> PLAGIARISM FLAG: {paper.plagiarism_percentage}%
                          </span>
                        )}
                        {paper.recommendations?.[0] && (
                          <span className="text-[10px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <Award size={10} /> REC: {paper.recommendations[0].conference_name.split("(")[1]?.replace(")", "") || paper.recommendations[0].conference_name.substring(0, 15)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-slate-800 tracking-tight leading-snug group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                        {paper.title}
                        <ArrowUpRight size={14} className="text-slate-400 group-hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100" />
                      </h3>
                    </div>

                    {/* Meta Section */}
                    <div className="flex flex-wrap items-center text-slate-500 text-xs gap-x-4 gap-y-1.5 font-sans">
                      <div className="flex items-center gap-1">
                        <UserIcon size={13} className="text-slate-400" />
                        <span className="font-medium text-slate-600">
                          {paper.author_records.map(a => a.name).join(", ") || "Unknown Authors"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{new Date(paper.upload_date).toLocaleDateString()}</span>
                      </div>
                      {paper.uploaded_by && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-300">|</span>
                          <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/50 rounded-md px-1.5 py-0.5 text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-slate-400">Indexed by:</span>
                            <strong className="text-slate-700 font-semibold truncate max-w-[120px]">{paper.uploaded_by.name}</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Abstract preview truncated */}
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {paper.abstract}
                    </p>

                    {/* Keywords Badge Strip */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {paper.keyword_records.map(kw => (
                        <span key={kw.keyword_id} className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full capitalize">
                          {kw.keyword_text}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Actions and quick score visualizers */}
                  <div className="flex items-center md:flex-col justify-between md:justify-start md:items-end gap-3.5 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
                    <div className="text-right">
                      <span className="block text-[10px] font-mono text-slate-400 uppercase">Sim. Crossings</span>
                      <span className="text-sm font-semibold text-slate-700 font-mono">
                        {paper.similarity_records.length} relations
                      </span>
                    </div>

                    <button
                      id={`delete-btn-${paper.paper_id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Are you sure you want to delete this research paper from indexing databases? This cascade will wipe all matching similarity scoring records.")) {
                          onDeletePaper(paper.paper_id);
                        }
                      }}
                      className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-100"
                      title="Delete paper"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
