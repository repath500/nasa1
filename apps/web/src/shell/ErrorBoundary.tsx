import { Component, type ReactNode } from 'react';
import { InlineError } from '../components/InlineError';

/** A lane that crashes must not take the shell down. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error: Error | null; key?: string }> {
  state: { error: Error | null; key?: string } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  static getDerivedStateFromProps(p: { resetKey?: string }, s: { error: Error | null; key?: string }) {
    return p.resetKey !== s.key ? { error: null, key: p.resetKey } : null;
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto max-w-xl p-6">
        <InlineError message="This screen hit an error and stopped." stillWorks="The top bar, palette and other pages still work." onRetry={() => this.setState({ error: null })} />
      </div>
    );
  }
}
