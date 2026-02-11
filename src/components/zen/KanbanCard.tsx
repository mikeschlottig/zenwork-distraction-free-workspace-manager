import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KanbanCard as KanbanCardType } from '@shared/types';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Calendar, Tag, Trash2, Clock } from 'lucide-react';
import { format } from 'date-fns';
interface KanbanCardProps {
  card: KanbanCardType;
  columnId: string;
  onUpdate: (card: KanbanCardType) => void;
  onDelete: () => void;
}
export function KanbanCard({ card, columnId, onUpdate, onDelete }: KanbanCardProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDesc, setEditDesc] = useState(card.description || '');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', columnId, card }
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto'
  };
  const handleSave = () => {
    onUpdate({ ...card, title: editTitle, description: editDesc });
    setIsEditorOpen(false);
  };
  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setIsEditorOpen(true)}
        className={cn(
          "group relative p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-all cursor-pointer shadow-sm active:scale-95 active:rotate-1",
          isDragging && "opacity-50 scale-105 shadow-2xl border-blue-500/50"
        )}
      >
        <div className="space-y-2">
          {card.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {card.labels.map((l, i) => (
                <div key={i} className="h-1 w-8 rounded-full bg-blue-500/50" />
              ))}
            </div>
          )}
          <h5 className="text-sm font-medium text-slate-200 leading-snug line-clamp-2">{card.title}</h5>
          {(card.description || card.dueDate) && (
            <div className="flex items-center gap-3 mt-2 text-slate-500">
              {card.dueDate && (
                <div className="flex items-center gap-1 text-[10px]">
                  <Clock className="w-3 h-3 text-amber-500/70" />
                  <span>{format(card.dueDate, 'MMM d')}</span>
                </div>
              )}
              {card.description && (
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              )}
            </div>
          )}
        </div>
      </div>
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-slate-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Card Title</label>
              <Input 
                value={editTitle} 
                onChange={e => setEditTitle(e.target.value)} 
                className="bg-slate-900 border-slate-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Description</label>
              <Textarea 
                value={editDesc} 
                onChange={e => setEditDesc(e.target.value)} 
                placeholder="Add more details about this task..."
                className="bg-slate-900 border-slate-800 text-slate-300 min-h-[100px] resize-none"
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="outline" className="border-slate-800 text-slate-500"><Tag className="w-3 h-3 mr-1" /> Label</Badge>
              <Badge variant="outline" className="border-slate-800 text-slate-500"><Calendar className="w-3 h-3 mr-1" /> Due Date</Badge>
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
            <Button variant="ghost" onClick={onDelete} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditorOpen(false)} className="border-slate-800 text-slate-400">Cancel</Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}