import { CognitionMemoryResult } from '../types';

const STORAGE_KEY_COGNITION = 'finefatigue_cognition_memory_v1';

export const CognitionStorage = {
  getResults(): CognitionMemoryResult[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COGNITION);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(item => item && typeof item.id === 'string') : [];
    } catch {
      return [];
    }
  },

  saveResults(results: CognitionMemoryResult[]): void {
    localStorage.setItem(STORAGE_KEY_COGNITION, JSON.stringify(results));
  },

  addResult(result: CognitionMemoryResult): void {
    const current = this.getResults();
    this.saveResults([result, ...current.filter(item => item.id !== result.id)]);
  },

  clearResults(): void {
    localStorage.removeItem(STORAGE_KEY_COGNITION);
  }
};
