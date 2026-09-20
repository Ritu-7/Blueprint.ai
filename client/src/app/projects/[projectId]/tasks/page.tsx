'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useProject } from '@/components/workspace/ProjectContext';
import type { TaskItem, TaskCategory, TaskPriority, TaskComplexity, TaskStatus } from '@/validators/taskSchema';
import { GlassCard } from '@/components/GlassCard';
import {
  CheckSquare,
  Sparkles,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  GitBranch,
  Layers,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';

const kanbanColumns: Array<{ id: TaskStatus; title: string; color: string }> = [
  { id: 'BACKLOG', title: 'Backlog', color: 'border-white/10 text-white/40' },
  { id: 'TODO', title: 'To Do', color: 'border-cyan-400/30 text-cyan-300' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-amber-400/30 text-amber-300' },
  { id: 'REVIEW', title: 'In Review', color: 'border-purple-400/30 text-purple-300' },
  { id: 'DONE', title: 'Done', color: 'border-green-400/30 text-green-400' },
];

export default function ProjectTasksKanbanPage() {
  const { project } = useProject();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'FRONTEND' as TaskCategory,
    priority: 'MEDIUM' as TaskPriority,
    complexity: 'M' as TaskComplexity,
    status: 'TODO' as TaskStatus,
    assignee: '',
    related_requirement: '',
    dependencies: '',
  });

  // Load Tasks
  const loadTasks = useCallback(async () => {
    if (!project?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tasks?projectId=${project.id}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTasks(data.data);
      }
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // AI Generation
  const handleGenerate = async () => {
    if (!project?.id) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/tasks/generate?projectId=${project.id}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(`Generated ${data.data?.length || 0} implementation tasks!`);
        await loadTasks();
      } else {
        toast.error(data.error || 'Task generation failed');
      }
    } catch {
      toast.error('Failed to generate tasks');
    } finally {
      setIsGenerating(false);
    }
  };

  // Status Change (Move Column)
  const moveTaskStatus = async (task: TaskItem, newStatus: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Task moved to ${newStatus.replace('_', ' ')}`);
      }
    } catch {
      toast.error('Failed to update status');
      await loadTasks();
    }
  };

  // Submit Handler (Create/Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project?.id) return;

    const payload = {
      project_id: project.id,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      complexity: formData.complexity,
      status: formData.status,
      assignee: formData.assignee || null,
      related_requirement: formData.related_requirement,
      dependencies: formData.dependencies.split(',').map((s) => s.trim()).filter(Boolean),
    };

    try {
      if (editingTask?.id) {
        const res = await fetch('/api/tasks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingTask.id, ...payload }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Task updated');
          setIsModalOpen(false);
          await loadTasks();
        }
      } else {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Task created');
          setIsModalOpen(false);
          await loadTasks();
        }
      }
    } catch {
      toast.error('Operation failed');
    }
  };

  // Delete Handler
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Task deleted');
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch {
      toast.error('Failed to delete task');
    }
  };

  // Open Add Modal
  const openAdd = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      category: 'FRONTEND',
      priority: 'MEDIUM',
      complexity: 'M',
      status: 'TODO',
      assignee: '',
      related_requirement: '',
      dependencies: '',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEdit = (t: TaskItem) => {
    setEditingTask(t);
    setFormData({
      title: t.title,
      description: t.description,
      category: t.category,
      priority: t.priority,
      complexity: t.complexity,
      status: t.status,
      assignee: t.assignee || '',
      related_requirement: t.related_requirement,
      dependencies: t.dependencies.join(', '),
    });
    setIsModalOpen(true);
  };

  // Progress Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
  const criticalHighCount = tasks.filter((t) => t.priority === 'CRITICAL' || t.priority === 'HIGH').length;
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.assignee && t.assignee.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [tasks, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-cyan-400" />
            AI Development Task Engine & Kanban
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Implementation workflow derived from {project?.name}&apos;s blueprint, requirements, & architecture
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-black text-[#05070a] hover:bg-cyan-300 transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)] disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {tasks.length > 0 ? 'Regenerate Tasks' : 'Generate Implementation Tasks'}
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-xs font-black text-white hover:bg-white/20 transition-all"
          >
            <Plus className="h-4 w-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Progress Metrics Bar */}
      <div className="grid gap-4 md:grid-cols-4 p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white/60">Overall Completion</span>
            <span className="font-black text-cyan-300">{completionPercent}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-black/60 overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-green-400 transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-l border-white/10 pl-4">
          <div>
            <p className="text-[10px] font-black uppercase text-white/40">Total Tasks</p>
            <p className="text-2xl font-black text-white">{totalTasks}</p>
          </div>
          <Layers className="h-5 w-5 text-cyan-400/60" />
        </div>

        <div className="flex items-center justify-between border-l border-white/10 pl-4">
          <div>
            <p className="text-[10px] font-black uppercase text-white/40">Completed</p>
            <p className="text-2xl font-black text-green-400">{completedTasks}</p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-green-400/60" />
        </div>

        <div className="flex items-center justify-between border-l border-white/10 pl-4">
          <div>
            <p className="text-[10px] font-black uppercase text-white/40">High / Critical</p>
            <p className="text-2xl font-black text-amber-300">{criticalHighCount}</p>
          </div>
          <Flame className="h-5 w-5 text-amber-400/60" />
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks or assignees..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-white/10 bg-black/40 text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-white/10 bg-black/40 text-white focus:border-cyan-400 focus:outline-none"
        >
          <option value="ALL">All Categories</option>
          <option value="SETUP">SETUP</option>
          <option value="FRONTEND">FRONTEND</option>
          <option value="BACKEND">BACKEND</option>
          <option value="DATABASE">DATABASE</option>
          <option value="AUTH">AUTH</option>
          <option value="AI">AI</option>
          <option value="TESTING">TESTING</option>
          <option value="DEVOPS">DEVOPS</option>
          <option value="DOCUMENTATION">DOCUMENTATION</option>
        </select>
      </div>

      {/* 5-Column Kanban Board */}
      {isLoading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-5 min-h-[600px] overflow-x-auto">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);

            return (
              <div key={col.id} className="flex flex-col rounded-3xl border border-white/10 bg-[#070a0f] p-3 space-y-3 min-w-[260px]">
                {/* Column Header */}
                <div className={`flex items-center justify-between border-b p-2 font-black text-xs uppercase tracking-wider ${col.color}`}>
                  <span>{col.title}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Task Cards */}
                <div className="flex-1 overflow-y-auto space-y-3 p-1">
                  {colTasks.map((t) => {
                    const colIndex = kanbanColumns.findIndex((c) => c.id === col.id);

                    return (
                      <GlassCard key={t.id} className="p-4 border-white/10 hover:border-cyan-400/40 space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase">
                          <span className="rounded-full bg-cyan-400/10 border border-cyan-400/30 px-2 py-0.5 text-cyan-300">
                            {t.category}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`rounded px-1.5 py-0.5 ${
                                t.priority === 'CRITICAL'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : t.priority === 'HIGH'
                                  ? 'bg-amber-400/20 text-amber-300'
                                  : 'bg-white/10 text-white/60'
                              }`}
                            >
                              {t.priority}
                            </span>
                            <span className="rounded bg-white/10 px-1.5 py-0.5 text-white/40">
                              {t.complexity}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-black text-white">{t.title}</h4>
                          <p className="text-[11px] text-white/50 mt-1 line-clamp-2">{t.description}</p>
                        </div>

                        {t.assignee && (
                          <div className="flex items-center gap-1.5 text-[10px] text-cyan-200/80">
                            <User className="h-3 w-3 text-cyan-400" />
                            <span>{t.assignee}</span>
                          </div>
                        )}

                        {/* Card Controls & Status Transition Buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-white/40">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(t)}
                              className="p-1 hover:text-cyan-300"
                              title="Edit Task"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => t.id && handleDelete(t.id)}
                              className="p-1 hover:text-rose-400"
                              title="Delete Task"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            {colIndex > 0 && (
                              <button
                                onClick={() => moveTaskStatus(t, kanbanColumns[colIndex - 1].id)}
                                className="p-1 hover:text-white rounded hover:bg-white/10"
                                title="Move Left"
                              >
                                <ChevronLeft className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {colIndex < kanbanColumns.length - 1 && (
                              <button
                                onClick={() => moveTaskStatus(t, kanbanColumns[colIndex + 1].id)}
                                className="p-1 hover:text-white rounded hover:bg-white/10"
                                title="Move Right"
                              >
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0c1017] p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-black">{editingTask ? 'Edit Task' : 'Add Implementation Task'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-bold text-white/60">Task Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Implement Clerk OAuth Provider"
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-white/60">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/60 text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="SETUP">SETUP</option>
                    <option value="FRONTEND">FRONTEND</option>
                    <option value="BACKEND">BACKEND</option>
                    <option value="DATABASE">DATABASE</option>
                    <option value="AUTH">AUTH</option>
                    <option value="AI">AI</option>
                    <option value="TESTING">TESTING</option>
                    <option value="DEVOPS">DEVOPS</option>
                    <option value="DOCUMENTATION">DOCUMENTATION</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-white/60">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/60 text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-white/60">Complexity</label>
                  <select
                    value={formData.complexity}
                    onChange={(e) => setFormData({ ...formData, complexity: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/60 text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="S">S (Small)</option>
                    <option value="M">M (Medium)</option>
                    <option value="L">L (Large)</option>
                    <option value="XL">XL (Extra Large)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-white/60">Kanban Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/60 text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="BACKLOG">BACKLOG</option>
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="REVIEW">REVIEW</option>
                    <option value="DONE">DONE</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-white/60">Assignee</label>
                  <input
                    type="text"
                    value={formData.assignee}
                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                    placeholder="e.g. Lead Engineer"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-white/60">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Task implementation details..."
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 text-xs font-black text-[#05070a] hover:bg-cyan-300 transition-all"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
