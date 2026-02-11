import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KanbanCard as KanbanCardType } from '@shared/types';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Calendar, Tag, Trash2, Clock, AlignLeft, CheckCircle2, MoreVertical, X, Plus } from 'lucide-react';
import { format } from 'date-fns';
const LABEL_COLORS: Record<string, string> = {
  'Design': 'bg-blue-500',
  'Dev': 'bg-emerald-500',
  'Priority': 'bg-rose-500',
  'Idea': 'bg-amber-500',
  'Bug': 'bg-red-500',
  'Task': 'bg-slate-500'
};
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
  const [activeLabel, setActiveLabel] = useState('');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', columnId, card }
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto'
  };
  const handleSave = () => {
    onUpdate({ ...card, title: editTitle, description: editDesc });
    setIsEditorOpen(false);
  };
  const addLabel = () => {
    if (!activeLabel.trim() || card.labels.includes(activeLabel.trim())) return;
    onUpdate({ ...card, labels: [...card.labels, activeLabel.trim()] });
    setActiveLabel('');
  };
  const removeLabel = (label: string) => {
    onUpdate({ ...card, labels: card.labels.filter(l => l !== label) });
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
          "group relative p-3.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-blue-500/50 transition-all cursor-pointer shadow-sm ring-blue-500/20 hover:ring-2",
          isDragging && "opacity-50 scale-105 shadow-2xl border-blue-500 ring-4 ring-blue-500/10 rotate-2"
        )}
      >
        <div className="space-y-2.5">
          {card.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {card.labels.map((l, i) => (
                <div 
                  key={i} 
                  className={cn("h-1.5 w-6 rounded-full transition-all group-hover:w-8", LABEL_COLORS[l] || 'bg-slate-500')} 
                  title={l}
                />
              ))}
            </div>
          )}
          <h5 className="text-sm font-semibold text-slate-200 leading-snug line-clamp-2 transition-colors group-hover:text-white">
            {card.title}
          </h5>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3 text-slate-500">
              {card.description && <AlignLeft className="w-3.5 h-3.5" />}
              {card.dueDate && (
                <div className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20">
                  <Clock className="w-3 h-3" />
                  <span>{format(card.dueDate, 'MMM d')}</span>
                </div>
              )}
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
               <MoreVertical className="w-3.5 h-3.5 text-slate-600" />
            </div>
          </div>
        </div>
      </div>
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-slate-200 max-w-xl p-0 overflow-hidden shadow-2xl">
          <div className="p-8 space-y-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight text-white">Edit Task</DialogTitle>
              <DialogDescription className="text-slate-500">
                Update card details, labels, and due dates.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Title</label>
                <Input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-white text-base focus:ring-blue-500/50 h-11"
                  placeholder="Task title..."
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Description</label>
                <Textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  placeholder="What is this task about? Describe the requirements..."
                  className="bg-slate-900 border-slate-800 text-slate-300 min-h-[140px] resize-none focus:ring-blue-500/50 leading-relaxed"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Labels</label>
                <div className="flex flex-wrap gap-2">
                  {card.labels.map((l, i) => (
                    <Badge 
                      key={i} 
                      className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5", LABEL_COLORS[l] || 'bg-slate-700')}
                    >
                      {l}
                      <button onClick={() => removeLabel(l)} className="hover:text-white/70">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  <div className="flex items-center gap-2">
                    <Input 
                      placeholder="Add label..." 
                      className="h-8 w-28 bg-slate-900 border-slate-800 text-xs"
                      value={activeLabel}
                      onChange={e => setActiveLabel(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addLabel()}
                    />
                    <Button size="icon" variant="outline" className="h-8 w-8 border-slate-800" onClick={addLabel}>
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 px-8 py-5 border-t border-slate-800 flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => { onDelete(); setIsEditorOpen(false); }} 
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete Card
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsEditorOpen(false)} className="border-slate-800 text-slate-400 h-10 px-6">Cancel</Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 h-10 px-8 shadow-lg shadow-blue-500/20">Save Card</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}