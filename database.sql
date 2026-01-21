
-- PsychoMetric AI - PT. BUANA MEGAH
-- System Architecture Blueprint: Database Schema v1.2

-- Table for Job Positions (Open Vacancies)
CREATE TABLE job_positions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    test_package JSON, -- e.g. ["tm_disc", "tm_kraepelin"]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Participants (Candidates)
CREATE TABLE participants (
    id VARCHAR(50) PRIMARY KEY, -- e.g. BM-2026-X99
    name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    education_level VARCHAR(50),
    age INT,
    job_position_id INT,
    current_status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_position_id) REFERENCES job_positions(id) ON DELETE SET NULL
);

-- Table for DISC Mapping (Personality Engine)
CREATE TABLE disc_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL, -- 1-24
    statement_1 VARCHAR(255),
    type_1 CHAR(1), -- 'D', 'I', 'S', 'C', or '*'
    statement_2 VARCHAR(255),
    type_2 CHAR(1),
    statement_3 VARCHAR(255),
    type_3 CHAR(1),
    statement_4 VARCHAR(255),
    type_4 CHAR(1)
);

-- Table for Test Results (Serialized Blobs for Analysis)
CREATE TABLE test_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id VARCHAR(50),
    test_type VARCHAR(20),
    raw_data JSON, -- Stores calculation metrics (e.g., Panker, Tianker)
    interpretation TEXT, -- AI-generated narrative
    recommendation VARCHAR(50),
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
);

-- Indexing for Dashboard Speed
CREATE INDEX idx_participant_status ON participants(current_status);
CREATE INDEX idx_job_active ON job_positions(is_active);
