'use client';

import { useState, useMemo } from 'react';
import { CheckCircle2, Circle, Clock, Plus, Search, Trash2, Tag, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TaskItem {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  done: boolean;
}

export function TodoTemplate({ title }: { title: string }) {
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: 't1', title: 'Design launch checklist & onboarding flow', priority: 'high', dueDate: 'Today', done: false },
    { id: 't2', title: 'Connect Supabase RLS security policies', priority: 'high', dueDate: 'Today', done: false },
    { id: 't3', title: 'Verify responsive viewport breakpoints', priority: 'medium', dueDate: 'Tomorrow', done: true },
    { id: 't4', title: 'Setup automated CI/CD deployment pipeline', priority: 'low', dueDate: 'This week', done: false },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed' | 'high'>('all');
  const [isAdding, setIsAdding] = useState(false);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast.success('Task removed');
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: TaskItem = {
      id: `t-${Date.now()}`,
      title: newTaskTitle.trim(),
      priority: newPriority,
      dueDate: 'Today',
      done: false,
    };
    setTasks((prev) => [newTask, ...prev]);
    setNewTaskTitle('');
    setIsAdding(false);
    toast.success('Task created successfully');
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (activeFilter === 'active') return !t.done;
      if (activeFilter === 'completed') return t.done;
      if (activeFilter === 'high') return t.priority === 'high';
      return true;
    });
  }, [tasks, searchQuery, activeFilter]);

  const activeCount = useMemo(() => tasks.filter((t) => !t.done).length, [tasks]);
  const completedCount = useMemo(() => tasks.filter((t) => t.done).length, [tasks]);
  const highPriorityCount = useMemo(() => tasks.filter((t) => t.priority === 'high' && !t.done).length, [tasks]);
  const completionRate = useMemo(() => (tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100)), [tasks, completedCount]);

  return (
    <main className="min-h-full bg-[#05070a] p-6 text-white font-sans">
      <section className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <header className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-cyan-300 mb-3">
                Task Workspace OS
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl text-white">{title}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
                Real-time task command center with live status tracking, priority lanes, and dynamic filtering.
              </p>
            </div>
            <button
              onClick={() => setIsAdding((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-xs font-black uppercase tracking-wider text-[#05070a] hover:bg-cyan-300 transition-all active:scale-95 shadow-[0_0_20px_rgba(0,243,255,0.3)]"
            >
              <Plus className="h-4 w-4" />
              {isAdding ? 'Close Panel' : 'New Task'}
            </button>
          </div>

          {/* Quick Task Creation Form */}
          {isAdding && (
            <form onSubmit={addTask} className="mt-6 border-t border-white/10 pt-5 space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Task title or requirement…"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  autoFocus
                  className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                />
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as 'high' | 'medium' | 'low')}
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="high" className="bg-[#0f131c]">High Priority</option>
                  <option value="medium" className="bg-[#0f131c]">Medium Priority</option>
                  <option value="low" className="bg-[#0f131c]">Low Priority</option>
                </select>
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-black text-[#05070a] hover:bg-cyan-300 disabled:opacity-30 transition-all"
                >
                  Add Task
                </button>
              </div>
            </form>
          )}
        </header>

        {/* Live Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <article className="rounded-2xl border border-cyan-400/20 bg-white/[0.035] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Active Tasks</p>
            <strong className="mt-3 block text-3xl font-black text-white">{activeCount}</strong>
            <p className="mt-1 text-xs text-cyan-200/70">In execution queue</p>
          </article>
          <article className="rounded-2xl border border-amber-400/20 bg-white/[0.035] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">High Priority</p>
            <strong className="mt-3 block text-3xl font-black text-amber-300">{highPriorityCount}</strong>
            <p className="mt-1 text-xs text-amber-200/70">Urgent delivery</p>
          </article>
          <article className="rounded-2xl border border-emerald-400/20 bg-white/[0.035] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Completed</p>
            <strong className="mt-3 block text-3xl font-black text-emerald-400">{completedCount}</strong>
            <p className="mt-1 text-xs text-emerald-200/70">Shipped tasks</p>
          </article>
          <article className="rounded-2xl border border-purple-400/20 bg-white/[0.035] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Completion Rate</p>
            <strong className="mt-3 block text-3xl font-black text-purple-300">{completionRate}%</strong>
            <p className="mt-1 text-xs text-purple-200/70">Overall progress</p>
          </article>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Search tasks by title…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {(['all', 'active', 'high', 'completed'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                  activeFilter === filter
                    ? 'bg-cyan-400 text-[#05070a]'
                    : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks List */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-white/40 pb-2 border-b border-white/5">
            <span className="font-bold uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-300" />
              Task Backlog ({filteredTasks.length})
            </span>
            <span>Click checkbox to toggle status</span>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-white/30 text-xs">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40 text-cyan-400" />
              No matching tasks found. Try changing filters or adding a new task.
            </div>
          ) : (
            filteredTasks.map((t) => (
              <div
                key={t.id}
                className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-all ${
                  t.done
                    ? 'border-white/5 bg-white/[0.015] opacity-60'
                    : 'border-white/10 bg-white/[0.035] hover:border-cyan-400/30'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <button
                    onClick={() => toggleTask(t.id)}
                    className="text-cyan-400 hover:scale-110 transition-transform shrink-0"
                  >
                    {t.done ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-white/30 hover:text-cyan-300" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold truncate ${t.done ? 'line-through text-white/40' : 'text-white'}`}>
                      {t.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-white/40">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3 text-cyan-400/70" />
                        {t.dueDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                      t.priority === 'high'
                        ? 'border border-rose-500/30 bg-rose-950/30 text-rose-300'
                        : t.priority === 'medium'
                        ? 'border border-amber-500/30 bg-amber-950/30 text-amber-300'
                        : 'border border-blue-500/30 bg-blue-950/30 text-blue-300'
                    }`}
                  >
                    {t.priority}
                  </span>
                  <button
                    onClick={() => deleteTask(t.id)}
                    className="p-1 rounded text-white/30 hover:text-rose-400 hover:bg-white/5 transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </section>
    </main>
  );
}

