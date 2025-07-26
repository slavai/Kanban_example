import { Board, Task, Column } from '@/types/kanban';

const STORAGE_KEYS = {
  BOARD: 'kanban-board',
  TASKS: 'kanban-tasks',
  COLUMNS: 'kanban-columns',
  SETTINGS: 'kanban-settings',
} as const;

interface StorageSettings {
  language: string;
  theme?: string;
}

class StorageManager {
  private isClient = typeof window !== 'undefined';

  private safeGet<T>(key: string, fallback: T): T {
    if (!this.isClient) return fallback;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (error) {
      console.warn(`Failed to parse localStorage item "${key}":`, error);
      return fallback;
    }
  }

  private safeSet<T>(key: string, value: T): boolean {
    if (!this.isClient) return false;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Failed to save to localStorage "${key}":`, error);
      return false;
    }
  }

  // Board operations
  getBoard(): Board | null {
    return this.safeGet<Board | null>(STORAGE_KEYS.BOARD, null);
  }

  saveBoard(board: Board): boolean {
    return this.safeSet(STORAGE_KEYS.BOARD, board);
  }

  // Task operations
  getTasks(): Task[] {
    const tasks = this.safeGet<Task[]>(STORAGE_KEYS.TASKS, []);
    return tasks.map(task => ({
      ...task,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    }));
  }

  saveTasks(tasks: Task[]): boolean {
    return this.safeSet(STORAGE_KEYS.TASKS, tasks);
  }

  // Column operations
  getColumns(): Column[] {
    return this.safeGet<Column[]>(STORAGE_KEYS.COLUMNS, []);
  }

  saveColumns(columns: Column[]): boolean {
    return this.safeSet(STORAGE_KEYS.COLUMNS, columns);
  }

  // Settings operations
  getSettings(): StorageSettings {
    return this.safeGet<StorageSettings>(STORAGE_KEYS.SETTINGS, {
      language: 'en',
    });
  }

  saveSettings(settings: StorageSettings): boolean {
    return this.safeSet(STORAGE_KEYS.SETTINGS, settings);
  }

  // Clear all data
  clearAll(): boolean {
    if (!this.isClient) return false;
    
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
      return false;
    }
  }

  // Check storage availability
  isAvailable(): boolean {
    if (!this.isClient) return false;
    
    try {
      const testKey = 'test-storage';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}

export const storage = new StorageManager(); 