/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { ExtractedMetadata, PopulatedPaper } from "../types.js";
import { Upload, FileText, CheckCircle, AlertCircle, Sparkles, Plus, X, Brain, HelpCircle, ArrowRight } from "lucide-react";

interface UploadPaperProps {
  onPaperSaved: (paper: PopulatedPaper) => void;
  activeProfileEmail?: string;
}

const TEMPLATE_PAPERS = [
  {
    name: "Autonomous Solar Microgrids Prompt (TXT)",
    title: "Decentralized Grid Balancing and Dynamic Pricing on Swarm-Controlled Solar Microgrids",
    text: "Decentralized Grid Balancing and Dynamic Pricing on Swarm-Controlled Solar Microgrids\n\nAuthors: Dr. Sylvia Vance (MIT Grid Lab), Dr. Kenji Sato (Univ. of Tokyo)\n\nAbstract: Solar microgrids are increasingly used in rural and decentralized environments, yet their intermittent supply profiles introduce acute grid balancing difficulties. This work models solar microgrid balancing as an autonomous swarm game. Energy flows are negotiated between domestic energy storage cells and community consumption gateways using decentralized smart pricing rules. Our simulation verifies grid balancing performance under high-intensity solar fluctuations. We observe that swarm optimization reduces battery degradation by 18% and mitigates high-demand blackout occurrences by 94%."
  },
  {
    name: "Deep Eye Medicine Transformer (TXT)",
    title: "Deep Vision Transformers for High-Resolution Diabetic Retinopathy Diagnostic Support",
    text: "Deep Vision Transformers for High-Resolution Diabetic Retinopathy Diagnostic Support\n\nAuthors: Dr. Alicia Sterling (Oxford Medical AI), Dr. Richard Park (CMU Computer Vision Center)\n\nAbstract: Automated eye pathology diagnosis requires capturing minute features such as microaneurysms and hemorrhages in high-resolution retina imagery. Vision Transformers (ViT) have shown strong capability but suffer on fine-grain local textures compared to dense convolutions. We propose EyeViT, an optimized vision transformer leveraging localized patch-attention blocks paired with sliding-window convolutions. EyeViT is trained on public ophthalmology datasets. It shows a sensitivity rating of 96.8% and specificity rating of 98.2%, outperforming standard ResNet baselines on early-stage diabetic retinopathy diagnosis."
  }
];

export default function UploadPaper({ onPaperSaved, activeProfileEmail }: UploadPaperProps) {
  const [activeTab, setActiveTab] = useState<"file" | "paste" | "presets">("file");
  const [isDragActive, setIsDragActive] = useState(false);
  
  // Loading pipeline state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Input states
  const [pastedText, setPastedText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Review states: after Gemini parsing, let user examine & correct details
  const [reviewMetadata, setReviewMetadata] = useState<ExtractedMetadata | null>(null);
  const [newAuthorName, setNewAuthorName] = useState("");
  const [newAuthorAff, setNewAuthorAff] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [uploaderEmail, setUploaderEmail] = useState(activeProfileEmail || "parvathareddygeethika@gmail.com");

  React.useEffect(() => {
    if (activeProfileEmail) {
      setUploaderEmail(activeProfileEmail);
    }
  }, [activeProfileEmail]);

  // Drag and drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Convert File to Base64 and send to server
  const processFile = (file: File) => {
    setError(null);
    setIsProcessing(true);
    setProcessingStep("Reading document file contents...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64Content = event.target?.result as string;
        setProcessingStep("Sending to ScholarSync AI for Metadata Extraction...");
        
        const response = await fetch("/api/papers/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileContent: base64Content,
            fileType: file.type || "application/pdf"
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to parse paper.");
        }

        const data: ExtractedMetadata = await response.json();
        setReviewMetadata(data);
        setIsProcessing(false);
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setError("Failed to read the selected file.");
      setIsProcessing(false);
    };

    // If text file, read as text; otherwise as data URL
    if (file.name.endsWith(".txt")) {
      const textReader = new FileReader();
      textReader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          triggerExtraction(text);
        } catch (err: any) {
          setError(err.message || "Failed to process text file.");
          setIsProcessing(false);
        }
      };
      textReader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  // Direct Text analysis engine
  const triggerExtraction = async (text: string) => {
    if (!text.trim()) {
      setError("Please write some research contents to extract.");
      return;
    }
    setError(null);
    setIsProcessing(true);
    setProcessingStep("Parsing text content layout...");

    try {
      setProcessingStep("Invoking Gemini models for full semantic breakdown...");
      const response = await fetch("/api/papers/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textContent: text })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Parser connection errored.");
      }

      const data: ExtractedMetadata = await response.json();
      setReviewMetadata(data);
    } catch (err: any) {
      setError(err.message || "An exception occurred during citation analysis.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Preset selector
  const triggerTemplate = (text: string) => {
    setPastedText(text);
    triggerExtraction(text);
  };

  // Review Edit Functions
  const handleAddAuthor = () => {
    if (!newAuthorName.trim() || !reviewMetadata) return;
    const updatedAuthors = [...reviewMetadata.authors, { name: newAuthorName.trim(), affiliation: newAuthorAff.trim() || "Independent Scholar" }];
    setReviewMetadata({ ...reviewMetadata, authors: updatedAuthors });
    setNewAuthorName("");
    setNewAuthorAff("");
  };

  const handleRemoveAuthor = (index: number) => {
    if (!reviewMetadata) return;
    const updatedAuthors = reviewMetadata.authors.filter((_, idx) => idx !== index);
    setReviewMetadata({ ...reviewMetadata, authors: updatedAuthors });
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim() || !reviewMetadata) return;
    if (reviewMetadata.keywords.includes(newKeyword.trim().toLowerCase())) return;
    const updatedKws = [...reviewMetadata.keywords, newKeyword.trim().toLowerCase()];
    setReviewMetadata({ ...reviewMetadata, keywords: updatedKws });
    setNewKeyword("");
  };

  const handleRemoveKeyword = (kw: string) => {
    if (!reviewMetadata) return;
    const updatedKws = reviewMetadata.keywords.filter(k => k !== kw);
    setReviewMetadata({ ...reviewMetadata, keywords: updatedKws });
  };

  // Save Approved Details to Relational RelStore
  const handleConfirmAndSave = async () => {
    if (!reviewMetadata) return;
    setIsProcessing(true);
    setProcessingStep("Saving metadata records and computing TF-IDF matrices...");

    try {
      const response = await fetch("/api/papers/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: reviewMetadata,
          uploaderEmail
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Save execution failed.");
      }

      const result = await response.json();
      onPaperSaved(result.paper);
      setReviewMetadata(null); // Clear state
    } catch (err: any) {
      setError(err.message || "Failed to commit changes.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="border-b border-slate-100 pb-4 mb-6">
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
          <Brain className="text-indigo-600" size={22} />
          ScholarSync Indexing Terminal
        </h2>
        <p className="text-sm text-slate-500">
          Upload research publications in PDF or TXT formats, or paste text. Our dual Gemini parser extracts metadata while computing TF-IDF vector overlays.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-semibold text-red-800">Processing Interrupted</h4>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Screen Overlay */}
      {isProcessing && (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
            <Sparkles className="absolute inset-0 m-auto text-indigo-500 animate-pulse" size={24} />
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-800 font-medium">{processingStep}</p>
            <p className="text-xs text-slate-400">Computing matrices, extraction, and academic connections</p>
          </div>
        </div>
      )}

      {!isProcessing && !reviewMetadata && (
        <div className="space-y-6">
          {/* Tab Selector */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab("file")}
              className={`pb-2.5 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "file" 
                  ? "border-indigo-600 text-indigo-600 font-semibold" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              PDF or TXT Upload
            </button>
            <button
              onClick={() => setActiveTab("paste")}
              className={`pb-2.5 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "paste" 
                  ? "border-indigo-600 text-indigo-600 font-semibold" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Paste Paper Text
            </button>
            <button
              onClick={() => setActiveTab("presets")}
              className={`pb-2.5 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "presets" 
                  ? "border-indigo-600 text-indigo-600 font-semibold" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Quick Test Presets
            </button>
          </div>

          {/* Tab Content: File Selector */}
          {activeTab === "file" && (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                isDragActive 
                  ? "border-indigo-500 bg-indigo-50/40" 
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                  <Upload size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-800">
                    Drag and drop your research paper here
                  </p>
                  <p className="text-xs text-slate-400">
                    Supports PDF and plain TXT, up to 15MB
                  </p>
                </div>
                <button
                  type="button"
                  className="px-4 py-1.5 text-xs bg-indigo-600 text-white rounded-lg font-medium shadow-sm hover:bg-indigo-700 transition-colors"
                >
                  Browse File
                </button>
              </div>
            </div>
          )}

          {/* Tab Content: Paste Text */}
          {activeTab === "paste" && (
            <div className="space-y-3">
              <textarea
                className="w-full text-slate-800 text-xs font-mono p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none min-h-[220px]"
                placeholder="Paste the title, author index, abstract, and paper text body..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
              />
              <div className="flex justify-end">
                <button
                  onClick={() => triggerExtraction(pastedText)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Brain size={14} /> Parse with Scholar-AI
                </button>
              </div>
            </div>
          )}

          {/* Tab Content: Presets */}
          {activeTab === "presets" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEMPLATE_PAPERS.map((tpl, i) => (
                <div
                  key={i}
                  className="border border-slate-200 rounded-xl p-5 hover:border-indigo-200 hover:bg-indigo-50/10 transition-all cursor-pointer flex flex-col justify-between"
                  onClick={() => triggerTemplate(tpl.text)}
                >
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 mb-2 font-mono">
                      <FileText size={14} /> PRESET {i+1}
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mb-1">{tpl.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">
                      {tpl.text.split("\n\n")[2] || tpl.text}
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                    Instantly load & parse <ArrowRight size={12} className="ml-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* METADATA REVIEW WORKSPACE */}
      {!isProcessing && reviewMetadata && (
        <div className="space-y-6">
          <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="text-indigo-600 mt-0.5 shrink-0" size={20} />
            <div>
              <h3 className="text-sm font-semibold text-indigo-900">Extracted AI Metadata Review</h3>
              <p className="text-xs text-indigo-700/80 mt-0.5">
                Our Gemini parser has isolated coordinates and evaluated plagiarism indicators. Overwrite, delete, or refine elements below prior to joining the library database.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Box: Title + Abstract */}
            <div className="lg:col-span-7 space-y-4 border-r border-slate-100 pr-0 lg:pr-6">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Paper Title</label>
                <input
                  type="text"
                  className="w-full text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={reviewMetadata.title}
                  onChange={(e) => setReviewMetadata({ ...reviewMetadata, title: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Abstract Representation</label>
                <textarea
                  className="w-full text-xs text-slate-600 leading-relaxed bg-white border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[160px]"
                  value={reviewMetadata.abstract}
                  onChange={(e) => setReviewMetadata({ ...reviewMetadata, abstract: e.target.value })}
                />
              </div>

              {/* Plagiarism Meter Panel */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-semibold text-slate-700">Simulated Plagiarism Index</h4>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    reviewMetadata.plagiarism_percentage >= 50 
                      ? "bg-red-50 text-red-700 border border-red-100"
                      : reviewMetadata.plagiarism_percentage >= 20
                      ? "bg-amber-50 text-amber-700 border border-amber-100"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  }`}>
                    {reviewMetadata.plagiarism_percentage}% MATCH
                  </span>
                </div>
                
                {/* Horizontal Progress Gauge */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      reviewMetadata.plagiarism_percentage >= 50 
                        ? "bg-red-500"
                        : reviewMetadata.plagiarism_percentage >= 20
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${reviewMetadata.plagiarism_percentage}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  <strong>Source Report:</strong> {reviewMetadata.plagiarism_report}
                </p>
              </div>
            </div>

            {/* Right Box: Authors, Keywords, Recommendations */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* Target Uploader Identity */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Indexing In Behalf Of</label>
                <input
                  type="email"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                  value={uploaderEmail}
                  onChange={(e) => setUploaderEmail(e.target.value)}
                  placeholder="Researcher email"
                />
              </div>

              {/* Authors List Controller */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-slate-400 uppercase font-semibold block">Author and Affiliation Registry</label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {reviewMetadata.authors.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No registered authors. Add below.</p>
                  ) : (
                    reviewMetadata.authors.map((auth, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2 rounded-lg text-xs">
                        <div className="truncate pr-2">
                          <span className="font-semibold text-slate-700">{auth.name}</span>
                          <span className="text-slate-400 block text-[10px] truncate">{auth.affiliation}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAuthor(idx)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-100/40 rounded"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Author Small Form */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="Author name"
                    className="p-1 px-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-indigo-500"
                    value={newAuthorName}
                    onChange={(e) => setNewAuthorName(e.target.value)}
                  />
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Affiliation"
                      className="p-1 px-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-indigo-500 flex-1"
                      value={newAuthorAff}
                      onChange={(e) => setNewAuthorAff(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleAddAuthor}
                      className="p-1 px-2 bg-slate-100 border border-slate-200 text-slate-600 rounded text-xs hover:bg-indigo-50 hover:text-indigo-600 transition"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Keywords Tag Belt */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-slate-400 uppercase font-semibold block">Conceptual Tags / Keywords</label>
                <div className="flex flex-wrap gap-1">
                  {reviewMetadata.keywords.map(kw => (
                    <span 
                      key={kw} 
                      className="text-[10px] bg-slate-100 text-slate-700 rounded-full px-2 py-0.5 inline-flex items-center gap-1 capitalize"
                    >
                      {kw}
                      <button type="button" onClick={() => handleRemoveKeyword(kw)} className="text-slate-400 hover:text-red-500">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="New keyword tag..."
                    className="p-1 px-2 text-xs border border-slate-200 rounded flex-1 focus:outline-none focus:border-indigo-500"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddKeyword(); }}
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-xs rounded hover:bg-slate-200"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Conference Recommendations Visual list */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-slate-400 uppercase font-semibold block">Recommended Publishing Channels</label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {reviewMetadata.conference_recommendations.map((rec, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">{rec.conference_name}</span>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {Math.floor(rec.confidence * 100)}% Match
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-sans line-clamp-2">
                        {rec.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Action Row */}
          <div className="border-t border-slate-100 pt-5 flex justify-between items-center">
            <button
              onClick={() => setReviewMetadata(null)}
              className="px-4 py-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Cancel and discard
            </button>
            <button
              onClick={handleConfirmAndSave}
              className="px-5 py-2 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm font-semibold flex items-center gap-1.5 transition-all"
            >
              <CheckCircle size={14} /> Establish and Save Paper
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
