import { TaskPriority } from '@/types/kanban';

// Priority colors for visual indicators
export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#6b7280',     // Gray-500
  medium: '#3b82f6',  // Blue-500  
  high: '#f59e0b',    // Amber-500
  urgent: '#ef4444',  // Red-500
};

// Priority labels for UI display
export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

// Status labels for columns
export const STATUS_LABELS = {
  'todo': 'To Do',
  'in-progress': 'In Progress', 
  'done': 'Done'
} as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  NEW_TASK: 'Ctrl+N',
  EDIT_TASK: 'Enter',
  DELETE_TASK: 'Delete',
  CLOSE_MODAL: 'Escape',
} as const;

// Animation durations (in ms)
export const ANIMATION_DURATION = {
  FAST: 150,
  DEFAULT: 200,
  SLOW: 300,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  BOARD: 'kanban-board',
  TASKS: 'kanban-tasks', 
  COLUMNS: 'kanban-columns',
  SETTINGS: 'kanban-settings',
} as const;

// UI configuration
export const UI_CONFIG = {
  COLUMN_MIN_WIDTH: 300,
  COLUMN_MAX_WIDTH: 320,
  TASK_CARD_SPACING: 12,
  SEARCH_DEBOUNCE: 300,
} as const; 