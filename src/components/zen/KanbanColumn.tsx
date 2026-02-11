import React, { useState } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KanbanCard } from './KanbanCard';
import type { KanbanColumn as KanbanColumnType, KanbanCard as KanbanCardType } from '@shared/types';
import { MoreHorizontal, Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
interface KanbanColumnProps {
  column: KanbanColumnType;
  onUpdate: (col: KanbanColumnType) => void;
  onDelete: () => void;
}
export function KanbanColumn({ column, onUpdate, onDelete }: KanbanColumnProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'column', columnId: column.id }
  });
  const style = { transform: CSS.Translate.toString(transform), transition };
  const handleAddCard = () => {
    if (!newCardTitle.trim()) return;
    const newCard: KanbanCardType = {
      id: crypto.randomUUID(),
      title: newCardTitle.trim(),
      labels: [],
      order: column.cards.length
    };
    onUpdate({ ...column, cards: [...column.cards, newCard] });
    setNewCardTitle('');
    setIsAddingCard(false);
  };
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "w-80 flex flex-col shrink-0 bg-slate-900/30 border border-slate-900 rounded-2xl h-full max-h-[calc(100vh-16rem)]",
        isDragging && "opacity-50 border-blue-500/50"
      )}
    >
      <div className="p-4 flex items-center justify-between group/header">
        <div className="flex items-center gap-3 truncate">
          <div {...attributes} {...listeners} className="cursor-grab p-1 text-slate-700 hover:text-slate-500 opacity-0 group-hover/header:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-slate-200 truncate text-sm uppercase tracking-wide">{column.name}</h4>
          <Badge variant="secondary" className="bg-slate-800 text-slate-500 font-normal text-[10px] h-5 px-1.5">
            {column.cards.length}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 text-slate-600 hover:text-white transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-950 border-slate-800">
            <DropdownMenuItem onClick={() => setIsAddingCard(true)} className="text-slate-300 hover:bg-slate-800 cursor-pointer">
              <Plus className="w-4 h-4 mr-2" /> Add Card
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-400 hover:bg-red-400/10 cursor-pointer">
              <Trash2 className="w-4 h-4 mr-2" /> Delete Column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-3 custom-scrollbar">
        <SortableContext items={column.cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {column.cards.map(card => (
            <KanbanCard 
              key={card.id} 
              card={card} 
              columnId={column.id}
              onUpdate={(updated) => onUpdate({ ...column, cards: column.cards.map(c => c.id === updated.id ? updated : c) })}
              onDelete={() => onUpdate({ ...column, cards: column.cards.filter(c => c.id !== card.id) })}
            />
          ))}
        </SortableContext>
      </div>
      <div className="p-3">
        {isAddingCard ? (
          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1">
            <textarea
              autoFocus
              placeholder="What needs to be done?"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none min-h-[60px]"
              value={newCardTitle}
              onChange={e => setNewCardTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAddCard())}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddCard} className="bg-blue-600 hover:bg-blue-700 h-8 text-[11px]">Add Card</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAddingCard(false)} className="text-slate-500 hover:text-white h-8 text-[11px]">Cancel</Button>
            </div>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            onClick={() => setIsAddingCard(true)}
            className="w-full justify-start text-slate-500 hover:text-blue-400 hover:bg-blue-400/5 h-9 font-medium text-xs px-2"
          >
            <Plus className="w-4 h-4 mr-2" /> New Card
          </Button>
        )}
      </div>
    </div>
  );
}