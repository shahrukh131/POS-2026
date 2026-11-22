const DEFAULT_EMPTY_MESSAGE = 'Nothing here yet.';

export function EmptyState({ message = DEFAULT_EMPTY_MESSAGE }) {
  return <div className="p-8 text-center text-sm text-muted-foreground">{message}</div>;
}
