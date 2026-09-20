'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useProject } from '@/components/workspace/ProjectContext';
import { DatabaseDesignService } from '@/services/databaseDesignService';
import type { DatabaseTable, DatabaseColumn, DesignWarning } from '@/validators/databaseSchema';
import { GlassCard } from '@/components/GlassCard';
import { CodeEditor } from '@/components/builder/CodeEditor';
import {
  Database,
  Sparkles,
  Plus,
  Save,
  RefreshCw,
  Key,
  Link as LinkIcon,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  Trash2,
  Edit3,
  X,
  Code2,
  Table as TableIcon,
  Eye,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectDatabaseDesignerPage() {
  const { project } = useProject();
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'er' | 'sql' | 'warnings'>('er');

  // Dragging state
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Table Modal State
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<DatabaseTable | null>(null);
  const [tableName, setTableName] = useState('');
  const [tableDesc, setTableDesc] = useState('');

  // Column Modal State
  const [isColModalOpen, setIsColModalOpen] = useState(false);
  const [targetTableId, setTargetTableId] = useState<string | null>(null);
  const [colFormData, setColFormData] = useState({
    name: '',
    type: 'text',
    isPrimaryKey: false,
    isNullable: true,
    isUnique: false,
    defaultValue: '',
    hasFK: false,
    targetTable: '',
    targetColumn: 'id',
  });

  // Load Design
  const loadDesign = useCallback(async () => {
    if (!project?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/database?projectId=${project.id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setTables(data.data.tables || []);
      }
    } catch {
      toast.error('Failed to load database design');
    } finally {
      setIsLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    loadDesign();
  }, [loadDesign]);

  // AI Regenerate
  const handleRegenerate = async () => {
    if (!project?.id) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/database/generate?projectId=${project.id}`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data) {
        setTables(data.data.tables || []);
        toast.success('Generated PostgreSQL ER database design!');
      }
    } catch {
      toast.error('Regeneration failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Topology
  const handleSave = async () => {
    if (!project?.id) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          tables,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Database design saved!');
      }
    } catch {
      toast.error('Failed to save database design');
    } finally {
      setIsSaving(false);
    }
  };

  // Validation Warnings Computation
  const validationWarnings = useMemo(() => {
    return DatabaseDesignService.validateDatabaseDesign(tables);
  }, [tables]);

  // Generated PostgreSQL DDL Script
  const generatedSQL = useMemo(() => {
    return DatabaseDesignService.generatePostgreSQLScript(tables);
  }, [tables]);

  // Dragging Handlers
  const handleMouseDown = (e: React.MouseEvent, table: DatabaseTable) => {
    e.stopPropagation();
    setDraggingTableId(table.id);
    dragOffsetRef.current = {
      x: e.clientX - table.position.x,
      y: e.clientY - table.position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingTableId || !canvasRef.current) return;
    const newX = Math.max(10, Math.min(canvasRef.current.clientWidth - 280, e.clientX - dragOffsetRef.current.x));
    const newY = Math.max(10, Math.min(canvasRef.current.clientHeight - 200, e.clientY - dragOffsetRef.current.y));

    setTables((prev) =>
      prev.map((t) => (t.id === draggingTableId ? { ...t, position: { x: newX, y: newY } } : t))
    );
  };

  const handleMouseUp = () => {
    setDraggingTableId(null);
  };

  // Add/Edit Table Submit
  const handleTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTable) {
      setTables((prev) =>
        prev.map((t) => (t.id === editingTable.id ? { ...t, name: tableName, description: tableDesc } : t))
      );
      toast.success('Table updated');
    } else {
      const newTable: DatabaseTable = {
        id: `tbl-${Date.now()}`,
        name: tableName,
        description: tableDesc,
        position: { x: 100, y: 100 },
        columns: [
          { id: `col-${Date.now()}-1`, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: false, defaultValue: 'gen_random_uuid()' },
          { id: `col-${Date.now()}-2`, name: 'created_at', type: 'timestamptz', isPrimaryKey: false, isNullable: false, isUnique: false, defaultValue: 'NOW()' },
        ],
        indexes: [],
      };
      setTables((prev) => [...prev, newTable]);
      toast.success('Table added');
    }
    setIsTableModalOpen(false);
  };

  // Add Column Submit
  const handleColSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTableId) return;

    const newCol: DatabaseColumn = {
      id: `col-${Date.now()}`,
      name: colFormData.name,
      type: colFormData.type,
      isPrimaryKey: colFormData.isPrimaryKey,
      isNullable: colFormData.isNullable,
      isUnique: colFormData.isUnique,
      defaultValue: colFormData.defaultValue || undefined,
      foreignKey: colFormData.hasFK && colFormData.targetTable ? { targetTable: colFormData.targetTable, targetColumn: colFormData.targetColumn, onDelete: 'CASCADE' } : undefined,
    };

    setTables((prev) =>
      prev.map((t) => (t.id === targetTableId ? { ...t, columns: [...t.columns, newCol] } : t))
    );
    toast.success('Column added');
    setIsColModalOpen(false);
  };

  // Delete Column
  const deleteColumn = (tableId: string, colId: string) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, columns: t.columns.filter((c) => c.id !== colId) } : t))
    );
  };

  // Delete Table
  const deleteTable = (id: string) => {
    setTables((prev) => prev.filter((t) => t.id !== id));
    toast.success('Table deleted');
  };

  return (
    <div className="flex h-full flex-col p-6 space-y-6">
      {/* Top Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Database className="h-6 w-6 text-cyan-400" />
            AI Database Designer & ER Modeler
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Planning tool for PostgreSQL schema modeling, foreign key validation, and DDL generation for {project?.name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-black text-[#05070a] hover:bg-cyan-300 transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)] disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate ER Schema
          </button>
          <button
            onClick={() => {
              setEditingTable(null);
              setTableName('');
              setTableDesc('');
              setIsTableModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-xs font-black text-white hover:bg-white/20 transition-all"
          >
            <Plus className="h-4 w-4" /> Add Table
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-xs font-black text-[#05070a] hover:bg-green-400 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]"
          >
            <Save className="h-4 w-4" /> Save Design
          </button>
        </div>
      </div>

      {/* Sub-Nav Mode Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 pb-1">
        <div className="flex space-x-2">
          {[
            { id: 'er', label: 'Visual ER Diagram', icon: TableIcon },
            { id: 'sql', label: 'PostgreSQL DDL Script', icon: Code2 },
            {
              id: 'warnings',
              label: `Validation Warnings (${validationWarnings.length})`,
              icon: AlertTriangle,
              alert: validationWarnings.length > 0,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-400/10'
                  : 'border-transparent text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className={`h-4 w-4 ${tab.alert ? 'text-amber-400 animate-pulse' : ''}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'er' && (
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
              {/* Relationship Connector Lines */}
              <svg className="absolute inset-0 h-full w-full pointer-events-none z-10">
                {tables.map((tbl) =>
                  tbl.columns.map((col) => {
                    if (!col.foreignKey) return null;
                    const tgtTbl = tables.find((t) => t.name.toLowerCase() === col.foreignKey?.targetTable.toLowerCase());
                    if (!tgtTbl) return null;

                    const x1 = tbl.position.x + 130;
                    const y1 = tbl.position.y + 40;
                    const x2 = tgtTbl.position.x + 130;
                    const y2 = tgtTbl.position.y + 40;

                    return (
                      <line
                        key={`${tbl.id}-${col.id}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="rgba(168, 85, 247, 0.5)"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    );
                  })
                )}
              </svg>

              {/* Draggable Tables Cards */}
              {tables.map((table) => (
                <div
                  key={table.id}
                  onMouseDown={(e) => handleMouseDown(e, table)}
                  style={{
                    left: `${table.position.x}px`,
                    top: `${table.position.y}px`,
                  }}
                  className={`absolute z-20 w-72 rounded-2xl border border-white/10 bg-[#0c1017]/95 shadow-2xl backdrop-blur-md cursor-grab active:cursor-grabbing ${
                    draggingTableId === table.id ? 'ring-2 ring-cyan-400 shadow-[0_0_25px_rgba(0,243,255,0.3)]' : ''
                  }`}
                >
                  {/* Table Header */}
                  <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <TableIcon className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                      <h3 className="text-xs font-black text-white truncate">{table.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTargetTableId(table.id);
                          setColFormData({
                            name: '',
                            type: 'text',
                            isPrimaryKey: false,
                            isNullable: true,
                            isUnique: false,
                            defaultValue: '',
                            hasFK: false,
                            targetTable: '',
                            targetColumn: 'id',
                          });
                          setIsColModalOpen(true);
                        }}
                        className="p-1 rounded text-white/60 hover:text-cyan-300 hover:bg-white/10"
                        title="Add Column"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTable(table);
                          setTableName(table.name);
                          setTableDesc(table.description);
                          setIsTableModalOpen(true);
                        }}
                        className="p-1 rounded text-white/60 hover:text-white hover:bg-white/10"
                        title="Edit Table"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTable(table.id);
                        }}
                        className="p-1 rounded text-white/60 hover:text-rose-400 hover:bg-white/10"
                        title="Delete Table"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Columns List */}
                  <div className="p-3 space-y-1.5 max-h-72 overflow-y-auto">
                    {table.columns.map((col) => (
                      <div
                        key={col.id}
                        className="group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] font-mono hover:bg-white/[0.04]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {col.isPrimaryKey ? (
                            <Key className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                          ) : col.foreignKey ? (
                            <LinkIcon className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
                          ) : (
                            <span className="w-3.5 text-center text-white/20">•</span>
                          )}
                          <span className={`truncate font-bold ${col.isPrimaryKey ? 'text-amber-300' : 'text-white'}`}>
                            {col.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-white/40">
                          <span className="text-cyan-300/80">{col.type}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteColumn(table.id, col.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 hover:text-rose-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* SQL Script Generator Tab */}
      {activeTab === 'sql' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-xs text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong>Planning Tool Safeguard:</strong> Generated PostgreSQL DDL scripts are for review and versioning. They <strong>NEVER</strong> auto-execute against your database.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedSQL);
                  toast.success('SQL script copied to clipboard!');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400/20 border border-amber-400/30 px-3 py-1.5 text-xs font-black text-amber-300 hover:bg-amber-400/30"
              >
                <Copy className="h-3.5 w-3.5" /> Copy SQL
              </button>
            </div>
          </div>

          <div className="min-h-[500px] rounded-2xl border border-white/10 bg-[#070a0f] overflow-hidden">
            <CodeEditor title="schema.sql" fallbackContent={generatedSQL} />
          </div>
        </div>
      )}

      {/* Warnings & Design Rules Tab */}
      {activeTab === 'warnings' && (
        <div className="space-y-4">
          {validationWarnings.length === 0 ? (
            <div className="rounded-3xl border border-green-400/20 bg-green-400/10 p-8 text-center text-green-300">
              <CheckCircle2 className="mx-auto h-8 w-8 mb-3" />
              <h2 className="text-base font-black uppercase">Zero Design Warnings</h2>
              <p className="text-xs text-green-200/70 mt-1">All tables contain primary keys, valid foreign key targets, unique indexes, and audit timestamps.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {validationWarnings.map((warn, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-4 rounded-2xl border p-4 text-xs ${
                    warn.severity === 'error'
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                      : 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                  }`}
                >
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black uppercase tracking-wider text-[10px] bg-black/40 px-2 py-0.5 rounded border border-white/10">
                        {warn.type}
                      </span>
                      <strong className="text-white">Table: {warn.tableName}</strong>
                      {warn.columnName && <span>(Column: {warn.columnName})</span>}
                    </div>
                    <p className="leading-relaxed">{warn.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table Modal */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0c1017] p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-black">{editingTable ? 'Edit Table' : 'Add Database Table'}</h2>
              <button onClick={() => setIsTableModalOpen(false)} className="text-white/40 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleTableSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-bold text-white/60">Table Name</label>
                <input
                  type="text"
                  required
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  placeholder="e.g. user_profiles"
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-white/60">Description</label>
                <textarea
                  rows={2}
                  value={tableDesc}
                  onChange={(e) => setTableDesc(e.target.value)}
                  placeholder="Table purpose..."
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 text-xs font-black text-[#05070a] hover:bg-cyan-300 transition-all"
                >
                  {editingTable ? 'Save Table' : 'Add Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Column Modal */}
      {isColModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0c1017] p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-black">Add Column to Table</h2>
              <button onClick={() => setIsColModalOpen(false)} className="text-white/40 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleColSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-bold text-white/60">Column Name</label>
                <input
                  type="text"
                  required
                  value={colFormData.name}
                  onChange={(e) => setColFormData({ ...colFormData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="e.g. user_id"
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-white/60">Data Type</label>
                  <select
                    value={colFormData.type}
                    onChange={(e) => setColFormData({ ...colFormData, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/60 text-white focus:border-cyan-400 focus:outline-none font-mono"
                  >
                    <option value="uuid">uuid</option>
                    <option value="text">text</option>
                    <option value="integer">integer</option>
                    <option value="boolean">boolean</option>
                    <option value="timestamptz">timestamptz</option>
                    <option value="jsonb">jsonb</option>
                    <option value="numeric">numeric</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-white/60">Default Value</label>
                  <input
                    type="text"
                    value={colFormData.defaultValue}
                    onChange={(e) => setColFormData({ ...colFormData, defaultValue: e.target.value })}
                    placeholder="e.g. NOW(), 'active'"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:border-cyan-400 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={colFormData.isPrimaryKey}
                    onChange={(e) => setColFormData({ ...colFormData, isPrimaryKey: e.target.checked })}
                    className="rounded border-white/20 bg-black/60 text-cyan-400"
                  />
                  <span>Primary Key</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={colFormData.isNullable}
                    onChange={(e) => setColFormData({ ...colFormData, isNullable: e.target.checked })}
                    className="rounded border-white/20 bg-black/60 text-cyan-400"
                  />
                  <span>Nullable</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={colFormData.isUnique}
                    onChange={(e) => setColFormData({ ...colFormData, isUnique: e.target.checked })}
                    className="rounded border-white/20 bg-black/60 text-cyan-400"
                  />
                  <span>Unique</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={colFormData.hasFK}
                    onChange={(e) => setColFormData({ ...colFormData, hasFK: e.target.checked })}
                    className="rounded border-white/20 bg-black/60 text-cyan-400"
                  />
                  <span>Foreign Key</span>
                </label>
              </div>

              {colFormData.hasFK && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                  <div>
                    <label className="block mb-1 font-bold text-white/60">Target Table</label>
                    <select
                      value={colFormData.targetTable}
                      onChange={(e) => setColFormData({ ...colFormData, targetTable: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/60 text-white focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="">Select Target</option>
                      {tables.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 font-bold text-white/60">Target Column</label>
                    <input
                      type="text"
                      value={colFormData.targetColumn}
                      onChange={(e) => setColFormData({ ...colFormData, targetColumn: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:border-cyan-400 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsColModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 text-xs font-black text-[#05070a] hover:bg-cyan-300 transition-all"
                >
                  Add Column
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
