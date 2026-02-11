import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import type { Resource, WorkspaceLayout, Workspace } from '@shared/types';
import { ExternalLink, Trash2, Plus, Globe, GripVertical, Sparkles, ChevronDown, ChevronRight, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
interface SortableItemProps {
  resource: Resource;
  onDelete: (id: string) => void;
  columns: number;
}
function SortableResource({ resource, onDelete, columns }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: resource.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto' };
  return (
    <div ref={setNodeRef} style={style} className={cn("group flex flex-col p-3 bg-slate-900/50 border border-slate-800/50 rounded-xl hover:border-blue-500/30 hover:bg-slate-900 transition-all shadow-sm", isDragging && "opacity-50 scale-95 shadow-2xl border-blue-500/50", columns === 1 ? "flex-row items-center" : "items-start gap-3")}>
      <div className={cn("flex items-center gap-3 flex-1 truncate w-full", columns === 1 ? "" : "flex-col items-start")}>
        <div className="flex items-center w-full gap-2">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-slate-700 hover:text-slate-500"><GripVertical className="w-4 h-4" /></button>
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
            {resource.favicon ? <img src={resource.favicon} alt="" className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
          </div>
          {columns > 1 && <div className="flex-1 truncate"><span className="text-xs font-semibold text-slate-200 truncate block">{resource.title}</span></div>}
        </div>
        <div className={cn("flex flex-col truncate w-full", columns === 1 ? "" : "mt-1")}>
          {columns === 1 && <span className="text-sm font-semibold text-slate-200 truncate">{resource.title}</span>}
          <span className="text-[10px] text-slate-500 truncate">{resource.url}</span>
        </div>
      </div>
      <div className={cn("flex items-center gap-1", columns === 1 ? "" : "w-full justify-end border-t border-slate-800/50 pt-2")}>
        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"><ExternalLink className="w-3.5 h-3.5" /></a>
        <button onClick={() => onDelete(resource.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}
export function ResourceList({ workspaceId, layout }: { workspaceId: string, layout: WorkspaceLayout }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [suggestion, setSuggestion] = useState<{ workspaceId: string, workspaceName: string } | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  useEffect(() => {
    const load = async () => {
      const [resData, wsData] = await Promise.all([
        api<Resource[]>(`/api/workspaces/${workspaceId}/resources`),
        api<Workspace>(`/api/workspaces/${workspaceId}`)
      ]);
      setResources(resData);
      setWorkspace(wsData);
    };
    load();
  }, [workspaceId]);
  useEffect(() => {
    if (newUrl.length > 5) {
      const t = setTimeout(async () => {
        const data = await api<{ workspaceId: string, workspaceName: string } | null>(`/api/resources/suggest-workspace?url=${encodeURIComponent(newUrl)}`);
        setSuggestion(data?.workspaceId !== workspaceId ? data : null);
      }, 500);
      return () => clearTimeout(t);
    } else {
      setSuggestion(null);
    }
  }, [newUrl, workspaceId]);
  const handleAutoOrganize = async () => {
    try {
      toast.loading("Organizing resources...", { id: "organize" });
      const updated = await api<Workspace>(`/api/workspaces/${workspaceId}/auto-organize`, { method: 'POST' });
      setWorkspace(updated);
      const resData = await api<Resource[]>(`/api/workspaces/${workspaceId}/resources`);
      setResources(resData);
      toast.success("Organized by domain!", { id: "organize" });
    } catch {
      toast.error("Failed to organize", { id: "organize" });
    }
  };
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = resources.findIndex((i) => i.id === active.id);
      const newIndex = resources.findIndex((i) => i.id === over.id);
      const newArray = arrayMove(resources, oldIndex, newIndex);
      setResources(newArray);
      api('/api/resources/bulk-reorder', { method: 'POST', body: JSON.stringify(newArray.map((res, idx) => ({ id: res.id, order: idx }))) });
    }
  };
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    try {
      const title = newUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
      const res = await api<Resource>('/api/resources', { method: 'POST', body: JSON.stringify({ workspaceId, url: newUrl, title, order: resources.length }) });
      setResources(prev => [...prev, res]);
      setNewUrl('');
      setIsAdding(false);
      toast.success('Resource added');
    } catch { toast.error('Failed to add resource'); }
  };
  const groups = workspace?.groups || [];
  const groupedResources = groups.map(g => ({
    ...g,
    items: resources.filter(r => r.groupId === g.id)
  })).filter(g => g.items.length > 0);
  const ungrouped = resources.filter(r => !r.groupId || !groups.find(g => g.id === r.groupId));
  const toggleGroup = (id: string) => {
    const next = new Set(collapsedGroups);
    if (next.has(id)) next.delete(id); else next.add(id);
    setCollapsedGroups(next);
  };
  return (
    <div className="space-y-6 max-w-6xl mx-auto min-h-[400px]">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            Resources <Sparkles className="w-4 h-4 text-blue-400" />
          </h3>
          <p className="text-xs text-slate-500">{resources.length} items collected</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAutoOrganize} variant="ghost" size="sm" className="text-blue-400 hover:bg-blue-400/10">
            <Wand2 className="w-4 h-4 mr-2" /> Auto-Group
          </Button>
          <Button onClick={() => setIsAdding(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Add Link
          </Button>
        </div>
      </div>
      {isAdding && (
        <form onSubmit={handleAdd} className="p-4 rounded-xl bg-slate-900 border border-slate-800 animate-in slide-in-from-top-2">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input autoFocus placeholder="Paste URL (e.g. google.com)" className="bg-slate-950" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
              <Button type="submit">Add</Button>
            </div>
            {suggestion && (
              <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-400/5 p-2 rounded-lg border border-blue-400/20">
                <Sparkles className="w-3 h-3" />
                Suggested Space: <strong>{suggestion.workspaceName}</strong>
              </div>
            )}
          </div>
        </form>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={resources.map(r => r.id)} strategy={rectSortingStrategy}>
          <div className="space-y-8">
            {groupedResources.map(group => (
              <div key={group.id} className="space-y-3">
                <button onClick={() => toggleGroup(group.id)} className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors">
                  {collapsedGroups.has(group.id) ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {group.name}
                  <Badge variant="outline" className="ml-2 bg-slate-900 border-slate-800 text-[10px] py-0">{group.items.length}</Badge>
                </button>
                {!collapsedGroups.has(group.id) && (
                  <div className={cn("grid gap-3", layout.columns === 1 ? "grid-cols-1" : layout.columns === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3")}>
                    {group.items.map(res => <SortableResource key={res.id} resource={res} columns={layout.columns} onDelete={id => setResources(p => p.filter(r => r.id !== id))} />)}
                  </div>
                )}
              </div>
            ))}
            {ungrouped.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">General Resources</div>
                <div className={cn("grid gap-3", layout.columns === 1 ? "grid-cols-1" : layout.columns === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3")}>
                  {ungrouped.map(res => <SortableResource key={res.id} resource={res} columns={layout.columns} onDelete={id => setResources(p => p.filter(r => r.id !== id))} />)}
                </div>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}