'use client';

import type { TemplateKind } from '@/lib/templates';
import { ChatTemplate } from './templates/ChatTemplate';
import { CRMTemplate } from './templates/CRMTemplate';
import { DashboardTemplate } from './templates/DashboardTemplate';
import { EcommerceTemplate } from './templates/EcommerceTemplate';
import { PortfolioTemplate } from './templates/PortfolioTemplate';
import { TodoTemplate } from './templates/TodoTemplate';

export function TemplateRenderer({ kind, title }: { kind: TemplateKind; title: string }) {
  if (kind === 'ecommerce') return <EcommerceTemplate title={title} />;
  if (kind === 'dashboard') return <DashboardTemplate title={title} />;
  if (kind === 'portfolio') return <PortfolioTemplate title={title} />;
  if (kind === 'chat') return <ChatTemplate title={title} />;
  if (kind === 'crm') return <CRMTemplate title={title} />;
  return <TodoTemplate title={title} />;
}
