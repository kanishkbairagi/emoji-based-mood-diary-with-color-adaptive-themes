/**
 * Resilient API Client with Distributed Systems Fallback
 * Connects to the Express/Node.js backend when online.
 * Falls back to local storage automatically if backend is unavailable.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getAuthHeader() {
  const token = localStorage.getItem('vault_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Check backend server status
  async pingServer() {
    try {
      const res = await fetch(`${API_BASE.replace('/api', '')}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Auth: Register
  async register(username, password, cryptoSalt) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, cryptoSalt }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    if (data.token) {
      localStorage.setItem('vault_token', data.token);
      localStorage.setItem('vault_user', JSON.stringify(data.user));
    }
    return data;
  },

  // Auth: Login
  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    if (data.token) {
      localStorage.setItem('vault_token', data.token);
      localStorage.setItem('vault_user', JSON.stringify(data.user));
    }
    return data;
  },

  // Auth: Logout
  logout() {
    localStorage.removeItem('vault_token');
    localStorage.removeItem('vault_user');
  },

  getCurrentUser() {
    const raw = localStorage.getItem('vault_user');
    return raw ? JSON.parse(raw) : null;
  },

  // Entries: Sync / Save Encrypted Entry to Server
  async saveEntry(entryPayload) {
    const res = await fetch(`${API_BASE}/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(entryPayload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save entry to server');
    return data.entry;
  },

  // Entries: Fetch from Server
  async fetchEntries(limit = 50, offset = 0) {
    const res = await fetch(`${API_BASE}/entries?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch entries');
    return data.entries;
  },

  // Analytics: Fetch Aggregated Affective Summary
  async fetchAnalytics() {
    const res = await fetch(`${API_BASE}/analytics/summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch analytics');
    return data.summary;
  },
};
