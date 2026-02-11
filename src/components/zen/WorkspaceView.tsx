import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResourceList } from './ResourceList';
import { NotesPanel } from './NotesPanel';
import { TaskBoard } from './TaskBoard';
import type { Workspace } from '@shared/types';
import { Search, Share2, MoreHorizontal } from 'lucide-react';
interface WorkspaceViewProps {
  workspace: Workspace;
  onUpdate: (ws: Workspace) => void;
}
export function WorkspaceView({ workspace, onUpdate }: WorkspaceViewProps) {
  const [activeTab, setActiveTab] = useState('resources');
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
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <input 
              placeholder="Search..."
              className="bg-slate-900 border border-slate-800 rounded-full py-1.5 pl-9 pr-4 text-sm w-48 focus:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-slate-200"
            />
          </div>
          <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </header>
      <div className="px-8 flex-1 overflow-auto">
        <Tabs defaultValue="resources" className="w-full h-full flex flex-col" onValueChange={setActiveTab}>
          <div className="pt-4 mb-6">
            <TabsList className="bg-slate-900/50 border border-slate-800 p-1">
              <TabsTrigger value="resources" className="data-[state=active]:bg-slate-800 data-[state=active]:text-fuchsia-400">Resources</TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:bg-slate-800 data-[state=active]:text-fuchsia-400">Notes</TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-slate-800 data-[state=active]:text-fuchsia-400">Tasks</TabsTrigger>
            </TabsList>
          </div>
          <div className="flex-1 pb-10">
            <TabsContent value="resources" className="m-0 focus-visible:ring-0">
              <ResourceList workspaceId={workspace.id} />
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