'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useProject } from '@/components/workspace/ProjectContext';
import { GlassCard } from '@/components/GlassCard';
import type { Requirement, RequirementType, RequirementPriority, RequirementStatus } from '@/validators/requirementSchema';
import {
  ListTodo,
  Plus,
  Sparkles,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Shield,
  Zap,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  GitBranch,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectRequirementsPage() {
  const { project } = useProject();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'status' | 'title' | 'date'>('priority');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<Requirement | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'FUNCTIONAL' as RequirementType,
    priority: 'MEDIUM' as RequirementPriority,
    status: 'TODO' as RequirementStatus,
    user_story: '',
    acceptance_criteria: '',
    dependencies: '',
  });

  // Load Requirements
  const loadRequirements = useCallback(async () => {
    if (!project?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/requirements?projectId=${project.id}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRequirements(data.data);
      }
    } catch {
      toast.error('Failed to load requirements');
    } finally {
      setIsLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    loadRequirements();
  }, [loadRequirements]);

  // AI Generation Trigger
  const handleGenerate = async () => {
    if (!project?.id) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/requirements/generate?projectId=${project.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Generated ${data.data?.length || 0} requirements from blueprint!`);
        await loadRequirements();
      } else {
        toast.error(data.error || 'Generation failed');
      }
    } catch {
      toast.error('Failed to generate requirements');
    } finally {
      setIsGenerating(false);
    }
  };

  // Create or Update Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project?.id) return;

    const payload = {
      project_id: project.id,
      title: formData.title,
      description: formData.description,
      type: formData.type,
      priority: formData.priority,
      status: formData.status,
      user_story: formData.user_story,
      acceptance_criteria: formData.acceptance_criteria.split('\n').filter(Boolean),
      dependencies: formData.dependencies.split(',').map((s) => s.trim()).filter(Boolean),
    };

    try {
      if (editingReq?.id) {
        const res = await fetch('/api/requirements', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingReq.id, ...payload }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Requirement updated');
          setIsModalOpen(false);
          await loadRequirements();
        }
      } else {
        const res = await fetch('/api/requirements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Requirement created');
          setIsModalOpen(false);
          await loadRequirements();
        }
      }
    } catch {
      toast.error('Operation failed');
    }
  };

  // Delete Handler
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/requirements?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Requirement deleted');
        setRequirements((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {
      toast.error('Failed to delete requirement');
    }
  };

  // Open Edit Modal
  const openEdit = (req: Requirement) => {
    setEditingReq(req);
    setFormData({
      title: req.title,
      description: req.description,
      type: req.type,
      priority: req.priority,
      status: req.status,
      user_story: req.user_story,
      acceptance_criteria: req.acceptance_criteria.join('\n'),
      dependencies: req.dependencies.join(', '),
    });
    setIsModalOpen(true);
  };

  // Open Add Modal
  const openAdd = () => {
    setEditingReq(null);
    setFormData({
      title: '',
      description: '',
      type: 'FUNCTIONAL',
      priority: 'MEDIUM',
      status: 'TODO',
      user_story: '',
      acceptance_criteria: '',
      dependencies: '',
    });
    setIsModalOpen(true);
  };

  // Filtered & Sorted List Computation
  const filteredRequirements = useMemo(() => {
    return requirements
      .filter((r) => {
        const matchesQuery =
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.user_story.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType === 'ALL' || r.type === selectedType;
        const matchesPriority = selectedPriority === 'ALL' || r.priority === selectedPriority;
        const matchesStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
        return matchesQuery && matchesType && matchesPriority && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          const pOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
        }
        if (sortBy === 'status') {
          return a.status.localeCompare(b.status);
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
  }, [requirements, searchQuery, selectedType, selectedPriority, selectedStatus, sortBy]);

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ListTodo className="h-6 w-6 text-cyan-400" />
            Requirements Engine
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Structured specifications derived from {project?.name}&apos;s saved blueprint model
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-black text-[#05070a] hover:bg-cyan-300 transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)] disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {requirements.length > 0 ? 'Regenerate Requirements' : 'Generate Requirements'}
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-xs font-black text-white hover:bg-white/20 transition-all"
          >
            <Plus className="h-4 w-4" /> Add Requirement
          </button>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search requirements or user stories..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-white/10 bg-black/40 text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        {/* Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-white/10 bg-black/40 text-white focus:border-cyan-400 focus:outline-none"
        >
          <option value="ALL">All Types</option>
          <option value="FUNCTIONAL">FUNCTIONAL</option>
          <option value="NON_FUNCTIONAL">NON_FUNCTIONAL</option>
          <option value="SECURITY">SECURITY</option>
          <option value="PERFORMANCE">PERFORMANCE</option>
          <option value="BUSINESS">BUSINESS</option>
        </select>

        {/* Priority Filter */}
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-white/10 bg-black/40 text-white focus:border-cyan-400 focus:outline-none"
        >
          <option value="ALL">All Priorities</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 text-xs rounded-xl border border-white/10 bg-black/40 text-white focus:border-cyan-400 focus:outline-none"
        >
          <option value="priority">Sort by Priority</option>
          <option value="status">Sort by Status</option>
          <option value="title">Sort by Title</option>
          <option value="date">Sort by Date</option>
        </select>
      </div>

      {/* Requirements List */}
      {isLoading ? (
        <div className="flex h-64 w-full items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin" />
        </div>
      ) : filteredRequirements.length > 0 ? (
        <div className="grid gap-4">
          {filteredRequirements.map((req) => (
            <GlassCard key={req.id} className="p-5 border-white/10 hover:border-cyan-400/40 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                      req.priority === 'CRITICAL'
                        ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                        : req.priority === 'HIGH'
                        ? 'bg-amber-400/10 border border-amber-400/30 text-amber-300'
                        : 'bg-cyan-400/10 border border-cyan-400/30 text-cyan-300'
                    }`}
                  >
                    {req.priority}
                  </span>
                  <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[9px] font-black uppercase text-white/70">
                    {req.type}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                      req.status === 'COMPLETED'
                        ? 'bg-green-400/10 border border-green-400/30 text-green-400'
                        : req.status === 'IN_PROGRESS'
                        ? 'bg-amber-400/10 border border-amber-400/30 text-amber-300'
                        : 'bg-white/5 border border-white/10 text-white/50'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(req)} className="p-1.5 rounded-lg border border-white/10 text-white/60 hover:text-cyan-300 hover:bg-white/5">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => req.id && handleDelete(req.id)} className="p-1.5 rounded-lg border border-white/10 text-white/60 hover:text-rose-400 hover:bg-white/5">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-base font-black text-white">{req.title}</h3>
                <p className="text-xs text-white/60 mt-1 leading-relaxed">{req.description}</p>
              </div>

              {/* User Story */}
              {req.user_story && (
                <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-cyan-100/90 font-mono">
                  &ldquo;{req.user_story}&rdquo;
                </div>
              )}

              {/* Acceptance Criteria & Dependencies */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10 text-[11px] text-white/50">
                {req.acceptance_criteria.length > 0 && (
                  <div>
                    Criteria: <span className="text-white font-bold">{req.acceptance_criteria.length} test cases</span>
                  </div>
                )}
                {req.dependencies.length > 0 && (
                  <div className="flex items-center gap-1.5 text-purple-300">
                    <GitBranch className="h-3.5 w-3.5" />
                    Dependencies: {req.dependencies.join(', ')}
                  </div>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <ListTodo className="mx-auto h-8 w-8 text-cyan-400/60 mb-3" />
          <p className="text-sm font-bold text-white">No requirements found</p>
          <p className="text-xs text-white/40 mt-1">Generate requirements automatically from your blueprint model or add one manually.</p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-black text-[#05070a] hover:bg-cyan-300 transition-all"
          >
            <Sparkles className="h-4 w-4" /> Generate Requirements
          </button>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0c1017] p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-black">{editingReq ? 'Edit Requirement' : 'Add New Requirement'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-bold text-white/60">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="REQ-01: Feature Title"
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-white/60">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/60 text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="FUNCTIONAL">FUNCTIONAL</option>
                    <option value="NON_FUNCTIONAL">NON_FUNCTIONAL</option>
                    <option value="SECURITY">SECURITY</option>
                    <option value="PERFORMANCE">PERFORMANCE</option>
                    <option value="BUSINESS">BUSINESS</option>
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
                  <label className="block mb-1 font-bold text-white/60">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/60 text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="BLOCKED">BLOCKED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-white/60">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed requirement specification..."
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-white/60">User Story</label>
                <input
                  type="text"
                  value={formData.user_story}
                  onChange={(e) => setFormData({ ...formData, user_story: e.target.value })}
                  placeholder="As a [role], I want to [action], so that [benefit]"
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-white/60">Acceptance Criteria (1 per line)</label>
                <textarea
                  rows={2}
                  value={formData.acceptance_criteria}
                  onChange={(e) => setFormData({ ...formData, acceptance_criteria: e.target.value })}
                  placeholder="Criteria 1&#10;Criteria 2"
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
                  {editingReq ? 'Save Changes' : 'Create Requirement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
