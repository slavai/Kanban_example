'use client';

import { useState, useEffect } from 'react';
import { Task, TaskStatus, Column, CreateColumnData, UpdateColumnData } from '@/types/kanban';
import { KanbanColumn } from './KanbanColumn';
import { TaskModal } from './TaskModal';
import { ColumnModal } from './ColumnModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useKanban } from '@/hooks/useKanban';
import { useToast } from '@/components/layout/ToastProvider';
import { searchTasks } from '@/utils/kanban';

export function KanbanBoard() {
  const { 
    board, 
    isLoading, 
    addTask, 
    updateTask, 
    deleteTask, 
    moveTask,
    addColumn,
    updateColumn,
    deleteColumn,
  } = useKanban();
  
  const { showSuccess, showError, showWarning } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [editingColumn, setEditingColumn] = useState<Column | undefined>();
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('todo');

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if no modal is open and not typing in an input
      if (isTaskModalOpen || isColumnModalOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        handleAddTask('todo');
      } else if (e.key === 'Escape') {
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isTaskModalOpen, isColumnModalOpen]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Board not found</h2>
          <p className="text-gray-600 mb-4">Something went wrong loading your board.</p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </div>
    );
  }

  const filteredTasks = searchTasks(board.tasks, searchQuery);

  const handleAddTask = (status: TaskStatus) => {
    setEditingTask(undefined);
    setNewTaskStatus(status);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTaskStatus(task.status);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    try {
      deleteTask(taskId);
      showSuccess('Task deleted successfully');
    } catch {
      showError('Failed to delete task');
    }
  };

  const handleTaskMove = (taskId: string, newStatus: TaskStatus) => {
    const task = board.tasks.find(t => t.id === taskId);
    if (!task) {
      showError('Task not found');
      return;
    }

    if (task.status === newStatus) {
      showWarning('Task is already in this column');
      return;
    }

    try {
      moveTask(taskId, newStatus);
      showSuccess(`Task moved to ${board.columns.find(c => c.status === newStatus)?.title || newStatus}`);
    } catch {
      showError('Failed to move task');
    }
  };

  const handleTaskSubmit = (taskData: {
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: Date;
  }) => {
    try {
      if (editingTask) {
        updateTask(editingTask.id, {
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          dueDate: taskData.dueDate,
        });
        showSuccess('Task updated successfully');
      } else {
        addTask({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          status: newTaskStatus,
          dueDate: taskData.dueDate,
        });
        showSuccess('Task created successfully');
      }
    } catch {
      showError(editingTask ? 'Failed to update task' : 'Failed to create task');
    }
  };

  // Column management functions
  const handleAddColumn = () => {
    setEditingColumn(undefined);
    setIsColumnModalOpen(true);
  };

  const handleEditColumn = (column: Column) => {
    setEditingColumn(column);
    setIsColumnModalOpen(true);
  };

  const handleDeleteColumn = (columnId: string) => {
    const column = board.columns.find(c => c.id === columnId);
    if (!column) return;

    const tasksInColumn = board.tasks.filter(t => t.status === column.status);
    let message = `Are you sure you want to delete "${column.title}"?`;
    
    if (tasksInColumn.length > 0) {
      message += ` ${tasksInColumn.length} task(s) will be moved to the first available column.`;
    }

    if (window.confirm(message)) {
      const result = deleteColumn(columnId);
      if (result.success) {
        showSuccess('Column deleted successfully');
      } else {
        showError(result.error || 'Failed to delete column');
      }
    }
  };

  const handleColumnSubmit = (columnData: CreateColumnData | UpdateColumnData) => {
    try {
      if (editingColumn) {
        const result = updateColumn(editingColumn.id, columnData as UpdateColumnData);
        if (result.success) {
          showSuccess('Column updated successfully');
        } else {
          showError(result.error || 'Failed to update column');
        }
      } else {
        const result = addColumn(columnData as CreateColumnData);
        if (result.success) {
          showSuccess('Column created successfully');
        } else {
          showError(result.error || 'Failed to create column');
        }
      }
    } catch {
      showError(editingColumn ? 'Failed to update column' : 'Failed to create column');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-4" role="banner">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{board.title}</h1>
            <p className="text-sm text-gray-600 mt-1" aria-live="polite">
              {board.tasks.length} tasks • {board.columns.length} columns
              {filteredTasks.length !== board.tasks.length && (
                <span className="ml-2">({filteredTasks.length} shown)</span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10"
                aria-label="Search tasks"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleAddColumn}
                variant="outline"
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
                aria-label="Add new column"
                title="Add new column"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
                Add Column
              </Button>
              
              <Button
                onClick={() => handleAddTask('todo')}
                aria-label="Add new task (Ctrl+N)"
                title="Add new task (Ctrl+N)"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Board */}
      <main className="flex-1 overflow-hidden" role="main">
        <div className="h-full overflow-x-auto py-6">
          <div className="flex gap-6 px-6 min-w-max">
            {board.columns
              .sort((a, b) => a.order - b.order)
              .map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={filteredTasks}
                  onTaskEdit={handleEditTask}
                  onTaskDelete={handleDeleteTask}
                  onTaskMove={handleTaskMove}
                  onAddTask={handleAddTask}
                  onEditColumn={handleEditColumn}
                  onDeleteColumn={handleDeleteColumn}
                  allColumns={board.columns}
                />
              ))}
            
            {/* Add Column Placeholder */}
            {board.columns.length < (board.settings?.maxColumns || 10) && (
              <div className="min-w-[300px] w-80">
                <Button
                  onClick={handleAddColumn}
                  variant="outline"
                  className="w-full h-32 border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-all duration-200"
                  aria-label="Add new column"
                >
                  <div className="text-center">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm font-medium">Add Column</span>
                  </div>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(undefined);
        }}
        onSubmit={handleTaskSubmit}
        task={editingTask}
        defaultStatus={newTaskStatus}
      />

      <ColumnModal
        isOpen={isColumnModalOpen}
        onClose={() => {
          setIsColumnModalOpen(false);
          setEditingColumn(undefined);
        }}
        onSubmit={handleColumnSubmit}
        column={editingColumn}
        existingColumns={board.columns}
      />
    </div>
  );
} 