import { Hono } from "hono";
import type { Env } from './core-utils';
import { WorkspaceEntity, ResourceEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // WORKSPACES
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
  // RESOURCES
  app.get('/api/workspaces/:id/resources', async (c) => {
    await ResourceEntity.ensureSeed(c.env);
    const resources = await ResourceEntity.listByWorkspace(c.env, c.req.param('id'));
    return ok(c, resources);
  });
  app.post('/api/resources', async (c) => {
    const data = await c.req.json();
    if (!data.workspaceId || !data.url) return bad(c, 'Missing data');
    const resource = await ResourceEntity.create(c.env, {
      ...data,
      id: crypto.randomUUID(),
      order: data.order ?? Date.now()
    });
    return ok(c, resource);
  });
  app.post('/api/resources/bulk-reorder', async (c) => {
    const updates = await c.req.json();
    if (!Array.isArray(updates)) return bad(c, 'Expected array');
    await ResourceEntity.bulkReorder(c.env, updates);
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
}