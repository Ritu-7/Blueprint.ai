'use client';

import { StatCard } from '@/components/engine/StatCard';
import { DataTable } from '@/components/engine/DataTable';
import { ErrorCard } from '@/components/engine/ErrorCard';
import { validateComponentProps } from '@/config/schema';
import type { ComponentNodeType } from '@/config/schema';

interface MappedComponent {
  component: React.ComponentType<{ node: ComponentNodeType }>;
}

const componentRegistry: Record<string, MappedComponent> = {
  StatCard: { component: StatCard },
  DataTable: { component: DataTable },
};

export function resolveComponent(node: ComponentNodeType): React.ReactNode {
  const { type, id, props } = node;

  // Check if the component type is missing entirely
  if (!type || type.trim() === '') {
    return (
      <ErrorCard
        componentType={type || '(empty)'}
        componentId={id}
        errors={['Component "type" field is missing or empty']}
        missingProps={['type']}
      />
    );
  }

  // Check if the component type is registered
  const mapping = componentRegistry[type];
  if (!mapping) {
    const validation = validateComponentProps(type, props);
    return (
      <ErrorCard
        componentType={type}
        componentId={id}
        errors={validation.errors}
        missingProps={validation.missingProps}
      />
    );
  }

  // Validate the component's props against its schema
  const validation = validateComponentProps(type, props);
  if (!validation.valid) {
    return (
      <ErrorCard
        componentType={type}
        componentId={id}
        errors={validation.errors}
        missingProps={validation.missingProps}
      />
    );
  }

  const Component = mapping.component;
  return <Component node={node} />;
}

export function getRegisteredTypes(): string[] {
  return Object.keys(componentRegistry);
}

