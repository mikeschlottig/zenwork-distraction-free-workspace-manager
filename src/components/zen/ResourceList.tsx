import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import type { Resource } from '@shared/types';
import { ExternalLink, Trash2, Plus, Globe, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
interface ResourceListProps {
  workspaceId: string;
}
export function ResourceList({ workspaceId }: ResourceListProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  useEffect(() => {
    const load = async () => {
      try {
        const data = await api<Resource[]>(`/api/workspaces/${workspaceId}/resources`);
        setResources(data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [workspaceId]);
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    try {
      const title = newUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
      const res = await api<Resource>('/api/resources', {
        method: 'POST',
        body: JSON.stringify({ workspaceId, url: newUrl, title }),
      });
      setResources(prev => [...prev, res]);
      setNewUrl('');
      setIsAdding(false);
      toast.success('Resource added');
    } catch (err) {
      toast.error('Failed to add resource');
    }
  };
  const handleDelete = async (id: string) => {
    try {
      await api(`/api/resources/${id}`, { method: 'DELETE' });
      setResources(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      toast.error('Failed to delete resource');
    }
  };
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-slate-100">Saved Links</h3>
        <Button 
          onClick={() => setIsAdding(true)} 
          variant="outline" 
          className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
        </Button>
      </div>
      {isAdding && (
        <form onSubmit={handleAdd} className="p-4 rounded-xl bg-slate-900 border border-slate-800 animate-in slide-in-from-top-2 mb-6">
          <div className="flex gap-2">
            <Input 
              autoFocus
              placeholder="Paste URL here..."
              className="bg-slate-950 border-slate-800"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
            />
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Add</Button>
            <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        </form>
      )}
      <div className="grid grid-cols-1 gap-2">
        {resources.map((res) => (
          <div 
            key={res.id} 
            className="group flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800/50 rounded-xl hover:border-blue-500/30 hover:bg-slate-900 transition-all"
          >
            <div className="flex items-center gap-4 flex-1 truncate">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                {res.favicon ? <img src={res.favicon} alt="" className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-sm font-semibold text-slate-200 truncate">{res.title}</span>
                <span className="text-xs text-slate-500 truncate">{res.url}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a 
                href={res.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button 
                onClick={() => handleDelete(res.id)}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {resources.length === 0 && !isAdding && (
          <div className="text-center py-12 text-slate-500 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
            No resources yet. Add your first link to get started.
          </div>
        )}
      </div>
    </div>
  );
}