export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface Resource {
  id: string;
  workspaceId: string;
  title: string;
  url: string;
  favicon?: string;
  order: number;
}
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}
export interface Workspace {
  id: string;
  name: string;
  notes: string;
  tasks: Task[];
  createdAt: number;
}
// User types kept for compatibility if needed
export interface User {
  id: string;
  name: string;
}