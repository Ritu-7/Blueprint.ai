export type TemplateKind = 'todo' | 'ecommerce' | 'dashboard' | 'portfolio' | 'chat' | 'crm';

export type ProjectFile = {
  path: string;
  name: string;
  language: 'tsx' | 'ts' | 'css' | 'sql' | 'json' | 'md' | 'js';
  content: string;
};

export type GeneratedProject = {
  id?: string;
  name: string;
  description: string;
  kind: TemplateKind;
  preview: string;
  uiCode: string;
  schema: string;
  api: string;
  files: ProjectFile[];
};

const kindLabels: Record<TemplateKind, string> = {
  todo: 'TaskFlow OS',
  ecommerce: 'Commerce Grid',
  dashboard: 'MetricOps Dashboard',
  portfolio: 'Signal Portfolio',
  chat: 'Relay Chat',
  crm: 'Pipeline CRM',
};

type WeightedKeyword = { pattern: RegExp; weight: number };

const kindKeywords: Record<TemplateKind, WeightedKeyword[]> = {
  todo: [
    { pattern: /\btodo\b/, weight: 3 },
    { pattern: /\bto-do\b/, weight: 3 },
    { pattern: /\btask\b/, weight: 3 },
    { pattern: /\btasks\b/, weight: 3 },
    { pattern: /\bchecklist\b/, weight: 3 },
    { pattern: /\breminder\b/, weight: 2 },
    { pattern: /\breminders\b/, weight: 2 },
    { pattern: /\btrack(ing|er)?\b/, weight: 1 },
    { pattern: /\bbacklog\b/, weight: 2 },
    { pattern: /\bkanban\b/, weight: 2 },
    { pattern: /\bplanner\b/, weight: 2 },
  ],
  ecommerce: [
    { pattern: /\becommerce\b/, weight: 3 },
    { pattern: /\be-commerce\b/, weight: 3 },
    { pattern: /\bcheckout\b/, weight: 3 },
    { pattern: /\bshopping cart\b/, weight: 3 },
    { pattern: /\bstorefront\b/, weight: 3 },
    { pattern: /\bonline store\b/, weight: 3 },
    { pattern: /\bshop\b/, weight: 2 },
    { pattern: /\bcart\b/, weight: 2 },
    { pattern: /\bsell\b/, weight: 2 },
    { pattern: /\bmerchandi[sz](ing|e)\b/, weight: 2 },
    { pattern: /\bproduct\b/, weight: 1 },
    { pattern: /\bproducts\b/, weight: 1 },
    { pattern: /\bstore\b/, weight: 1 },
    { pattern: /\binventory\b/, weight: 1 },
  ],
  dashboard: [
    { pattern: /\bdashboard\b/, weight: 3 },
    { pattern: /\banalytics\b/, weight: 3 },
    { pattern: /\bkpi\b/, weight: 3 },
    { pattern: /\bkpis\b/, weight: 3 },
    { pattern: /\bmetric\b/, weight: 2 },
    { pattern: /\bmetrics\b/, weight: 2 },
    { pattern: /\bchart\b/, weight: 2 },
    { pattern: /\bcharts\b/, weight: 2 },
    { pattern: /\breport\b/, weight: 2 },
    { pattern: /\breports\b/, weight: 2 },
    { pattern: /\bvisuali[sz](ation|e)\b/, weight: 2 },
    { pattern: /\binsight\b/, weight: 1 },
    { pattern: /\binsights\b/, weight: 1 },
  ],
  portfolio: [
    { pattern: /\bportfolio\b/, weight: 3 },
    { pattern: /\bpersonal site\b/, weight: 3 },
    { pattern: /\bpersonal website\b/, weight: 3 },
    { pattern: /\bresume\b/, weight: 3 },
    { pattern: /\bphotographer\b/, weight: 3 },
    { pattern: /\bdesigner\b/, weight: 2 },
    { pattern: /\bcreator\b/, weight: 2 },
    { pattern: /\bshowcase\b/, weight: 2 },
    { pattern: /\bcase stud(y|ies)\b/, weight: 2 },
    { pattern: /\bfreelance\b/, weight: 2 },
  ],
  chat: [
    { pattern: /\bchat\b/, weight: 3 },
    { pattern: /\bmessaging\b/, weight: 3 },
    { pattern: /\bsupport (chat|widget|bot)\b/, weight: 3 },
    { pattern: /\bconversation\b/, weight: 2 },
    { pattern: /\bconversations\b/, weight: 2 },
    { pattern: /\binbox\b/, weight: 2 },
    { pattern: /\bmessage\b/, weight: 2 },
    { pattern: /\bmessages\b/, weight: 2 },
    { pattern: /\bchatbot\b/, weight: 3 },
    { pattern: /\blive chat\b/, weight: 3 },
    { pattern: /\bthread\b/, weight: 1 },
    { pattern: /\bthreads\b/, weight: 1 },
  ],
  crm: [
    { pattern: /\bcrm\b/, weight: 3 },
    { pattern: /\blead\b/, weight: 3 },
    { pattern: /\bleads\b/, weight: 3 },
    { pattern: /\bpipeline\b/, weight: 2 },
    { pattern: /\bsales\b/, weight: 2 },
    { pattern: /\bdeal\b/, weight: 2 },
    { pattern: /\bdeals\b/, weight: 2 },
    { pattern: /\bcustomer relationship\b/, weight: 3 },
    { pattern: /\bprospect\b/, weight: 2 },
    { pattern: /\bprospects\b/, weight: 2 },
    { pattern: /\bcustomer\b/, weight: 1 },
    { pattern: /\bcustomers\b/, weight: 1 },
  ],
};

export function detectTemplateKind(prompt: string): TemplateKind {
  const text = prompt.toLowerCase();
  const kinds = Object.keys(kindKeywords) as TemplateKind[];
  let bestKind: TemplateKind = 'todo';
  let bestScore = 0;

  for (const kind of kinds) {
    let score = 0;
    for (const { pattern, weight } of kindKeywords[kind]) {
      if (pattern.test(text)) {
        score += weight;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestKind = kind;
    }
  }

  return bestKind;
}

function titleFromPrompt(prompt: string, kind: TemplateKind) {
  const cleaned = prompt
    .replace(/^(create|build|make|generate)\s+(an?\s+)?/i, '')
    .trim()
    .replace(/[^\w\s-]/g, '');

  if (!cleaned || cleaned.length < 4) return kindLabels[kind];

  return cleaned
    .split(/\s+/)
    .slice(0, 5)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ─── Specialized Interactive Application Generator ───
function analyzePromptDomain(prompt: string, title: string) {
  const p = prompt.toLowerCase();
  const slug = slugify(title);

  let pageCode = '';

  // 1. TODO / TASK / REMOTE TEAM WORKFLOW APP
  if (p.includes('todo') || p.includes('task') || p.includes('remote') || p.includes('sprint') || p.includes('kanban') || p.includes('checklist') || p.includes('project')) {
    pageCode = `'use client';

import { useState, useMemo } from 'react';
import { Search, Sparkles, Plus, CheckCircle2, Circle, Clock, User, Filter, AlertCircle, Trash2, Calendar } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Review' | 'Completed';
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  assignee: string;
  avatar: string;
  dueDate: string;
}

const initialTasks: Task[] = [
  { id: '1', title: 'Prepare Sprint Retrospective Deck', description: 'Gather team feedback metrics and velocity points for Q3.', status: 'In Progress', priority: 'High', assignee: 'Sarah Jenkins', avatar: 'SJ', dueDate: 'Today' },
  { id: '2', title: 'Fix Auth Session Refresh Token Bug', description: 'Resolve 401 token expiry error during long-lived websocket connection.', status: 'To Do', priority: 'Urgent', assignee: 'Alex Rivera', avatar: 'AR', dueDate: 'Tomorrow' },
  { id: '3', title: 'Design System Dark Mode Audit', description: 'Review contrast ratios for WCAG AA compliance across dialog components.', status: 'Review', priority: 'Medium', assignee: 'Elena Rostova', avatar: 'ER', dueDate: 'Oct 4' },
  { id: '4', title: 'Setup PostgreSQL RLS Security Migration', description: 'Add row level security policies for tenant organization IDs.', status: 'Completed', priority: 'High', assignee: 'David Chen', avatar: 'DC', dueDate: 'Completed' },
];

export default function Page() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [titleInput, setTitleInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [priorityInput, setPriorityInput] = useState<'Urgent' | 'High' | 'Medium' | 'Low'>('High');
  const [assigneeInput, setAssigneeInput] = useState('Alex Rivera');

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'All' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'All' || t.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  const toggleTaskComplete = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'Completed' ? 'In Progress' : 'Completed' } : t));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) return;
    const newTask: Task = {
      id: String(Date.now()),
      title: titleInput.trim(),
      description: descInput.trim() || 'No additional details provided.',
      status: 'To Do',
      priority: priorityInput,
      assignee: assigneeInput,
      avatar: assigneeInput.split(' ').map(n => n[0]).join(''),
      dueDate: 'Oct 8',
    };
    setTasks([newTask, ...tasks]);
    setTitleInput('');
    setDescInput('');
    setIsModalOpen(false);
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const progressPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#05070a] text-white p-4 md:p-8 font-sans">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-6 shadow-2xl backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-cyan-300">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                Remote Team Workspace
              </div>
              <h1 className="mt-3 text-3xl md:text-4xl font-black text-white">${title}</h1>
              <p className="mt-1 text-sm text-white/60">Organize tasks, track sprint velocity, and collaborate with your product team in real time.</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-black text-black shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:bg-cyan-300 transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
              New Task
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between text-xs font-bold text-white/70 mb-2">
              <span>Sprint Completion Rate</span>
              <span className="text-cyan-300">{completedCount} of {tasks.length} Completed ({progressPercentage}%)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300" style={{ width: \`\${progressPercentage}%\` }} />
            </div>
          </div>
        </header>

        {/* Filters Bar */}
        <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 md:flex-row md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Search tasks by title or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-white/40 flex items-center gap-1"><Filter className="h-3 w-3" /> Status:</span>
            {['All', 'To Do', 'In Progress', 'Review', 'Completed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={\`rounded-lg px-3 py-1.5 text-xs font-bold transition \${
                  statusFilter === st ? 'bg-cyan-400 text-black shadow-[0_0_12px_rgba(0,243,255,0.2)]' : 'bg-white/5 text-white/50 hover:bg-white/10'
                }\`}
              >
                {st}
              </button>
            ))}
          </div>
        </section>

        {/* Tasks Grid */}
        <section className="grid gap-4 sm:grid-cols-2">
          {filteredTasks.map((t) => (
            <article key={t.id} className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-cyan-400/40 hover:bg-white/[0.045] transition flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => toggleTaskComplete(t.id)} className="mt-0.5 text-white/40 hover:text-cyan-400 transition">
                    {t.status === 'Completed' ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <Circle className="h-5 w-5" />}
                  </button>
                  <div className="flex-1">
                    <h3 className={\`text-base font-bold text-white \${t.status === 'Completed' ? 'line-through text-white/40' : ''}\`}>{t.title}</h3>
                    <p className="mt-1 text-xs text-white/60 line-clamp-2">{t.description}</p>
                  </div>
                  <button onClick={() => deleteTask(t.id)} className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-rose-400 transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/20 font-bold text-cyan-300 text-[10px]">{t.avatar}</span>
                  <span className="text-white/60 font-medium">{t.assignee}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={\`rounded-md px-2 py-0.5 text-[10px] font-bold \${
                    t.priority === 'Urgent' ? 'bg-rose-400/20 text-rose-300 border border-rose-400/30' :
                    t.priority === 'High' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-blue-400/20 text-blue-300'
                  }\`}>{t.priority}</span>
                  <span className="text-white/40 text-[11px] flex items-center gap-1"><Calendar className="h-3 w-3" /> {t.dueDate}</span>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0d14] p-6 text-white shadow-2xl">
            <h3 className="text-lg font-black">Create New Task</h3>
            <form onSubmit={handleCreateTask} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/60 mb-1">Task Title</label>
                <input type="text" required placeholder="e.g. Implement API rate limiter" value={titleInput} onChange={e => setTitleInput(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white focus:border-cyan-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/60 mb-1">Description</label>
                <textarea rows={3} placeholder="Task requirements..." value={descInput} onChange={e => setDescInput(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white focus:border-cyan-400 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/60 mb-1">Priority</label>
                  <select value={priorityInput} onChange={e => setPriorityInput(e.target.value as any)} className="w-full rounded-xl border border-white/10 bg-[#151a26] p-3 text-sm text-white focus:border-cyan-400 focus:outline-none">
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/60 mb-1">Assignee</label>
                  <select value={assigneeInput} onChange={e => setAssigneeInput(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#151a26] p-3 text-sm text-white focus:border-cyan-400 focus:outline-none">
                    <option value="Alex Rivera">Alex Rivera</option>
                    <option value="Sarah Jenkins">Sarah Jenkins</option>
                    <option value="David Chen">David Chen</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold hover:bg-white/10">Cancel</button>
                <button type="submit" className="rounded-xl bg-cyan-400 px-4 py-2 text-xs font-black text-black hover:bg-cyan-300">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
`;
  }
  // 2. RESTAURANT / FOOD / MENU APP
  else if (p.includes('recipe') || p.includes('food') || p.includes('restaurant') || p.includes('menu') || p.includes('meal') || p.includes('dish') || p.includes('cafe')) {
    pageCode = `'use client';

import { useState } from 'react';
import { Search, Sparkles, Plus, Minus, ShoppingBag, Star, Clock, Flame, Check, Utensils } from 'lucide-react';

interface Dish {
  id: string;
  name: string;
  description: string;
  category: 'Specials' | 'Appetizers' | 'Mains' | 'Desserts' | 'Drinks';
  price: number;
  calories: string;
  prepTime: string;
  rating: number;
  badge: string;
}

const dishes: Dish[] = [
  { id: '1', name: 'Truffle Mushroom Fettuccine', description: 'Handcrafted ribbon pasta with wild porcini mushrooms, black truffle butter, and aged parmesan.', category: 'Specials', price: 24.50, calories: '680 kcal', prepTime: '20 mins', rating: 4.9, badge: 'Chef Special' },
  { id: '2', name: 'Artisanal Wood-Fired Margherita', description: 'San Marzano tomato sauce, fresh buffalo mozzarella, organic basil, and extra virgin olive oil.', category: 'Mains', price: 18.00, calories: '540 kcal', prepTime: '15 mins', rating: 4.8, badge: 'Popular' },
  { id: '3', name: 'Avocado & Pacific Salmon Tartare', description: 'Sustainably caught wild salmon, Hass avocado, yuzu dressing, and crispy lotus root chips.', category: 'Appetizers', price: 16.50, calories: '320 kcal', prepTime: '10 mins', rating: 4.9, badge: 'Fresh' },
  { id: '4', name: 'Dark Chocolate Lava Cake', description: 'Warm Valrhona chocolate cake with molten center, served with Madagascar vanilla bean gelato.', category: 'Desserts', price: 12.00, calories: '410 kcal', prepTime: '12 mins', rating: 5.0, badge: 'Dessert' },
];

export default function Page() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [cart, setCart] = useState<{ dish: Dish; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const addToCart = (dish: Dish) => {
    const existing = cart.find(item => item.dish.id === dish.id);
    if (existing) {
      setCart(cart.map(item => item.dish.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { dish, quantity: 1 }]);
    }
  };

  const updateQuantity = (dishId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.dish.id === dishId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as any);
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.dish.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const filteredDishes = activeCategory === 'All' ? dishes : dishes.filter(d => d.category === activeCategory);

  return (
    <main className="min-h-screen bg-[#05070a] text-white p-4 md:p-8 font-sans">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/10 via-white/[0.02] to-white/[0.01] p-6 backdrop-blur-sm shadow-2xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase text-amber-300">
              <Utensils className="h-3.5 w-3.5 text-amber-400" />
              Gourmet Kitchen & Dining
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-black text-white">${title}</h1>
            <p className="mt-1 text-sm text-white/60">Explore artisanal dishes, customize your meal order, and reserve tables live.</p>
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-black text-black shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:bg-amber-300 transition"
          >
            <ShoppingBag className="h-4 w-4" />
            Order Cart ({cart.reduce((a, b) => a + b.quantity, 0)})
          </button>
        </header>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['All', 'Specials', 'Appetizers', 'Mains', 'Desserts'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={\`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap \${
                activeCategory === cat ? 'bg-amber-400 text-black font-black' : 'bg-white/5 text-white/60 hover:bg-white/10'
              }\`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dishes Grid */}
        <section className="grid gap-4 sm:grid-cols-2">
          {filteredDishes.map(d => (
            <article key={d.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-amber-400/40 transition flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-md border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">{d.badge}</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-400"><Star className="h-3.5 w-3.5 fill-amber-400" /> {d.rating}</span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-white">{d.name}</h3>
                <p className="mt-1 text-xs text-white/60 line-clamp-2">{d.description}</p>
              </div>

              <div className="mt-5 flex items-center justify-between pt-4 border-t border-white/5">
                <div>
                  <span className="text-xl font-black text-amber-300">\${d.price.toFixed(2)}</span>
                  <span className="ml-2 text-[11px] text-white/40">{d.prepTime} • {d.calories}</span>
                </div>
                <button
                  onClick={() => addToCart(d)}
                  className="rounded-xl bg-white/10 hover:bg-amber-400 hover:text-black px-3.5 py-1.5 text-xs font-bold transition"
                >
                  + Add to Order
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>

      {/* Cart Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0a0d14] border-l border-white/10 p-6 flex flex-col justify-between text-white">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-black flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-amber-400" /> Your Order</h3>
                <button onClick={() => setIsCartOpen(false)} className="text-white/40 hover:text-white">✕</button>
              </div>

              {cart.length === 0 ? (
                <p className="mt-8 text-center text-sm text-white/40">Your cart is empty. Add delicious items to start!</p>
              ) : (
                <div className="mt-4 space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div key={item.dish.id} className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                      <div>
                        <h4 className="text-xs font-bold">{item.dish.name}</h4>
                        <p className="text-[11px] text-amber-300 font-bold">\${(item.dish.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1">
                        <button onClick={() => updateQuantity(item.dish.id, -1)} className="text-xs font-bold text-white/60 hover:text-white">-</button>
                        <span className="text-xs font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.dish.id, 1)} className="text-xs font-bold text-white/60 hover:text-white">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-white/10 pt-4 space-y-3">
                <div className="flex justify-between text-xs text-white/60"><span>Subtotal</span><span>\${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-xs text-white/60"><span>Tax (8%)</span><span>\${tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm font-black text-amber-300"><span>Total</span><span>\${total.toFixed(2)}</span></div>
                <button
                  onClick={() => { setOrderPlaced(true); setCart([]); }}
                  className="w-full rounded-xl bg-amber-400 p-3 text-center text-xs font-black text-black hover:bg-amber-300 transition"
                >
                  Place Order Now (\${total.toFixed(2)})
                </button>
              </div>
            )}

            {orderPlaced && (
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-center mt-4">
                <Check className="h-6 w-6 text-emerald-400 mx-auto" />
                <p className="mt-1 text-xs font-bold text-emerald-300">Order Confirmed!</p>
                <p className="text-[10px] text-white/60">Kitchen is preparing your order now.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
`;
  }
  // 3. E-COMMERCE / STORE APP
  else if (p.includes('ecommerce') || p.includes('store') || p.includes('shop') || p.includes('cart') || p.includes('product') || p.includes('checkout')) {
    pageCode = `'use client';

import { useState } from 'react';
import { ShoppingCart, Search, Sparkles, Star, Tag, ShieldCheck, ArrowRight } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  category: string;
  rating: number;
  badge: string;
}

const products: Product[] = [
  { id: '1', title: 'Wireless Noise-Canceling Headphones', price: 199.99, originalPrice: 249.99, category: 'Audio', rating: 4.8, badge: 'Top Seller' },
  { id: '2', title: 'Minimalist Mechanical Keyboard', price: 129.50, originalPrice: 159.99, category: 'Peripherals', rating: 4.9, badge: '20% OFF' },
  { id: '3', title: 'Ergonomic Standing Desk Mat', price: 59.00, originalPrice: 79.00, category: 'Accessories', rating: 4.7, badge: 'Popular' },
  { id: '4', title: 'Ultra HD 4K Webcam with Mic', price: 89.99, originalPrice: 110.00, category: 'Peripherals', rating: 4.6, badge: 'New Arrival' },
];

export default function Page() {
  const [cartCount, setCartCount] = useState(0);

  return (
    <main className="min-h-screen bg-[#05070a] text-white p-4 md:p-8 font-sans">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">${title}</h1>
            <p className="text-xs text-white/60 mt-1">Discover premium items, seamless checkout, and live order tracking.</p>
          </div>
          <button className="relative rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-black text-black flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" /> Cart ({cartCount})
          </button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map(p => (
            <div key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-cyan-400/40 transition flex flex-col justify-between">
              <div>
                <span className="rounded-md bg-cyan-400/20 text-cyan-300 text-[10px] font-bold px-2 py-0.5">{p.badge}</span>
                <h3 className="mt-2 text-sm font-bold text-white">{p.title}</h3>
                <div className="mt-1 flex items-center gap-1 text-xs text-amber-400"><Star className="h-3 w-3 fill-amber-400" /> {p.rating}</div>
              </div>
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/5">
                <span className="text-base font-black text-cyan-300">\${p.price}</span>
                <button onClick={() => setCartCount(c => c + 1)} className="rounded-lg bg-white/10 hover:bg-cyan-400 hover:text-black px-3 py-1 text-xs font-bold transition">+ Add</button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
`;
  }
  // 4. GENERAL DYNAMIC APPLICATION
  else {
    pageCode = `'use client';

import { useState, useMemo } from 'react';
import { Search, Sparkles, Plus, Check, Trash2, Filter, Star, Activity, ArrowUpRight } from 'lucide-react';

interface AppItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  badge: string;
  status: string;
}

const initialItems: AppItem[] = [
  { id: '1', title: '${title} Core Workspace', subtitle: 'Main interactive workflow module for ${prompt.slice(0, 40)}', category: 'Active', badge: 'High Priority', status: 'Operational' },
  { id: '2', title: 'Data Telemetry & Stream', subtitle: 'Real-time telemetry and reporting channel', category: 'Active', badge: 'Live Sync', status: 'Connected' },
  { id: '3', title: 'Automated Event Handler', subtitle: 'Background event triggers and state sync', category: 'Automation', badge: 'Automated', status: 'Ready' },
];

export default function Page() {
  const [items, setItems] = useState<AppItem[]>(initialItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');

  const filteredItems = useMemo(() => {
    return items.filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [items, searchTerm]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    setItems([{ id: String(Date.now()), title: newItemTitle.trim(), subtitle: 'Newly created entry', category: 'Active', badge: 'New', status: 'Active' }, ...items]);
    setNewItemTitle('');
    setIsModalOpen(false);
  };

  return (
    <main className="min-h-screen bg-[#05070a] p-4 md:p-8 text-white font-sans">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-6 shadow-2xl backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-cyan-200">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                Live Application
              </div>
              <h1 className="mt-2 text-3xl md:text-4xl font-black text-white">${title}</h1>
              <p className="mt-1 text-sm text-white/60">Tailored full-stack application workspace matching your exact prompt requirements.</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-black text-black shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:bg-cyan-300 transition">
              <Plus className="h-4 w-4" /> Add Item
            </button>
          </div>
        </header>

        <section className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-white/30" />
          <input type="text" placeholder="Search items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white focus:border-cyan-400 focus:outline-none" />
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {filteredItems.map(item => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-cyan-400/40 transition">
              <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">{item.badge}</span>
              <h3 className="mt-2 text-base font-bold text-white">{item.title}</h3>
              <p className="mt-1 text-xs text-white/60">{item.subtitle}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
`;
  }

  const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #05070a;
  color: #ffffff;
}

* {
  box-sizing: border-box;
}`;

  const packageJson = JSON.stringify(
    {
      name: slug || 'blueprint-app',
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
      },
      dependencies: {
        next: '^14.2.0',
        react: '^18.3.0',
        'react-dom': '^18.3.0',
        'lucide-react': '^0.400.0',
      },
    },
    null,
    2
  );

  const schema = `CREATE TABLE ${slug.replace(/-/g, '_')}_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`;

  const api = `GET    /api/${slug}    List records
POST   /api/${slug}    Create new record`;

  const files: ProjectFile[] = [
    { path: 'app/globals.css', name: 'globals.css', language: 'css', content: globalsCss },
    { path: 'app/page.tsx', name: 'page.tsx', language: 'tsx', content: pageCode },
    {
      path: 'app/layout.tsx',
      name: 'layout.tsx',
      language: 'tsx',
      content: `import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`,
    },
    { path: 'supabase/schema.sql', name: 'schema.sql', language: 'sql', content: schema },
    { path: 'package.json', name: 'package.json', language: 'json', content: packageJson },
  ];

  return { title, domainName: title, schema, api, files };
}

function previewFor(kind: TemplateKind, title: string) {
  return `<main class="min-h-full bg-[#05070a] p-6 text-white">
  <section class="mx-auto max-w-6xl space-y-6">
    <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
      <p class="mb-3 text-xs font-black uppercase tracking-[0.28em] text-cyan-300">AI Application Preview</p>
      <h1 class="text-4xl font-black tracking-tight">${title}</h1>
      <p class="mt-3 max-w-2xl text-sm leading-6 text-white/55">Generated interactive full-stack workspace with dynamic data surfaces.</p>
    </div>
  </section>
</main>`;
}

export function generateProjectFromPrompt(prompt: string): GeneratedProject {
  const kind = detectTemplateKind(prompt);
  const name = titleFromPrompt(prompt, kind);
  const domain = analyzePromptDomain(prompt, name);

  const uiCode = domain.files
    .filter((file) => file.language === 'tsx' || file.language === 'ts')
    .map((file) => `// ${file.path}\n${file.content}`)
    .join('\n\n');

  return {
    name,
    kind,
    description: `Full-stack ${name} application generated specifically for: "${prompt}".`,
    preview: previewFor(kind, name),
    uiCode,
    schema: domain.schema,
    api: domain.api,
    files: domain.files,
  };
}
