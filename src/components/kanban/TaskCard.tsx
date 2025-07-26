'use client';

import { useState } from 'react';
import { Task, TaskPriority } from '@/types/kanban';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { isTaskOverdue } from '@/utils/kanban';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/utils/constants';
import { clsx } from 'clsx';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const isOverdue = isTaskOverdue(task);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    onDragStart?.(e, task);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    onDragEnd?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onEdit?.(task);
    } else if (e.key === 'Delete') {
      e.preventDefault();
      onDelete?.(task.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(task);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(task.id);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getDaysUntilDue = () => {
    if (!task.dueDate) return null;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateDisplay = () => {
    const daysUntilDue = getDaysUntilDue();
    if (daysUntilDue === null) return null;

    let suffix = '';
    if (daysUntilDue === 0) {
      suffix = 'Today';
    } else if (daysUntilDue > 0) {
      suffix = `${daysUntilDue}d`;
    } else {
      suffix = `${Math.abs(daysUntilDue)}d ago`;
    }

    return {
      text: formatDate(task.dueDate!),
      suffix,
      isUrgent: daysUntilDue !== null && daysUntilDue <= 3,
      isOverdue,
    };
  };

  const dueDateInfo = getDueDateDisplay();

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Task: ${task.title}. Priority: ${PRIORITY_LABELS[task.priority]}. ${task.description ? `Description: ${task.description}` : ''} Press Enter to edit, Delete to remove.`}
      className={clsx(
        // Base styles
        'cursor-move transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mb-3 group bg-white border border-gray-200',
        // Dragging state
        isDragging && 'opacity-50 rotate-1 scale-105 shadow-2xl',
        // Overdue state
        isOverdue && 'border-red-300 bg-red-50'
      )}
    >
      <CardHeader className="pb-3 pt-3 px-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1 pr-2 leading-5">
            {task.title}
          </CardTitle>
          
          {/* Action buttons */}
          <div className={clsx(
            'flex gap-1 ml-2 transition-opacity duration-200',
            isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              onClick={handleEdit}
              aria-label={`Edit task: ${task.title}`}
              title="Edit task"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
              onClick={handleDelete}
              aria-label={`Delete task: ${task.title}`}
              title="Delete task"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-3 px-3">
        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-3 leading-4">
            {task.description}
          </p>
        )}

        {/* Footer with priority and due date */}
        <div className="flex items-center justify-between gap-2">
          {/* Priority indicator */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold border"
            style={{
              backgroundColor: `${PRIORITY_COLORS[task.priority]}15`,
              borderColor: `${PRIORITY_COLORS[task.priority]}30`,
              color: PRIORITY_COLORS[task.priority],
            }}
            aria-label={`Priority: ${PRIORITY_LABELS[task.priority]}`}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
              aria-hidden="true"
            />
            {PRIORITY_LABELS[task.priority]}
          </div>

          {/* Due date */}
          {dueDateInfo && (
            <div className={clsx(
              'text-xs px-2 py-1 rounded-md font-medium border flex-shrink-0',
              dueDateInfo.isOverdue 
                ? 'text-red-700 bg-red-100 border-red-200' 
                : dueDateInfo.isUrgent
                ? 'text-orange-700 bg-orange-100 border-orange-200'
                : 'text-gray-600 bg-gray-100 border-gray-200'
            )}>
              {dueDateInfo.isOverdue && (
                <span className="mr-1" aria-label="Overdue">⚠️</span>
              )}
              {dueDateInfo.text}
              <span className="ml-1 text-xs opacity-75">
                ({dueDateInfo.suffix})
              </span>
            </div>
          )}
        </div>

        {/* Accessibility-only content */}
        <div className="sr-only">
          Created: {task.createdAt.toLocaleDateString()}
          {task.updatedAt.getTime() !== task.createdAt.getTime() && (
            <span>, Updated: {task.updatedAt.toLocaleDateString()}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 