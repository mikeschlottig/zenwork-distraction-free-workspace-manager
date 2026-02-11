import { IndexedEntity } from "./core-utils";
import type { Workspace, Resource, Task } from "@shared/types";
import { MOCK_WORKSPACES, MOCK_RESOURCES } from "@shared/mock-data";
export class WorkspaceEntity extends IndexedEntity<Workspace> {
  static readonly entityName = "workspace";
  static readonly indexName = "workspaces";
  static readonly initialState: Workspace = { 
    id: "", 
    name: "New Space", 
    notes: "", 
    tasks: [], 
    createdAt: 0 
  };
  static seedData = MOCK_WORKSPACES;
  async updateNotes(notes: string): Promise<Workspace> {
    return this.mutate(s => ({ ...s, notes }));
  }
  async updateTasks(tasks: Task[]): Promise<Workspace> {
    return this.mutate(s => ({ ...s, tasks }));
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
}