'use client';

import { useState, useEffect, useRef } from 'react';
import { Column, CreateColumnData, UpdateColumnData, ColumnValidationError } from '@/types/kanban';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { validateColumnData, getAvailableColumnColors } from '@/utils/kanban';
import { clsx } from 'clsx';

interface ColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateColumnData | UpdateColumnData) => void;
  column?: Column; // If provided, we're editing
  existingColumns: Column[];
}

export function ColumnModal({
  isOpen,
  onClose,
  onSubmit,
  column,
  existingColumns,
}: ColumnModalProps) {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [errors, setErrors] = useState<ColumnValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const isEditing = !!column;
  const availableColors = getAvailableColumnColors();

  // Initialize form with column data if editing
  useEffect(() => {
    if (column) {
      setTitle(column.title);
      setColor(column.color || '#3b82f6');
    } else {
      setTitle('');
      setColor('#3b82f6');
    }
    setErrors([]);
  }, [column, isOpen]);

  // Focus title input when modal opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose, isSubmitting]);

  // Focus trap within modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const getFieldError = (field: string) => {
    return errors.find(error => error.field === field)?.message;
  };

  const validateForm = () => {
    const data = isEditing 
      ? { title, color } as UpdateColumnData
      : { title, color } as CreateColumnData;
    
    const validationErrors = validateColumnData(
      data, 
      existingColumns, 
      isEditing ? column!.id : undefined
    );
    
    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const data = isEditing 
        ? { title: title.trim(), color } as UpdateColumnData
        : { title: title.trim(), color } as CreateColumnData;
      
      onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Error submitting column:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="column-modal-title"
      aria-describedby="column-modal-description"
    >
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" />
      
      <div 
        ref={modalRef}
        className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 id="column-modal-title" className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Column' : 'Add New Column'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
            disabled={isSubmitting}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <p id="column-modal-description" className="sr-only">
          {isEditing 
            ? 'Edit the title and color of your column' 
            : 'Create a new column with a custom title and color'
          }
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="column-title" className="block text-sm font-medium text-gray-700 mb-1">
              Column Title *
            </label>
            <Input
              ref={titleInputRef}
              id="column-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter column title..."
              className={clsx(
                getFieldError('title') && 'border-red-300 focus:border-red-500'
              )}
              disabled={isSubmitting}
              aria-describedby={getFieldError('title') ? 'title-error' : undefined}
              aria-invalid={!!getFieldError('title')}
              maxLength={30}
            />
            {getFieldError('title') && (
              <p id="title-error" className="mt-1 text-sm text-red-600" role="alert">
                {getFieldError('title')}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {title.length}/30 characters
            </p>
          </div>

          {/* Color */}
          <div>
            <label htmlFor="column-color" className="block text-sm font-medium text-gray-700 mb-1">
              Column Color
            </label>
            <div className="grid grid-cols-5 gap-3">
              {availableColors.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  onClick={() => setColor(colorOption)}
                  className={clsx(
                    'w-12 h-12 rounded-lg border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    color === colorOption 
                      ? 'border-gray-800 shadow-lg scale-110' 
                      : 'border-gray-300 hover:border-gray-400'
                  )}
                  style={{ backgroundColor: colorOption }}
                  aria-label={`Select color ${colorOption}`}
                  disabled={isSubmitting}
                />
              ))}
            </div>
            {getFieldError('color') && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {getFieldError('color')}
              </p>
            )}
          </div>

          {/* Warning for editing default columns */}
          {isEditing && column?.isDefault && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-amber-800">
                  This is a default column. Changing its name may affect task organization.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                isEditing ? 'Update Column' : 'Create Column'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 