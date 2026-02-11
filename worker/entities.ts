import { IndexedEntity } from "./core-utils";
import type { Workspace, Resource, Note } from "@shared/types";
import { MOCK_WORKSPACES, MOCK_RESOURCES } from "@shared/mock-data";
export class WorkspaceEntity extends IndexedEntity<Workspace> {
  static readonly entityName = "workspace";
  static readonly indexName = "workspaces";
  static readonly initialState: Workspace = {
    id: "",
    name: "New Space",
    notes: [],
    tasks: [],
    groups: [],
    layout: {
      columns: 1,
      resourceOrder: [],
      notesViewMode: "cards"
    },
    createdAt: 0
  };
  static seedData = MOCK_WORKSPACES;
  async addNote(note: Note): Promise<Workspace> {
    return this.mutate(s => ({ ...s, notes: [...s.notes, note] }));
  }
  async updateNote(noteId: string, updates: Partial<Note>): Promise<Workspace> {
    return this.mutate(s => ({
      ...s,
      notes: s.notes.map(n => n.id === noteId ? { ...n, ...updates, updatedAt: Date.now() } : n)
    }));
  }
  override async patch(p: Partial<Workspace>): Promise<void> {
    await this.mutate((s) => {
      const next = { ...s, ...p };
      if (p.layout && s.layout) {
        next.layout = { ...s.layout, ...p.layout };
      }
      return next;
    });
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
  static extractDomain(url: string): string {
    try {
      const u = new URL(url);
      return u.hostname.replace('www.', '');
    } catch {
      return 'other';
    }
  }
  static async listByWorkspace(env: any, workspaceId: string): Promise<Resource[]> {
    const { items } = await this.list(env, null, 500);
    return items
      .filter(r => r.workspaceId === workspaceId)
      .sort((a, b) => a.order - b.order);
  }
  static async bulkUpdate(env: any, updates: { id: string; patch: Partial<Resource> }[]): Promise<void> {
    await Promise.all(updates.map(async (u) => {
      const res = new ResourceEntity(env, u.id);
      await res.patch(u.patch);
    }));
  }
}