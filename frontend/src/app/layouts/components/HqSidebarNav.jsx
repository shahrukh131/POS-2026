import { ChartColumn, ClipboardList, Package, Store, UtensilsCrossed } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ROUTE_PATHS } from '../../router/routePaths';

// Reports first: it is also the HQ home page (HQ_HOME_PATH).
const HQ_NAVIGATION_ITEMS = [
  { path: ROUTE_PATHS.HQ_REPORTS, label: 'Reports', Icon: ChartColumn },
  { path: ROUTE_PATHS.HQ_OUTLETS, label: 'Outlets', Icon: Store },
  { path: ROUTE_PATHS.HQ_MENU_ITEMS, label: 'Menu Items', Icon: UtensilsCrossed },
  { path: ROUTE_PATHS.HQ_ASSIGNMENTS, label: 'Assignments', Icon: ClipboardList },
  { path: ROUTE_PATHS.HQ_INVENTORY, label: 'Inventory', Icon: Package },
];

export function HqSidebarNav() {
  return (
    <nav aria-label="HQ navigation" className="flex gap-1 overflow-x-auto md:flex-col">
      {HQ_NAVIGATION_ITEMS.map(({ path, label, Icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            cn(
              'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              isActive && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
            )
          }
        >
          <Icon className="size-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
