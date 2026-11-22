import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { LoadingState } from '@/components/common/LoadingState';
import { AppFooter } from './components/AppFooter';
import { AppHeader } from './components/AppHeader';
import { HqSidebarNav } from './components/HqSidebarNav';

export function HqLayout() {
  return (
    // Column layout so the footer sits at the bottom even on short pages.
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="mx-auto grid w-full max-w-screen-2xl flex-1 content-start gap-6 px-4 py-6 md:grid-cols-[220px_minmax(0,1fr)] md:px-6">
        <HqSidebarNav />
        <main className="min-w-0">
          <Suspense fallback={<LoadingState />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <AppFooter />
    </div>
  );
}
