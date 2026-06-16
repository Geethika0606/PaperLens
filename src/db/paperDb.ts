import fs from "fs";
import path from "path";
import { 
  User, Paper, Author, Keyword, 
  PaperAuthor, PaperKeyword, SimilarityScore, 
  ConferenceRecommendation, PopulatedPaper, ExtractedMetadata 
} from "../types.js";

// Database storage structure
interface RelationalDatabase {
  users: User[];
  papers: Paper[];
  authors: Author[];
  keywords: Keyword[];
  paper_authors: PaperAuthor[];
  paper_keywords: PaperKeyword[];
  similarity_scores: SimilarityScore[];
  conference_recommendations: ConferenceRecommendation[];
}

const DB_FILE_PATH = path.join(process.cwd(), "src", "db", "papers_db.json");

// Static Stopwords to prune text for proper TF-IDF calculations
const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "arent", 
  "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "cant", 
  "cannot", "could", "couldnt", "did", "didnt", "do", "does", "doesnt", "doing", "dont", "down", "during", 
  "each", "few", "for", "from", "further", "had", "hadnt", "has", "hasnt", "have", "havent", "having", "he", 
  "hed", "hell", "hes", "her", "here", "heres", "hers", "herself", "him", "himself", "his", "how", "hows", 
  "i", "id", "ill", "im", "ive", "if", "in", "into", "is", "isnt", "it", "its", "itself", "lets", "me", "more", 
  "most", "mustnt", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", 
  "our", "ours", "ourselves", "out", "over", "own", "same", "shant", "she", "shed", "shell", "shes", "should", 
  "shouldnt", "so", "some", "such", "than", "that", "thats", "the", "their", "theirs", "them", "themselves", 
  "then", "there", "theres", "these", "they", "theyd", "theyll", "theyre", "theyve", "this", "those", "through", 
  "to", "too", "under", "until", "up", "very", "was", "wasnt", "we", "wed", "well", "were", "weve", "werent", 
  "what", "whats", "when", "whens", "where", "wheres", "which", "while", "who", "whos", "whom", "why", "whys", 
  "with", "wont", "would", "wouldnt", "you", "youd", "youll", "youre", "youve", "your", "yours", "yourself", "yourselves"
]);

// Initial seed data representing elegant research works
const INITIAL_DB: RelationalDatabase = {
  users: [
    {
      user_id: "u-1",
      name: "Geethika Parvathareddy",
      email: "parvathareddygeethika@gmail.com",
      role: "admin"
    },
    {
      user_id: "u-2",
      name: "Dr. Kenji Sato",
      email: "k.sato@academy.edu",
      role: "researcher"
    },
    {
      user_id: "u-3",
      name: "Dr. Lisa Thompson",
      email: "lisa.t@researchlab.org",
      role: "researcher"
    }
  ],
  papers: [
    {
      paper_id: "p-1",
      title: "Deep Quantum Neural Networks for Entangled Molecular Simulation",
      abstract: "We introduce a novel architecture based on Deep Quantum Neural Networks (DQNN) designed explicitly to simulate entangled molecular structures. Understanding quantum chemical bonding and electron distribution has been historically intractable for classical compute due to exponential Hilbert space scaling. Our models utilize parameterized quantum gates optimized through classical-quantum hybrid neural pipelines to predict multi-electron energy surfaces. Empirical evaluations show a 32% increase in precision compared to classical variational quantum eigensolvers, establishing a new boundary for molecular mechanics, catalysis synthesis, and quantum materials discovery.",
      full_text: "Full text of Deep Quantum Neural Networks for Entangled Molecular Simulation. We intro quantum circuits...",
      upload_date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), // 10 days ago
      user_id: "u-3",
      plagiarism_percentage: 12.5,
      plagiarism_report: "Low plagiarism detected. 12.5% overlap with known quantum circuit frameworks on GitHub repositories."
    },
    {
      paper_id: "p-2",
      title: "ClimateNet: Distributed Deep Learning Framework for Global Heatwave and Flood Forecasting",
      abstract: "Global warming has increased the intensity and frequency of severe climate occurrences. Classical meteorological calculations require weeks of supercomputing power, rendering real-time predictions ineffective. We present ClimateNet: a distributed deep learning framework leveraging continuous graph spatial-temporal convolutions for immediate weather anomaly and heatwave modeling. By feeding high-resolution satellite temperature, humidity, and barometric inputs into our models, we identify climatic patterns days before they emerge. ClimateNet demonstrates unprecedented reliability, predicting major European flood stages with 92% sensitivity.",
      full_text: "Full text of ClimateNet, weather grids, and supercomputing comparisons...",
      upload_date: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(), // 7 days ago
      user_id: "u-2",
      plagiarism_percentage: 4.8,
      plagiarism_report: "Minimal plagiarism detected. Minor matches of 4.8% on standard meteorological definitions."
    },
    {
      paper_id: "p-3",
      title: "Reinforcement Learning with Large Language Models for Scalable Robotic Swarm Operations",
      abstract: "Managing robotic swarms requires complex coordinate alignments and immediate adjustments. Traditionally, decentralized control algorithms are hand-crafted or computed via model predictive pipelines, lacking adaptiveness for dynamic obstacles. This paper describes RoboSwarm, a reinforcement learning approach guided by Large Language Models (LLMs). The LLM functions as a high-level strategic planner, translating natural language tasks into localized dense reward matrices. These rewards guide low-level reinforcement learning agents control loops. Our evaluations verify superior navigation efficiency, dynamic threat avoidance, and collective swarm coordinate tasks.",
      full_text: "Full text of RoboSwarm, including reward matrix structures and simulation metrics...",
      upload_date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), // 5 days ago
      user_id: "u-2",
      plagiarism_percentage: 28.3,
      plagiarism_report: "Moderate plagiarism detected (28.3%). Portions of the reward shaping explanations share sentence design with standard RL literature."
    },
    {
      paper_id: "p-4",
      title: "Adaptive Prompt Tuning and Reasoning Chain Optimization in Zero-Shot Multi-Modal Visual Models",
      abstract: "Zero-shot visual translation requires aligning text embeddings with pixel matrices. Adaptive Prompt Tuning (APT) optimizes visual templates dynamically based on input context without full weight recomputations. We describe Reasoning Chain Tuning (RCT) which encourages multi-modal networks to construct logical proofs about visual attributes before outputting classifications. Standard vision models suffer from hallucinations in complex reasoning tests, which RCT resolves by forcing a step-by-step verification pipeline. We observe a 14% improvement in zero-shot classification on complex visual scenes.",
      full_text: "Full text of Adaptive Prompt Tuning and multi-modal classification metrics...",
      upload_date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      user_id: "u-3",
      plagiarism_percentage: 7.2,
      plagiarism_report: "Very low plagiarism. Standard definitions of prompt fine-tuning accounted for the minor 7.2% similarity."
    },
    {
      paper_id: "p-5",
      title: "Securing Edge IoT Swarms using Decentralized Consensus and Homomorphic Encryption structures",
      abstract: "The integration of Edge Internet of Things (IoT) swarms in industrial automation introduces critical cybersecurity vectors. Nodes are vulnerable to state injection and man-in-the-middle exploits. We propose SecureSwarms, an architecture fusing decentralized lightweight consensus with fully homomorphic encryption structures. To maintain energy efficiency, we craft an optimized mathematical consensus protocol designed for low-power edge gateways. By utilizing homomorphic cryptography, central coordinators parse state vectors and calculate average statistics directly on encrypted data without ever exposing sensitive operations, ensuring total system trust.",
      full_text: "Full text of SecureSwarms cryptography and network metrics...",
      upload_date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      user_id: "u-1",
      plagiarism_percentage: 67.4,
      plagiarism_report: "HIGH PLAGIARISM WARNING (67.4%). Massive textual overlaps with homomorphic encryption templates and edge computing papers. Check reference guidelines."
    }
  ],
  authors: [
    { author_id: "a-1", name: "Dr. Kenneth Vance", affiliation: "MIT Departments of Quantum Physics" },
    { author_id: "a-2", name: "Dr. Lisa Thompson", affiliation: "Stanford Artificial Intelligence Lab" },
    { author_id: "a-3", name: "Dr. Maria Alvarez", affiliation: "UC Berkeley Meteorological Department" },
    { author_id: "a-4", name: "Dr. Kenji Sato", affiliation: "University of Tokyo Robotics Lab" },
    { author_id: "a-5", name: "Dr. Clara Dupont", affiliation: "ETH Zurich Security and Controls Lab" },
    { author_id: "a-6", name: "Dr. Kevin Zheng", affiliation: "Carnegie Mellon University" },
    { author_id: "a-7", name: "Dr. Alicia Sterling", affiliation: "Oxford Cyber Informatics" }
  ],
  keywords: [
    { keyword_id: "k-1", keyword_text: "quantum computing" },
    { keyword_id: "k-2", keyword_text: "neural networks" },
    { keyword_id: "k-3", keyword_text: "molecular simulation" },
    { keyword_id: "k-4", keyword_text: "deep learning" },
    { keyword_id: "k-5", keyword_text: "chemistry" },
    { keyword_id: "k-6", keyword_text: "climate" },
    { keyword_id: "k-7", keyword_text: "weather forecasting" },
    { keyword_id: "k-8", keyword_text: "reinforcement learning" },
    { keyword_id: "k-9", keyword_text: "large language models" },
    { keyword_id: "k-10", keyword_text: "robotics" },
    { keyword_id: "k-11", keyword_text: "robotic swarms" },
    { keyword_id: "k-12", keyword_text: "prompt tuning" },
    { keyword_id: "k-13", keyword_text: "reasoning chain" },
    { keyword_id: "k-14", keyword_text: "visual models" },
    { keyword_id: "k-15", keyword_text: "homomorphic encryption" },
    { keyword_id: "k-16", keyword_text: "consensus" },
    { keyword_id: "k-17", keyword_text: "edge iot" }
  ],
  paper_authors: [
    { paper_id: "p-1", author_id: "a-1" },
    { paper_id: "p-1", author_id: "a-2" },
    { paper_id: "p-2", author_id: "a-3" },
    { paper_id: "p-2", author_id: "a-4" },
    { paper_id: "p-3", author_id: "a-4" },
    { paper_id: "p-3", author_id: "a-5" },
    { paper_id: "p-4", author_id: "a-2" },
    { paper_id: "p-4", author_id: "a-6" },
    { paper_id: "p-5", author_id: "a-5" },
    { paper_id: "p-5", author_id: "a-7" }
  ],
  paper_keywords: [
    { paper_id: "p-1", keyword_id: "k-1" },
    { paper_id: "p-1", keyword_id: "k-2" },
    { paper_id: "p-1", keyword_id: "k-3" },
    { paper_id: "p-1", keyword_id: "k-4" },
    { paper_id: "p-1", keyword_id: "k-5" },
    { paper_id: "p-2", keyword_id: "k-4" },
    { paper_id: "p-2", keyword_id: "k-6" },
    { paper_id: "p-2", keyword_id: "k-7" },
    { paper_id: "p-3", keyword_id: "k-8" },
    { paper_id: "p-3", keyword_id: "k-9" },
    { paper_id: "p-3", keyword_id: "k-10" },
    { paper_id: "p-3", keyword_id: "k-11" },
    { paper_id: "p-4", keyword_id: "k-2" },
    { paper_id: "p-4", keyword_id: "k-4" },
    { paper_id: "p-4", keyword_id: "k-12" },
    { paper_id: "p-4", keyword_id: "k-13" },
    { paper_id: "p-4", keyword_id: "k-14" },
    { paper_id: "p-5", keyword_id: "k-15" },
    { paper_id: "p-5", keyword_id: "k-16" },
    { paper_id: "p-5", keyword_id: "k-17" }
  ],
  similarity_scores: [
    // Pre-calculated or automatically calculated in subsequent bootstrap routine
  ],
  conference_recommendations: [
    { paper_id: "p-1", conference_name: "IEEE International Conference on Quantum Computing (QCS)", rank: 1, confidence: 0.94, reason: "Excellent match for parameterized quantum circuits and multi-electron energy surfaces." },
    { paper_id: "p-1", conference_name: "Journal of Chemical Theory and Computation", rank: 2, confidence: 0.88, reason: "High relevance to molecular simulations and quantum materials discovery." },
    { paper_id: "p-2", conference_name: "ACM SIGKDD Conference on Knowledge Discovery and Data Mining", rank: 1, confidence: 0.91, reason: "Direct application of spatial-temporal convolutions to historical meteorology datasets." },
    { paper_id: "p-2", conference_name: "Nature Climate Change", rank: 2, confidence: 0.85, reason: "Significant real-world implication for predictive global heatwave modeling." },
    { paper_id: "p-3", conference_name: "International Conference on Intelligent Robots and Systems (IROS)", rank: 1, confidence: 0.95, reason: "Ideal venue for collective robotic swarms controlled via LLM reward pipelines." },
    { paper_id: "p-3", conference_name: "Neural Information Processing Systems (NeurIPS)", rank: 2, confidence: 0.82, reason: "Applicable to advanced multi-agent reinforcement learning reward-shaping methodologies." },
    { paper_id: "p-4", conference_name: "IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR)", rank: 1, confidence: 0.93, reason: "Spot-on visual classification improvement via step-by-step token verification chains." },
    { paper_id: "p-4", conference_name: "International Conference on Learning Representations (ICLR)", rank: 2, confidence: 0.89, reason: "Core learning optimization focused on zero-shot Visual-Language prompt layouts." },
    { paper_id: "p-5", conference_name: "IEEE Transactions on Information Forensics and Security", rank: 1, confidence: 0.92, reason: "Tailored to homomorphic cryptography applications inside Edge IoT and industrial swarm grids." },
    { paper_id: "p-5", conference_name: "ACM Conference on Computer and Communications Security (CCS)", rank: 2, confidence: 0.86, reason: "Deep consensus analysis under edge gateways with power constraints." }
  ]
};

export class RelationalPaperDb {
  private data: RelationalDatabase = { ...INITIAL_DB };

  constructor() {
    this.init();
  }

  private init() {
    // Check if folder exists
    const dbDir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Try reading existing DB
    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE_PATH, "utf-8");
        this.data = JSON.parse(fileContent);
      } catch (err) {
        console.error("Failed to parse DB, using seeds:", err);
        this.data = { ...INITIAL_DB };
        this.saveToDisk();
      }
    } else {
      this.data = { ...INITIAL_DB };
      this.recalculateAllSimilarities(); // Populate initial paper similarities
      this.saveToDisk();
    }
  }

  private saveToDisk() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("Error writing DB to disk:", err);
    }
  }

  // Pure TF-IDF + Cosine Similarity computation
  public recalculateAllSimilarities() {
    const papers = this.data.papers;
    if (papers.length <= 1) {
      this.data.similarity_scores = [];
      return;
    }

    // Combine titles, abstracts, and metadata topics to make rich comparison strings
    const docCorpus = papers.map(paper => {
      // Find keywords for this paper to add conceptual weight
      const kwIds = this.data.paper_keywords
        .filter(pk => pk.paper_id === paper.paper_id)
        .map(pk => pk.keyword_id);
      const kws = this.data.keywords
        .filter(k => kwIds.includes(k.keyword_id))
        .map(k => k.keyword_text)
        .join(" ");

      return {
        id: paper.paper_id,
        text: `${paper.title} ${paper.abstract} ${kws}`.toLowerCase()
      };
    });

    // 1. Tokenize and clean text
    const docsTokens = docCorpus.map(doc => {
      const words = doc.text
        .replace(/[^a-z0-9\s]/g, " ") // Clean punctuation
        .split(/\s+/)
        .filter(w => w.length > 2 && !STOP_WORDS.has(w));
      return { id: doc.id, words };
    });

    // 2. Compute Document Frequencies (DF)
    const dfMap: Record<string, number> = {};
    docsTokens.forEach(doc => {
      const uniqueWords = new Set(doc.words);
      uniqueWords.forEach(w => {
        dfMap[w] = (dfMap[w] || 0) + 1;
      });
    });

    // 3. Compute Inverse Document Frequencies (IDF)
    const N = papers.length;
    const idfMap: Record<string, number> = {};
    Object.keys(dfMap).forEach(word => {
      // Smoothed IDF
      idfMap[word] = Math.log(1 + N / dfMap[word]);
    });

    // 4. Compute TF-IDF Vectors for each paper
    const vectors: Record<string, Record<string, number>> = {};
    docsTokens.forEach(doc => {
      const tfMap: Record<string, number> = {};
      doc.words.forEach(w => {
        tfMap[w] = (tfMap[w] || 0) + 1;
      });

      const tfIdfs: Record<string, number> = {};
      Object.keys(tfMap).forEach(word => {
        const tf = tfMap[word] / doc.words.length; // Normalized TF
        const idf = idfMap[word] || 0;
        tfIdfs[word] = tf * idf;
      });
      vectors[doc.id] = tfIdfs;
    });

    // 5. Compute pairwise Cosine Similarities
    const newScores: SimilarityScore[] = [];

    for (let i = 0; i < papers.length; i++) {
      for (let j = i + 1; j < papers.length; j++) {
        const id1 = papers[i].paper_id;
        const id2 = papers[j].paper_id;
        const vec1 = vectors[id1];
        const vec2 = vectors[id2];

        // Dot product
        let dotProduct = 0;
        const uniqueWords = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
        uniqueWords.forEach(word => {
          dotProduct += (vec1[word] || 0) * (vec2[word] || 0);
        });

        // Norms
        let norm1 = 0;
        Object.keys(vec1).forEach(w => { norm1 += vec1[w] * vec1[w]; });
        norm1 = Math.sqrt(norm1);

        let norm2 = 0;
        Object.keys(vec2).forEach(w => { norm2 += vec2[w] * vec2[w]; });
        norm2 = Math.sqrt(norm2);

        const similarity = (norm1 > 0 && norm2 > 0) ? (dotProduct / (norm1 * norm2)) : 0;

        newScores.push({
          paper1_id: id1,
          paper2_id: id2,
          score: Math.min(similarity, 1.0)
        });
      }
    }

    this.data.similarity_scores = newScores;
  }

  // Retrieve complete papers aggregated with all authors, keywords, similarity scoring metrics
  public getPopulatedPapers(): PopulatedPaper[] {
    return this.data.papers.map(paper => {
      // Match Authors
      const authorIds = this.data.paper_authors
        .filter(pa => pa.paper_id === paper.paper_id)
        .map(pa => pa.author_id);
      const authorRecords = this.data.authors.filter(a => authorIds.includes(a.author_id));

      // Match Keywords
      const keywordIds = this.data.paper_keywords
        .filter(pk => pk.paper_id === paper.paper_id)
        .map(pk => pk.keyword_id);
      const keywordRecords = this.data.keywords.filter(k => keywordIds.includes(k.keyword_id));

      // Match Similarity Scores
      const similarityRecords = this.data.similarity_scores
        .filter(s => s.paper1_id === paper.paper_id || s.paper2_id === paper.paper_id)
        .map(s => {
          const targetId = s.paper1_id === paper.paper_id ? s.paper2_id : s.paper1_id;
          const targetPaper = this.data.papers.find(p => p.paper_id === targetId);
          return {
            target_paper_id: targetId,
            target_title: targetPaper?.title || "Unknown Paper",
            score: s.score
          };
        })
        .sort((a, b) => b.score - a.score);

      // Match Conference Recommendations
      const recommendations = this.data.conference_recommendations.filter(cr => cr.paper_id === paper.paper_id);

      // Match User Object
      const uploaded_by = this.data.users.find(u => u.user_id === paper.user_id);

      return {
        ...paper,
        author_records: authorRecords,
        keyword_records: keywordRecords,
        similarity_records: similarityRecords,
        recommendations,
        uploaded_by
      };
    });
  }

  public getAuthors(): Author[] {
    return this.data.authors;
  }

  public getKeywords(): Keyword[] {
    return this.data.keywords;
  }

  public getUsers(): User[] {
    return this.data.users;
  }

  // Relational storage pipeline to save new research papers
  public saveMetadataAndRecalculate(metadata: ExtractedMetadata, uploaderEmail: string): PopulatedPaper {
    // 1. Create or retrieve User reference
    let user = this.data.users.find(u => u.email.toLowerCase() === uploaderEmail.toLowerCase());
    if (!user) {
      user = {
        user_id: `u-${Date.now()}`,
        name: uploaderEmail.split("@")[0].toUpperCase(),
        email: uploaderEmail,
        role: "researcher"
      };
      this.data.users.push(user);
    }

    // 2. Setup Paper entry
    const paper_id = `p-${Date.now()}`;
    const newPaper: Paper = {
      paper_id,
      title: metadata.title,
      abstract: metadata.abstract,
      full_text: metadata.full_text || "",
      upload_date: new Date().toISOString(),
      user_id: user.user_id,
      plagiarism_percentage: metadata.plagiarism_percentage,
      plagiarism_report: metadata.plagiarism_report || "No plagiarism metadata generated."
    };
    this.data.papers.push(newPaper);

    // 3. Setup Author linkages
    metadata.authors.forEach(auth => {
      let existingAuthor = this.data.authors.find(
        a => a.name.toLowerCase() === auth.name.toLowerCase()
      );
      if (!existingAuthor) {
        existingAuthor = {
          author_id: `a-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: auth.name,
          affiliation: auth.affiliation || "Independent Scholar"
        };
        this.data.authors.push(existingAuthor);
      }
      this.data.paper_authors.push({
        paper_id,
        author_id: existingAuthor.author_id
      });
    });

    // 4. Setup Keywords links
    metadata.keywords.forEach(keywordText => {
      const cleanKw = keywordText.toLowerCase().trim();
      if (!cleanKw) return;
      let existingKw = this.data.keywords.find(
        k => k.keyword_text.toLowerCase() === cleanKw
      );
      if (!existingKw) {
        existingKw = {
          keyword_id: `k-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          keyword_text: cleanKw
        };
        this.data.keywords.push(existingKw);
      }
      this.data.paper_keywords.push({
        paper_id,
        keyword_id: existingKw.keyword_id
      });
    });

    // 5. Setup Recommendations
    metadata.conference_recommendations.forEach((rec, idx) => {
      this.data.conference_recommendations.push({
        paper_id,
        conference_name: rec.conference_name,
        rank: rec.rank || (idx + 1),
        confidence: rec.confidence,
        reason: rec.reason
      });
    });

    // 6. Regenerate relational similarities with the addition of the new paper
    this.recalculateAllSimilarities();

    this.saveToDisk();

    // Return the aggregates of this newly saved paper
    const populated = this.getPopulatedPapers().find(p => p.paper_id === paper_id);
    if (!populated) {
      throw new Error("Relational assembly failed.");
    }
    return populated;
  }

  public deletePaper(paper_id: string) {
    // Cascade actions manually mirroring PostgreSQL
    this.data.papers = this.data.papers.filter(p => p.paper_id !== paper_id);
    this.data.paper_authors = this.data.paper_authors.filter(pa => pa.paper_id !== paper_id);
    this.data.paper_keywords = this.data.paper_keywords.filter(pkw => pkw.paper_id !== paper_id);
    this.data.conference_recommendations = this.data.conference_recommendations.filter(cr => cr.paper_id !== paper_id);
    this.data.similarity_scores = this.data.similarity_scores.filter(
      s => s.paper1_id !== paper_id && s.paper2_id !== paper_id
    );

    // Filter orphaned authors / keywords that aren't linked to any paper
    const activeAuthorIds = new Set(this.data.paper_authors.map(pa => pa.author_id));
    this.data.authors = this.data.authors.filter(a => activeAuthorIds.has(a.author_id));

    const activeKeywordIds = new Set(this.data.paper_keywords.map(pkw => pkw.keyword_id));
    this.data.keywords = this.data.keywords.filter(k => activeKeywordIds.has(k.keyword_id));

    this.recalculateAllSimilarities();
    this.saveToDisk();
  }
}
