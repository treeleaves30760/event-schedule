// Event Types
export type EventType = 'event' | 'homework' | 'meeting' | 'task' | 'reminder' | 'other';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  type: EventType;
  urgency: number; // 1-5
  importance: number; // 1-5
  dueDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  type: EventType;
  urgency: number;
  importance: number;
  dueDate?: Date;
  startTime?: Date;
  endTime?: Date;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  type?: EventType;
  urgency?: number;
  importance?: number;
  dueDate?: Date;
  startTime?: Date;
  endTime?: Date;
  completed?: boolean;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string | null;
  apiToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Priority Matrix Position
export interface MatrixPosition {
  urgency: number;
  importance: number;
}
