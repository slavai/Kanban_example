import { Task, Board } from '@/types/kanban';
import { createBoard, createTask, DEFAULT_COLUMNS } from './kanban';

export function createDemoBoard(): Board {
  const board = createBoard('Demo Project Board');
  
  const demoTasks: Task[] = [
    // To Do tasks
    createTask(
      'Setup Development Environment',
      'Install Node.js, VS Code, and configure development tools for the project.',
      'high',
      'todo',
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    ),
    createTask(
      'Research UI/UX Best Practices',
      'Study modern design patterns and user experience principles for web applications.',
      'medium',
      'todo'
    ),
    createTask(
      'Plan Database Schema',
      'Design the database structure and relationships for the application.',
      'high',
      'todo',
      new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
    ),

    // In Progress tasks
    createTask(
      'Implement User Authentication',
      'Create login/register functionality with JWT tokens and secure password handling.',
      'urgent',
      'in-progress',
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
    ),
    createTask(
      'Design Landing Page',
      'Create an attractive and responsive landing page with call-to-action buttons.',
      'medium',
      'in-progress'
    ),

    // Done tasks
    createTask(
      'Project Kickoff Meeting',
      'Initial team meeting to discuss project requirements, timeline, and deliverables.',
      'high',
      'done',
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    ),
    createTask(
      'Choose Technology Stack',
      'Evaluate and select the best technologies for frontend, backend, and database.',
      'medium',
      'done',
      new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    ),
    createTask(
      'Setup Version Control',
      'Initialize Git repository and setup branching strategy for the team.',
      'low',
      'done',
      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    ),
  ];

  // Add created/updated timestamps
  demoTasks.forEach((task, index) => {
    const baseTime = Date.now() - (demoTasks.length - index) * 24 * 60 * 60 * 1000;
    task.createdAt = new Date(baseTime);
    task.updatedAt = new Date(baseTime + Math.random() * 12 * 60 * 60 * 1000); // Random update within 12 hours
  });

  return {
    ...board,
    tasks: demoTasks,
  };
}

export function shouldCreateDemoData(): boolean {
  // Create demo data if localStorage is empty or doesn't exist
  if (typeof window === 'undefined') return false;
  
  try {
    const existingBoard = localStorage.getItem('kanban-board');
    const existingTasks = localStorage.getItem('kanban-tasks');
    
    return !existingBoard && !existingTasks;
  } catch {
    return false;
  }
} 