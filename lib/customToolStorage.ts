import { CustomToolDefinition } from '@/types/customTool';

const STORAGE_KEY = 'mcp-tools';

export function getStoredCustomTools(): CustomToolDefinition[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.error('Failed to load custom tools:', error);
    return [];
  }
}
