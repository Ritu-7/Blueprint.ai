'use client';

import { useState, useEffect } from 'react';
import { useProject } from '@/components/workspace/ProjectContext';
import type { FullBlueprint } from '@/validators/blueprintSchema';
import { GlassCard } from '@/components/GlassCard';
import { CodeEditor } from '@/components/builder/CodeEditor';
import { ReadmeViewer } from '@/components/builder/ReadmeViewer';
import {
  FileCode2,
  Sparkles,
  RefreshCw,
  History,
  Layers,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Workflow,
  ListTodo,
  Database,
  Terminal,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectBlueprintPage() {
  const { project, refreshProject } = useProject();
  const [activeTab, setActiveTab] = useState<'blueprint' | 'schema' | 'api' | 'readme'>('blueprint');
  const [blueprintData, setBlueprintData] = useState<FullBlueprint | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [versions, setVersions] = useState<Array<{ id: string; version_number: number; prompt: string; created_at: string }>>([]);

  // Load structured blueprint data via API (never call AIService directly from the browser)
  useEffect(() => {
    if (!project?.prompt) return;
    let cancelled = false;
    async function loadBlueprint() {
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // No projectId — preview only, does not save a new version
          body: JSON.stringify({ prompt: project!.prompt }),
        });
        const json = await res.json();
        if (!cancelled && json.success && json.data) {
          setBlueprintData(json.data as FullBlueprint);
        }
      } catch {
        // Silently ignore — blueprint will stay null until next retry
      }
    }
    loadBlueprint();
    return () => { cancelled = true; };
  }, [project]);

  // Load version history
  useEffect(() => {
    async function loadVersions() {
      if (project?.id) {
        try {
          const res = await fetch(`/api/blueprints/versions?projectId=${project.id}`);
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setVersions(data.data);
          }
        } catch {
          // Fallback empty versions
        }
      }
    }
    loadVersions();
  }, [project]);

  const handleRegenerate = async () => {
    if (!project?.prompt) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/generate?projectId=${project.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: project.prompt }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Blueprint regenerated & new version snapshotted!');
        await refreshProject();
      }
    } catch {
      toast.error('Regeneration failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Top Header & Version Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <FileCode2 className="h-6 w-6 text-cyan-400" />
            AI Blueprint Model
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Structured 12-section technical blueprint for {project?.name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Version Selector */}
          {versions.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-xs font-bold text-white">
              <History className="h-4 w-4 text-cyan-400" />
              <span>v{versions[0]?.version_number || 1}.0</span>
            </div>
          )}

          <button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-black text-[#05070a] hover:bg-cyan-300 transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate Blueprint
          </button>
        </div>
      </div>

      {/* Mode Sub-Tabs */}
      <div className="flex border-b border-white/10 space-x-2">
        {[
          { id: 'blueprint', label: '12-Section Architecture', icon: Layers },
          { id: 'schema', label: 'PostgreSQL Schema', icon: Database },
          { id: 'api', label: 'API Specifications', icon: Terminal },
          { id: 'readme', label: 'README Docs', icon: FileCode2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-cyan-400 text-cyan-300 bg-cyan-400/10'
                : 'border-transparent text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main View Area */}
      {activeTab === 'blueprint' && blueprintData && (
        <div className="space-y-8">
          {/* 1. Overview */}
          <GlassCard className="p-6 border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
              <Sparkles className="h-4 w-4" /> 1. Project Overview
            </div>
            <h2 className="text-2xl font-black text-white">{blueprintData.overview.title}</h2>
            <p className="text-xs font-bold text-cyan-200/80">{blueprintData.overview.tagline}</p>
            <p className="text-xs leading-6 text-white/60">{blueprintData.overview.description}</p>
          </GlassCard>

          {/* 2. Problem Statement */}
          <GlassCard className="p-6 border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
              <AlertTriangle className="h-4 w-4" /> 2. Problem Statement & Pain Points
            </div>
            <p className="text-xs leading-6 text-white/80">{blueprintData.problemStatement.coreProblem}</p>
            <div className="grid gap-2 sm:grid-cols-3 pt-2">
              {blueprintData.problemStatement.painPoints.map((pt, i) => (
                <div key={i} className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-xs text-rose-200/90">
                  • {pt}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* 3 & 4. Target Users & User Roles */}
          <div className="grid gap-6 md:grid-cols-2">
            <GlassCard className="p-6 border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
                <Users className="h-4 w-4" /> 3. Target Users
              </div>
              <ul className="space-y-2 text-xs text-white/70">
                {blueprintData.targetUsers.map((usr, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400" /> {usr}
                  </li>
                ))}
              </ul>
            </GlassCard>

            <GlassCard className="p-6 border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
                <ShieldCheck className="h-4 w-4" /> 4. User Roles & Permissions
              </div>
              <div className="space-y-3">
                {blueprintData.userRoles.map((role, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <h3 className="text-xs font-black text-white">{role.role}</h3>
                    <p className="text-[11px] text-white/50 mt-1">{role.description}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* 5. Core Features */}
          <GlassCard className="p-6 border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
              <Layers className="h-4 w-4" /> 5. Core Features
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {blueprintData.coreFeatures.map((feat, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-white">{feat.name}</h3>
                    <span className="rounded-full bg-cyan-400/10 border border-cyan-400/30 px-2.5 py-0.5 text-[9px] font-black uppercase text-cyan-300">
                      {feat.priority}
                    </span>
                  </div>
                  <p className="text-[11px] leading-5 text-white/60">{feat.description}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* 6 & 7. Functional & Non-Functional Requirements */}
          <div className="grid gap-6 md:grid-cols-2">
            <GlassCard className="p-6 border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
                <ListTodo className="h-4 w-4" /> 6. Functional Requirements
              </div>
              <div className="space-y-2">
                {blueprintData.functionalRequirements.map((fr) => (
                  <div key={fr.id} className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs">
                    <span className="font-mono font-bold text-cyan-400">{fr.id}</span>
                    <p className="text-white/70">{fr.description}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6 border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
                <ShieldCheck className="h-4 w-4" /> 7. Non-Functional Requirements
              </div>
              <div className="space-y-2">
                {blueprintData.nonFunctionalRequirements.map((nfr, i) => (
                  <div key={i} className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs">
                    <span className="font-bold text-cyan-300">{nfr.category}: </span>
                    <span className="text-white/70">{nfr.requirement}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* 8. User Stories */}
          <GlassCard className="p-6 border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
              <Users className="h-4 w-4" /> 8. User Stories
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {blueprintData.userStories.map((us, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs leading-relaxed text-white/80">
                  <span className="text-cyan-300 font-bold">As a {us.asA}</span>, I want to {us.iWantTo}, <span className="text-cyan-200">so that {us.soThat}</span>.
                </div>
              ))}
            </div>
          </GlassCard>

          {/* 9. Main Workflows */}
          <GlassCard className="p-6 border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
              <Workflow className="h-4 w-4" /> 9. Main Workflows
            </div>
            {blueprintData.mainWorkflows.map((wf, i) => (
              <div key={i} className="space-y-2">
                <h3 className="text-xs font-black text-white">{wf.name}</h3>
                <div className="grid gap-2 sm:grid-cols-4">
                  {wf.steps.map((step, sIdx) => (
                    <div key={sIdx} className="rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] text-white/70">
                      <span className="font-mono text-cyan-400 font-bold block mb-1">Step {sIdx + 1}</span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </GlassCard>

          {/* 10. Recommended Tech Stack */}
          <GlassCard className="p-6 border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
              <Cpu className="h-4 w-4" /> 10. Recommended Technology Stack
            </div>
            <div className="grid gap-4 sm:grid-cols-5 text-xs">
              {Object.entries(blueprintData.techStack).map(([layer, techs]) => (
                <div key={layer} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
                  <h3 className="font-black uppercase tracking-wider text-cyan-300 text-[10px]">{layer}</h3>
                  <div className="space-y-1 text-white/70">
                    {techs.map((t) => (
                      <div key={t} className="truncate">• {t}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* 11 & 12. Phases & Risks */}
          <div className="grid gap-6 md:grid-cols-2">
            <GlassCard className="p-6 border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
                <Workflow className="h-4 w-4" /> 11. Development Phases
              </div>
              <div className="space-y-3">
                {blueprintData.developmentPhases.map((dp, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs space-y-1">
                    <span className="font-bold text-cyan-300 uppercase text-[10px]">{dp.phase}</span>
                    <h4 className="font-black text-white">{dp.title}</h4>
                    <p className="text-white/50 text-[11px]">Deliverables: {dp.deliverables.join(', ')}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6 border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
                <AlertTriangle className="h-4 w-4" /> 12. Potential Risks & Mitigation
              </div>
              <div className="space-y-3">
                {blueprintData.potentialRisks.map((rk, i) => (
                  <div key={i} className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-300">{rk.risk}</span>
                      <span className="text-[9px] font-black uppercase text-rose-400">Impact: {rk.impact}</span>
                    </div>
                    <p className="text-white/60 text-[11px]">Mitigation: {rk.mitigation}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {activeTab === 'schema' && (
        <div className="min-h-[500px] rounded-2xl border border-white/10 bg-[#070a0f] overflow-hidden">
          <CodeEditor title="supabase/schema.sql" fallbackContent={project?.schema_code || '-- PostgreSQL Schema'} />
        </div>
      )}

      {activeTab === 'api' && (
        <div className="min-h-[500px] rounded-2xl border border-white/10 bg-[#070a0f] overflow-hidden">
          <CodeEditor title="docs/api.md" fallbackContent={project?.api_code || 'GET /api/health'} />
        </div>
      )}

      {activeTab === 'readme' && (
        <div className="min-h-[500px] rounded-2xl border border-white/10 bg-[#070a0f] p-4">
          <ReadmeViewer content={project?.readme_code || `# ${project?.name}`} />
        </div>
      )}
    </div>
  );
}
