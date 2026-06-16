/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { PopulatedPaper } from "./types.js";
import LibraryView from "./components/LibraryView.js";
import UploadPaper from "./components/UploadPaper.js";
import DashboardAnalytics from "./components/DashboardAnalytics.js";
import PaperDetailModal from "./components/PaperDetailModal.js";
import SimilarityInspector from "./components/SimilarityInspector.js";
import { Network, FileText, Upload, RefreshCw, Layers, ShieldCheck, HelpCircle, Activity, ChevronDown } from "lucide-react";

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  affiliation: string;
  initials: string;
  color: string;
}

export const ACADEMIC_PROFILES: UserProfile[] = [
  {
    name: "Dr. Elena Vance",
    email: "parvathareddygeethika@gmail.com",
    role: "Senior AI Researcher",
    affiliation: "ScholarSync Academic Institute",
    initials: "EV",
    color: "bg-indigo-600 text-white"
  },
  {
    name: "Prof. Marcus Aurelius",
    email: "marcus.aurelius@computational.edu",
    role: "Dean of Computer Science",
    affiliation: "MIT Lab of Intelligence",
    initials: "MA",
    color: "bg-emerald-600 text-white"
  },
  {
    name: "Dr. Alicia Sterling",
    email: "a.sterling@medai.ox.ac.uk",
    role: "Associate Professor of MedAI",
    affiliation: "Oxford Medical Informatics",
    initials: "AS",
    color: "bg-violet-600 text-white"
  },
  {
    name: "Devon Carter",
    email: "d.carter@student.gatech.edu",
    role: "PhD Research Fellow",
    affiliation: "Georgia Institute of Technology",
    initials: "DC",
    color: "bg-amber-500 text-slate-900 font-bold"
  }
];

export default function App() {
  const [papers, setPapers] = useState<PopulatedPaper[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "library" | "upload">("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile switcher states
  const [activeProfile, setActiveProfile] = useState<UserProfile>(ACADEMIC_PROFILES[0]);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Focus and modal states
  const [selectedPaper, setSelectedPaper] = useState<PopulatedPaper | null>(null);
  const [comparePaperA, setComparePaperA] = useState<PopulatedPaper | null>(null);
  const [comparePaperB, setComparePaperB] = useState<PopulatedPaper | null>(null);

  // Fetch all papers from SQLite relational JSON store on startup
  const fetchPapers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/papers");
      if (!response.ok) {
        throw new Error("Could not construct indexing link with server.");
      }
      const data: PopulatedPaper[] = await response.json();
      setPapers(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to synchronise with local ScholarSync database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  const handleDeletePaper = async (paperId: string) => {
    try {
      const response = await fetch(`/api/papers/${paperId}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error("Failed to cascade delete through tables.");
      }
      // Re-fetch papers list
      fetchPapers();
      
      // Close detail view if deleting active focus
      if (selectedPaper?.paper_id === paperId) {
        setSelectedPaper(null);
      }
    } catch (err: any) {
      alert(err.message || "Delete operations aborted.");
    }
  };

  const handleManualRecompute = async () => {
    try {
      const response = await fetch("/api/papers/recompute", {
        method: "POST"
      });
      if (response.ok) {
        fetchPapers();
        alert("TF-IDF matrix & all-pair Cosine similarity weights successfully recalibrated!");
      }
    } catch (err) {
      alert("Recalibration pipelines interrupted.");
    }
  };

  const handlePaperSaved = (newPaper: PopulatedPaper) => {
    // Refresh library and navigate to it automatically
    fetchPapers();
    setActiveTab("library");
  };

  const handleCompareFromDetails = (secondPaperPartial: PopulatedPaper) => {
    // If we're looking at "selectedPaper" in the details modal, let A be selectedPaper
    // and let B be the matching populated paper from list
    if (!selectedPaper) return;
    const fullSecond = papers.find(p => p.paper_id === secondPaperPartial.paper_id);
    if (fullSecond) {
      setComparePaperA(selectedPaper);
      setComparePaperB(fullSecond);
      setSelectedPaper(null); // Close modal
    }
  };

  const handleInitializeComparison = (p1: PopulatedPaper, p2: PopulatedPaper) => {
    setComparePaperA(p1);
    setComparePaperB(p2);
  };

  return (
    <div className="h-screen bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden antialiased">
      
      {/* PROFESSIONAL POLISH UPPER HEADER BAR */}
      <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-xs">
        <div className="flex items-center gap-3 select-none">
          <div className="w-10 h-10 bg-indigo-600 rounded flex items-center justify-center text-white font-bold shadow-sm">
            <Network size={22} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-lg font-bold tracking-tight text-slate-800">ScholarSync</span>
              <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded uppercase tracking-wider border border-indigo-100 font-mono">
                v2.5
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              AI Relational Metadata Network
            </p>
          </div>
        </div>

        {/* Header Right Actions & Identity */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleManualRecompute}
            className="p-1.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-700 hover:text-slate-950 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all select-none"
            title="Manually recompute TF-IDF indices for all papers"
          >
            <RefreshCw size={12} className="text-slate-500 animate-spin-slow" /> Recompute TF-IDF
          </button>

          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-3 border-l pl-4 border-slate-200 text-left hover:opacity-85 select-none focus:outline-none focus:ring-0 group cursor-pointer"
              id="profile-dropdown-btn"
            >
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-tight flex items-center justify-end gap-1 group-hover:text-indigo-600 transition-colors">
                  {activeProfile.name}
                  <ChevronDown size={12} className="text-slate-400 group-hover:text-indigo-500 transition-transform duration-200" style={{ transform: isProfileDropdownOpen ? "rotate(180deg)" : "none" }} />
                </div>
                <div className="text-[9px] font-mono text-indigo-600 font-semibold">{activeProfile.email}</div>
              </div>
              <div className={`w-8 h-8 rounded-full ${activeProfile.color} border border-indigo-200/50 flex items-center justify-center text-xs font-bold font-mono shadow-xs`}>
                {activeProfile.initials}
              </div>
            </button>

            {isProfileDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setIsProfileDropdownOpen(false)}
                />
                <div 
                  className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  id="profile-dropdown-menu"
                >
                  <div className="px-4 pb-2.5 border-b border-slate-100 mb-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Active Session Scholar</span>
                    <p className="text-xs font-bold text-slate-800 mt-1">{activeProfile.name}</p>
                    <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">{activeProfile.email}</p>
                    <p className="text-[10px] text-indigo-600 font-medium font-sans mt-1 bg-indigo-50/50 px-2 py-1 rounded border border-indigo-100/30 inline-block">{activeProfile.affiliation}</p>
                  </div>
                  
                  <div className="px-4 py-1.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Switch Identity (Profiles)</span>
                  </div>
                  <div className="space-y-0.5 px-2 max-h-[220px] overflow-y-auto">
                    {ACADEMIC_PROFILES.map((profile) => {
                      const isSelected = profile.email === activeProfile.email;
                      return (
                        <button
                          key={profile.email}
                          onClick={() => {
                            setActiveProfile(profile);
                            setIsProfileDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg flex items-center gap-2.5 transition-all duration-150 cursor-pointer ${
                            isSelected 
                              ? "bg-slate-50 border border-slate-200/60 font-semibold text-slate-900" 
                              : "hover:bg-slate-50 border border-transparent hover:border-slate-100 text-slate-600 hover:text-slate-800"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full ${profile.color} flex items-center justify-center text-xs font-bold font-mono shrink-0 shadow-2xs`}>
                            {profile.initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700 truncate">{profile.name}</span>
                              {isSelected && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full shrink-0" />}
                            </div>
                            <span className="text-[9px] text-slate-500 block truncate">{profile.role}</span>
                            <span className="text-[8px] font-mono text-slate-400 block truncate leading-none mt-0.5">{profile.email}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* CORE FRAMEWORK SPLIT CONTAINER */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* SLEEK PROFESSIONAL POLISH SIDEBAR */}
        <aside className="w-64 bg-slate-900 text-slate-400 flex flex-col p-4 shrink-0 justify-between select-none border-r border-slate-950">
          <div className="space-y-4">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4">Workspace Navigation</div>
            
            <div className="space-y-1">
              <button
                onClick={() => {
                  setActiveTab("dashboard");
                  setComparePaperA(null);
                  setComparePaperB(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-xs font-semibold ${
                  activeTab === "dashboard" && !comparePaperA 
                    ? "bg-indigo-600 text-white shadow-sm font-bold" 
                    : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Layers size={16} />
                <span>Overview & Analytics</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("library");
                  setComparePaperA(null);
                  setComparePaperB(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-xs font-semibold ${
                  activeTab === "library" && !comparePaperA
                    ? "bg-indigo-600 text-white shadow-sm font-bold" 
                    : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText size={16} />
                <span>Papers Library ({papers.length})</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("upload");
                  setComparePaperA(null);
                  setComparePaperB(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-xs font-semibold ${
                  activeTab === "upload" && !comparePaperA
                    ? "bg-indigo-600 text-white shadow-sm font-bold" 
                    : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Upload size={16} />
                <span>Upload & Index</span>
              </button>
            </div>
          </div>

          {/* Database quota gauge panel */}
          <div className="p-4 bg-slate-800/40 border border-slate-800/60 rounded-xl space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DATABASE USAGE</div>
            <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(8, (papers.length / 50) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[9px] font-mono">
              <span>{papers.length} / 50 Pages</span>
              <span>{Math.round(Math.min(100, (papers.length / 50) * 100))}%</span>
            </div>
          </div>
        </aside>

        {/* WORKSPACE CONTENT MAIN STREAM */}
        <main className="flex-1 p-6 overflow-y-auto bg-slate-50 flex flex-col gap-6 min-h-0">
          
          {/* Error notification banner */}
          {error && (
            <div className="bg-red-50 border border-red-150 rounded-lg p-4 text-xs font-mono text-red-600 shrink-0">
              Database Sync Exception: {error}
            </div>
          )}

          {/* Interactive Screen viewport */}
          <div className="flex-1 min-h-0">
            {isLoading && papers.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center h-full py-24 space-y-3">
                <div className="w-12 h-12 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
                <p className="text-xs font-mono text-slate-400">Restoring ScholarSync relational indexes...</p>
              </div>
            ) : (
              (() => {
                // Case-1: Comparative Split View is active
                if (comparePaperA && comparePaperB) {
                  return (
                    <SimilarityInspector
                      paperA={comparePaperA}
                      paperB={comparePaperB}
                      onClose={() => {
                        setComparePaperA(null);
                        setComparePaperB(null);
                      }}
                    />
                  );
                }

                // Case-2: Static tab routing
                switch (activeTab) {
                  case "dashboard":
                    return (
                      <DashboardAnalytics
                        papers={papers}
                        onSelectPaper={(p) => setSelectedPaper(p)}
                        onComparePapers={handleInitializeComparison}
                      />
                    );
                  case "library":
                    return (
                      <LibraryView
                        papers={papers}
                        onSelectPaper={(p) => setSelectedPaper(p)}
                        onDeletePaper={handleDeletePaper}
                      />
                    );
                  case "upload":
                    return <UploadPaper onPaperSaved={handlePaperSaved} activeProfileEmail={activeProfile.email} />;
                  default:
                    return null;
                }
              })()
            )}
          </div>

          {/* Elegant Footer */}
          <footer className="border-t border-slate-200/60 pt-4 text-[10px] font-mono text-slate-400 shrink-0 flex justify-between select-none leading-none">
            <span>ScholarSync Scientific Metadata System &bull; Active Node Cloud-Run</span>
            <span className="hidden sm:inline">Port 3000 Ingress</span>
          </footer>

        </main>
      </div>

      {/* DETAILED OVERLAY POPUP */}
      {selectedPaper && (
        <PaperDetailModal
          paper={selectedPaper}
          papersListCount={papers.length}
          onClose={() => setSelectedPaper(null)}
          onSelectPaper={(p) => setSelectedPaper(p)}
          onCompareWith={handleCompareFromDetails}
        />
      )}

    </div>
  );
}
