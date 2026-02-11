import React, { useState, useEffect } from 'react';
import { Zap, Loader2 } from 'lucide-react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { toast } from 'sonner';
import { Sidebar } from '@/components/zen/Sidebar';
import { WorkspaceView } from '@/components/zen/WorkspaceView';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import type { Workspace } from '@shared/types';
export function HomePage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );
  const fetchWorkspaces = async () => {
    try {
      const data = await api<Workspace[]>('/api/workspaces');
      setWorkspaces(data);
      return data;
    } catch (err) {
      console.error('Failed to load workspaces', err);
      toast.error('Failed to load workspaces');
      return [];
    }
  };
  useEffect(() => {
    const load = async () => {
      const data = await fetchWorkspaces();
      if (data && data.length > 0) {
        setActiveId(data[0].id);
      }
      setIsLoading(false);
    };
    load();
  }, []);
  const activeWorkspace = workspaces.find(w => w.id === activeId);
  const handleUpdateWorkspace = (updated: Workspace) => {
    setWorkspaces(prev => prev.map(w => w.id === updated.id ? updated : w));
  };
  const handleCreateWorkspace = async (name: string) => {
    try {
      const newWs = await api<Workspace>('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setWorkspaces(prev => [...prev, newWs]);
      setActiveId(newWs.id);
      toast.success('Workspace created');
    } catch (err) {
      toast.error('Failed to create workspace');
    }
  };
  const handleDeleteWorkspace = async (id: string) => {
    try {
      await api(`/api/workspaces/${id}`, { method: 'DELETE' });
      const remaining = workspaces.filter(w => w.id !== id);
      setWorkspaces(remaining);
      if (activeId === id) {
        setActiveId(remaining.length > 0 ? remaining[0].id : null);
      }
      toast.success('Workspace deleted');
    } catch (err) {
      toast.error('Failed to delete workspace');
    }
  };
  const handleGlobalOrganize = async () => {
    setIsOrganizing(true);
    const toastId = toast.loading('Intelligently organizing resources across spaces...');
    try {
      await api('/api/workspaces/auto-organize-all', { method: 'POST' });
      await fetchWorkspaces();
      toast.success('Resources auto-sorted to primary spaces', { id: toastId });
    } catch (err) {
      toast.error('Organization failed', { id: toastId });
    } finally {
      setIsOrganizing(false);
    }
  };
  const handleDragEndGlobal = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (String(over.id).startsWith('sidebar-') && !String(active.id).startsWith('sidebar-')) {
      const targetWsId = over.data.current?.workspaceId;
      const resourceId = active.id;
      if (targetWsId && targetWsId !== activeWorkspace?.id) {
        try {
          await api(`/api/resources/${resourceId}`, {
            method: 'PATCH',
            body: JSON.stringify({ workspaceId: targetWsId, groupId: undefined })
          });
          toast.success('Moved resource to new space');
          const [updatedActive, updatedTarget] = await Promise.all([
            api<Workspace>(`/api/workspaces/${activeId}`),
            api<Workspace>(`/api/workspaces/${targetWsId}`)
          ]);
          setWorkspaces(prev => prev.map(w => {
            if (w.id === updatedActive.id) return updatedActive;
            if (w.id === updatedTarget.id) return updatedTarget;
            return w;
          }));
        } catch (err) {
          toast.error('Failed to move resource');
        }
      }
    }
  };
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }
  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEndGlobal}>
      <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
        <Sidebar 
          workspaces={workspaces} 
          activeId={activeId} 
          onSelect={setActiveId} 
          onCreate={handleCreateWorkspace} 
          onDelete={handleDeleteWorkspace}
          onGlobalOrganize={handleGlobalOrganize}
          isOrganizing={isOrganizing}
        />
        <main className="flex-1 relative overflow-hidden bg-slate-950">
          {activeWorkspace ? (
            <WorkspaceView workspace={activeWorkspace} onUpdate={handleUpdateWorkspace} onDelete={handleDeleteWorkspace} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4">
              <Zap className="w-12 h-12 opacity-20" />
              <p className="text-lg">Select or create a space to begin</p>
              <Button onClick={() => handleCreateWorkspace('New Space')} variant="outline" className="border-slate-800 hover:bg-slate-800 text-slate-400">Quick Start</Button>
            </div>
          )}
        </main>
        <Toaster richColors position="bottom-right" theme="dark" />
      </div>
    </DndContext>
  );
}