'use client';

import { useState, useMemo } from 'react';
import {
  ArrowUpRight,
  Sparkles,
  Search,
  Mail,
  Heart,
  Eye,
  X,
  Send,
  Code2,
  Palette,
  Globe,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

export interface PortfolioProject {
  id: string;
  title: string;
  category: 'AI Products' | 'Brand Systems' | 'Web Apps' | 'Editorial';
  description: string;
  tags: string[];
  likes: number;
  views: number;
  featured: boolean;
}

export function PortfolioTemplate({ title }: { title: string }) {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);

  // New project form inputs
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'AI Products' | 'Brand Systems' | 'Web Apps' | 'Editorial'>('AI Products');
  const [newDescription, setNewDescription] = useState('');
  const [newTagsStr, setNewTagsStr] = useState('React, Next.js, Tailwind');

  // Contact form inputs
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [projects, activeCategory, searchQuery]);

  const handleLikeProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
    );
    toast.success('Appreciated project!');
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const tagsArray = newTagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newProj: PortfolioProject = {
      id: `proj-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim(),
      tags: tagsArray.length > 0 ? tagsArray : ['React', 'TypeScript'],
      likes: 1,
      views: 10,
      featured: true,
    };

    setProjects((prev) => [newProj, ...prev]);
    setNewTitle('');
    setNewDescription('');
    setIsAddProjectOpen(false);
    toast.success('Added new portfolio showcase project');
  };

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;

    toast.success(`Inquiry sent successfully! We'll reply to ${contactEmail} soon.`);
    setContactName('');
    setContactEmail('');
    setContactMessage('');
    setIsInquiryOpen(false);
  };

  return (
    <main className="min-h-full bg-[#05070a] p-6 text-white font-sans">
      <section className="mx-auto max-w-6xl space-y-6">
        {/* Header Hero */}
        <header className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-md">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-1 text-xs font-black uppercase tracking-[0.28em] text-cyan-300 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Creative Portfolio Engine
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-5xl text-white">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55">
              High-impact showcase displaying production web applications, design systems, and software engineering case studies.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsInquiryOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-xs font-black uppercase tracking-wider text-[#05070a] hover:bg-cyan-300 transition-all active:scale-95 shadow-[0_0_20px_rgba(0,243,255,0.3)]"
              >
                <Mail className="h-4 w-4" />
                Get In Touch
              </button>
              <button
                onClick={() => setIsAddProjectOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-xs font-bold text-white hover:bg-white/[0.08] transition-all"
              >
                <Plus className="h-4 w-4 text-cyan-300" />
                Add Showcase Work
              </button>
            </div>
          </div>

          {/* Add Project Form */}
          {isAddProjectOpen && (
            <form onSubmit={handleCreateProject} className="mt-6 border-t border-white/10 pt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  placeholder="Project title (e.g. Acme App)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="AI Products" className="bg-[#0f131c]">AI Products</option>
                  <option value="Brand Systems" className="bg-[#0f131c]">Brand Systems</option>
                  <option value="Web Apps" className="bg-[#0f131c]">Web Apps</option>
                  <option value="Editorial" className="bg-[#0f131c]">Editorial</option>
                </select>
                <input
                  type="text"
                  placeholder="Tags (comma separated: React, Next.js)"
                  value={newTagsStr}
                  onChange={(e) => setNewTagsStr(e.target.value)}
                  className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <textarea
                rows={2}
                placeholder="Project description and key technical features..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-400 px-5 py-2 text-xs font-black text-[#05070a] hover:bg-cyan-300 transition-all"
                >
                  Save Showcase Project
                </button>
              </div>
            </form>
          )}
        </header>

        {/* Filter and Search Bar */}
        <div id="projects-grid" className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {['All', 'AI Products', 'Brand Systems', 'Web Apps', 'Editorial'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? 'bg-cyan-400 text-[#05070a] shadow-[0_0_12px_rgba(0,243,255,0.3)]'
                    : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Search projects or tags…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {filteredProjects.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-xs text-white/30 space-y-3">
              <Sparkles className="h-8 w-8 mx-auto opacity-30 text-cyan-400" />
              <p>No projects in portfolio gallery. Click &quot;Add Showcase Work&quot; to display your projects.</p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <article
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition-all hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-white/[0.06] shadow-xl"
              >
                {/* Visual Thumbnail Placeholder */}
                <div className="relative mb-5 aspect-video overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-cyan-900/30 via-black to-blue-900/20 p-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-400/20">
                      {project.category}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-cyan-300 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-50 transition-opacity">
                    {project.category === 'AI Products' && <Code2 className="h-12 w-12 text-cyan-400" />}
                    {project.category === 'Brand Systems' && <Palette className="h-12 w-12 text-cyan-400" />}
                    {project.category === 'Web Apps' && <Globe className="h-12 w-12 text-cyan-400" />}
                    {project.category === 'Editorial' && <Sparkles className="h-12 w-12 text-cyan-400" />}
                  </div>
                </div>

                <h2 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors">
                  {project.title}
                </h2>
                <p className="mt-2 text-xs text-white/55 leading-relaxed line-clamp-2">{project.description}</p>

                {/* Tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {project.tags.map((t) => (
                    <span key={t} className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/40">
                      #{t}
                    </span>
                  ))}
                </div>

                {/* Footer Metrics */}
                <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-3 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {project.views}
                  </span>
                  <button
                    onClick={(e) => handleLikeProject(project.id, e)}
                    className="flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-white/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Heart className="h-3.5 w-3.5 text-rose-400" />
                    {project.likes}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Project Details Modal */}
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-2xl rounded-2xl border border-cyan-400/30 bg-[#0f131c] p-6 shadow-2xl">
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute right-4 top-4 rounded-lg bg-white/5 p-2 text-white/40 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <span className="rounded-md bg-cyan-400/10 px-2.5 py-1 text-xs font-bold text-cyan-300 border border-cyan-400/20">
                {selectedProject.category}
              </span>
              <h2 className="mt-3 text-2xl font-black text-white">{selectedProject.title}</h2>
              <p className="mt-3 text-sm text-white/70 leading-relaxed">{selectedProject.description}</p>

              <div className="mt-5 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/40">Technologies & Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.tags.map((t) => (
                    <span key={t} className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-xs font-bold text-cyan-200">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-white/40">
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-cyan-400" /> {selectedProject.views} Views
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Heart className="h-4 w-4 text-rose-400" /> {selectedProject.likes} Appreciations
                  </span>
                </div>

                <button
                  onClick={() => {
                    toast.success('Launching demo preview env...');
                    setSelectedProject(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-black text-[#05070a] hover:bg-cyan-300"
                >
                  Live Demo Preview
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contact Inquiry Modal */}
        {isInquiryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md rounded-2xl border border-cyan-400/30 bg-[#0f131c] p-6 shadow-2xl">
              <button
                onClick={() => setIsInquiryOpen(false)}
                className="absolute right-4 top-4 rounded-lg bg-white/5 p-2 text-white/40 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-cyan-300" />
                Send Project Inquiry
              </h2>
              <p className="mt-1 text-xs text-white/50">Submit project requirements or collaboration proposals.</p>

              <form onSubmit={handleSendInquiry} className="mt-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jane@company.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">Message</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Tell us about your project timeline and scope..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-cyan-400 py-3 text-xs font-black uppercase tracking-wider text-[#05070a] hover:bg-cyan-300 transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)]"
                >
                  Submit Inquiry
                </button>
              </form>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
