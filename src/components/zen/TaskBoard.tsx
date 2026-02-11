import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import type { Workspace, Task } from '@shared/types';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
interface TaskBoardProps {
  workspace: Workspace;
  onUpdate: (ws: Workspace) => void;
}
export function TaskBoard({ workspace, onUpdate }: TaskBoardProps) {
  const [newTask, setNewTask] = useState('');
  const updateTasks = async (tasks: Task[]) => {
    try {
      const updated = await api<Workspace>(`/api/workspaces/${workspace.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ tasks }),
      });
      onUpdate(updated);
    } catch (err) {
      toast.error('Failed to update task');
    }
  };
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const task: Task = {
      id: crypto.randomUUID(),
      text: newTask.trim(),
      completed: false,
      createdAt: Date.now()
    };
    updateTasks([...workspace.tasks, task]);
    setNewTask('');
  };
  const toggleTask = (id: string) => {
    const updated = workspace.tasks.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    updateTasks(updated);
  };
  const deleteTask = (id: string) => {
    updateTasks(workspace.tasks.filter(t => t.id !== id));
  };
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100">Tasks</h3>
        <span className="text-xs text-slate-500">{workspace.tasks.filter(t => t.completed).length} / {workspace.tasks.length} Done</span>
      </div>
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input 
          className="bg-slate-900 border-slate-800"
          placeholder="What needs to be done?"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />
        <Button type="submit" className="bg-fuchsia-600 hover:bg-fuchsia-700">
          <Plus className="w-4 h-4" />
        </Button>
      </form>
      <div className="space-y-2">
        {workspace.tasks.sort((a,b) => b.createdAt - a.createdAt).map((task) => (
          <div 
            key={task.id}
            className={cn(
              "flex items-center justify-between p-4 rounded-xl border transition-all",
              task.completed 
                ? "bg-slate-900/20 border-slate-800/50 opacity-60" 
                : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
            )}
          >
            <div 
              className="flex items-center gap-3 cursor-pointer flex-1"
              onClick={() => toggleTask(task.id)}
            >
              {task.completed ? (
                <CheckCircle2 className="w-5 h-5 text-fuchsia-500" />
              ) : (
                <Circle className="w-5 h-5 text-slate-600" />
              )}
              <span className={cn("text-sm transition-all", task.completed && "line-through text-slate-500")}>
                {task.text}
              </span>
            </div>
            <button 
              onClick={() => deleteTask(task.id)}
              className="p-1 text-slate-600 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {workspace.tasks.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
            No tasks yet. Enjoy your zen.
          </div>
        )}
      </div>
    </div>
  );
}