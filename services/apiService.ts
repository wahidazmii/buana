import { JobPosition, Candidate, TestType, TestModule } from '../types';

const API_BASE = '/api'; // Use absolute path for proxy consistency
const AUTH_KEY = 'buana_session_token';

class ApiService {
  private getAuthHeader() {
    const token = localStorage.getItem(AUTH_KEY);
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...(options.headers || {})
    };
    
    // Ensure we don't double slash if endpoint starts with slash
    const url = `${API_BASE}/${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`;
    
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      let errData;
      try {
        errData = await response.json();
      } catch (e) {
        errData = { error: `Server returned status ${response.status}. Ensure Apache/XAMPP is running and the proxy target in vite.config.ts is correct.` };
      }
      throw new Error(errData.error || `HTTP error! status: ${response.status}`);
    }
    
    try {
      return await response.json();
    } catch (e) {
      throw new Error("Invalid JSON response from server. Check if PHP is returning errors or raw code.");
    }
  }

  async getActivePositions(): Promise<JobPosition[]> {
    return this.request('positions.php');
  }

  async savePosition(position: Partial<JobPosition>) {
    return this.request('positions.php', {
      method: 'POST',
      body: JSON.stringify(position)
    });
  }

  async getTestModules(): Promise<TestModule[]> {
    return this.request('test_modules.php');
  }

  async updateTestModule(module: TestModule) {
    return this.request('test_modules.php', {
      method: 'POST',
      body: JSON.stringify(module)
    });
  }

  async register(data: any) {
    const response = await this.request('register.php', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (response.token) {
      localStorage.setItem(AUTH_KEY, response.token);
    }
    return response;
  }

  async submitTest(participantId: string, testType: string, results: any, isLast: boolean) {
    return this.request('submit_test.php', {
      method: 'POST',
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

  clearSession() {
    localStorage.removeItem(AUTH_KEY);
  }
}

export const api = new ApiService();