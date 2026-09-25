'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { GlassCard } from '@/components/GlassCard';
import { AlertCircle, Loader2, ShieldCheck, User } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
}

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === 'admin';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
        isAdmin
          ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-400'
          : 'border-white/10 bg-white/[0.04] text-white/40'
      }`}
    >
      {isAdmin ? <ShieldCheck className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
      {role}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadUsers() {
      try {
        const res = await fetch('/api/admin/users');
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          setUsers(json.data.users as AdminUser[]);
          setTotal(json.data.total as number);
        } else {
          setError(json.error ?? 'Failed to load users');
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Network error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadUsers();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Users</h1>
          <p className="mt-1 text-xs text-white/40">All registered Clerk accounts.</p>
        </div>
        {!loading && !error && (
          <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-black text-white/60">
            {total.toLocaleString()} total
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex h-48 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            <p className="text-xs font-bold uppercase tracking-widest text-white/40">
              Loading users…
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <GlassCard className="border-rose-400/20 bg-rose-400/5 p-6" hover={false}>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
            <div>
              <p className="text-sm font-black text-white">Failed to load users</p>
              <p className="mt-0.5 text-xs text-white/50">{error}</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Table */}
      {!loading && !error && (
        <GlassCard className="overflow-hidden p-0 border-white/10" hover={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="px-4 py-3 text-left font-black uppercase tracking-widest text-white/30">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-widest text-white/30">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-widest text-white/30">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-widest text-white/30">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-white/30">
                      No users found.
                    </td>
                  </tr>
                )}
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="transition-colors hover:bg-white/[0.025]"
                  >
                    <td className="px-4 py-3 font-semibold text-white">
                      {u.name ?? <span className="text-white/30 italic">—</span>}
                    </td>
                    <td className="px-4 py-3 text-white/60">
                      {u.email ?? <span className="text-white/30 italic">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={String(u.role)} />
                    </td>
                    <td className="px-4 py-3 text-white/40">
                      {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
