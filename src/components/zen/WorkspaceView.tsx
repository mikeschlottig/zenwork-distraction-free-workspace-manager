import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResourceList } from './ResourceList';
import { NotesPanel } from './NotesPanel';
import { TaskBoard } from './TaskBoard';
import { KanbanBoard } from './KanbanBoard';
import type { Workspace } from '@shared/types';
import { Search, Share2, MoreHorizontal, LayoutGrid, Trash2, Settings2, Check, RefreshCw, Layout } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
interface WorkspaceViewProps {
  workspace: Workspace;
  onUpdate: (ws: Workspace) => void;
  onDelete: (id: string) => void;
  onMoveRequest?: (resourceId: string, targetWsId: string) => void;
}
export function WorkspaceView({ workspace, onUpdate, onDelete, onMoveRequest }: WorkspaceViewProps) {
  const safeLayout = React.useMemo(() => ({
    columns: workspace.layout?.columns ?? 1,
    resourceOrder: workspace.layout?.resourceOrder ?? [],
    notesViewMode: workspace.layout?.notesViewMode ?? 'cards'
  }), [workspace.layout]);
  const [activeTab, setActiveTab] = useState('resources');
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Workspace link copied to clipboard!');
  };
  const updateLayout = async (cols: number) => {
    try {
      const updated = await api<Workspace>(`/api/workspaces/${workspace.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ layout: { ...safeLayout, columns: cols } }),
      });
      onUpdate(updated);
      toast.success(`Grid updated to ${cols} column${cols > 1 ? 's' : ''}`);
    } catch (err) {
      toast.error('Failed to update layout');
    }
  };
  const resetToDefault = async () => {
    try {
      const updated = await api<Workspace>(`/api/workspaces/${workspace.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          layout: {
            columns: 1,
            resourceOrder: [],
            notesViewMode: 'cards'
          }
        }),
      });
      onUpdate(updated);
      toast.success('Workspace layout reset to default');
    } catch (err) {
      toast.error('Failed to reset workspace');
    }
  };
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <header className="px-8 py-6 flex items-center justify-between border-b border-slate-900 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <span>Spaces</span>
            <span>/</span>
            <span className="text-blue-500/80">{workspace.name}</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{workspace.name}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <input
              placeholder="Search space..."
              className="bg-slate-900 border border-slate-800 rounded-full py-1.5 pl-9 pr-4 text-sm w-48 focus:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-slate-200"
            />
          </div>
          <button onClick={handleShare} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Share Space">
            <Share2 className="w-5 h-5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 bg-slate-950 border-slate-800 text-slate-200 shadow-2xl">
              <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-widest px-3">Visual Settings</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem onClick={() => updateLayout(1)} className="hover:bg-slate-800 cursor-pointer flex justify-between">
                <div className="flex items-center"><LayoutGrid className="w-4 h-4 mr-2" /> 1 Column</div>
                {safeLayout.columns === 1 && <Check className="w-4 h-4 text-blue-500" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateLayout(2)} className="hover:bg-slate-800 cursor-pointer flex justify-between">
                <div className="flex items-center"><LayoutGrid className="w-4 h-4 mr-2" /> 2 Columns</div>
                {safeLayout.columns === 2 && <Check className="w-4 h-4 text-blue-500" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateLayout(3)} className="hover:bg-slate-800 cursor-pointer flex justify-between">
                <div className="flex items-center"><LayoutGrid className="w-4 h-4 mr-2" /> 3 Columns</div>
                {safeLayout.columns === 3 && <Check className="w-4 h-4 text-blue-500" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem onClick={resetToDefault} className="hover:bg-slate-800 cursor-pointer text-slate-400">
                <RefreshCw className="w-4 h-4 mr-2" /> Reset View to Default
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-slate-800 cursor-pointer">
                <Settings2 className="w-4 h-4 mr-2" /> Workspace Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-800" />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-400 hover:bg-red-400/10 cursor-pointer focus:bg-red-400/10">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Space
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-200">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete "{workspace.name}"?</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-400">
                      All resources, notes, and tasks will be removed permanently.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-800 border-slate-700">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(workspace.id)} className="bg-red-600 hover:bg-red-700">Delete Permanently</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="px-8 flex-1 overflow-auto custom-scrollbar">
        <Tabs value={activeTab} className="w-full h-full flex flex-col" onValueChange={setActiveTab}>
          <div className="pt-4 mb-6">
            <TabsList className="bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <TabsTrigger value="resources" className="rounded-lg data-[state=active]:bg-slate-800 data-[state=active]:text-blue-400 transition-all px-6">Resources</TabsTrigger>
              <TabsTrigger value="kanban" className="rounded-lg data-[state=active]:bg-slate-800 data-[state=active]:text-fuchsia-400 transition-all px-6">Board</TabsTrigger>
              <TabsTrigger value="notes" className="rounded-lg data-[state=active]:bg-slate-800 data-[state=active]:text-amber-400 transition-all px-6">Notes</TabsTrigger>
              <TabsTrigger value="tasks" className="rounded-lg data-[state=active]:bg-slate-800 data-[state=active]:text-emerald-400 transition-all px-6">Tasks</TabsTrigger>
            </TabsList>
          </div>
          <div className="flex-1 pb-10">
            <TabsContent value="resources" className="m-0 focus-visible:ring-0">
              <ResourceList workspaceId={workspace.id} layout={safeLayout} onMoveRequest={onMoveRequest} />
            </TabsContent>
            <TabsContent value="kanban" className="m-0 focus-visible:ring-0">
              <KanbanBoard workspace={workspace} onUpdate={onUpdate} />
            </TabsContent>
            <TabsContent value="notes" className="m-0 focus-visible:ring-0">
              <NotesPanel workspace={workspace} onUpdate={onUpdate} />
            </TabsContent>
            <TabsContent value="tasks" className="m-0 focus-visible:ring-0">
              <TaskBoard workspace={workspace} onUpdate={onUpdate} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}