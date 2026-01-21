
-- Job Positions table
CREATE TABLE IF NOT EXISTS job_positions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    description TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mapping which tests are required for which position
CREATE TABLE IF NOT EXISTS position_test_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_position_id INT,
    test_type VARCHAR(50) NOT NULL,
    sequence INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_position_id) REFERENCES job_positions(id) ON DELETE CASCADE
);

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    address TEXT,
    education_level VARCHAR(50),
    birth_date DATE,
    job_position_id INT,
    session_token VARCHAR(255) UNIQUE,
    test_status ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'NOT_STARTED',
    ai_recommendation VARCHAR(50),
    ai_report TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_position_id) REFERENCES job_positions(id) ON DELETE SET NULL
);

-- Test Results table
CREATE TABLE IF NOT EXISTS test_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id INT NOT NULL,
    test_type VARCHAR(50) NOT NULL,
    raw_results JSON NOT NULL,
    scored_results JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a default admin (username: hrbuana26, password: HrdBM)
INSERT INTO admins (username, password, name) VALUES ('hrbuana26', '$2y$12$zMvMCF64J.MzivpJZPik1OnVN7nCGAAHIoT.6AT/gCYcnx.b9PLtW', 'HRD Buana Megah');

-- Insert some sample job positions
INSERT INTO job_positions (title, department, description) VALUES 
('Staff Administrasi', 'Finance', 'Melakukan tugas administratif kantor'),
('Sales Marketing', 'Sales', 'Melakukan penjualan dan pemasaran produk'),
('IT Support', 'IT', 'Memberikan dukungan teknis IT');

-- Insert sample mappings
INSERT INTO position_test_mappings (job_position_id, test_type, sequence) VALUES 
(1, 'DISC', 1), (1, 'PAPI', 2),
(2, 'DISC', 1), (2, 'PAPI', 2), (2, 'KRAEPELIN', 3),
(3, 'DISC', 1), (3, 'KRAEPELIN', 2);
-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default Gemini API Key placeholder
-- Insert default Gemini API Key placeholder
INSERT INTO settings (setting_key, setting_value) VALUES ('gemini_api_key', '');

-- Test Modules Table
CREATE TABLE IF NOT EXISTS test_modules (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    config_json LONGTEXT,
    questions_json LONGTEXT,
    is_active TINYINT(1) DEFAULT 1,
    question_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
