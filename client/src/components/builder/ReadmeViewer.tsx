'use client';

import ReactMarkdown from 'react-markdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ReadmeViewerProps {
  content: string;
}

export function ReadmeViewer({ content }: ReadmeViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('README content copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#05070a]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">README.md</h3>
            <p className="text-[10px] text-white/35 uppercase tracking-tighter">Documentation Preview</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleCopy}
          className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5"
        >
          {copied ? <Check className="h-3.5 w-3.5 mr-2 text-green-400" /> : <Copy className="h-3.5 w-3.5 mr-2" />}
          {copied ? 'Copied' : 'Copy MD'}
        </Button>
      </div>

      <ScrollArea className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <article className="prose prose-invert prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-cyan max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </article>
        </div>
      </ScrollArea>
    </div>
  );
}

export function generateReadme(name: string, description: string, kind: string, techStack: string[] = ['Next.js', 'Tailwind CSS', 'TypeScript', 'Supabase', 'Lucide React']) {
  return `# ${name}

${description}

Generated with **Blueprint.ai** - The Ultimate AI Website Builder.

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
npm install

# Run the development server
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🛠 Tech Stack

${techStack.map(tech => `- ${tech}`).join('\n')}

## 📂 Project Structure

\`\`\`text
├── app/               # Next.js App Router
├── components/        # React components
│   ├── ui/           # Shared UI primitives
│   └── shared/       # Domain-specific components
├── lib/               # Utilities and shared logic
├── public/            # Static assets
└── types/             # TypeScript definitions
\`\`\`

## 📝 Features

- **AI-Powered**: Generated based on custom prompts.
- **Modern UI**: Built with Tailwind CSS and Radix UI.
- **Responsive**: Fully optimized for mobile and desktop.
- **Type-Safe**: Complete TypeScript implementation.
- **Scalable**: Clean architecture for long-term growth.

## 📄 API Documentation

This project includes built-in API routes located in \`app/api/\`. Check the \`API\` tab in the Blueprint IDE for full endpoint documentation.

## 💾 Database Schema

The relational data structure is defined using Supabase/PostgreSQL. Refer to the \`Schema\` tab for the complete migration SQL.

---

Built with ❤️ by [Blueprint.ai](https://blueprint.ai)`;
}

