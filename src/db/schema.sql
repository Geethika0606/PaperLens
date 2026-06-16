-- ScholarSync Database Schema Blueprint (PostgreSQL)
-- This file defines the full schema, relations, indices, full-text search configurations, 
-- and stored procedures for similarity computation or analytical queries.

-- Enable helpful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE Users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'researcher' CHECK (role IN ('researcher', 'reviewer', 'admin'))
);

-- 2. Papers Table
CREATE TABLE Papers (
    paper_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    abstract TEXT NOT NULL,
    full_text TEXT,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    plagiarism_percentage DECIMAL(5, 2) DEFAULT 0.0 CHECK (plagiarism_percentage >= 0.0 AND plagiarism_percentage <= 100.0),
    plagiarism_report TEXT,
    
    -- Full-text search vector column
    search_vector TSVECTOR
);

-- 3. Authors Table
CREATE TABLE Authors (
    author_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    affiliation VARCHAR(255) DEFAULT 'Independent Researcher'
);

-- 4. Keywords Table
CREATE TABLE Keywords (
    keyword_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    keyword_text VARCHAR(100) UNIQUE NOT NULL
);

-- 5. Paper_Authors Table (Many-to-Many Connection)
CREATE TABLE Paper_Authors (
    paper_id UUID NOT NULL REFERENCES Papers(paper_id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES Authors(author_id) ON DELETE CASCADE,
    PRIMARY KEY (paper_id, author_id)
);

-- 6. Paper_Keywords Table (Many-to-Many Connection)
CREATE TABLE Paper_Keywords (
    paper_id UUID NOT NULL REFERENCES Papers(paper_id) ON DELETE CASCADE,
    keyword_id UUID NOT NULL REFERENCES Keywords(keyword_id) ON DELETE CASCADE,
    PRIMARY KEY (paper_id, keyword_id)
);

-- 7. SimilarityScores Table (All-to-All Paper Comparisons)
CREATE TABLE SimilarityScores (
    paper1_id UUID NOT NULL REFERENCES Papers(paper_id) ON DELETE CASCADE,
    paper2_id UUID NOT NULL REFERENCES Papers(paper_id) ON DELETE CASCADE,
    score DECIMAL(4, 3) NOT NULL CHECK (score >= 0.0 AND score <= 1.0),
    PRIMARY KEY (paper1_id, paper2_id),
    CONSTRAINT check_different_papers CHECK (paper1_id <> paper2_id)
);

-- 8. ConferenceRecommendations Table
CREATE TABLE ConferenceRecommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paper_id UUID NOT NULL REFERENCES Papers(paper_id) ON DELETE CASCADE,
    conference_name VARCHAR(255) NOT NULL,
    rank INTEGER NOT NULL, -- e.g. 1st recommendation, 2nd, etc.
    confidence DECIMAL(3, 2) NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    reason TEXT
);


-- ==========================================
-- PERFORMANCE OPTIMIZATIONS & INDEXES
-- ==========================================

-- Standard B-Tree Indexes for Foreign Keys & Joins
CREATE INDEX idx_papers_user ON Papers(user_id);
CREATE INDEX idx_paper_authors_author ON Paper_Authors(author_id);
CREATE INDEX idx_paper_keywords_keyword ON Paper_Keywords(keyword_id);
CREATE INDEX idx_similarity_paper2 ON SimilarityScores(paper2_id);
CREATE INDEX idx_similarity_score ON SimilarityScores(score DESC);

-- GIN Index for PostgreSQL Full-Text Search on Papers
-- Automatically keeps the search_vector updated via trigger
CREATE OR REPLACE FUNCTION papers_search_vector_trigger() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.abstract, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_papers_search_update
    BEFORE INSERT OR UPDATE ON Papers
    FOR EACH ROW
    EXECUTE FUNCTION papers_search_vector_trigger();

CREATE INDEX idx_papers_search_gin ON Papers USING GIN(search_vector);


-- ==========================================
-- STORED PROCEDURES & TRIGGERS
-- ==========================================

-- Stored Procedure: Fetch Similar Papers Above a Certain Threshold
CREATE OR REPLACE FUNCTION get_similar_papers(target_paper_id UUID, min_score DECIMAL)
RETURNS TABLE (
    similar_paper_id UUID,
    title VARCHAR,
    score DECIMAL,
    plagiarism_risk BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.paper_id as similar_paper_id,
        p.title,
        s.score,
        (s.score >= 0.75 OR p.plagiarism_percentage >= 50.0) AS plagiarism_risk
    FROM SimilarityScores s
    JOIN Papers p ON (p.paper_id = s.paper2_id AND s.paper1_id = target_paper_id)
                  OR (p.paper_id = s.paper1_id AND s.paper2_id = target_paper_id)
    WHERE s.score >= min_score
    ORDER BY s.score DESC;
END;
$$ LANGUAGE plpgsql;


-- Stored Procedure: Get Dashboard Analytics Aggregates
CREATE OR REPLACE FUNCTION get_dashboard_analytics()
RETURNS TABLE (
    total_papers BIGINT,
    avg_similarity DECIMAL,
    high_risk_plagiarism BIGINT,
    unique_authors BIGINT,
    top_conference VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM Papers),
        coalesce((SELECT AVG(score) FROM SimilarityScores), 0.0),
        (SELECT COUNT(*) FROM Papers WHERE plagiarism_percentage >= 30.0),
        (SELECT COUNT(*) FROM Authors),
        coalesce((SELECT conference_name FROM ConferenceRecommendations GROUP BY conference_name ORDER BY COUNT(*) DESC LIMIT 1), 'N/A');
END;
$$ LANGUAGE plpgsql;
