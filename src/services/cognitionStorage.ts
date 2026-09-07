import { CognitionMemoryResult } from '../types';

const STORAGE_KEY_COGNITION = 'finefatigue_cognition_memory_v1';

export class CognitionStorageError extends Error {
  constructor(public readonly code: 'quota' | 'unavailable') {
    super(code);
    this.name = 'CognitionStorageError';
  }
}

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
    try {
      localStorage.setItem(STORAGE_KEY_COGNITION, JSON.stringify(results));
    } catch (error) {
      const isQuotaError = error instanceof DOMException && (
        error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      );
      throw new CognitionStorageError(isQuotaError ? 'quota' : 'unavailable');
    }
  },

  addResult(result: CognitionMemoryResult): void {
    const current = this.getResults();
    this.saveResults([result, ...current.filter(item => item.id !== result.id)]);
  },

  clearResults(): void {
    localStorage.removeItem(STORAGE_KEY_COGNITION);
  }
};
