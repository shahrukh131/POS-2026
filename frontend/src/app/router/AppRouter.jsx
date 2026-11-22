import { Navigate, Route, Routes } from 'react-router-dom';
import { useViewAs } from '@/features/view-as/hooks/useViewAs';
import { HqLayout } from '../layouts/HqLayout';
import { PosLayout } from '../layouts/PosLayout';
import { lazyPage } from './lazyPage';
import { HQ_HOME_PATH, OUTLET_HOME_PATH, ROUTE_PATHS } from './routePaths';

// Each page is its own chunk, loaded on first visit. Layouts wrap <Outlet/> in <Suspense>.
const OutletsPage = lazyPage(() => import('@/features/outlets/pages/OutletsPage'), 'OutletsPage');
const MenuItemsPage = lazyPage(() => import('@/features/menu-items/pages/MenuItemsPage'), 'MenuItemsPage');
const AssignmentsPage = lazyPage(() => import('@/features/assignments/pages/AssignmentsPage'), 'AssignmentsPage');
const InventoryPage = lazyPage(() => import('@/features/inventory/pages/InventoryPage'), 'InventoryPage');
const ReportsPage = lazyPage(() => import('@/features/reports/pages/ReportsPage'), 'ReportsPage');
const PosPage = lazyPage(() => import('@/features/pos/pages/PosPage'), 'PosPage');

/** HQ and outlet users get completely separate route trees; unknown paths redirect home. */
export function AppRouter() {
  const { viewAs, isHqView } = useViewAs();

  if (isHqView) {
    return (
      <Routes>
        <Route element={<HqLayout />}>
          <Route path={ROUTE_PATHS.HQ_OUTLETS} element={<OutletsPage />} />
          <Route path={ROUTE_PATHS.HQ_MENU_ITEMS} element={<MenuItemsPage />} />
          <Route path={ROUTE_PATHS.HQ_ASSIGNMENTS} element={<AssignmentsPage />} />
          <Route path={ROUTE_PATHS.HQ_INVENTORY} element={<InventoryPage />} />
          <Route path={ROUTE_PATHS.HQ_REPORTS} element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to={HQ_HOME_PATH} replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<PosLayout />}>
        {/* Keyed by outlet so switching outlets resets the cart and checkout state. */}
        <Route path={ROUTE_PATHS.POS} element={<PosPage key={viewAs.outletId} />} />
      </Route>
      <Route path="*" element={<Navigate to={OUTLET_HOME_PATH} replace />} />
    </Routes>
  );
}
