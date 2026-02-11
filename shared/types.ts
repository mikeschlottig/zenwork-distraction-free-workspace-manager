export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}
export interface ResourceGroup {
  id: string;
  name: string;
  order: number;
}
export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  labels: string[];
  dueDate?: number;
  order: number;
}
export interface KanbanColumn {
  id: string;
  name: string;
  order: number;
  cards: KanbanCard[];
}
export interface KanbanBoardData {
  columns: KanbanColumn[];
}
export interface WorkspaceLayout {
  columns: number;
  resourceOrder: string[]; 
  notesViewMode?: 'cards' | 'table';
}
export interface Workspace {
  id: string;
  name: string;
  notes: Note[];
  tasks: Task[];
  groups: ResourceGroup[];
  kanban: KanbanBoardData;
  layout: WorkspaceLayout;
  createdAt: number;
}
export interface Resource {
  id: string;
  workspaceId: string;
  groupId?: string;
  title: string;
  url: string;
  favicon?: string;
  order: number;
  metadata?: {
    domain?: string;
  };
}
export interface User {
  id: string;
  name: string;
}