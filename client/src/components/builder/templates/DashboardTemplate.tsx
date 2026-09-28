'use client';

import { useState, useMemo } from 'react';
import {
  Activity,
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

type TimeRange = '7D' | '30D' | '90D' | '1Y';

interface MetricItem {
  id: string;
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  sparkline: number[];
}

interface ActivityLog {
  id: string;
  user: string;
  action: string;
  amount: string;
  time: string;
  status: 'completed' | 'pending' | 'failed';
}

const timeRangeData: Record<TimeRange, { volume: number[]; revenue: string; users: string; uptime: string }> = {
  '7D': { volume: [42, 64, 52, 80, 72, 96, 88], revenue: '$24.5K', users: '4.2K', uptime: '99.99%' },
  '30D': { volume: [35, 48, 62, 75, 84, 91, 105, 98, 112, 120, 115, 134], revenue: '$98.4K', users: '18.4K', uptime: '99.98%' },
  '90D': { volume: [20, 35, 50, 65, 80, 95, 110, 130, 145, 160, 175, 190], revenue: '$284.1K', users: '52.1K', uptime: '99.95%' },
  '1Y': { volume: [15, 30, 45, 70, 90, 120, 150, 180, 220, 260, 310, 380], revenue: '$1.12M', users: '194K', uptime: '99.92%' },
};

const initialLogs: ActivityLog[] = [
  { id: '1', user: 'Sophia Chen', action: 'Enterprise Subscription Upgrade', amount: '+$2,400', time: '5 mins ago', status: 'completed' },
  { id: '2', user: 'Alex Rivera', action: 'API Credit Pack Purchase', amount: '+$450', time: '18 mins ago', status: 'completed' },
  { id: '3', user: 'Marcus Vance', action: 'Team License Renewal', amount: '+$1,200', time: '1 hour ago', status: 'pending' },
  { id: '4', user: 'Elena Rostova', action: 'Failed Invoice Payment', amount: '$0', time: '2 hours ago', status: 'failed' },
  { id: '5', user: 'David Kim', action: 'Pro Tier Subscription', amount: '+$299', time: '3 hours ago', status: 'completed' },
];

export function DashboardTemplate({ title }: { title: string }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30D');
  const [activeMetric, setActiveMetric] = useState<'volume' | 'conversions' | 'latency'>('volume');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const currentData = timeRangeData[timeRange];

  const metrics: MetricItem[] = useMemo(
    () => [
      { id: 'm1', label: 'Total Revenue', value: currentData.revenue, change: '+14.2%', isPositive: true, sparkline: [40, 55, 70, 85, 95] },
      { id: 'm2', label: 'Active Users', value: currentData.users, change: '+8.7%', isPositive: true, sparkline: [30, 40, 45, 60, 75] },
      { id: 'm3', label: 'System Uptime', value: currentData.uptime, change: '0.01%', isPositive: true, sparkline: [99, 99, 100, 99, 100] },
      { id: 'm4', label: 'Avg Latency', value: '42ms', change: '-4.1%', isPositive: true, sparkline: [60, 52, 48, 44, 42] },
    ],
    [currentData]
  );

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [logs, searchQuery, statusFilter]);

  const handleExport = () => {
    toast.success(`Dashboard report exported for timeframe ${timeRange}`);
  };

  const handleRefresh = () => {
    toast.info('Refreshing live operational metrics...');
    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        user: 'System Bot',
        action: 'Automated Health Check & Sync',
        amount: '+$0',
        time: 'Just now',
        status: 'completed',
      },
      ...prev,
    ]);
  };

  return (
    <main className="min-h-full bg-[#05070a] p-6 text-white font-sans">
      <section className="mx-auto max-w-6xl space-y-6">
        {/* Header Banner */}
        <header className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.28em] text-cyan-300 mb-3">
                Analytics Command OS
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl text-white">{title}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
                Executive KPIs, live operational signals, and interactive telemetry visualization.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-white/10 bg-black/40 p-1">
                {(['7D', '30D', '90D', '1Y'] as TimeRange[]).map((tr) => (
                  <button
                    key={tr}
                    onClick={() => setTimeRange(tr)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      timeRange === tr
                        ? 'bg-cyan-400 text-[#05070a] shadow-[0_0_12px_rgba(0,243,255,0.4)]'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {tr}
                  </button>
                ))}
              </div>

              <button
                onClick={handleRefresh}
                className="p-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white/70 hover:text-cyan-300 hover:border-cyan-400/30 transition-all active:scale-95"
                title="Refresh metrics"
              >
                <RefreshCw className="h-4 w-4" />
              </button>

              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-black text-[#05070a] hover:bg-cyan-300 transition-all active:scale-95 shadow-[0_0_20px_rgba(0,243,255,0.3)]"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </header>

        {/* Live KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          {metrics.map((m) => (
            <article
              key={m.id}
              className="group relative rounded-2xl border border-cyan-400/20 bg-white/[0.035] p-5 transition-all hover:border-cyan-400/50 hover:bg-white/[0.05]"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/40">{m.label}</p>
                <span
                  className={`flex items-center text-xs font-bold ${
                    m.isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {m.isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  {m.change}
                </span>
              </div>
              <strong className="mt-3 block text-3xl font-black text-white">{m.value}</strong>
              <p className="mt-1 text-[11px] text-white/35">Compared to previous period</p>
            </article>
          ))}
        </div>

        {/* Main Chart Section */}
        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                <BarChart3 className="h-5 w-5" />
                <span>Volume Telemetry ({timeRange})</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setActiveMetric('volume')}
                  className={`px-3 py-1 rounded-lg border transition-all ${
                    activeMetric === 'volume'
                      ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
                      : 'border-white/5 bg-white/[0.02] text-white/40'
                  }`}
                >
                  Requests
                </button>
                <button
                  onClick={() => setActiveMetric('conversions')}
                  className={`px-3 py-1 rounded-lg border transition-all ${
                    activeMetric === 'conversions'
                      ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
                      : 'border-white/5 bg-white/[0.02] text-white/40'
                  }`}
                >
                  Conversions
                </button>
              </div>
            </div>

            {/* Interactive Bar Chart Visual */}
            <div className="relative">
              <div className="flex h-72 items-end gap-2 sm:gap-3 rounded-xl bg-black/40 p-6 border border-white/5">
                {currentData.volume.map((val, index) => {
                  const maxVal = Math.max(...currentData.volume);
                  const heightPercent = Math.round((val / maxVal) * 100);
                  const isHovered = hoveredBarIndex === index;

                  return (
                    <div
                      key={index}
                      className="group relative flex-1 h-full flex items-end cursor-pointer"
                      onMouseEnter={() => setHoveredBarIndex(index)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                    >
                      {/* Bar */}
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          isHovered
                            ? 'bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.8)] scale-y-105'
                            : 'bg-cyan-400/70 hover:bg-cyan-400'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />

                      {/* Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 rounded-lg border border-cyan-400/30 bg-[#0f131c] px-3 py-1.5 text-center text-xs font-bold text-cyan-200 shadow-2xl whitespace-nowrap">
                          Interval #{index + 1}: <span className="text-white font-black">{val * 10} units</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex justify-between text-[11px] text-white/30 px-2 font-mono">
                <span>Start Period</span>
                <span>Mid Point</span>
                <span>Current Peak ({currentData.volume[currentData.volume.length - 1] * 10} ops/sec)</span>
              </div>
            </div>
          </div>

          {/* AI Insights & Pulse */}
          <aside className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-xl">
            <div>
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider mb-4">
                <TrendingUp className="h-5 w-5" />
                AI Pulse Detection
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-xs text-white/70 leading-relaxed">
                  <span className="font-bold text-cyan-300 block mb-1">Elevated Traffic Detected</span>
                  AI detected a +24.8% conversion surge originating from interactive template-backed project workspaces today.
                </div>

                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-xs text-white/70 leading-relaxed">
                  <span className="font-bold text-emerald-400 block mb-1">System Health Excellent</span>
                  All API gateways and database clusters are performing within standard 42ms p99 latency thresholds.
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between text-xs text-white/40">
              <span className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400 animate-pulse" />
                Live Telemetry Feed
              </span>
              <span className="font-mono text-[10px]">SYNC ACTIVE</span>
            </div>
          </aside>
        </section>

        {/* Activity & Audit Logs Table */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-xl space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-300" />
              Live Audit & Transaction Stream
            </h2>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-white/30" />
                <input
                  type="text"
                  placeholder="Filter activity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1 rounded-xl bg-black/40 p-1 border border-white/10">
                {(['all', 'completed', 'pending', 'failed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize transition-colors ${
                      statusFilter === st
                        ? 'bg-cyan-400 text-[#05070a]'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/40 uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action / Event</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-white/30">
                      No transaction logs matching selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">{log.user}</td>
                      <td className="py-3.5 px-4 text-white/70">{log.action}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">{log.amount}</td>
                      <td className="py-3.5 px-4 text-white/40">{log.time}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            log.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : log.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {log.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                          {log.status === 'pending' && <Clock className="h-3 w-3" />}
                          {log.status === 'failed' && <AlertTriangle className="h-3 w-3" />}
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
