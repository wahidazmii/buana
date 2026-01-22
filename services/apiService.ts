
import { JobPosition, Candidate, TestType } from '../types';

const API_BASE = './api';
const DB_KEY = 'buana_mock_db';

interface MockDB {
  candidates: Candidate[];
  positions: JobPosition[];
  results: any[];
}

// Initial Mock Data untuk fallback offline/preview
const INITIAL_POSITIONS: JobPosition[] = [
  { id: '1', title: 'Machine Operator', department: 'Production', isActive: true, applicantCount: 0, testIds: ['tm_ishihara', 'tm_disc', 'tm_kraepelin'] },
  { id: '2', title: 'HR Generalist', department: 'HR & GA', isActive: true, applicantCount: 0, testIds: ['tm_disc'] },
  { id: '3', title: 'Quality Control', department: 'QA', isActive: true, applicantCount: 0, testIds: ['tm_ishihara'] }
];

class ApiService {
  private isMockMode = false;

  constructor() {
    this.initMockDB();
  }

  private initMockDB() {
    if (!localStorage.getItem(DB_KEY)) {
      const initialDB: MockDB = {
        candidates: [],
        positions: INITIAL_POSITIONS,
        results: []
      };
      localStorage.setItem(DB_KEY, JSON.stringify(initialDB));
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
      
      // Jika server mengembalikan source PHP mentah, berarti server PHP tidak aktif
      if (text.trim().startsWith('<?php')) {
        this.isMockMode = true;
        throw new Error('PHP_NOT_EXECUTED');
      }

      return JSON.parse(text);
    } catch (err: any) {
      // Fallback ke Mock Mode jika fetch gagal atau PHP tidak dieksekusi
      this.isMockMode = true;
      console.warn("ApiService: Berjalan dalam Mode Mock (Client-side).");
      return this.handleMock(endpoint, options);
    }
  }

  private handleMock(endpoint: string, options: RequestInit) {
    const db = this.getDB();
    const url = new URL(endpoint, 'http://localhost');
    const method = options.method || 'GET';

    if (endpoint.includes('positions.php')) {
      return db.positions.filter(p => p.isActive);
    }

    if (endpoint.includes('register.php')) {
      const data = JSON.parse(options.body as string);
      const id = `BM-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const pos = db.positions.find(p => p.id === data.appliedPositionId);
      
      const newCandidate: Candidate = {
        id,
        ...data,
        status: 'IN_PROGRESS',
        currentTestIndex: 0,
        appliedPosition: pos?.title || 'Unknown',
        package: pos?.testIds || ['tm_disc']
      };
      
      db.candidates.push(newCandidate);
      this.saveDB(db);
      return { id, token: 'mock-session-token', message: 'Registrasi berhasil (Mock)' };
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
        return { message: 'Dihapus' };
      }

      return db.candidates;
    }

    return null;
  }

  // API Methods
  async getActivePositions(): Promise<JobPosition[]> {
    return this.request('positions.php');
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

export const api = new ApiService();
