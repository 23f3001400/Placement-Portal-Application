// services/api.js — Fetch-based API helper
const API_BASE = '/api';

const Api = {
    getToken() {
        return localStorage.getItem('ppa_token') || '';
    },
    setToken(token) {
        localStorage.setItem('ppa_token', token);
    },
    clearToken() {
        localStorage.removeItem('ppa_token');
        localStorage.removeItem('ppa_role');
        localStorage.removeItem('ppa_email');
    },
    getRole() {
        return localStorage.getItem('ppa_role') || '';
    },
    setRole(role) {
        localStorage.setItem('ppa_role', role);
    },
    getEmail() {
        return localStorage.getItem('ppa_email') || '';
    },
    setEmail(email) {
        localStorage.setItem('ppa_email', email);
    },
    isLoggedIn() {
        return !!this.getToken();
    },

    async request(method, path, body = null, isFormData = false) {
        const headers = {};
        const token = this.getToken();
        if (token) {
            headers['Authentication-Token'] = token;
        }
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        const opts = { method, headers };
        if (body) {
            opts.body = isFormData ? body : JSON.stringify(body);
        }

        const res = await fetch(`${API_BASE}${path}`, opts);
        let data;
        try {
            data = await res.json();
        } catch {
            data = {};
        }
        if (!res.ok) {
            const msg = data.msg || data.message || `Error ${res.status}`;
            throw new Error(msg);
        }
        return data;
    },

    get(path) { return this.request('GET', path); },
    post(path, body) { return this.request('POST', path, body); },
    put(path, body) { return this.request('PUT', path, body); },
    del(path) { return this.request('DELETE', path); },
    upload(path, formData) { return this.request('POST', path, formData, true); },

    // Auth
    login(email, password) { return this.post('/auth/login', { email, password }); },
    register(data) { return this.post('/auth/register', data); },
    logout() { return this.post('/auth/logout'); },
    me() { return this.get('/auth/me'); },
};

window.Api = Api;
