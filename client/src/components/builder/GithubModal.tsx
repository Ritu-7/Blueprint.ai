'use client';

import { useState } from 'react';
import { 
  Lock, 
  Globe, 
  GitBranch, 
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/utils/utils';

import type { ProjectFile } from '@/lib/templates';

interface GithubModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  files: ProjectFile[];
  onSuccess: (repoUrl: string) => void;
}

export function GithubModal({ 
  isOpen, 
  onClose, 
  projectName,
  files,
  onSuccess 
}: GithubModalProps) {
  const [repoName, setRepoName] = useState(projectName.toLowerCase().replace(/\s+/g, '-'));
  const [isPrivate, setIsPrivate] = useState(true);
  const [commitMessage, setCommitMessage] = useState('feat: initial blueprint generate');
  const [branchName, setBranchName] = useState('main');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [repoUrl, setRepoUrl] = useState('');

  const handlePush = async () => {
    setStatus('loading');
    
    try {
      const response = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoName,
          isPrivate,
          commitMessage,
          branchName,
          files
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRepoUrl(data.repoUrl);
        setStatus('success');
        setTimeout(() => {
          onSuccess(data.repoUrl);
          onClose();
          setStatus('idle');
        }, 2000);
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-[#05070a] border-white/10 text-white shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tighter italic">
            <FaGithub className="h-6 w-6 text-cyan-400" />
            Push to <span className="text-cyan-400">GitHub</span>
          </DialogTitle>
          <DialogDescription className="text-white/40 font-medium">
            Deploy your blueprint directly to a GitHub repository.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="repo-name" className="text-[10px] font-black uppercase tracking-widest text-white/40">
                Repository Name
              </Label>
              <div className="relative">
                <Input
                  id="repo-name"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  className="bg-white/5 border-white/10 focus:border-cyan-400/50 focus:ring-cyan-400/20 text-sm h-11"
                  placeholder="my-awesome-project"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center gap-3">
                {isPrivate ? <Lock className="h-4 w-4 text-amber-400" /> : <Globe className="h-4 w-4 text-green-400" />}
                <div>
                  <p className="text-xs font-black uppercase tracking-widest">
                    {isPrivate ? 'Private Repository' : 'Public Repository'}
                  </p>
                  <p className="text-[10px] text-white/35 uppercase tracking-tighter">
                    Visible only to you and collaborators
                  </p>
                </div>
              </div>
              <Switch checked={!isPrivate} onCheckedChange={(val) => setIsPrivate(!val)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="branch" className="text-[10px] font-black uppercase tracking-widest text-white/40">
                Branch
              </Label>
              <div className="relative">
                <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                <Input
                  id="branch"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-sm h-11"
                  placeholder="main"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="commit" className="text-[10px] font-black uppercase tracking-widest text-white/40">
                Commit Message
              </Label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-white/20" />
                <Textarea
                  id="commit"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-sm min-h-[80px]"
                  placeholder="What did you build?"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5"
          >
            Cancel
          </Button>
          
          <Button
            onClick={handlePush}
            disabled={status === 'loading' || status === 'success'}
            className={cn(
              "relative px-8 text-[10px] font-black uppercase tracking-widest transition-all duration-500",
              status === 'success' ? "bg-green-500 hover:bg-green-500" : "bg-cyan-400 text-[#05070a] hover:bg-cyan-300"
            )}
          >
            {status === 'loading' && (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Pushing...
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Success!
              </>
            )}
            {status === 'error' && (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Failed
              </>
            )}
            {status === 'idle' && 'Push to GitHub'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

