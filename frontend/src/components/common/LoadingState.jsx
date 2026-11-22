import { Skeleton } from '@/components/ui/skeleton';

const DEFAULT_SKELETON_ROW_COUNT = 4;

export function LoadingState({ skeletonRowCount = DEFAULT_SKELETON_ROW_COUNT }) {
  return (
    <div className="space-y-3 p-4" role="status" aria-label="Loading">
      {Array.from({ length: skeletonRowCount }, (_unused, rowIndex) => (
        <Skeleton key={rowIndex} className="h-9 w-full" />
      ))}
    </div>
  );
}
