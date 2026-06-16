/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  user_id: string;
  name: string;
  email: string;
  role: string;
}

export interface Paper {
  paper_id: string;
  title: string;
  abstract: string;
  full_text?: string;
  upload_date: string;
  user_id: string;
  plagiarism_percentage: number;
  plagiarism_report?: string;
}

export interface Author {
  author_id: string;
  name: string;
  affiliation: string;
}

export interface Keyword {
  keyword_id: string;
  keyword_text: string;
}

export interface PaperAuthor {
  paper_id: string;
  author_id: string;
}

export interface PaperKeyword {
  paper_id: string;
  keyword_id: string;
}

export interface SimilarityScore {
  paper1_id: string;
  paper2_id: string;
  score: number;
}

export interface ConferenceRecommendation {
  paper_id: string;
  conference_name: string;
  rank: number;
  confidence: number; // 0.0 to 1.0
  reason: string;
}

// Frontend response aggregates for easy consumption
export interface PopulatedPaper extends Paper {
  author_records: Author[];
  keyword_records: Keyword[];
  similarity_records: Array<{
    target_paper_id: string;
    target_title: string;
    score: number;
  }>;
  recommendations: ConferenceRecommendation[];
  uploaded_by?: User;
}

// Backend upload response/state matching
export interface ExtractedMetadata {
  title: string;
  abstract: string;
  full_text?: string;
  authors: Array<{ name: string; affiliation: string }>;
  keywords: string[];
  plagiarism_percentage: number;
  plagiarism_report?: string;
  conference_recommendations: Array<{
    conference_name: string;
    rank: number;
    confidence: number;
    reason: string;
  }>;
}
