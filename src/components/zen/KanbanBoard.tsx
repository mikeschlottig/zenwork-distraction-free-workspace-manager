import React, { useState, useMemo, useEffect } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCorners, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import type { Workspace, KanbanColumn as KanbanColumnType, KanbanCard as KanbanCardType } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Plus, Layout, Loader2, Sparkles } from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
export function KanbanBoard({ workspace, onUpdate }: { workspace: Workspace; onUpdate: (ws: Workspace) => void }) {
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [newColName, setNewColName] = useState('');
  // Local state for fluid DnD interactions
  const [localColumns, setLocalColumns] = useState<KanbanColumnType[]>(workspace.kanban?.columns || []);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Keep local state in sync with workspace prop when it changes externally (not during drag)
  useEffect(() => {
    if (!activeId) {
      setLocalColumns(workspace.kanban?.columns || []);
    }
  }, [workspace.kanban, activeId]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const syncWithServer = async (newCols: KanbanColumnType[]) => {
    try {
      const updated = await api<Workspace>(`/api/workspaces/${workspace.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ kanban: { columns: newCols } })
      });
      onUpdate(updated);
    } catch (err) {
      toast.error('Failed to sync board changes');
      // Revert local state on error
      setLocalColumns(workspace.kanban?.columns || []);
    }
  };
  const handleAddColumn = () => {
    if (!newColName.trim()) return;
    const newCol: KanbanColumnType = {
      id: crypto.randomUUID(),
      name: newColName.trim(),
      order: localColumns.length,
      cards: []
    };
    const nextCols = [...localColumns, newCol];
    setLocalColumns(nextCols);
    syncWithServer(nextCols);
    setNewColName('');
    setIsAddingCol(false);
  };
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
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
      if (!activeColId || !overColId) return;
      if (activeColId !== overColId) {
        setLocalColumns(prev => {
          const nextCols = JSON.parse(JSON.stringify(prev)) as KanbanColumnType[];
          const activeCol = nextCols.find(c => c.id === activeColId);
          const overCol = nextCols.find(c => c.id === overColId);
          if (!activeCol || !overCol) return prev;
          const cardIndex = activeCol.cards.findIndex(c => c.id === activeId);
          if (cardIndex === -1) return prev;
          const [card] = activeCol.cards.splice(cardIndex, 1);
          card.order = overCol.cards.length;
          if (overType === 'column') {
            overCol.cards.push(card);
          } else {
            const overCardIndex = overCol.cards.findIndex(c => c.id === overId);
            overCol.cards.splice(overCardIndex, 0, card);
          }
          return nextCols;
        });
      } else if (overType === 'card') {
        setLocalColumns(prev => {
          const nextCols = [...prev];
          const colIndex = nextCols.findIndex(c => c.id === activeColId);
          if (colIndex === -1) return prev;
          const col = nextCols[colIndex];
          const oldIndex = col.cards.findIndex(c => c.id === activeId);
          const newIndex = col.cards.findIndex(c => c.id === overId);
          nextCols[colIndex] = {
            ...col,
            cards: arrayMove(col.cards, oldIndex, newIndex)
          };
          return nextCols;
        });
      }
    }
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    if (active.id !== over.id && active.data.current?.type === 'column') {
      const oldIndex = localColumns.findIndex(c => c.id === active.id);
      const newIndex = localColumns.findIndex(c => c.id === over.id);
      const nextCols = arrayMove(localColumns, oldIndex, newIndex);
      setLocalColumns(nextCols);
      syncWithServer(nextCols);
    } else {
      // For cards, the dragOver already updated localColumns
      // We just need to sync the final result
      syncWithServer(localColumns);
    }
  };
  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-700">
      <div className="flex-1 overflow-x-auto pb-6 custom-scrollbar">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 h-full min-w-max px-2">
            <SortableContext items={localColumns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
              {localColumns.map(col => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  onUpdate={(updatedCol) => {
                    const next = localColumns.map(c => c.id === updatedCol.id ? updatedCol : c);
                    setLocalColumns(next);
                    syncWithServer(next);
                  }}
                  onDelete={() => {
                    const next = localColumns.filter(c => c.id !== col.id);
                    setLocalColumns(next);
                    syncWithServer(next);
                  }}
                />
              ))}
            </SortableContext>
            <div className="w-80 shrink-0">
              {isAddingCol ? (
                <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl animate-in slide-in-from-top-2 shadow-xl">
                  <input
                    autoFocus
                    placeholder="New column title..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                    value={newColName}
                    onChange={e => setNewColName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddColumn()}
                  />
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" onClick={handleAddColumn} className="bg-blue-600 hover:bg-blue-700 rounded-lg flex-1">Create</Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsAddingCol(false)} className="text-slate-400 hover:text-white flex-1">Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setIsAddingCol(true)}
                  variant="outline"
                  className="w-full border-dashed border-slate-800 bg-slate-900/10 text-slate-500 hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/5 h-14 rounded-2xl transition-all group"
                >
                  <Plus className="w-4 h-4 mr-2 group-hover:scale-125 transition-transform" /> Add Column
                </Button>
              )}
            </div>
          </div>
        </DndContext>
      </div>
    </div>
  );
}