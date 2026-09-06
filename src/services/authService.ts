import { UserProfile } from '../types';

const STORAGE_KEY_AUTH = 'finefatigue_auth_v2';
type AuthListener = (user: UserProfile | null) => void;
type StoredAuth = { user: UserProfile; token: string };

class AuthService {
  private currentUser: UserProfile | null = null;
  private accessToken: string | null = null;
  private listeners = new Set<AuthListener>();

  constructor() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_AUTH) || 'null') as StoredAuth | null;
      if (stored?.user?.id && stored.token) {
        this.currentUser = stored.user;
        this.accessToken = stored.token;
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    }
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getAuthHeaders(): Record<string, string> {
    return this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {};
  }

  async login(identifier: string, password: string, mode: 'login' | 'register'): Promise<UserProfile> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, mode })
    });
    const payload = await response.json().catch(() => ({}));
    if (payload.pending) throw new Error(payload.message || 'Registration is awaiting administrator approval.');
    if (!response.ok) throw new Error(payload.error || 'Login failed.');
    this.currentUser = payload.user as UserProfile;
    this.accessToken = payload.token as string;
    this.save();
    this.notifyListeners();
    return this.currentUser;
  }

  async validateCurrentSession(): Promise<UserProfile | null> {
    if (!this.accessToken) return null;
    try {
      const response = await fetch('/api/auth/me', { headers: this.getAuthHeaders() });
      if (!response.ok) throw new Error('Session expired.');
      const payload = await response.json();
      this.currentUser = payload.user as UserProfile;
      this.save();
      this.notifyListeners();
      return this.currentUser;
    } catch {
      this.clear(false);
      return null;
    }
  }

  logout(): void {
    if (this.accessToken) void fetch('/api/auth/logout', { method: 'POST', headers: this.getAuthHeaders() });
    this.clear(true);
  }

  subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    listener(this.currentUser);
    return () => this.listeners.delete(listener);
  }

  private save(): void {
    if (!this.currentUser || !this.accessToken) return;
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify({ user: this.currentUser, token: this.accessToken }));
    localStorage.setItem('finefatigue_subject_id', this.currentUser.participantCode);
  }

  private clear(notify: boolean): void {
    this.currentUser = null;
    this.accessToken = null;
    localStorage.removeItem(STORAGE_KEY_AUTH);
    if (notify) this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentUser));
  }
}

export const authService = new AuthService();
