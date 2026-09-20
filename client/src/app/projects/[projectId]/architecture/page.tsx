'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useProject } from '@/components/workspace/ProjectContext';
import type {
  ArchitectureComponent,
  ArchitectureConnection,
  ComponentType,
} from '@/validators/architectureSchema';
import {
  Network,
  Sparkles,
  Plus,
  Save,
  RefreshCw,
  Globe,
  Server,
  Database,
  Shield,
  HardDrive,
  Cpu,
  Terminal,
  Zap,
  Layers,
  Activity,
  Cloud,
  X,
  Trash2,
  Edit3,
} from 'lucide-react';
import { toast } from 'sonner';

const componentIcons: Record<ComponentType, typeof Server> = {
  FRONTEND: Globe,
  BACKEND: Server,
  DATABASE: Database,
  AUTHENTICATION: Shield,
  STORAGE: HardDrive,
  AI_SERVICES: Cpu,
  EXTERNAL_APIS: Terminal,
  CACHING: Zap,
  QUEUES: Layers,
  MONITORING: Activity,
  DEPLOYMENT: Cloud,
};

const componentColors: Record<ComponentType, string> = {
  FRONTEND: 'border-cyan-400/40 text-cyan-300 bg-cyan-400/10',
  BACKEND: 'border-blue-400/40 text-blue-300 bg-blue-400/10',
  DATABASE: 'border-purple-400/40 text-purple-300 bg-purple-400/10',
  AUTHENTICATION: 'border-amber-400/40 text-amber-300 bg-amber-400/10',
  STORAGE: 'border-emerald-400/40 text-emerald-300 bg-emerald-400/10',
  AI_SERVICES: 'border-rose-400/40 text-rose-300 bg-rose-400/10',
  EXTERNAL_APIS: 'border-indigo-400/40 text-indigo-300 bg-indigo-400/10',
  CACHING: 'border-yellow-400/40 text-yellow-300 bg-yellow-400/10',
  QUEUES: 'border-teal-400/40 text-teal-300 bg-teal-400/10',
  MONITORING: 'border-green-400/40 text-green-300 bg-green-400/10',
  DEPLOYMENT: 'border-sky-400/40 text-sky-300 bg-sky-400/10',
};

export default function ProjectArchitectureDesignerPage() {
  const { project } = useProject();
  const [components, setComponents] = useState<ArchitectureComponent[]>([]);
  const [connections, setConnections] = useState<ArchitectureConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Dragging state
  const [draggingCompId, setDraggingCompId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [isConnModalOpen, setIsConnModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<ArchitectureComponent | null>(null);

  const [compFormData, setCompFormData] = useState({
    name: '',
    type: 'BACKEND' as ComponentType,
    technology: '',
    responsibility: '',
  });

  const [connFormData, setConnFormData] = useState({
    source: '',
    target: '',
    protocol: 'HTTPS / REST',
    description: '',
  });

  // Load Architecture
  const loadArchitecture = useCallback(async () => {
    if (!project?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/architecture?projectId=${project.id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setComponents(data.data.components || []);
        setConnections(data.data.connections || []);
      }
    } catch {
      toast.error('Failed to load architecture model');
    } finally {
      setIsLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    loadArchitecture();
  }, [loadArchitecture]);

  // AI Regenerate
  const handleRegenerate = async () => {
    if (!project?.id) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/architecture/generate?projectId=${project.id}`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data) {
        setComponents(data.data.components || []);
        setConnections(data.data.connections || []);
        toast.success('Architecture model regenerated!');
      }
    } catch {
      toast.error('Regeneration failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Snapshot
  const handleSave = async () => {
    if (!project?.id) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/architecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          components,
          connections,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Architecture topology saved!');
      }
    } catch {
      toast.error('Failed to save architecture');
    } finally {
      setIsSaving(false);
    }
  };

  // Node Dragging Handler
  const handleMouseDown = (e: React.MouseEvent, comp: ArchitectureComponent) => {
    e.stopPropagation();
    setDraggingCompId(comp.id);
    dragOffsetRef.current = {
      x: e.clientX - comp.position.x,
      y: e.clientY - comp.position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingCompId || !canvasRef.current) return;
    const newX = Math.max(10, Math.min( canvasRef.current.clientWidth - 220, e.clientX - dragOffsetRef.current.x));
    const newY = Math.max(10, Math.min( canvasRef.current.clientHeight - 140, e.clientY - dragOffsetRef.current.y));

    setComponents((prev) =>
      prev.map((c) => (c.id === draggingCompId ? { ...c, position: { x: newX, y: newY } } : c))
    );
  };

  const handleMouseUp = () => {
    setDraggingCompId(null);
  };

  // Add / Edit Component Submit
  const handleCompSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingComp) {
      setComponents((prev) =>
        prev.map((c) =>
          c.id === editingComp.id
            ? { ...c, name: compFormData.name, type: compFormData.type, technology: compFormData.technology, responsibility: compFormData.responsibility }
            : c
        )
      );
      toast.success('Component updated');
    } else {
      const newComp: ArchitectureComponent = {
        id: `comp-${Date.now()}`,
        name: compFormData.name,
        type: compFormData.type,
        technology: compFormData.technology,
        responsibility: compFormData.responsibility,
        dependencies: [],
        position: { x: 200, y: 200 },
      };
      setComponents((prev) => [...prev, newComp]);
      toast.success('Component added to canvas');
    }
    setIsCompModalOpen(false);
  };

  // Add Connection Submit
  const handleConnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connFormData.source || !connFormData.target) {
      toast.error('Please select both source and target components');
      return;
    }
    const newConn: ArchitectureConnection = {
      id: `conn-${Date.now()}`,
      source: connFormData.source,
      target: connFormData.target,
      protocol: connFormData.protocol,
      description: connFormData.description,
    };
    setConnections((prev) => [...prev, newConn]);
    toast.success('Data flow connection created');
    setIsConnModalOpen(false);
  };

  // Delete Handlers
  const deleteComponent = (id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
    setConnections((prev) => prev.filter((cn) => cn.source !== id && cn.target !== id));
    toast.success('Component removed');
  };

  const deleteConnection = (id: string) => {
    setConnections((prev) => prev.filter((cn) => cn.id !== id));
    toast.success('Connection removed');
  };

  return (
    <div className="flex h-full flex-col p-6 space-y-6">
      {/* Top Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Network className="h-6 w-6 text-cyan-400" />
            Visual Architecture Designer
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Structured system topology & data flow canvas for {project?.name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-black text-[#05070a] hover:bg-cyan-300 transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)] disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate AI Topology
          </button>
          <button
            onClick={() => {
              setEditingComp(null);
              setCompFormData({ name: '', type: 'BACKEND', technology: '', responsibility: '' });
              setIsCompModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-xs font-black text-white hover:bg-white/20 transition-all"
          >
            <Plus className="h-4 w-4" /> Add Component
          </button>
          <button
            onClick={() => setIsConnModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-xs font-black text-white hover:bg-white/20 transition-all"
          >
            <Plus className="h-4 w-4" /> Add Connector
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-xs font-black text-[#05070a] hover:bg-green-400 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]"
          >
            <Save className="h-4 w-4" /> Save Topology
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative flex-1 min-h-[600px] rounded-3xl border border-white/10 bg-[#070a0f] overflow-hidden select-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* SVG Connecting Lines */}
            <svg className="absolute inset-0 h-full w-full pointer-events-none z-10">
              {connections.map((conn) => {
                const srcNode = components.find((c) => c.id === conn.source);
                const tgtNode = components.find((c) => c.id === conn.target);
                if (!srcNode || !tgtNode) return null;

                const x1 = srcNode.position.x + 100;
                const y1 = srcNode.position.y + 50;
                const x2 = tgtNode.position.x + 100;
                const y2 = tgtNode.position.y + 50;

                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;

                return (
                  <g key={conn.id}>
                    <path
                      d={`M ${x1} ${y1} C ${x1 + 60} ${y1}, ${x2 - 60} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      stroke="rgba(0, 243, 255, 0.35)"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                    <rect
                      x={midX - 40}
                      y={midY - 10}
                      width="80"
                      height="20"
                      rx="4"
                      fill="#0c1017"
                      stroke="rgba(255, 255, 255, 0.2)"
                    />
                    <text
                      x={midX}
                      y={midY + 4}
                      textAnchor="middle"
                      fill="#a5f3fc"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {conn.protocol}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Draggable Component Nodes */}
            {components.map((comp) => {
              const IconComp = componentIcons[comp.type] || Server;
              const colorClasses = componentColors[comp.type] || 'border-cyan-400/40 text-cyan-300 bg-cyan-400/10';

              return (
                <div
                  key={comp.id}
                  onMouseDown={(e) => handleMouseDown(e, comp)}
                  style={{
                    left: `${comp.position.x}px`,
                    top: `${comp.position.y}px`,
                  }}
                  className={`absolute z-20 w-52 rounded-2xl border p-4 shadow-2xl backdrop-blur-md cursor-grab active:cursor-grabbing transition-shadow ${
                    draggingCompId === comp.id ? 'ring-2 ring-cyan-400 shadow-[0_0_25px_rgba(0,243,255,0.4)]' : ''
                  } ${colorClasses}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <IconComp className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{comp.type}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingComp(comp);
                          setCompFormData({
                            name: comp.name,
                            type: comp.type,
                            technology: comp.technology,
                            responsibility: comp.responsibility,
                          });
                          setIsCompModalOpen(true);
                        }}
                        className="p-1 hover:text-white"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteComponent(comp.id);
                        }}
                        className="p-1 hover:text-rose-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-black text-white truncate">{comp.name}</h3>
                  <p className="text-[10px] font-mono text-white/60 truncate mt-1">{comp.technology}</p>
                  <p className="text-[10px] text-white/40 line-clamp-2 mt-2 pt-2 border-t border-white/10">
                    {comp.responsibility}
                  </p>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Component Modal */}
      {isCompModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0c1017] p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-black">{editingComp ? 'Edit Component' : 'Add Component Node'}</h2>
              <button onClick={() => setIsCompModalOpen(false)} className="text-white/40 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCompSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-bold text-white/60">Component Name</label>
                <input
                  type="text"
                  required
                  value={compFormData.name}
                  onChange={(e) => setCompFormData({ ...compFormData, name: e.target.value })}
                  placeholder="e.g. Next.js App Router"
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-white/60">Component Type</label>
                <select
                  value={compFormData.type}
                  onChange={(e) => setCompFormData({ ...compFormData, type: e.target.value as ComponentType })}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/60 text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="FRONTEND">FRONTEND</option>
                  <option value="BACKEND">BACKEND</option>
                  <option value="DATABASE">DATABASE</option>
                  <option value="AUTHENTICATION">AUTHENTICATION</option>
                  <option value="STORAGE">STORAGE</option>
                  <option value="AI_SERVICES">AI_SERVICES</option>
                  <option value="EXTERNAL_APIS">EXTERNAL_APIS</option>
                  <option value="CACHING">CACHING</option>
                  <option value="QUEUES">QUEUES</option>
                  <option value="MONITORING">MONITORING</option>
                  <option value="DEPLOYMENT">DEPLOYMENT</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold text-white/60">Technology Stack</label>
                <input
                  type="text"
                  required
                  value={compFormData.technology}
                  onChange={(e) => setCompFormData({ ...compFormData, technology: e.target.value })}
                  placeholder="e.g. React 18 + Tailwind CSS"
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-white/60">Responsibility</label>
                <textarea
                  rows={2}
                  required
                  value={compFormData.responsibility}
                  onChange={(e) => setCompFormData({ ...compFormData, responsibility: e.target.value })}
                  placeholder="e.g. Renders interactive client views..."
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCompModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 text-xs font-black text-[#05070a] hover:bg-cyan-300 transition-all"
                >
                  {editingComp ? 'Save Changes' : 'Add Node'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connection Modal */}
      {isConnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0c1017] p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-black">Add Data Flow Connector</h2>
              <button onClick={() => setIsConnModalOpen(false)} className="text-white/40 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConnSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-bold text-white/60">Source Node</label>
                <select
                  value={connFormData.source}
                  onChange={(e) => setConnFormData({ ...connFormData, source: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/60 text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="">Select Source Component</option>
                  {components.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold text-white/60">Target Node</label>
                <select
                  value={connFormData.target}
                  onChange={(e) => setConnFormData({ ...connFormData, target: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/60 text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="">Select Target Component</option>
                  {components.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold text-white/60">Protocol Label</label>
                <input
                  type="text"
                  required
                  value={connFormData.protocol}
                  onChange={(e) => setConnFormData({ ...connFormData, protocol: e.target.value })}
                  placeholder="e.g. HTTPS / REST, PostgreSQL / TCP, gRPC"
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsConnModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 text-xs font-black text-[#05070a] hover:bg-cyan-300 transition-all"
                >
                  Create Connector
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
