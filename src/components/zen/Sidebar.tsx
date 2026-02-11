import React, { useState } from 'react';
import { Plus, Layout, Trash2, Zap, FolderInput, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDroppable } from '@dnd-kit/core';
import type { Workspace } from '@shared/types';
import { Badge } from '@/components/ui/badge';
interface SidebarItemProps {
  ws: Workspace;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}
function SidebarItem({ ws, isActive, onSelect, onDelete }: SidebarItemProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `sidebar-${ws.id}`,
    data: { workspaceId: ws.id }
  });
  const groupCount = ws.groups?.length || 0;
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group flex items-center justify-between px-3 py-2.5 rounded-lg transition-all cursor-pointer relative",
        isActive
          ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm"
          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
        isOver && "ring-2 ring-blue-500 bg-blue-500/20"
      )}
      onClick={() => onSelect(ws.id)}
    >
      <div className="flex items-center gap-3 truncate relative z-10">
        <Layout className={cn("w-4 h-4", isActive ? "text-blue-500" : "text-slate-500")} />
        <span className="truncate font-medium">{ws.name}</span>
        {groupCount > 0 && (
          <Badge variant="secondary" className="bg-slate-800 text-[9px] h-4 px-1 text-slate-400 font-normal">
            {groupCount} groups
          </Badge>
        )}
      </div>
      {!isOver && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(ws.id); }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity z-10"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
interface SidebarProps {
  workspaces: Workspace[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
}
export function Sidebar({ workspaces, activeId, onSelect, onCreate, onDelete }: SidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onCreate(newName.trim());
      setNewName('');
      setIsCreating(false);
    }
  };
  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-900 flex flex-col h-full shrink-0">
      <div className="p-6 pb-8 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">ZenWork</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4 space-y-2">
        <div className="px-3 mb-2 text-[11px] font-bold text-slate-600 uppercase tracking-widest">Your Workspaces</div>
        {workspaces.map((ws) => (
          <SidebarItem key={ws.id} ws={ws} isActive={activeId === ws.id} onSelect={onSelect} onDelete={onDelete} />
        ))}
        {isCreating ? (
          <form onSubmit={handleSubmit} className="px-2 py-1 animate-in fade-in slide-in-from-top-1">
            <Input autoFocus className="h-9 bg-slate-900 border-slate-800 text-sm focus:ring-blue-500/50" placeholder="Workspace name..." value={newName} onChange={(e) => setNewName(e.target.value)} onBlur={() => !newName && setIsCreating(false)} />
          </form>
        ) : (
          <Button variant="ghost" className="w-full justify-start text-slate-500 hover:text-blue-400 hover:bg-blue-400/5 px-3 py-2.5 rounded-lg" onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Space
          </Button>
        )}
      </div>
      <div className="p-4 border-t border-slate-900 space-y-3">
        <Button variant="outline" className="w-full justify-start text-xs border-slate-800 bg-slate-950/50 text-slate-400 hover:text-blue-400 h-9">
          <BrainCircuit className="w-3.5 h-3.5 mr-2" /> Smart Insights
        </Button>
        <div className="flex items-center gap-2 text-[10px] text-slate-700 font-medium px-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> WORKSPACE SYNCED
        </div>
      </div>
    </aside>
  );
}