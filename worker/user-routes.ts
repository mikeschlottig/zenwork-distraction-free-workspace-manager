import { Hono } from "hono";
import type { Env } from './core-utils';
import { WorkspaceEntity, ResourceEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
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
      notes: '',
      tasks: [],
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
      order: Date.now() // Simple ordering
    });
    return ok(c, resource);
  });
  app.delete('/api/resources/:id', async (c) => {
    await ResourceEntity.delete(c.env, c.req.param('id'));
    return ok(c, { id: c.req.param('id') });
  });
}