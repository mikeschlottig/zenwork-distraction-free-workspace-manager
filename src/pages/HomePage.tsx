import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/zen/Sidebar';
import { WorkspaceView } from '@/components/zen/WorkspaceView';
import { Toaster } from '@/components/ui/sonner';
import { api } from '@/lib/api-client';
import type { Workspace } from '@shared/types';
import { Loader2 } from 'lucide-react';
export function HomePage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const load = async () => {
      try {
        const data = await api<Workspace[]>('/api/workspaces');
        setWorkspaces(data);
        if (data.length > 0) setActiveId(data[0].id);
      } catch (err) {
        console.error('Failed to load workspaces', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);
  const activeWorkspace = workspaces.find(w => w.id === activeId);
  const handleCreateWorkspace = async (name: string) => {
    try {
      const newWs = await api<Workspace>('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setWorkspaces(prev => [...prev, newWs]);
      setActiveId(newWs.id);
    } catch (err) {
      console.error(err);
    }
  };
  const handleDeleteWorkspace = async (id: string) => {
    try {
      await api(`/api/workspaces/${id}`, { method: 'DELETE' });
      setWorkspaces(prev => prev.filter(w => w.id !== id));
      if (activeId === id) setActiveId(workspaces[0]?.id || null);
    } catch (err) {
      console.error(err);
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
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      <Sidebar 
        workspaces={workspaces} 
        activeId={activeId} 
        onSelect={setActiveId}
        onCreate={handleCreateWorkspace}
        onDelete={handleDeleteWorkspace}
      />
      <main className="flex-1 relative overflow-auto">
        {activeWorkspace ? (
          <WorkspaceView workspace={activeWorkspace} onUpdate={(updated) => {
            setWorkspaces(prev => prev.map(w => w.id === updated.id ? updated : w));
          }} />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500">
            Select or create a space to begin
          </div>
        )}
      </main>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}