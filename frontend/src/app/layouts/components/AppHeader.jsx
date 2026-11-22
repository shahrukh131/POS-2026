import { CircleAlert } from 'lucide-react';
import { useOutletsQuery } from '@/features/outlets/hooks/useOutletsQuery';
import { useViewAs } from '@/features/view-as/hooks/useViewAs';
import { ViewAsSelect } from './ViewAsSelect';

export function AppHeader() {
  const { viewAs, isHqView } = useViewAs();
  const outletsQuery = useOutletsQuery();
  const consoleTitle = isHqView ? 'HQ Console' : `${viewAs.outletName} POS`;

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <span className="rounded-md bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">F&amp;B</span>
          <span>{consoleTitle}</span>
        </div>
        <ViewAsSelect />
      </div>
      {outletsQuery.isError && (
        <div className="flex items-center gap-2 border-t bg-destructive/10 px-4 py-2 text-sm text-destructive md:px-6">
          <CircleAlert className="size-4" />
          Could not load outlets: {outletsQuery.error.message}
        </div>
      )}
    </header>
  );
}
