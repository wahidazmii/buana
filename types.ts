
export enum TestType {
  DISC = 'DISC',
  PAPI = 'PAPI',
  KRAEPELIN = 'KRAEPELIN',
  ISHIHARA = 'ISHIHARA',
  MCQ = 'MCQ'
}

export enum UserRole {
  CANDIDATE = 'CANDIDATE',
  ADMIN = 'ADMIN'
}

export type SessionStatus = 'ONLINE' | 'IDLE' | 'OFFLINE' | 'UNUSED' | 'COMPLETED' | 'SUSPENDED';

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

export interface JobPosition {
  id: string;
  title: string;
  department: string;
  isActive: boolean;
  applicantCount: number;
  testIds: string[];
}

export interface QuestionOption {
  id: string;
  text: string;
  dimension?: string;
}

export interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
  correctOptionId?: string;
}

// Added DiscQuestion interface to support constants.ts
export interface DiscQuestion {
  id: number;
  options: {
    text: string;
    most: string;
    least: string;
  }[];
}

// Added PapiQuestion interface to support constants.ts
export interface PapiQuestion {
  id: number;
  pair: {
    a: { text: string; dimension: string };
    b: { text: string; dimension: string };
  };
}

export interface TestConfiguration {
  durationSeconds?: number;
  passingScore?: number;
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
  questions?: Question[];
}

export interface Candidate {
  id: string;
  name: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  package: string[];
  currentTestIndex: number;
  appliedPosition?: string;
  // Fix: Added appliedPositionId to Candidate interface to resolve property access error in apiService.ts line 125
  appliedPositionId?: string;
  whatsapp?: string;
  address?: string;
  dob?: string;
  education?: string;
  age?: number;
  results?: TestResults;
}

export interface AIReportSections {
  executiveSummary: string;
  personalityAnalysis: string;
  performanceAnalysis: string;
  interviewGuide: string;
  fullText: string;
}

export interface TestResults {
  disc?: {
    raw: Record<string, { most: number; least: number; change: number }>;
    profileName: string;
  };
  papi?: Record<string, number>;
  kraepelin?: {
    panker: number;
    tianker: number;
    janker: number;
    trend: 'Rising' | 'Falling' | 'Stable';
    workCurve: number[];
  };
  mcqScores?: Record<string, number>;
  ishihara?: { score: number; status: string; totalPlates: number };
  aiReport?: AIReportSections;
  recommendation?: RecommendationLevel;
}

export type RecommendationLevel = 'Highly Recommended' | 'Recommended' | 'Consider with Notes' | 'Not Recommended';
