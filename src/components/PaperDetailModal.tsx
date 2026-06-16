/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { PopulatedPaper } from "../types.js";
import { X, User, Tag, Award, AlertTriangle, FileText, ArrowRight, BookOpen, Calendar, Mail } from "lucide-react";

interface PaperDetailModalProps {
  paper: PopulatedPaper;
  papersListCount: number;
  onClose: () => void;
  onSelectPaper: (paper: PopulatedPaper) => void;
  onCompareWith: (p2: PopulatedPaper) => void;
}

export default function PaperDetailModal({ paper, papersListCount, onClose, onSelectPaper, onCompareWith }: PaperDetailModalProps) {
  const isHighRiskPlagiarism = paper.plagiarism_percentage >= 35;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="detail-modal-container"
        className="relative bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in fade-in zoom-in duration-150"
      >
        {/* Modal Top Banner with Title */}
        <div className="bg-slate-900 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            title="Close modal"
          >
            <X size={16} />
          </button>
          
          <div className="space-y-2 max-w-[95%]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase bg-indigo-500 text-white px-2 py-0.5 rounded">
                Paper Identity: {paper.paper_id}
              </span>
              <span className="text-[10px] font-mono font-medium tracking-normal text-slate-300 flex items-center gap-1">
                <Calendar size={11} /> Published: {new Date(paper.upload_date).toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-white tracking-tight leading-snug">
              {paper.title}
            </h2>
          </div>
        </div>

        {/* Modal Scrollable Contents */}
        <div className="overflow-y-auto p-6 md:p-8 space-y-6 flex-1">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Left Main Box: Abstract, full text */}
            <div className="md:col-span-7 space-y-6">
              
              {/* Abstract */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1 cursor-default">
                  <BookOpen size={16} className="text-slate-400" />
                  Structured Abstract
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed text-justify bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  {paper.abstract}
                </p>
              </div>

              {/* Full Text preview notes */}
              {paper.full_text && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1 cursor-default">
                    <FileText size={16} className="text-slate-400" />
                    Indexed Document Excerpts
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500 max-h-36 overflow-y-auto bg-slate-50 border border-slate-100 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                    {paper.full_text || "No full document extracts archived currently."}
                  </p>
                </div>
              )}

              {/* Integrity report */}
              <div className={`p-4 border rounded-xl space-y-2.5 ${
                isHighRiskPlagiarism 
                  ? "border-red-150 bg-red-50/20" 
                  : "border-emerald-100 bg-emerald-50/10"
              }`}>
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-semibold text-slate-850 flex items-center gap-1.5">
                    <AlertTriangle size={15} className={isHighRiskPlagiarism ? "text-red-500" : "text-emerald-600"} />
                    Plagiarism Audit Summary
                  </h4>
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                    isHighRiskPlagiarism 
                      ? "bg-red-50 text-red-700" 
                      : "bg-emerald-50 text-emerald-800"
                  }`}>
                    {paper.plagiarism_percentage}% MATCH
                  </span>
                </div>
                
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${isHighRiskPlagiarism ? "bg-red-500" : "bg-emerald-500"}`} 
                    style={{ width: `${paper.plagiarism_percentage}%` }} 
                  />
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  <strong>Report Details:</strong> {paper.plagiarism_report || "No plagiarism reports parsed."}
                </p>
              </div>

            </div>

            {/* Right Box: Metadata List, Conferences, Similarities list */}
            <div className="md:col-span-5 space-y-6">

              {/* Authors list block */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">Author Registry</h4>
                <div className="gap-2 grid grid-cols-1">
                  {paper.author_records.map(auth => (
                    <div key={auth.author_id} className="flex items-center gap-3 bg-slate-50 border border-slate-100/60 p-2.5 rounded-lg">
                      <div className="p-1.5 bg-white border border-slate-200 text-slate-500 rounded-md shrink-0">
                        <User size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate leading-none">{auth.name}</div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5" title={auth.affiliation}>
                          {auth.affiliation || "Independent Scholar"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keywords Tag Belt */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">Indexed Keywords</h4>
                <div className="flex flex-wrap gap-1">
                  {paper.keyword_records.map(kw => (
                    <span key={kw.keyword_id} className="text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/40 px-2 py-0.5 rounded-full capitalize">
                      {kw.keyword_text}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI publishing recommendations */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">Publishing Recommendations</h4>
                <div className="space-y-2">
                  {paper.recommendations.map((rec, i) => (
                    <div key={i} className="bg-indigo-50/20 border border-indigo-100/50 rounded-xl p-3 space-y-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-bold text-slate-800 leading-snug flex items-center gap-1.5">
                          <Award size={13} className="text-indigo-600 grow-0 shrink-0" />
                          {rec.conference_name}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                          {Math.floor(rec.confidence * 100)}% Match
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-sans mt-1">
                        {rec.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Similarity matrix ranking list */}
              {papersListCount > 1 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">Similarity Matrix (TF-IDF ranking)</h4>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {paper.similarity_records.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">No similarity indices built yet.</p>
                    ) : (
                      paper.similarity_records.map(sim => (
                        <div 
                          key={sim.target_paper_id}
                          className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs hover:border-indigo-100 group transition-all"
                        >
                          <div className="truncate pr-3 w-40">
                            <span 
                              className="font-semibold text-slate-700 truncate block group-hover:text-indigo-600 transition-colors cursor-pointer"
                              title={`View ${sim.target_title}`}
                              onClick={() => {
                                // Find targets of similar papers and select them
                                const match = document.getElementById(`paper-card-${sim.target_paper_id}`);
                                if (match) match.click();
                                onClose();
                              }}
                            >
                              {sim.target_title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-5 light:bg-slate-2 px-1 rounded">
                              {(sim.score * 100).toFixed(0)}%
                            </span>
                            <button
                              onClick={() => {
                                const matchedPaper = document.getElementById(`paper-card-${sim.target_paper_id}`);
                                if (matchedPaper) {
                                  // Trigger compare directly from action callback on modal parent
                                  onCompareWith({
                                    paper_id: sim.target_paper_id,
                                    title: sim.target_title,
                                  } as any);
                                }
                              }}
                              className="text-[10px] hover:underline font-semibold text-indigo-600 flex items-center"
                              title="Compare Side-by-Side"
                            >
                              Compare <ArrowRight size={10} className="ml-0.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 px-6 md:px-8 flex justify-between items-center shrink-0">
          <div className="flex gap-2 items-center">
            {paper.uploaded_by && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <Mail size={12} /> Email: 
                <span className="text-slate-600">{paper.uploaded_by.email}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold shadow-sm transition-all"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
}
