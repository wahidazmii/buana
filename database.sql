
-- PsychoMetric AI - PT. BUANA MEGAH
-- SQL Schema v2.0 (PHP Backend Compatible)

CREATE DATABASE IF NOT EXISTS buana_psychometric;
USE buana_psychometric;

-- 1. TABEL POSISI (Lowongan Aktif)
CREATE TABLE job_positions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABEL PESERTA
CREATE TABLE participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    birth_date DATE,
    education_level VARCHAR(50),
    job_position_id INT,
    session_token VARCHAR(255),
    test_status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'PENDING',
    ai_recommendation VARCHAR(50) DEFAULT 'Consider with Notes',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_position_id) REFERENCES job_positions(id) ON DELETE SET NULL
);

-- 3. TABEL MAPPING TES
CREATE TABLE position_test_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_position_id INT,
    test_type VARCHAR(20), -- 'DISC', 'KRAEPELIN', 'ISHIHARA'
    sequence INT,
    FOREIGN KEY (job_position_id) REFERENCES job_positions(id) ON DELETE CASCADE
);

-- 4. TABEL HASIL TES (JSON Storage)
CREATE TABLE test_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id INT,
    test_type VARCHAR(20),
    raw_results JSON, -- Menyimpan jawaban mentah atau skor
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
);

-- DATA AWAL (Dummy untuk testing)
INSERT INTO job_positions (title, department, is_active) VALUES 
('Machine Operator', 'Production', 1),
('HR Generalist', 'HR & GA', 1),
('Quality Control', 'QA', 0);

INSERT INTO position_test_mappings (job_position_id, test_type, sequence) VALUES 
(1, 'ISHIHARA', 1), (1, 'DISC', 2), (1, 'KRAEPELIN', 3),
(2, 'DISC', 1);
