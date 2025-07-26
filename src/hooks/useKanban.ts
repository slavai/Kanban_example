'use client';

import { useState, useEffect } from 'react';
import { Board, Task, TaskStatus, CreateColumnData, UpdateColumnData } from '@/types/kanban';
import { 
  createBoard, 
  createTask, 
  updateTask, 
  moveTaskToColumn,
  createColumn,
  updateColumn,
  deleteColumn as deleteColumnUtil,
} from '@/utils/kanban';
import { storage } from '@/utils/storage';
import { createDemoBoard, shouldCreateDemoData } from '@/utils/demo-data';

export function useKanban() {
  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load board from storage on mount
  useEffect(() => {
    const savedBoard = storage.getBoard();
    const savedTasks = storage.getTasks();
    const savedColumns = storage.getColumns();

    if (savedBoard) {
      // Use saved data with fallbacks
      const boardToUse: Board = {
        ...savedBoard,
        tasks: savedTasks.length > 0 ? savedTasks : savedBoard.tasks || [],
        columns: savedColumns.length > 0 ? savedColumns : savedBoard.columns || [],
      };
      setBoard(boardToUse);
    } else {
      // Create new board with demo data if needed
      const newBoard = shouldCreateDemoData() ? createDemoBoard() : createBoard();
      setBoard(newBoard);
      storage.saveBoard(newBoard);
      storage.saveColumns(newBoard.columns);
      storage.saveTasks(newBoard.tasks);
    }

    setIsLoading(false);
  }, []);

  // Save board to storage whenever it changes
  const saveBoard = (updatedBoard: Board) => {
    storage.saveBoard(updatedBoard);
    storage.saveTasks(updatedBoard.tasks);
    storage.saveColumns(updatedBoard.columns);
  };

  // Task management functions
  const addTask = (taskData: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    status?: TaskStatus;
    dueDate?: Date;
  }) => {
    if (!board) return;

    const newTask = createTask(
      taskData.title,
      taskData.description,
      taskData.priority,
      taskData.status,
      taskData.dueDate
    );

    const updatedBoard = {
      ...board,
      tasks: [...board.tasks, newTask],
      updatedAt: new Date(),
    };

    setBoard(updatedBoard);
    saveBoard(updatedBoard);
  };

  const updateTaskInBoard = (taskId: string, updates: Partial<Task>) => {
    if (!board) return;

    const updatedTasks = board.tasks.map(task =>
      task.id === taskId ? updateTask(task, updates) : task
    );

    const updatedBoard = {
      ...board,
      tasks: updatedTasks,
      updatedAt: new Date(),
    };

    setBoard(updatedBoard);
    saveBoard(updatedBoard);
  };

  const deleteTask = (taskId: string) => {
    if (!board) return;

    const updatedTasks = board.tasks.filter(task => task.id !== taskId);
    const updatedBoard = {
      ...board,
      tasks: updatedTasks,
      updatedAt: new Date(),
    };

    setBoard(updatedBoard);
    saveBoard(updatedBoard);
  };

  const moveTask = (taskId: string, newStatus: TaskStatus) => {
    if (!board) return;

    const task = board.tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Move task to new column
    updateTaskInBoard(taskId, { status: newStatus });
  };

  // Column management functions
  const addColumn = (columnData: CreateColumnData): { success: boolean; error?: string } => {
    if (!board) return { success: false, error: 'Board not found' };

    // Check max columns limit
    const maxColumns = board.settings?.maxColumns || 10;
    if (board.columns.length >= maxColumns) {
      return { success: false, error: `Maximum ${maxColumns} columns allowed` };
    }

    const { column, errors } = createColumn(columnData, board.columns);
    
    if (!column || errors.length > 0) {
      return { success: false, error: errors[0]?.message || 'Failed to create column' };
    }

    const updatedBoard = {
      ...board,
      columns: [...board.columns, column],
      updatedAt: new Date(),
    };

    setBoard(updatedBoard);
    saveBoard(updatedBoard);
    return { success: true };
  };

  const updateColumnInBoard = (columnId: string, updates: UpdateColumnData): { success: boolean; error?: string } => {
    if (!board) return { success: false, error: 'Board not found' };

    const { column, errors } = updateColumn(columnId, updates, board.columns);
    
    if (!column || errors.length > 0) {
      return { success: false, error: errors[0]?.message || 'Failed to update column' };
    }

    const updatedColumns = board.columns.map(col =>
      col.id === columnId ? column : col
    );

    const updatedBoard = {
      ...board,
      columns: updatedColumns,
      updatedAt: new Date(),
    };

    setBoard(updatedBoard);
    saveBoard(updatedBoard);
    return { success: true };
  };

  const deleteColumnFromBoard = (columnId: string, targetColumnId?: string): { success: boolean; error?: string } => {
    if (!board) return { success: false, error: 'Board not found' };

    const { updatedColumns, updatedTasks, success, error } = deleteColumnUtil(
      columnId,
      board.columns,
      board.tasks,
      targetColumnId
    );

    if (!success) {
      return { success: false, error };
    }

    const updatedBoard = {
      ...board,
      columns: updatedColumns,
      tasks: updatedTasks,
      updatedAt: new Date(),
    };

    setBoard(updatedBoard);
    saveBoard(updatedBoard);
    return { success: true };
  };

  const reorderColumns = (fromIndex: number, toIndex: number) => {
    if (!board) return;

    const reorderedColumns = [...board.columns];
    const [removed] = reorderedColumns.splice(fromIndex, 1);
    reorderedColumns.splice(toIndex, 0, removed);

    // Update order property
    const updatedColumns = reorderedColumns.map((col, index) => ({
      ...col,
      order: index,
    }));

    const updatedBoard = {
      ...board,
      columns: updatedColumns,
      updatedAt: new Date(),
    };

    setBoard(updatedBoard);
    saveBoard(updatedBoard);
  };

  return {
    board,
    isLoading,
    // Task operations
    addTask,
    updateTask: updateTaskInBoard,
    deleteTask,
    moveTask,
    // Column operations
    addColumn,
    updateColumn: updateColumnInBoard,
    deleteColumn: deleteColumnFromBoard,
    reorderColumns,
  };
} 