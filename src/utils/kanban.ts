import { Task, Column, Board, TaskPriority, TaskStatus, CreateColumnData, UpdateColumnData, ColumnValidationError } from '@/types/kanban';
import { PRIORITY_COLORS } from '@/utils/constants';

export const DEFAULT_COLUMNS: Column[] = [
  {
    id: 'todo',
    title: 'To Do',
    status: 'todo',
    order: 0,
    color: '#ef4444',
    isDefault: true,
    isCustom: false,
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    status: 'in-progress',
    order: 1,
    color: '#f59e0b',
    isDefault: true,
    isCustom: false,
  },
  {
    id: 'done',
    title: 'Done',
    status: 'done',
    order: 2,
    color: '#10b981',
    isDefault: true,
    isCustom: false,
  },
];

// Re-export for backward compatibility
export { PRIORITY_COLORS } from '@/utils/constants';

/**
 * Generates a unique identifier for tasks and boards
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a status key from column title
 */
export function generateStatusFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

/**
 * Gets available colors for columns
 */
export function getAvailableColumnColors(): string[] {
  return [
    '#ef4444', // Red
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
    '#6366f1', // Indigo
  ];
}

/**
 * Validates column data for creation/update
 */
export function validateColumnData(data: CreateColumnData | UpdateColumnData, existingColumns: Column[] = [], excludeColumnId?: string): ColumnValidationError[] {
  const errors: ColumnValidationError[] = [];

  // Validate title
  if ('title' in data && data.title !== undefined) {
    if (!data.title.trim()) {
      errors.push({ field: 'title', message: 'Column title is required' });
    } else if (data.title.trim().length < 2) {
      errors.push({ field: 'title', message: 'Column title must be at least 2 characters' });
    } else if (data.title.trim().length > 30) {
      errors.push({ field: 'title', message: 'Column title must be less than 30 characters' });
    } else {
      // Check for duplicate titles
      const isDuplicate = existingColumns.some(col => 
        col.id !== excludeColumnId && 
        col.title.toLowerCase() === data.title!.trim().toLowerCase()
      );
      if (isDuplicate) {
        errors.push({ field: 'title', message: 'A column with this title already exists' });
      }
    }
  }

  // Validate color
  if ('color' in data && data.color !== undefined) {
    const availableColors = getAvailableColumnColors();
    if (!availableColors.includes(data.color)) {
      errors.push({ field: 'color', message: 'Invalid color selected' });
    }
  }

  // Validate status (for creation)
  if ('status' in data && data.status !== undefined) {
    const statusExists = existingColumns.some(col => 
      col.id !== excludeColumnId && 
      col.status === data.status
    );
    if (statusExists) {
      errors.push({ field: 'status', message: 'A column with this status already exists' });
    }
  }

  return errors;
}

/**
 * Creates a new column with validation
 */
export function createColumn(data: CreateColumnData, existingColumns: Column[]): { column: Column | null; errors: ColumnValidationError[] } {
  const errors = validateColumnData(data, existingColumns);
  if (errors.length > 0) {
    return { column: null, errors };
  }

  const now = new Date();
  const status = data.status || generateStatusFromTitle(data.title);
  const maxOrder = Math.max(...existingColumns.map(col => col.order), -1);

  const column: Column = {
    id: generateId(),
    title: data.title.trim(),
    status,
    order: maxOrder + 1,
    color: data.color || getAvailableColumnColors()[0],
    isDefault: false,
    isCustom: true,
    createdAt: now,
    updatedAt: now,
  };

  return { column, errors: [] };
}

/**
 * Updates an existing column with validation
 */
export function updateColumn(columnId: string, data: UpdateColumnData, existingColumns: Column[]): { column: Column | null; errors: ColumnValidationError[] } {
  const column = existingColumns.find(col => col.id === columnId);
  if (!column) {
    return { column: null, errors: [{ field: 'title', message: 'Column not found' }] };
  }

  const errors = validateColumnData(data, existingColumns, columnId);
  if (errors.length > 0) {
    return { column: null, errors };
  }

  const updatedColumn: Column = {
    ...column,
    ...data,
    updatedAt: new Date(),
  };

  return { column: updatedColumn, errors: [] };
}

/**
 * Checks if a column can be deleted
 */
export function canDeleteColumn(column: Column, allColumns: Column[]): { canDelete: boolean; reason?: string } {
  // Prevent deletion if it's a default column
  if (column.isDefault) {
    return { canDelete: false, reason: 'Default columns cannot be deleted' };
  }

  // Prevent deletion if it's the last column
  if (allColumns.length <= 1) {
    return { canDelete: false, reason: 'Cannot delete the last column' };
  }

  return { canDelete: true };
}

/**
 * Deletes a column and reassigns its tasks
 */
export function deleteColumn(
  columnId: string, 
  columns: Column[], 
  tasks: Task[], 
  targetColumnId?: string
): { 
  updatedColumns: Column[]; 
  updatedTasks: Task[]; 
  success: boolean; 
  error?: string 
} {
  const column = columns.find(col => col.id === columnId);
  if (!column) {
    return { updatedColumns: columns, updatedTasks: tasks, success: false, error: 'Column not found' };
  }

  const { canDelete, reason } = canDeleteColumn(column, columns);
  if (!canDelete) {
    return { updatedColumns: columns, updatedTasks: tasks, success: false, error: reason };
  }

  // Find target column for task reassignment
  let targetColumn: Column | undefined;
  if (targetColumnId) {
    targetColumn = columns.find(col => col.id === targetColumnId);
  }
  
  // If no target specified or target not found, use first available column
  if (!targetColumn) {
    targetColumn = columns.find(col => col.id !== columnId);
  }

  if (!targetColumn) {
    return { updatedColumns: columns, updatedTasks: tasks, success: false, error: 'No target column available' };
  }

  // Update tasks that belong to the deleted column
  const updatedTasks = tasks.map(task => {
    if (task.status === column.status) {
      return updateTask(task, { status: targetColumn!.status });
    }
    return task;
  });

  // Remove the column and reorder remaining columns
  const updatedColumns = columns
    .filter(col => col.id !== columnId)
    .map((col, index) => ({ ...col, order: index }));

  return { updatedColumns, updatedTasks, success: true };
}

/**
 * Reorders columns
 */
export function reorderColumns(columns: Column[], fromIndex: number, toIndex: number): Column[] {
  const result = [...columns];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  
  // Update order property
  return result.map((col, index) => ({ ...col, order: index }));
}

/**
 * Creates a new task with default values
 */
export function createTask(
  title: string,
  description?: string,
  priority: TaskPriority = 'medium',
  status: TaskStatus = 'todo',
  dueDate?: Date
): Task {
  const now = new Date();
  return {
    id: generateId(),
    title,
    description,
    priority,
    status,
    createdAt: now,
    updatedAt: now,
    dueDate,
  };
}

/**
 * Creates a new board with default columns
 */
export function createBoard(title: string = 'My Kanban Board'): Board {
  const now = new Date();
  return {
    id: generateId(),
    title,
    columns: DEFAULT_COLUMNS,
    tasks: [],
    createdAt: now,
    updatedAt: now,
    settings: {
      allowCustomColumns: true,
      maxColumns: 10,
      defaultColumnColor: '#3b82f6',
    },
  };
}

/**
 * Updates a task with new values and sets updatedAt timestamp
 */
export function updateTask(task: Task, updates: Partial<Task>): Task {
  return {
    ...task,
    ...updates,
    updatedAt: new Date(),
  };
}

/**
 * Moves a task to a different column/status
 */
export function moveTaskToColumn(task: Task, newStatus: TaskStatus): Task {
  return updateTask(task, { status: newStatus });
}

/**
 * Gets all tasks for a specific status/column
 */
export function getTasksByStatus(tasks: Task[], status: TaskStatus): Task[] {
  return tasks.filter(task => task.status === status);
}

/**
 * Sorts tasks by priority (urgent -> high -> medium -> low)
 */
export function sortTasksByPriority(tasks: Task[]): Task[] {
  const priorityOrder: Record<TaskPriority, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return [...tasks].sort((a, b) => {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Searches tasks by title and description
 */
export function searchTasks(tasks: Task[], query: string): Task[] {
  if (!query.trim()) return tasks;
  
  const lowercaseQuery = query.toLowerCase();
  return tasks.filter(task => 
    task.title.toLowerCase().includes(lowercaseQuery) ||
    task.description?.toLowerCase().includes(lowercaseQuery)
  );
}

/**
 * Filters tasks by priority level
 */
export function filterTasksByPriority(tasks: Task[], priority: TaskPriority): Task[] {
  return tasks.filter(task => task.priority === priority);
}

/**
 * Checks if a task is overdue
 */
export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate) return false;
  return new Date() > task.dueDate && task.status !== 'done';
}

/**
 * Gets tasks that are due soon (within specified days)
 */
export function getTasksDueSoon(tasks: Task[], days: number = 3): Task[] {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return tasks.filter(task => 
    task.dueDate && 
    task.dueDate > now && 
    task.dueDate <= futureDate &&
    task.status !== 'done'
  );
}

/**
 * Gets overdue tasks
 */
export function getOverdueTasks(tasks: Task[]): Task[] {
  return tasks.filter(isTaskOverdue);
}

/**
 * Gets task statistics for a board
 */
export function getTaskStatistics(tasks: Task[]) {
  const total = tasks.length;
  const completed = tasks.filter(task => task.status === 'done').length;
  const overdue = getOverdueTasks(tasks).length;
  const dueSoon = getTasksDueSoon(tasks).length;
  
  const byPriority = {
    urgent: tasks.filter(task => task.priority === 'urgent').length,
    high: tasks.filter(task => task.priority === 'high').length,
    medium: tasks.filter(task => task.priority === 'medium').length,
    low: tasks.filter(task => task.priority === 'low').length,
  };
  
  const byStatus = {
    todo: tasks.filter(task => task.status === 'todo').length,
    'in-progress': tasks.filter(task => task.status === 'in-progress').length,
    done: completed,
  };
  
  return {
    total,
    completed,
    overdue,
    dueSoon,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    byPriority,
    byStatus,
  };
} 