'use client';

import React from 'react';
import { ErrorCard } from './ErrorCard';

interface Props {
  children: React.ReactNode;
  componentId?: string;
  componentType?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorCard
          componentType={this.props.componentType || 'Unknown'}
          componentId={this.props.componentId}
          errors={[this.state.error?.message || 'An unexpected render error occurred']}
          missingProps={[]}
        />
      );
    }

    return this.props.children;
  }
}
