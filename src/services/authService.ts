import { UserProfile } from '../types';

const STORAGE_KEY_USER = 'finefatigue_auth_user_v1';

export const PRESET_DEMO_USERS: UserProfile[] = [
  {
    id: 'USR-SUBJ-001',
    name: '张受试 (Participant 01)',
    email: 'subj001@lab.edu',
    role: 'participant',
    participantCode: 'SUBJ-A01',
    avatar: '👨‍🔬',
    lastLogin: Date.now()
  },
  {
    id: 'USR-RESEARCH-01',
    name: '李研究员 (Lab Researcher)',
    email: 'researcher.li@lab.edu',
    role: 'researcher',
    participantCode: 'LAB-RES-08',
    avatar: '👩‍🏫',
    lastLogin: Date.now()
  },
  {
    id: 'USR-SUBJ-002',
    name: '王同学 (Student Trial)',
    email: 'student.wang@lab.edu',
    role: 'participant',
    participantCode: 'SUBJ-B02',
    avatar: '🧑‍💻',
    lastLogin: Date.now()
  }
];

type AuthListener = (user: UserProfile | null) => void;

class AuthService {
  private currentUser: UserProfile | null = null;
  private listeners: Set<AuthListener> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      } else {
        // Default to preset participant for demo
        this.currentUser = PRESET_DEMO_USERS[0];
        this.saveUser(this.currentUser);
      }
    } catch (e) {
      this.currentUser = PRESET_DEMO_USERS[0];
    }
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  loginPreset(user: UserProfile): void {
    const updated = { ...user, lastLogin: Date.now() };
    this.currentUser = updated;
    this.saveUser(updated);
    this.notifyListeners();
  }

  login(identifier: string, role: 'participant' | 'researcher' = 'participant'): UserProfile {
    const cleanId = identifier.trim() || 'Guest Subject';
    const newUser: UserProfile = {
      id: `USR-${Date.now().toString(36).toUpperCase()}`,
      name: cleanId,
      email: cleanId.includes('@') ? cleanId : `${cleanId.toLowerCase().replace(/\s+/g, '')}@lab.edu`,
      role,
      participantCode: cleanId.startsWith('SUBJ-') ? cleanId : `SUBJ-${Math.floor(100 + Math.random() * 900)}`,
      avatar: role === 'researcher' ? '👩‍🏫' : '🧑‍💻',
      lastLogin: Date.now()
    };
    this.currentUser = newUser;
    this.saveUser(newUser);
    this.notifyListeners();
    return newUser;
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEY_USER);
    this.notifyListeners();
  }

  subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    listener(this.currentUser);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private saveUser(user: UserProfile) {
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      localStorage.setItem('finefatigue_subject_id', user.name);
    } catch (e) {
      console.warn('Failed to save user session', e);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.currentUser));
  }
}

export const authService = new AuthService();
