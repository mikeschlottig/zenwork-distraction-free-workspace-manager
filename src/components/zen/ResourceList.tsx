import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import type { Resource, WorkspaceLayout } from '@shared/types';
import { ExternalLink, Trash2, Plus, Globe, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
interface SortableItemProps {
  resource: Resource;
  onDelete: (id: string) => void;
  columns: number;
}
function SortableResource({ resource, onDelete, columns }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: resource.id });
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition, 
    zIndex: isDragging ? 50 : 'auto' 
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex flex-col p-3 bg-slate-900/50 border border-slate-800/50 rounded-xl hover:border-blue-500/30 hover:bg-slate-900 transition-all shadow-sm",
        isDragging && "opacity-50 scale-95 shadow-2xl border-blue-500/50",
        columns === 1 ? "flex-row items-center" : "items-start gap-3"
      )}
    >
      <div className={cn("flex items-center gap-3 flex-1 truncate w-full", columns === 1 ? "" : "flex-col items-start")}>
        <div className="flex items-center w-full gap-2">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-slate-700 hover:text-slate-500">
            <GripVertical className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
            {resource.favicon ? <img src={resource.favicon} alt="" className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
          </div>
          {columns > 1 && (
            <div className="flex-1 truncate">
               <span className="text-xs font-semibold text-slate-200 truncate block">{resource.title}</span>
            </div>
          )}
        </div>
        <div className={cn("flex flex-col truncate w-full", columns === 1 ? "" : "mt-1")}>
          {columns === 1 && <span className="text-sm font-semibold text-slate-200 truncate">{resource.title}</span>}
          <span className="text-[10px] text-slate-500 truncate">{resource.url}</span>
        </div>
      </div>
      <div className={cn("flex items-center gap-1", columns === 1 ? "" : "w-full justify-end border-t border-slate-800/50 pt-2")}>
        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button onClick={() => onDelete(resource.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
export function ResourceList({ workspaceId, layout }: { workspaceId: string, layout: WorkspaceLayout }) {
  const safeColumns = layout?.columns ?? 1;
  const [resources, setResources] = useState<Resource[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  useEffect(() => {
    api<Resource[]>(`/api/workspaces/${workspaceId}/resources`).then(setResources).catch(console.error);
  }, [workspaceId]);
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = resources.findIndex((i) => i.id === active.id);
      const newIndex = resources.findIndex((i) => i.id === over.id);
      const newArray = arrayMove(resources, oldIndex, newIndex);
      setResources(newArray);
      try {
        await api('/api/resources/bulk-reorder', {
          method: 'POST',
          body: JSON.stringify(newArray.map((res, idx) => ({ id: res.id, order: idx })))
        });
      } catch (err) {
        toast.error('Failed to sync reordering');
        const data = await api<Resource[]>(`/api/workspaces/${workspaceId}/resources`);
        setResources(data);
      }
    }
  };
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    try {
      const title = newUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
      const res = await api<Resource>('/api/resources', {
        method: 'POST',
        body: JSON.stringify({ workspaceId, url: newUrl, title, order: resources.length }),
      });
      setResources(prev => [...prev, res]);
      setNewUrl('');
      setIsAdding(false);
      toast.success('Resource added');
    } catch (err) {
      toast.error('Failed to add resource');
    }
  };
  const gridCols = safeColumns === 1 ? "grid-cols-1" : safeColumns === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
  return (
    <div className="space-y-4 max-w-6xl mx-auto min-h-[300px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Resources</h3>
          <p className="text-xs text-slate-500">Sorted links in {safeColumns} column(s)</p>
        </div>
        <Button onClick={() => setIsAdding(true)} variant="outline" size="sm" className="bg-blue-500/10 border-blue-500/30 text-blue-400">
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
        </Button>
      </div>
      {isAdding && (
        <form onSubmit={handleAdd} className="p-4 rounded-xl bg-slate-900 border border-slate-800 animate-in slide-in-from-top-2 mb-6">
          <div className="flex gap-2">
            <Input autoFocus placeholder="Paste URL here..." className="bg-slate-950" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
            <Button type="submit" className="bg-blue-600">Add</Button>
            <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        </form>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={resources.map(r => r.id)} strategy={rectSortingStrategy}>
          <div className={cn("grid gap-3", gridCols)}>
            {resources.map((res) => (
              <SortableResource
                key={res.id}
                resource={res}
                columns={safeColumns}
                onDelete={(id) => {
                  api(`/api/resources/${id}`, { method: 'DELETE' }).then(() => setResources(prev => prev.filter(r => r.id !== id)));
                }}
              />
            ))}
            {resources.length === 0 && !isAdding && (
              <div className="col-span-full text-center py-12 text-slate-500 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
                No resources saved yet.
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}