
const API_URL = '/api'; // Adjusted for likely proxy or relative path

export const authService = {
    async login(username: string, password: string): Promise<{ token: string; user: any }> {
        const response = await fetch(`${API_URL}/auth.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', username, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        const data = await response.json();
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
        return data;
    },

    logout() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
    },

    getAdminToken() {
        return localStorage.getItem('admin_token');
    },

    isAdminAuthenticated() {
        return !!this.getAdminToken();
    },

    // Participant session
    setParticipantSession(id: string, token: string) {
        localStorage.setItem('participant_id', id);
        localStorage.setItem('participant_token', token);
    },

    getParticipantSession() {
        return {
            id: localStorage.getItem('participant_id'),
            token: localStorage.getItem('participant_token')
        };
    },

    clearParticipantSession() {
        localStorage.removeItem('participant_id');
        localStorage.removeItem('participant_token');
    }
};
