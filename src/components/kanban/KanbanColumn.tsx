'use client';

import { useState } from 'react';
import { Column, Task, TaskStatus } from '@/types/kanban';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/Button';
import { getTasksByStatus, sortTasksByPriority, canDeleteColumn } from '@/utils/kanban';
import { clsx } from 'clsx';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskMove?: (taskId: string, newStatus: TaskStatus) => void;
  onAddTask?: (status: TaskStatus) => void;
  onEditColumn?: (column: Column) => void;
  onDeleteColumn?: (columnId: string) => void;
  onTaskDragStart?: (e: React.DragEvent, task: Task) => void;
  onTaskDragEnd?: (e: React.DragEvent) => void;
  allColumns?: Column[]; // Needed for delete validation
}

export function KanbanColumn({
  column,
  tasks,
  onTaskEdit,
  onTaskDelete,
  onTaskMove,
  onAddTask,
  onEditColumn,
  onDeleteColumn,
  onTaskDragStart,
  onTaskDragEnd,
  allColumns = [],
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const columnTasks = sortTasksByPriority(getTasksByStatus(tasks, column.status));
  const { canDelete } = canDeleteColumn(column, allColumns);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && onTaskMove) {
      onTaskMove(taskId, column.status);
    }
  };

  const handleTaskDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('text/plain', task.id);
    onTaskDragStart?.(e, task);
  };

  const handleTaskDragEnd = (e: React.DragEvent) => {
    setIsDragOver(false);
    onTaskDragEnd?.(e);
  };

  const handleEditColumn = () => {
    onEditColumn?.(column);
    setShowActions(false);
  };

  const handleDeleteColumn = () => {
    if (canDelete && onDeleteColumn) {
      onDeleteColumn(column.id);
    }
    setShowActions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, task: Task) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTaskEdit?.(task);
    } else if (e.key === 'Delete') {
      e.preventDefault();
      onTaskDelete?.(task.id);
    }
  };

  return (
    <section
      className="flex flex-col h-full min-w-[300px] w-80 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      aria-labelledby={`column-${column.id}-heading`}
    >
      {/* Enhanced Header with Actions */}
      <header
        className="relative flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: column.color }}
            aria-hidden="true"
          />
          <h2
            id={`column-${column.id}-heading`}
            className="font-semibold text-gray-900 text-sm flex-1"
          >
            {column.title}
          </h2>
          <span
            className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full font-medium min-w-[20px] text-center"
            aria-label={`${columnTasks.length} tasks in ${column.title}`}
          >
            {columnTasks.length}
          </span>
        </div>

        {/* Column Actions */}
        <div className="flex items-center gap-1">
          {/* Add Task Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddTask?.(column.status)}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1.5 h-auto w-auto"
            aria-label={`Add new task to ${column.title}`}
            title={`Add new task to ${column.title}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>

          {/* Column Management Actions */}
          {(showActions || column.isCustom) && (
            <div className={clsx(
              'flex gap-1 transition-opacity duration-200',
              showActions ? 'opacity-100' : 'opacity-0'
            )}>
              {/* Edit Column Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditColumn}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 h-auto w-auto"
                aria-label={`Edit column ${column.title}`}
                title="Edit column"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>

              {/* Delete Column Button */}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteColumn}
                  className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 h-auto w-auto"
                  aria-label={`Delete column ${column.title}`}
                  title="Delete column"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              )}
            </div>
          )}

          {/* Custom Column Indicator */}
          {column.isCustom && (
            <div
              className="ml-1 w-2 h-2 bg-blue-500 rounded-full"
              title="Custom column"
              aria-label="Custom column"
            />
          )}
        </div>
      </header>

      {/* Tasks Area */}
      <div
        className={clsx(
          'flex-1 p-3 transition-all duration-200 min-h-[500px] overflow-y-auto',
          isDragOver ? 'bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg' : 'bg-gray-50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="region"
        aria-label={`${column.title} tasks drop zone`}
      >
        <div className="space-y-3">
          {columnTasks.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm text-gray-500 mb-3">No tasks yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddTask?.(column.status)}
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add first task
              </Button>
            </div>
          ) : (
            columnTasks.map((task) => (
              <div
                key={task.id}
                className="group"
                tabIndex={0}
                role="article"
                aria-label={`Task: ${task.title}`}
                onKeyDown={(e) => handleKeyDown(e, task)}
              >
                <TaskCard
                  task={task}
                  onEdit={onTaskEdit}
                  onDelete={onTaskDelete}
                  onDragStart={handleTaskDragStart}
                  onDragEnd={handleTaskDragEnd}
                />
              </div>
            ))
          )}
        </div>

        {/* Drop Indicator */}
        {isDragOver && columnTasks.length > 0 && (
          <div className="flex items-center justify-center py-6 mt-4 border-2 border-dashed border-blue-400 rounded-lg bg-blue-100">
            <div className="text-center text-blue-700">
              <svg className="w-6 h-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <p className="text-xs font-medium">Drop task here</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
} 