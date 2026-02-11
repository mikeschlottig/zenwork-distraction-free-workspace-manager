import React, { useState } from 'react';
import { Plus, Layout, Trash2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Workspace } from '@shared/types';
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
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-fuchsia-500 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">ZenWork</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Your Spaces
        </div>
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className={cn(
              "group flex items-center justify-between px-3 py-2 rounded-md transition-all cursor-pointer",
              activeId === ws.id 
                ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            )}
            onClick={() => onSelect(ws.id)}
          >
            <div className="flex items-center gap-2 truncate">
              <Layout className="w-4 h-4" />
              <span className="truncate font-medium">{ws.name}</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(ws.id); }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {isCreating ? (
          <form onSubmit={handleSubmit} className="px-3 py-2 animate-in fade-in slide-in-from-top-1">
            <Input
              autoFocus
              className="h-8 bg-slate-800 border-slate-700 text-sm"
              placeholder="Space name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => !newName && setIsCreating(false)}
            />
          </form>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-500 hover:text-blue-400 hover:bg-blue-400/5 mt-2"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Space
          </Button>
        )}
      </div>
      <div className="p-4 border-t border-slate-800">
        <div className="text-[10px] text-slate-600 text-center uppercase tracking-widest font-bold">
          Focus is Power
        </div>
      </div>
    </aside>
  );
}