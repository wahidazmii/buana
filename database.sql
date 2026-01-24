-- PsychoMetric AI - PT. BUANA MEGAH
-- SQL Schema v3.0 (Fullstack Compatible)

CREATE DATABASE IF NOT EXISTS buana_psychometric;
USE buana_psychometric;

-- 1. TABEL MODUL TES (Bank Soal & Konfigurasi)
-- Menyimpan soal dan konfigurasi yang diedit Admin di Frontend
CREATE TABLE IF NOT EXISTS test_modules (
    id VARCHAR(50) PRIMARY KEY, -- ex: 'tm_disc', 'tm_kraepelin'
    title VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'DISC', 'PAPI', 'KRAEPELIN', etc
    is_active BOOLEAN DEFAULT TRUE,
    question_count INT DEFAULT 0,
    config JSON, -- Menyimpan timer, setting baris, dll
    questions JSON, -- Menyimpan array soal (options, keys)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. TABEL POSISI (Lowongan)
CREATE TABLE IF NOT EXISTS job_positions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL PESERTA
CREATE TABLE IF NOT EXISTS participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    address TEXT,
    job_position_id INT,
    session_token VARCHAR(255),
    status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'PENDING',
    education_level VARCHAR(50),
    birth_date DATE,
    ai_recommendation VARCHAR(50) DEFAULT 'Not Yet Analyzed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_position_id) REFERENCES job_positions(id) ON DELETE SET NULL
);

-- 4. TABEL MAPPING (Relasi Posisi <-> Modul Tes)
CREATE TABLE IF NOT EXISTS position_test_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_position_id INT,
    test_type VARCHAR(50), 
    sequence INT,
    FOREIGN KEY (job_position_id) REFERENCES job_positions(id) ON DELETE CASCADE
);

-- 5. TABEL HASIL TES
CREATE TABLE IF NOT EXISTS test_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id INT,
    test_type VARCHAR(50),
    raw_results JSON,   -- Jawaban mentah user
    score_result JSON,  -- Skor hasil olahan PHP (Grafik DISC, Speed Kraepelin)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
);

-- =============================================
-- SEEDING DATA AWAL
-- =============================================

-- A. Insert Default Modules
INSERT INTO test_modules (id, title, type, is_active, question_count, config, questions) VALUES 
('tm_disc', 'DISC Personality', 'DISC', 1, 24, '{"durationSeconds": 900}', '[]'),
('tm_kraepelin', 'Kraepelin Speed Test', 'KRAEPELIN', 1, 40, '{"timerPerLine": 15, "totalLines": 40}', '[]'),
('tm_ishihara', 'Ishihara Color Blind', 'ISHIHARA', 1, 14, '{}', '[]'),
('tm_k3', 'Pengetahuan Dasar K3', 'K3', 1, 5, '{"durationSeconds": 1200, "passingScore": 70}', '[
    {
        "id": "k3-1",
        "text": "Apa warna standar helm keselamatan (safety helmet) yang biasa digunakan oleh operator atau pekerja umum di lapangan?",
        "options": [
            {"id": "a", "text": "Putih"},
            {"id": "b", "text": "Kuning"},
            {"id": "c", "text": "Merah"},
            {"id": "d", "text": "Hijau"}
        ],
        "correctOptionId": "b"
    },
    {
        "id": "k3-2",
        "text": "Jika terjadi kebakaran ringan akibat korsleting listrik (Api Kelas C), jenis APAR apa yang PALING TEPAT digunakan?",
        "options": [
            {"id": "a", "text": "Air (Water)"},
            {"id": "b", "text": "Busa (Foam)"},
            {"id": "c", "text": "Karbon Dioksida (CO2)"},
            {"id": "d", "text": "Pasir Basah"}
        ],
        "correctOptionId": "c"
    },
    {
        "id": "k3-3",
        "text": "Apa makna dari rambu keselamatan berbentuk segitiga dengan warna dasar kuning dan garis tepi hitam?",
        "options": [
            {"id": "a", "text": "Larangan (Prohibition)"},
            {"id": "b", "text": "Wajib Dilakukan (Mandatory)"},
            {"id": "c", "text": "Informasi Umum"},
            {"id": "d", "text": "Peringatan Bahaya (Warning)"}
        ],
        "correctOptionId": "d"
    },
    {
        "id": "k3-4",
        "text": "Posisi tubuh yang benar saat mengangkat beban berat dari lantai untuk menghindari cedera punggung adalah...",
        "options": [
            {"id": "a", "text": "Membungkukkan punggung, kaki lurus"},
            {"id": "b", "text": "Menekuk lutut, punggung tetap tegak, beban dekat tubuh"},
            {"id": "c", "text": "Kaki rapat, punggung membungkuk"},
            {"id": "d", "text": "Mengangkat dengan cepat agar tidak terasa berat"}
        ],
        "correctOptionId": "b"
    },
    {
        "id": "k3-5",
        "text": "Alat Pelindung Diri (APD) yang wajib digunakan saat bekerja di area dengan tingkat kebisingan tinggi (>85 dB) adalah...",
        "options": [
            {"id": "a", "text": "Safety Glasses"},
            {"id": "b", "text": "Ear Plug / Ear Muff"},
            {"id": "c", "text": "Masker Respirator"},
            {"id": "d", "text": "Face Shield"}
        ],
        "correctOptionId": "b"
    }
]')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- B. Insert Posisi Dummy
INSERT INTO job_positions (title, department, is_active) VALUES 
('Operator Produksi', 'Factory', 1),
('Admin HRD', 'Human Resources', 1),
('Staff Gudang', 'Logistics', 1);

-- C. Mapping Tes ke Posisi
INSERT INTO position_test_mappings (job_position_id, test_type, sequence) VALUES 
(1, 'ISHIHARA', 1),
(1, 'KRAEPELIN', 2),
(1, 'K3', 3),
(2, 'DISC', 1),
(2, 'PAPI', 2);