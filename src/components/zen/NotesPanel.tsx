import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api-client';
import type { Workspace } from '@shared/types';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';
interface NotesPanelProps {
  workspace: Workspace;
  onUpdate: (ws: Workspace) => void;
}
export function NotesPanel({ workspace, onUpdate }: NotesPanelProps) {
  const [content, setContent] = useState(workspace.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setContent(workspace.notes || '');
  }, [workspace.id]);
  const handleSave = async (val: string) => {
    setIsSaving(true);
    try {
      const updated = await api<Workspace>(`/api/workspaces/${workspace.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes: val }),
      });
      onUpdate(updated);
    } catch (err) {
      toast.error('Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      handleSave(val);
    }, 1000);
  };
  return (
    <div className="flex flex-col h-full bg-slate-900/30 rounded-2xl border border-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-100">Scratchpad</h3>
        <div className="text-xs text-slate-500 flex items-center gap-2">
          {isSaving ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-3 h-3" />
              Changes saved
            </>
          )}
        </div>
      </div>
      <textarea
        className="flex-1 bg-transparent border-none outline-none resize-none text-slate-300 leading-relaxed font-mono text-sm"
        placeholder="Type your ideas, links, or snippets here..."
        value={content}
        onChange={handleChange}
      />
    </div>
  );
}