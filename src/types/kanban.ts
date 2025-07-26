export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = string; // Changed from union to string to support custom statuses

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
}

export interface Column {
  id: string;
  title: string;
  status: TaskStatus;
  order: number;
  color?: string;
  isDefault?: boolean; // Mark default columns to prevent deletion
  isCustom?: boolean;  // Mark custom columns
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  columns: Column[];
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
  settings?: BoardSettings;
}

export interface BoardSettings {
  allowCustomColumns?: boolean;
  maxColumns?: number;
  defaultColumnColor?: string;
}

export interface DragItem {
  type: 'task' | 'column';
  id: string;
  data: Task | Column;
}

// Column management types
export interface CreateColumnData {
  title: string;
  color?: string;
  status?: string; // If not provided, will be generated from title
}

export interface UpdateColumnData {
  title?: string;
  color?: string;
  order?: number;
}

export interface ColumnValidationError {
  field: 'title' | 'color' | 'status';
  message: string;
} 