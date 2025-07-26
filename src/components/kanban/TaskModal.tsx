'use client';

import { useState, useEffect, useRef } from 'react';
import { Task, TaskPriority, TaskStatus } from '@/types/kanban';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { clsx } from 'clsx';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: {
    title: string;
    description?: string;
    priority: TaskPriority;
    dueDate?: Date;
  }) => void;
  task?: Task | null;
  defaultStatus?: TaskStatus;
}

export function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  task,
  defaultStatus = 'todo',
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority);
        setDueDate(task.dueDate ? task.dueDate.toISOString().split('T')[0] : '');
      } else {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setDueDate('');
      }
      setErrors({});
      setIsSubmitting(false);
      
      // Focus the title input when modal opens
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, task]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (title.trim().length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (description.trim().length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for UX
      
      onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
    } catch (error) {
      console.error('Failed to submit task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setErrors({});
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
            {task ? 'Edit Task' : 'Add New Task'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
            disabled={isSubmitting}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <p id="modal-description" className="sr-only">
          {task ? 'Edit the details of your existing task' : 'Create a new task with title, description, priority, and due date'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <Input
              ref={titleInputRef}
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className={clsx(errors.title && 'border-red-300 focus:border-red-500')}
              disabled={isSubmitting}
              aria-describedby={errors.title ? 'title-error' : undefined}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p id="title-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description..."
              rows={3}
              className={clsx(
                "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
                errors.description && 'border-red-300 focus:border-red-500'
              )}
              disabled={isSubmitting}
              aria-describedby={errors.description ? 'description-error' : undefined}
              aria-invalid={!!errors.description}
            />
            <div className="flex justify-between mt-1">
              {errors.description && (
                <p id="description-error" className="text-sm text-red-600" role="alert">
                  {errors.description}
                </p>
              )}
              <p className="text-xs text-gray-500 ml-auto">
                {description.length}/500
              </p>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <Select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              disabled={isSubmitting}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent Priority</option>
            </Select>
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="task-due-date" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <Input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                task ? 'Update Task' : 'Create Task'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 