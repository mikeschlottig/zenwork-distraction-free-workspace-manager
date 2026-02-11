import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api-client';
import type { Workspace, Note } from '@shared/types';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Calendar, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  // Track if current changes are local to prevent cursor jump on sync
  const isLocalChange = useRef(false);
  const lastSyncTime = useRef(note.updatedAt);
  useEffect(() => {
    // Only update from props if we are not actively typing AND the server version is newer
    if (!isLocalChange.current && note.updatedAt > lastSyncTime.current) {
      setTitle(note.title);
      setContent(note.content);
      lastSyncTime.current = note.updatedAt;
    }
  }, [note.title, note.content, note.updatedAt]);
  const performSave = useCallback(async (t: string, c: string) => {
    setIsSaving(true);
    try {
      const updatedWs = await api<Workspace>(`/api/workspaces/${workspaceId}/notes/${note.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: t, content: c }),
      });
      const savedNote = Array.isArray(updatedWs.notes) ? updatedWs.notes.find(n => n.id === note.id) : null;
      if (savedNote) {
        lastSyncTime.current = savedNote.updatedAt;
        onUpdate(savedNote);
      }
    } catch (err) {
      toast.error('Failed to auto-save note');
    } finally {
      setIsSaving(false);
      isLocalChange.current = false;
    }
  }, [workspaceId, onUpdate, note.id]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title !== note.title || content !== note.content) {
        performSave(title, content);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, content, performSave, note.title, note.content]);
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isLocalChange.current = true;
    setTitle(e.target.value);
  };
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    isLocalChange.current = true;
    setContent(e.target.value);
  };
  return (
    <Card className="bg-slate-900/40 border-slate-800 hover:border-slate-700 transition-colors shadow-lg">
      <CardHeader className="p-4 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <Input
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled Note"
            className="h-8 bg-transparent border-none text-lg font-bold p-0 focus-visible:ring-0 text-white"
          />
          <div className="flex items-center gap-2">
            {isSaving && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-400" onClick={() => onDelete(note.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
          <Calendar className="w-3 h-3" />
          {format(note.updatedAt || Date.now(), 'MMM d, h:mm a')}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Start typing your ideas..."
          className="w-full min-h-[160px] bg-transparent border-none outline-none resize-none text-slate-300 leading-relaxed font-mono text-sm focus:ring-0"
        />
      </CardContent>
    </Card>
  );
}
export function NotesPanel({ workspace, onUpdate }: { workspace: Workspace, onUpdate: (ws: Workspace) => void }) {
  const safeNotes: Note[] = React.useMemo(() => Array.isArray(workspace.notes) ? workspace.notes : [], [workspace.notes]);
  const safeLayout = workspace.layout ?? { columns: 1, resourceOrder: [], notesViewMode: 'cards' };
  const viewMode = safeLayout.notesViewMode || 'cards';
  const updateViewMode = async (mode: 'cards' | 'table') => {
    try {
      const updated = await api<Workspace>(`/api/workspaces/${workspace.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ layout: { ...safeLayout, notesViewMode: mode } }),
      });
      onUpdate(updated);
    } catch { toast.error('Failed to update view mode'); }
  };
  const handleAddNote = async () => {
    const newNote: Note = { id: crypto.randomUUID(), title: 'Untitled Note', content: '', createdAt: Date.now(), updatedAt: Date.now() };
    const newNotes = [...safeNotes, newNote];
    try {
      const updatedWs = await api<Workspace>(`/api/workspaces/${workspace.id}`, { method: 'PATCH', body: JSON.stringify({ notes: newNotes }) });
      onUpdate(updatedWs);
      toast.success('Note added');
    } catch { toast.error('Failed to add note'); }
  };
  const handleDeleteNote = async (id: string) => {
    const newNotes = safeNotes.filter(n => n.id !== id);
    try {
      const updatedWs = await api<Workspace>(`/api/workspaces/${workspace.id}`, { method: 'PATCH', body: JSON.stringify({ notes: newNotes }) });
      onUpdate(updatedWs);
    } catch { toast.error('Failed to delete note'); }
  };
  const handleNoteUpdate = (updatedNote: Note) => {
    // Functional update ensures we don't overwrite other fields
    onUpdate({
      ...workspace,
      notes: safeNotes.map(n => n.id === updatedNote.id ? updatedNote : n)
    });
  };
  const sortedNotes = [...safeNotes].sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-bold text-white tracking-tight">Space Scratchpad</h3>
          <Tabs value={viewMode} onValueChange={(v) => updateViewMode(v as 'cards' | 'table')}>
            <TabsList className="bg-slate-900 border border-slate-800 p-0.5 h-8">
              <TabsTrigger value="cards" className="h-7 px-2 data-[state=active]:bg-slate-800"><LayoutGrid className="w-3.5 h-3.5" /></TabsTrigger>
              <TabsTrigger value="table" className="h-7 px-2 data-[state=active]:bg-slate-800"><TableIcon className="w-3.5 h-3.5" /></TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Button onClick={handleAddNote} size="sm" className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-full h-9 shadow-lg shadow-fuchsia-500/20">
          <Plus className="w-4 h-4 mr-2" /> New Note
        </Button>
      </div>
      {safeNotes.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
          <div className="text-slate-500 mb-4 text-sm">Capture your thoughts for this workspace.</div>
          <Button variant="outline" size="sm" onClick={handleAddNote} className="border-slate-800 text-slate-400 hover:text-white">Create your first note</Button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-slate-900/50"><TableRow className="border-slate-800"><TableHead>Title</TableHead><TableHead className="hidden md:table-cell">Preview</TableHead><TableHead>Last Updated</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {sortedNotes.map((note) => (
                <TableRow key={note.id} className="border-slate-800 hover:bg-slate-900/40 group">
                  <TableCell className="font-medium text-slate-200">{note.title || 'Untitled'}</TableCell>
                  <TableCell className="text-slate-500 hidden md:table-cell max-w-xs truncate">{note.content || '...'}</TableCell>
                  <TableCell className="text-slate-400 text-xs">{format(note.updatedAt || Date.now(), 'MMM d, h:mm a')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteNote(note.id)} className="h-8 w-8 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedNotes.map(note => <NoteCard key={note.id} note={note} workspaceId={workspace.id} onUpdate={handleNoteUpdate} onDelete={handleDeleteNote} />)}
        </div>
      )}
    </div>
  );
}