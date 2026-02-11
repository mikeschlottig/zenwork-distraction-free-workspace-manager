import { Hono } from "hono";
import type { Env } from './core-utils';
import { WorkspaceEntity, ResourceEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { ResourceGroup, Resource } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/workspaces', async (c) => {
    await WorkspaceEntity.ensureSeed(c.env);
    const page = await WorkspaceEntity.list(c.env);
    return ok(c, page.items);
  });
  app.post('/api/workspaces', async (c) => {
    const data = await c.req.json();
    const workspace = await WorkspaceEntity.create(c.env, {
      ...data,
      id: crypto.randomUUID(),
      notes: [],
      tasks: [],
      groups: [],
      layout: { columns: 1, resourceOrder: [] },
      createdAt: Date.now()
    });
    return ok(c, workspace);
  });
  app.patch('/api/workspaces/:id', async (c) => {
    const id = c.req.param('id');
    const data = await c.req.json();
    const ws = new WorkspaceEntity(c.env, id);
    if (!await ws.exists()) return notFound(c);
    await ws.patch(data);
    return ok(c, await ws.getState());
  });
  app.post('/api/workspaces/:id/auto-organize', async (c) => {
    const id = c.req.param('id');
    const ws = new WorkspaceEntity(c.env, id);
    if (!await ws.exists()) return notFound(c);
    const resources = await ResourceEntity.listByWorkspace(c.env, id);
    const domainMap: Record<string, Resource[]> = {};
    resources.forEach(r => {
      const domain = ResourceEntity.extractDomain(r.url);
      if (!domainMap[domain]) domainMap[domain] = [];
      domainMap[domain].push(r);
    });
    const newGroups: ResourceGroup[] = [];
    const resourceUpdates: { id: string; patch: Partial<Resource> }[] = [];
    Object.entries(domainMap).forEach(([domain, items]) => {
      if (items.length >= 2) {
        const groupId = crypto.randomUUID();
        newGroups.push({ id: groupId, name: domain.charAt(0).toUpperCase() + domain.slice(1), order: newGroups.length });
        items.forEach(r => resourceUpdates.push({ id: r.id, patch: { groupId } }));
      } else {
        items.forEach(r => resourceUpdates.push({ id: r.id, patch: { groupId: undefined } }));
      }
    });
    await ws.patch({ groups: newGroups });
    await ResourceEntity.bulkUpdate(c.env, resourceUpdates);
    return ok(c, await ws.getState());
  });
  app.get('/api/resources/suggest-workspace', async (c) => {
    const url = c.req.query('url');
    if (!url) return bad(c, 'URL required');
    const domain = ResourceEntity.extractDomain(url);
    const { items: allResources } = await ResourceEntity.list(c.env, null, 1000);
    const match = allResources.find(r => ResourceEntity.extractDomain(r.url) === domain);
    if (match) {
      const ws = new WorkspaceEntity(c.env, match.workspaceId);
      const state = await ws.getState();
      return ok(c, { workspaceId: state.id, workspaceName: state.name });
    }
    return ok(c, null);
  });
  app.get('/api/workspaces/:id/resources', async (c) => {
    const resources = await ResourceEntity.listByWorkspace(c.env, c.req.param('id'));
    return ok(c, resources);
  });
  app.post('/api/resources', async (c) => {
    const data = await c.req.json();
    if (!data.workspaceId || !data.url) return bad(c, 'Missing data');
    const domain = ResourceEntity.extractDomain(data.url);
    const resource = await ResourceEntity.create(c.env, {
      ...data,
      id: crypto.randomUUID(),
      order: data.order ?? Date.now(),
      metadata: { domain }
    });
    return ok(c, resource);
  });
  app.post('/api/resources/bulk-reorder', async (c) => {
    const updates = await c.req.json();
    if (!Array.isArray(updates)) return bad(c, 'Expected array');
    await ResourceEntity.bulkUpdate(c.env, updates.map(u => ({ id: u.id, patch: { order: u.order } })));
    return ok(c, { success: true });
  });
  app.patch('/api/resources/:id', async (c) => {
    const id = c.req.param('id');
    const data = await c.req.json();
    const res = new ResourceEntity(c.env, id);
    if (!await res.exists()) return notFound(c);
    await res.patch(data);
    return ok(c, await res.getState());
  });
  app.delete('/api/resources/:id', async (c) => {
    await ResourceEntity.delete(c.env, c.req.param('id'));
    return ok(c, { id: c.req.param('id') });
  });
  app.patch('/api/workspaces/:id/notes/:noteId', async (c) => {
    const id = c.req.param('id');
    const noteId = c.req.param('noteId');
    const data = await c.req.json();
    const ws = new WorkspaceEntity(c.env, id);
    if (!await ws.exists()) return notFound(c);
    const updated = await ws.updateNote(noteId, data);
    return ok(c, updated);
  });
  app.delete('/api/workspaces/:id', async (c) => {
    const id = c.req.param('id');
    await WorkspaceEntity.delete(c.env, id);
    return ok(c, { id });
  });
}