import { CheckCircle2, Circle, Clock, Plus } from 'lucide-react';

const tasks = [
  { title: 'Design launch checklist', meta: 'Due today', done: false },
  { title: 'Connect Supabase tables', meta: 'In progress', done: false },
  { title: 'Publish preview build', meta: 'Completed', done: true },
];

export function TodoTemplate({ title }: { title: string }) {
  return (
    <main className="min-h-full bg-[#05070a] p-6 text-white">
      <section className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Task Workspace</p>
          <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-tight">{title}</h1>
              <p className="mt-2 max-w-xl text-sm text-white/55">An AI-generated task command center with priorities, due dates, and clean execution lanes.</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black text-[#05070a]">
              <Plus className="h-4 w-4" />
              New Task
            </button>
          </div>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {['12 Active', '4 Due Today', '92% Complete'].map((stat) => (
            <article key={stat} className="rounded-2xl border border-cyan-400/20 bg-white/[0.035] p-5">
              <strong className="text-3xl font-black">{stat.split(' ')[0]}</strong>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.22em] text-white/40">{stat.split(' ').slice(1).join(' ')}</p>
            </article>
          ))}
        </div>
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white/60">
            <Clock className="h-4 w-4 text-cyan-300" />
            Today&apos;s queue
          </div>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.title} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.035] p-4">
                {task.done ? <CheckCircle2 className="h-5 w-5 text-cyan-300" /> : <Circle className="h-5 w-5 text-white/25" />}
                <div>
                  <p className="font-bold">{task.title}</p>
                  <p className="text-xs text-white/40">{task.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
