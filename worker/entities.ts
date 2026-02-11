import { IndexedEntity } from "./core-utils";
import type { Workspace, Resource, Note, Task } from "@shared/types";
import { MOCK_WORKSPACES, MOCK_RESOURCES } from "@shared/mock-data";
export class WorkspaceEntity extends IndexedEntity<Workspace> {
  static readonly entityName = "workspace";
  static readonly indexName = "workspaces";
  static readonly initialState: Workspace = {
    id: "",
    name: "New Space",
    notes: [],
    tasks: [],
    layout: { columns: 1, resourceOrder: [] },
    createdAt: 0
  };
  // Convert legacy mock data (string notes) to array if necessary during seed
  static seedData = MOCK_WORKSPACES.map(ws => ({
    ...ws,
    notes: typeof (ws as any).notes === 'string' 
      ? [{ id: 'n1', title: 'Main Note', content: (ws as any).notes, createdAt: Date.now(), updatedAt: Date.now() }]
      : (ws.notes || []),
    layout: ws.layout || { columns: 1, resourceOrder: [] }
  }));
  async addNote(note: Note): Promise<Workspace> {
    return this.mutate(s => ({ ...s, notes: [...s.notes, note] }));
  }
  async updateNote(noteId: string, updates: Partial<Note>): Promise<Workspace> {
    return this.mutate(s => ({
      ...s,
      notes: s.notes.map(n => n.id === noteId ? { ...n, ...updates, updatedAt: Date.now() } : n)
    }));
  }
  async deleteNote(noteId: string): Promise<Workspace> {
    return this.mutate(s => ({
      ...s,
      notes: s.notes.filter(n => n.id !== noteId)
    }));
  }
}
export class ResourceEntity extends IndexedEntity<Resource> {
  static readonly entityName = "resource";
  static readonly indexName = "resources";
  static readonly initialState: Resource = {
    id: "",
    workspaceId: "",
    title: "",
    url: "",
    order: 0
  };
  static seedData = MOCK_RESOURCES;
  static async listByWorkspace(env: any, workspaceId: string): Promise<Resource[]> {
    const { items } = await this.list(env, null, 100);
    return items
      .filter(r => r.workspaceId === workspaceId)
      .sort((a, b) => a.order - b.order);
  }
  async move(newWorkspaceId: string): Promise<Resource> {
    return this.mutate(s => ({ ...s, workspaceId: newWorkspaceId }));
  }
}