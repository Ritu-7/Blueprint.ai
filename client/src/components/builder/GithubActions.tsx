'use client';

import { 
  GitPullRequest, 
  UploadCloud, 
  GitCommit, 
  Download, 
  Rocket, 
  RefreshCw,
  FileText
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface GithubActionsProps {
  onPush: () => void;
  onPR: () => void;
  onExport: () => void;
  onCommit: () => void;
  onDeploy: () => void;
  onRegenerate: () => void;
  onViewReadme: () => void;
  isGenerating?: boolean;
}

export function GithubActions({
  onPush,
  onPR,
  onExport,
  onCommit,
  onDeploy,
  onRegenerate,
  onViewReadme,
  isGenerating = false
}: GithubActionsProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5 p-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onPush}
              className="h-9 w-9 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 rounded-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]"
            >
              <FaGithub className="h-[18px] w-[18px]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-[#0f1115] border-white/10 text-[10px] font-black uppercase tracking-widest text-white">
            Push to GitHub
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onPR}
              className="h-9 w-9 text-purple-400 hover:text-purple-300 hover:bg-purple-400/10 rounded-lg transition-all duration-300"
            >
              <GitPullRequest className="h-[18px] w-[18px]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-[#0f1115] border-white/10 text-[10px] font-black uppercase tracking-widest text-white">
            Open Pull Request
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onCommit}
              className="h-9 w-9 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-lg transition-all duration-300"
            >
              <GitCommit className="h-[18px] w-[18px]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-[#0f1115] border-white/10 text-[10px] font-black uppercase tracking-widest text-white">
            Commit Changes
          </TooltipContent>
        </Tooltip>

        <div className="w-[1px] h-6 bg-white/10 mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onViewReadme}
              className="h-9 w-9 text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 rounded-lg transition-all duration-300"
            >
              <FileText className="h-[18px] w-[18px]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-[#0f1115] border-white/10 text-[10px] font-black uppercase tracking-widest text-white">
            Generate README
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onExport}
              className="h-9 w-9 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-all duration-300"
            >
              <Download className="h-[18px] w-[18px]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-[#0f1115] border-white/10 text-[10px] font-black uppercase tracking-widest text-white">
            Export ZIP
          </TooltipContent>
        </Tooltip>

        <div className="w-[1px] h-6 bg-white/10 mx-1" />

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRegenerate}
          disabled={isGenerating}
          className="h-9 px-3 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-300"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
          Regenerate
        </Button>

        <Button 
          variant="default" 
          size="sm" 
          onClick={onDeploy}
          className="h-9 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-[10px] font-black uppercase tracking-widest text-white rounded-lg shadow-[0_4px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_4px_25px_rgba(6,182,212,0.5)] transition-all duration-300 border-none ml-1"
        >
          <Rocket className="h-3.5 w-3.5 mr-2" />
          Deploy
        </Button>
      </div>
    </TooltipProvider>
  );
}

