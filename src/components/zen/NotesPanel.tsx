import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import type { Workspace, Note } from '@shared/types';
import { toast } from 'sonner';
import { Save, Loader2, Plus, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
interface NoteCardProps {
  note: Note;
  workspaceId: string;
  onUpdate: (updatedNote: Note) => void;
  onDelete: (noteId: string) => void;
}
function NoteCard({ note, workspaceId, onUpdate, onDelete }: NoteCardProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isSaving, setIsSaving] = useState(false);
  const performSave = useCallback(async (t: string, c: string) => {
    setIsSaving(true);
    try {
      const workspace = await api<Workspace>(`/api/workspaces/${workspaceId}`);
      const updatedNotes = workspace.notes.map(n => 
        n.id === note.id ? { ...n, title: t, content: c, updatedAt: Date.now() } : n
      );
      const updatedWs = await api<Workspace>(`/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes: updatedNotes }),
      });
      const savedNote = updatedWs.notes.find(n => n.id === note.id);
      if (savedNote) onUpdate(savedNote);
    } catch (err) {
      toast.error('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  }, [note.id, workspaceId, onUpdate]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title !== note.title || content !== note.content) {
        performSave(title, content);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, content, note.title, note.content, performSave]);
  return (
    <Card className="bg-slate-900/40 border-slate-800 hover:border-slate-700 transition-colors">
      <CardHeader className="p-4 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note Title"
            className="h-8 bg-transparent border-none text-lg font-bold p-0 focus-visible:ring-0 text-white"
          />
          <div className="flex items-center gap-2">
            {isSaving && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-slate-500 hover:text-red-400"
              onClick={() => onDelete(note.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
          <Calendar className="w-3 h-3" />
          {format(note.updatedAt, 'MMM d, h:mm a')}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing..."
          className="w-full min-h-[120px] bg-transparent border-none outline-none resize-none text-slate-300 leading-relaxed font-mono text-sm"
        />
      </CardContent>
    </Card>
  );
}
export function NotesPanel({ workspace, onUpdate }: { workspace: Workspace, onUpdate: (ws: Workspace) => void }) {
  const handleAddNote = async () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: 'Untitled Note',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    try {
      const updatedWs = await api<Workspace>(`/api/workspaces/${workspace.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes: [...workspace.notes, newNote] }),
      });
      onUpdate(updatedWs);
      toast.success('Note added');
    } catch (err) {
      toast.error('Failed to add note');
    }
  };
  const handleDeleteNote = async (id: string) => {
    try {
      const updatedWs = await api<Workspace>(`/api/workspaces/${workspace.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes: workspace.notes.filter(n => n.id !== id) }),
      });
      onUpdate(updatedWs);
    } catch (err) {
      toast.error('Failed to delete note');
    }
  };
  const handleNoteUpdate = (updatedNote: Note) => {
    const updatedWs = {
      ...workspace,
      notes: workspace.notes.map(n => n.id === updatedNote.id ? updatedNote : n)
    };
    onUpdate(updatedWs);
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white tracking-tight">Project Scratchpad</h3>
        <Button onClick={handleAddNote} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full">
          <Plus className="w-4 h-4 mr-2" />
          New Note
        </Button>
      </div>
      {workspace.notes.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
          <div className="text-slate-500 mb-4">No notes found for this space.</div>
          <Button variant="outline" onClick={handleAddNote} className="border-slate-800">
            Create your first note
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workspace.notes.sort((a,b) => b.updatedAt - a.updatedAt).map(note => (
            <NoteCard 
              key={note.id} 
              note={note} 
              workspaceId={workspace.id} 
              onUpdate={handleNoteUpdate}
              onDelete={handleDeleteNote}
            />
          ))}
        </div>
      )}
    </div>
  );
}