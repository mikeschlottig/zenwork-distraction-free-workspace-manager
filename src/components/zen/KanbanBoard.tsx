import React, { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCorners, DragOverEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import type { Workspace, KanbanColumn as KanbanColumnType, KanbanCard as KanbanCardType } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Plus, Layout, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
export function KanbanBoard({ workspace, onUpdate }: { workspace: Workspace; onUpdate: (ws: Workspace) => void }) {
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [newColName, setNewColName] = useState('');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const columns = useMemo(() => workspace.kanban?.columns || [], [workspace.kanban]);
  const handleUpdateKanban = async (newCols: KanbanColumnType[]) => {
    try {
      const updated = await api<Workspace>(`/api/workspaces/${workspace.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ kanban: { columns: newCols } })
      });
      onUpdate(updated);
    } catch (err) {
      toast.error('Failed to sync board');
    }
  };
  const handleAddColumn = () => {
    if (!newColName.trim()) return;
    const newCol: KanbanColumnType = {
      id: crypto.randomUUID(),
      name: newColName.trim(),
      order: columns.length,
      cards: []
    };
    handleUpdateKanban([...columns, newCol]);
    setNewColName('');
    setIsAddingCol(false);
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id && active.data.current?.type === 'column') {
      const oldIndex = columns.findIndex(c => c.id === active.id);
      const newIndex = columns.findIndex(c => c.id === over.id);
      handleUpdateKanban(arrayMove(columns, oldIndex, newIndex));
    }
  };
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;
    if (activeType === 'card') {
      const activeId = active.id as string;
      const overId = over.id as string;
      const activeColId = active.data.current?.columnId;
      const overColId = overType === 'column' ? overId : over.data.current?.columnId;
      if (activeColId && overColId && activeColId !== overColId) {
        const nextCols = [...columns];
        const activeCol = nextCols.find(c => c.id === activeColId);
        const overCol = nextCols.find(c => c.id === overColId);
        if (activeCol && overCol) {
          const cardIndex = activeCol.cards.findIndex(c => c.id === activeId);
          const [card] = activeCol.cards.splice(cardIndex, 1);
          if (overType === 'column') {
            overCol.cards.push(card);
          } else {
            const overCardIndex = overCol.cards.findIndex(c => c.id === overId);
            overCol.cards.splice(overCardIndex, 0, card);
          }
          handleUpdateKanban(nextCols);
        }
      } else if (activeColId === overColId && overType === 'card') {
        const col = columns.find(c => c.id === activeColId);
        if (col) {
          const oldIndex = col.cards.findIndex(c => c.id === activeId);
          const newIndex = col.cards.findIndex(c => c.id === overId);
          const nextCols = columns.map(c => c.id === activeColId ? { ...c, cards: arrayMove(c.cards, oldIndex, newIndex) } : c);
          handleUpdateKanban(nextCols);
        }
      }
    }
  };
  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCorners} 
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <div className="flex gap-6 h-full min-w-max px-2">
            <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
              {columns.map(col => (
                <KanbanColumn 
                  key={col.id} 
                  column={col} 
                  onUpdate={(updatedCol) => handleUpdateKanban(columns.map(c => c.id === updatedCol.id ? updatedCol : c))}
                  onDelete={() => handleUpdateKanban(columns.filter(c => c.id !== col.id))}
                />
              ))}
            </SortableContext>
            <div className="w-80 shrink-0">
              {isAddingCol ? (
                <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl animate-in slide-in-from-top-2">
                  <input
                    autoFocus
                    placeholder="Column name..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    value={newColName}
                    onChange={e => setNewColName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddColumn()}
                  />
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={handleAddColumn} className="bg-blue-600 hover:bg-blue-700">Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsAddingCol(false)} className="text-slate-400">Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={() => setIsAddingCol(true)}
                  variant="outline" 
                  className="w-full border-dashed border-slate-800 bg-transparent text-slate-500 hover:text-white hover:border-slate-700 h-12 rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Column
                </Button>
              )}
            </div>
          </div>
        </DndContext>
      </div>
    </div>
  );
}