// ==========================================
// 1. ENUMS & CONSTANTS
// ==========================================

export enum TestType {
  DISC = 'DISC',
  PAPI = 'PAPI',
  KRAEPELIN = 'KRAEPELIN',
  ISHIHARA = 'ISHIHARA',
  MCQ = 'MCQ',      // Pilihan Ganda Custom
  ESSAY = 'ESSAY',  // Isian Singkat Custom
  K3 = 'K3'         // Pengetahuan Umum / K3
}

export enum UserRole {
  CANDIDATE = 'CANDIDATE',
  ADMIN = 'ADMIN'
}

export type SessionStatus = 'ONLINE' | 'IDLE' | 'OFFLINE' | 'UNUSED' | 'COMPLETED' | 'SUSPENDED';
export type RecommendationLevel = 'Highly Recommended' | 'Recommended' | 'Consider with Notes' | 'Not Recommended';

// ==========================================
// 2. QUESTIONS & MODULES STRUCTURE
// ==========================================

// Generic Question (untuk Custom Module / MCQ)
export interface QuestionOption {
  id: string;
  text: string;
  dimension?: string; // Opsional: Untuk scoring custom
}

export interface Question {
  id: string | number;
  text: string;
  options: QuestionOption[];
  correctOptionId?: string; // Untuk Ishihara / MCQ
  imageUrl?: string;        // Untuk Ishihara
}

// Specific: DISC Question Structure
export interface DiscQuestion {
  id: number;
  options: {
    text: string;
    most: string; // D, I, S, atau C
    least: string;
  }[];
}

// Specific: PAPI Kostick Question Structure
export interface PapiQuestion {
  id: number;
  pair: {
    a: { text: string; dimension: string }; // Dimension: G, L, I, T, etc.
    b: { text: string; dimension: string };
  };
}

export interface TestConfiguration {
  durationSeconds?: number;
  passingScore?: number;
  // Kraepelin Configs
  timerPerLine?: number; 
  totalLines?: number;   
  digitsPerLine?: number;
  direction?: 'UP_TO_DOWN' | 'DOWN_TO_UP';
}

export interface TestModule {
  id: string;
  title: string;
  type: TestType;
  isActive: boolean;
  questionCount: number;
  config: TestConfiguration;
  // Questions bisa berisi campuran tipe tergantung 'type' modulnya
  questions?: (Question | DiscQuestion | PapiQuestion | any)[]; 
}

// ==========================================
// 3. POSITIONS & JOBS
// ==========================================

export interface JobPosition {
  id: string;
  title: string;
  department: string;
  isActive: boolean;
  applicantCount: number;
  testIds: string[]; // List ID dari TestModule yang wajib dikerjakan
}

// ==========================================
// 4. SESSIONS & MONITORING (TokenRegistry)
// ==========================================

export interface SessionLog {
  timestamp: string;
  event: string;
  type: 'info' | 'warning' | 'error';
}

export interface TokenSession {
  id: string;
  tokenCode: string;
  candidateName: string;
  position: string;
  status: SessionStatus;
  currentActivity: string;
  progress: number;
  tabSwitches: number;
  remainingSeconds: number;
  lastSeen: string;
  device: string;
  ip: string;
  logs: SessionLog[];
}

// ==========================================
// 5. CANDIDATE & RESULTS (Core Data)
// ==========================================

export interface AIReportSections {
  executiveSummary: string;
  strengths?: string[];          // Tambahan untuk Gemini Service
  areasForImprovement?: string[]; // Tambahan untuk Gemini Service
  personalityAnalysis?: string;   // Legacy / Optional
  performanceAnalysis?: string;   // Legacy / Optional
  interviewGuide?: string;        // Legacy / Optional
  fullText: string;
}

export interface KraepelinResult {
  // Istilah Psikometri (Backend Calculation)
  panker: number;   // Kecepatan
  tianker: number;  // Ketelitian (Error Rate)
  janker: number;   // Kestabilan (Range)
  trend: 'Rising' | 'Falling' | 'Stable' | number;
  workCurve: number[]; 
  
  // Alias Bahasa Inggris (untuk ReportView Frontend)
  avg_speed?: number; 
  accuracy_deviation?: number; 
  endurance_trend?: number;
}

export interface TestResults {
  // DISC Results
  disc?: {
    raw: Record<string, { most: number; least: number; change: number }>;
    profileName: string;
    graph?: any; // Data visualisasi Recharts
    graph_1_mask?: Record<string, number>;
    graph_2_core?: Record<string, number>;
    graph_3_mirror?: Record<string, number>;
  };
  
  // PAPI Results (Skor Arah Panah G, L, I, etc)
  papi?: Record<string, number>;
  
  // Kraepelin Results
  kraepelin?: KraepelinResult;
  
  // MCQ / Custom Results
  mcqScores?: Record<string, number>;
  
  // Ishihara Results
  ishihara?: { 
    score: number; 
    status: string; 
    totalPlates: number;
    total?: number;
  };
  
  // AI & Final Recommendation
  aiReport?: AIReportSections;
  recommendation?: RecommendationLevel;
}

export interface Candidate {
  id: string;
  name: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  package: string[]; // Array of TestModule IDs
  currentTestIndex: number;
  
  // Personal Info
  appliedPosition?: string;
  appliedPositionId?: string;
  whatsapp?: string;
  address?: string;
  dob?: string;
  education?: string;
  age?: number;
  
  // Hasil Tes
  results?: TestResults;
}