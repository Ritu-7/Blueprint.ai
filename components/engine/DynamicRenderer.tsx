'use client';

import { resolveComponent } from './ComponentMap';
import { ErrorBoundary } from './ErrorBoundary';
import type { ComponentNodeType, SectionNodeType } from '@/config/schema';

interface DynamicRendererProps {
  nodes: ComponentNodeType[];
}

export function DynamicRenderer({ nodes }: DynamicRendererProps) {
  return (
    <div className="space-y-2">
      {nodes.map((node) => (
        <ErrorBoundary key={node.id} componentId={node.id} componentType={node.type}>
          {resolveComponent(node)}
        </ErrorBoundary>
      ))}
    </div>
  );
}

interface SectionRendererProps {
  section: SectionNodeType;
}

export function SectionRenderer({ section }: SectionRendererProps) {
  const { props, children } = section;
  const title = props?.title || '';
  const columns = props?.columns || 1;

  const gridCols: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section className="space-y-4">
      {title && (
        <h2 className="text-lg font-semibold text-zinc-200 tracking-tight">
          {title}
        </h2>
      )}
      <div className={`grid gap-4 ${gridCols[columns] || gridCols[1]}`}>
        {children.map((child) => (
          <ErrorBoundary key={child.id} componentId={child.id} componentType={child.type}>
            {resolveComponent(child)}
          </ErrorBoundary>
        ))}
      </div>
    </section>
  );
}
