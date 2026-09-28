'use client';

import { useState, useMemo } from 'react';
import {
  DollarSign,
  Users,
  Plus,
  Search,
  Building2,
  TrendingUp,
  ArrowRight,
  Trash2,
  CheckCircle,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';

export type StageName = 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed Won';

export interface Deal {
  id: string;
  company: string;
  contact: string;
  value: number;
  stage: StageName;
  probability: number;
}

const initialDeals: Deal[] = [
  { id: 'd1', company: 'Acme Studio', contact: 'Sarah Jenkins', value: 24000, stage: 'Qualified', probability: 30 },
  { id: 'd2', company: 'NEXUS Robotics', contact: 'Liam Vance', value: 85000, stage: 'Proposal', probability: 60 },
  { id: 'd3', company: 'Hyperion Cloud', contact: 'Elena Rostova', value: 120000, stage: 'Negotiation', probability: 80 },
  { id: 'd4', company: 'Starlight Tech', contact: 'Marcus Brody', value: 45000, stage: 'Closed Won', probability: 100 },
  { id: 'd5', company: 'Vanguard Systems', contact: 'Kira Nerys', value: 62000, stage: 'Proposal', probability: 60 },
];

const stagesList: StageName[] = ['Qualified', 'Proposal', 'Negotiation', 'Closed Won'];

export function CRMTemplate({ title }: { title: string }) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingDeal, setIsAddingDeal] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newValue, setNewValue] = useState('35000');
  const [newStage, setNewStage] = useState<StageName>('Qualified');

  const filteredDeals = useMemo(() => {
    return deals.filter(
      (d) =>
        d.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.contact.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [deals, searchQuery]);

  const totalWeightedPipeline = useMemo(() => {
    return deals.reduce((acc, d) => acc + d.value * (d.probability / 100), 0);
  }, [deals]);

  const totalRawPipeline = useMemo(() => {
    return deals.reduce((acc, d) => acc + d.value, 0);
  }, [deals]);

  const activeAccountsCount = useMemo(() => {
    return new Set(deals.map((d) => d.company)).size;
  }, [deals]);

  const handleAddDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newContact.trim()) return;

    const valNum = parseInt(newValue, 10) || 10000;
    const probabilityMap: Record<StageName, number> = {
      Qualified: 30,
      Proposal: 60,
      Negotiation: 80,
      'Closed Won': 100,
    };

    const newDealItem: Deal = {
      id: `deal-${Date.now()}`,
      company: newCompany.trim(),
      contact: newContact.trim(),
      value: valNum,
      stage: newStage,
      probability: probabilityMap[newStage],
    };

    setDeals((prev) => [newDealItem, ...prev]);
    setNewCompany('');
    setNewContact('');
    setIsAddingDeal(false);
    toast.success(`Deal added to ${newStage} stage`);
  };

  const handleMoveStage = (dealId: string, currentStage: StageName) => {
    const nextIndex = (stagesList.indexOf(currentStage) + 1) % stagesList.length;
    const nextStage = stagesList[nextIndex];
    const probabilityMap: Record<StageName, number> = {
      Qualified: 30,
      Proposal: 60,
      Negotiation: 80,
      'Closed Won': 100,
    };

    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId ? { ...d, stage: nextStage, probability: probabilityMap[nextStage] } : d
      )
    );
    toast.info(`Moved deal to ${nextStage}`);
  };

  const handleDeleteDeal = (dealId: string) => {
    setDeals((prev) => prev.filter((d) => d.id !== dealId));
    toast.success('Deal removed from pipeline');
  };

  return (
    <main className="min-h-full bg-[#05070a] p-6 text-white font-sans">
      <section className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.28em] text-cyan-300 mb-3">
                Revenue Intelligence OS
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl text-white">{title}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
                Interactive sales pipeline with drag-like stage progression, weighted revenue forecasts, and account tracking.
              </p>
            </div>

            <button
              onClick={() => setIsAddingDeal((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-xs font-black uppercase tracking-wider text-[#05070a] hover:bg-cyan-300 transition-all active:scale-95 shadow-[0_0_20px_rgba(0,243,255,0.3)]"
            >
              <Plus className="h-4 w-4" />
              {isAddingDeal ? 'Close Form' : 'New Deal Opportunity'}
            </button>
          </div>

          {/* Add Deal Form */}
          {isAddingDeal && (
            <form onSubmit={handleAddDeal} className="mt-6 border-t border-white/10 pt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <input
                  type="text"
                  placeholder="Company name (e.g. Acme Corp)"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  required
                  className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Contact name (e.g. Jane Doe)"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  required
                  className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Deal Value ($)"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  required
                  className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                />
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value as StageName)}
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                >
                  {stagesList.map((st) => (
                    <option key={st} value={st} className="bg-[#0f131c]">
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-400 px-5 py-2 text-xs font-black text-[#05070a] hover:bg-cyan-300 transition-all"
                >
                  Save Deal to Pipeline
                </button>
              </div>
            </form>
          )}
        </header>

        {/* Live Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <article className="rounded-2xl border border-cyan-400/20 bg-white/[0.035] p-5">
            <div className="flex items-center gap-2 text-cyan-300 mb-2">
              <DollarSign className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/40">Weighted Pipeline</span>
            </div>
            <strong className="block text-3xl font-black text-white">${Math.round(totalWeightedPipeline).toLocaleString()}</strong>
            <p className="mt-1 text-xs text-cyan-200/70">Probability weighted</p>
          </article>

          <article className="rounded-2xl border border-emerald-400/20 bg-white/[0.035] p-5">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/40">Gross Pipeline</span>
            </div>
            <strong className="block text-3xl font-black text-emerald-400">${totalRawPipeline.toLocaleString()}</strong>
            <p className="mt-1 text-xs text-emerald-200/70">Total unweighted value</p>
          </article>

          <article className="rounded-2xl border border-amber-400/20 bg-white/[0.035] p-5">
            <div className="flex items-center gap-2 text-amber-300 mb-2">
              <Users className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/40">Active Accounts</span>
            </div>
            <strong className="block text-3xl font-black text-amber-300">{activeAccountsCount}</strong>
            <p className="mt-1 text-xs text-amber-200/70">Unique target clients</p>
          </article>

          <article className="rounded-2xl border border-purple-400/20 bg-white/[0.035] p-5">
            <div className="flex items-center gap-2 text-purple-300 mb-2">
              <Briefcase className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/40">Open Opportunities</span>
            </div>
            <strong className="block text-3xl font-black text-purple-300">{deals.length}</strong>
            <p className="mt-1 text-xs text-purple-200/70">Deals in motion</p>
          </article>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Search companies or contacts…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <span className="text-xs text-white/40 font-mono hidden md:inline">Click arrow icon to advance deal stage</span>
        </div>

        {/* Kanban Stage Pipeline Board */}
        <section className="grid gap-4 md:grid-cols-4">
          {stagesList.map((stage) => {
            const stageDeals = filteredDeals.filter((d) => d.stage === stage);
            const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0);

            return (
              <div key={stage} className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4 min-h-[420px]">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">{stage}</h2>
                    <p className="text-[10px] text-white/40 font-mono mt-0.5">${stageTotal.toLocaleString()}</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/70">
                    {stageDeals.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {stageDeals.length === 0 ? (
                    <div className="py-10 text-center text-xs text-white/20 border border-dashed border-white/5 rounded-xl">
                      No deals in {stage}
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="group relative rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-all hover:border-cyan-400/40 hover:bg-white/[0.06] shadow-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-cyan-300 shrink-0" />
                            <h3 className="text-sm font-bold text-white leading-tight">{deal.company}</h3>
                          </div>
                          <button
                            onClick={() => handleDeleteDeal(deal.id)}
                            className="text-white/20 hover:text-rose-400 p-1 transition-colors"
                            title="Delete deal"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <p className="mt-1 text-xs text-white/50">{deal.contact}</p>

                        <div className="mt-3 flex items-end justify-between border-t border-white/5 pt-2.5">
                          <div>
                            <span className="text-xs font-black text-cyan-300 font-mono">
                              ${deal.value.toLocaleString()}
                            </span>
                            <span className="block text-[10px] text-white/30">{deal.probability}% win probability</span>
                          </div>

                          <button
                            onClick={() => handleMoveStage(deal.id, deal.stage)}
                            className="inline-flex items-center gap-1 rounded-lg bg-cyan-400/10 px-2.5 py-1 text-[10px] font-bold text-cyan-300 hover:bg-cyan-400 hover:text-[#05070a] transition-all"
                            title="Advance stage"
                          >
                            Advance
                            {deal.stage === 'Closed Won' ? <CheckCircle className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </section>
    </main>
  );
}
