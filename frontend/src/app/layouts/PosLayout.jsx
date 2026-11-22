import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { LoadingState } from '@/components/common/LoadingState';
import { AppFooter } from './components/AppFooter';
import { AppHeader } from './components/AppHeader';

export function PosLayout() {
  return (
    // Column layout so the footer sits at the bottom even on short pages.
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6 md:px-6">
        <Suspense fallback={<LoadingState />}>
          <Outlet />
        </Suspense>
      </main>
      <AppFooter />
    </div>
  );
}
