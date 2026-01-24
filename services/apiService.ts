
import { JobPosition, Candidate, TestType, TestModule } from '../types';

const API_BASE = './api';
const DB_KEY = 'buana_mock_db';

interface MockDB {
  candidates: Candidate[];
  positions: JobPosition[];
  results: any[];
  testModules: TestModule[];
}

const INITIAL_POSITIONS: JobPosition[] = [
  { id: '1', title: 'Machine Operator', department: 'Production', isActive: true, applicantCount: 0, testIds: ['tm_ishihara', 'tm_disc', 'tm_kraepelin'] },
  { id: '2', title: 'HR Generalist', department: 'HR & GA', isActive: true, applicantCount: 0, testIds: ['tm_disc', 'tm_papi'] },
  { id: '3', title: 'Quality Control', department: 'QA', isActive: true, applicantCount: 0, testIds: ['tm_ishihara'] }
];

const ISHIHARA_ASSETS = [
  { url: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Ishihara_1.png', ans: '12' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Ishihara_2.png', ans: '8' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Ishihara_9.png', ans: '74' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Ishihara_5.png', ans: '5' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Ishihara_11.png', ans: '6' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Ishihara_23.png', ans: '42' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Ishihara_10.png', ans: '16' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Ishihara_22.png', ans: '26' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Ishihara_3.png', ans: '6' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/d/de/Ishihara_8.png', ans: '15' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/6/69/Ishihara_12.png', ans: '97' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Ishihara_4.png', ans: '29' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/1/13/Ishihara_24.png', ans: '35' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/b/b6/Ishihara_13.png', ans: '45' }
];

const INITIAL_MODULES: TestModule[] = [
  { 
    id: 'tm_disc', 
    title: 'DISC Gaya Kerja', 
    type: TestType.DISC, 
    isActive: true, 
    questionCount: 24, 
    config: { durationSeconds: 900 },
    questions: Array.from({ length: 24 }, (_, i) => ({
      id: i + 1,
      options: [
        { text: `Pernyataan D - ${i+1}`, most: "D", least: "D" },
        { text: `Pernyataan I - ${i+1}`, most: "I", least: "I" },
        { text: `Pernyataan S - ${i+1}`, most: "S", least: "S" },
        { text: `Pernyataan C - ${i+1}`, most: "C", least: "C" }
      ]
    }))
  },
  { 
    id: 'tm_papi', 
    title: 'PAPI Kostick', 
    type: TestType.PAPI, 
    isActive: true, 
    questionCount: 90, 
    config: { durationSeconds: 1200 },
    questions: Array.from({ length: 90 }, (_, i) => ({
      id: i + 1,
      pair: {
        a: { text: `Saya bekerja keras (Pernyataan A-${i+1})`, dimension: "G" },
        b: { text: `Saya suka memimpin (Pernyataan B-${i+1})`, dimension: "P" }
      }
    }))
  },
  { 
    id: 'tm_kraepelin', 
    title: 'Kraepelin Speed Test', 
    type: TestType.KRAEPELIN, 
    isActive: true, 
    questionCount: 0, 
    config: { timerPerLine: 15, totalLines: 45, digitsPerLine: 20, direction: 'UP_TO_DOWN' } 
  },
  { 
    id: 'tm_ishihara', 
    title: 'Ishihara Color Vision', 
    type: TestType.ISHIHARA, 
    isActive: true, 
    questionCount: 14, 
    config: {}, 
    questions: ISHIHARA_ASSETS.map((asset, i) => ({
      id: `plate-${i+1}`,
      text: `Pelat ${i+1}`,
      imageUrl: asset.url,
      correctOptionId: asset.ans
    }))
  }
];

class ApiService {
  private isMockMode = false;

  constructor() {
    this.initMockDB();
  }

  private initMockDB() {
    const existing = localStorage.getItem(DB_KEY);
    if (!existing) {
      const initialDB: MockDB = {
        candidates: [],
        positions: INITIAL_POSITIONS,
        results: [],
        testModules: INITIAL_MODULES
      };
      localStorage.setItem(DB_KEY, JSON.stringify(initialDB));
    } else {
      const db = JSON.parse(existing);
      // Data Consistency: Ensure default modules exist
      if (!db.testModules || db.testModules.length === 0) {
        db.testModules = INITIAL_MODULES;
        this.saveDB(db);
      }
    }
  }

  private getDB(): MockDB {
    return JSON.parse(localStorage.getItem(DB_KEY) || '{}');
  }

  private saveDB(db: MockDB) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    try {
      const response = await fetch(`${API_BASE}/${endpoint}`, options);
      const text = await response.text();
      // Detect PHP raw text instead of executed JSON
      if (text.trim().startsWith('<?php')) {
        this.isMockMode = true;
        throw new Error('PHP_NOT_EXECUTED');
      }
      return JSON.parse(text);
    } catch (err: any) {
      this.isMockMode = true;
      return this.handleMock(endpoint, options);
    }
  }

  private handleMock(endpoint: string, options: RequestInit) {
    const db = this.getDB();
    const method = options.method || 'GET';

    if (endpoint.includes('positions.php')) {
      return db.positions.filter(p => p.isActive);
    }

    if (endpoint.includes('test_modules.php')) {
      if (method === 'POST') {
        const data = JSON.parse(options.body as string);
        const idx = db.testModules.findIndex(m => m.id === data.id);
        if (idx > -1) db.testModules[idx] = data;
        else db.testModules.push(data);
        this.saveDB(db);
        return { message: 'Module updated (Mock)' };
      }
      return db.testModules;
    }

    if (endpoint.includes('register.php')) {
      const data = JSON.parse(options.body as string);
      // Ensure numeric ID for consistency with SQL logic
      const id = (db.candidates.length + 100).toString(); 
      const token = bin2hex(32);
      
      const pos = db.positions.find(p => p.id == data.appliedPositionId);
      
      const newCandidate: Candidate = {
        id,
        ...data,
        status: 'IN_PROGRESS',
        currentTestIndex: 0,
        appliedPosition: pos?.title || 'Kandidat',
        package: pos?.testIds || ['tm_disc'] 
      };
      
      db.candidates.push(newCandidate);
      this.saveDB(db);
      return { id, token, message: 'Registrasi Berhasil (Mock API)' };
    }

    if (endpoint.includes('submit_test.php')) {
      const data = JSON.parse(options.body as string);
      db.results.push(data);
      const cand = db.candidates.find(c => c.id === data.participantId);
      if (cand) {
        if (!cand.results) cand.results = {};
        const typeKey = data.testType.toLowerCase() as keyof typeof cand.results;
        (cand.results as any)[typeKey] = data.results;
        if (data.isLast) cand.status = 'COMPLETED';
      }
      this.saveDB(db);
      return { message: 'Hasil disimpan (Mock)' };
    }

    if (endpoint.includes('admin.php')) {
      const url = new URL(endpoint, 'http://localhost');
      const action = url.searchParams.get('action');
      if (action === 'stats') {
        return {
          total: db.candidates.length,
          completed: db.candidates.filter(c => c.status === 'COMPLETED').length,
          activePositions: db.positions.filter(p => p.isActive).length,
          avgScore: 78
        };
      }
      
      const deleteId = url.searchParams.get('id');
      if (method === 'DELETE' && deleteId) {
        db.candidates = db.candidates.filter(c => c.id !== deleteId);
        this.saveDB(db);
        return { message: 'Data dihapus' };
      }

      return db.candidates;
    }

    return null;
  }

  async getActivePositions(): Promise<JobPosition[]> {
    return this.request('positions.php');
  }

  async getTestModules(): Promise<TestModule[]> {
    return this.request('test_modules.php');
  }

  async updateTestModule(module: TestModule) {
    return this.request('test_modules.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(module)
    });
  }

  async register(data: any) {
    return this.request('register.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async submitTest(participantId: string, testType: TestType, results: any, isLast: boolean) {
    return this.request('submit_test.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, testType, results, isLast })
    });
  }

  async getAdminStats() {
    return this.request('admin.php?action=stats');
  }

  async getParticipants(): Promise<Candidate[]> {
    return this.request('admin.php');
  }

  async deleteParticipant(id: string) {
    return this.request(`admin.php?id=${id}`, { method: 'DELETE' });
  }
}

function bin2hex(length: number) {
    const chars = '0123456789abcdef';
    let res = '';
    for (let i = 0; i < length; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
}

export const api = new ApiService();
