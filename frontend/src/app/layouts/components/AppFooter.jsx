import { APP_NAME, APP_VERSION } from '@/config/appInfo';
import { ApiStatusIndicator } from '@/features/system-status/components/ApiStatusIndicator';
import { useViewAs } from '@/features/view-as/hooks/useViewAs';

const CURRENT_YEAR = new Date().getFullYear();

/** Shared footer: who you're acting as, backend connection status, app name and version. */
export function AppFooter() {
  const { viewAs, isHqView } = useViewAs();
  const viewingAsLabel = isHqView ? 'HQ Admin' : `${viewAs.outletName} (${viewAs.outletCode})`;

  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-2 px-4 py-3 text-xs text-muted-foreground md:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {CURRENT_YEAR} {APP_NAME} · v{APP_VERSION}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              Viewing as <span className="font-medium text-foreground">{viewingAsLabel}</span>
            </span>
            <ApiStatusIndicator />
          </div>
        </div>
        <p className="text-muted-foreground/80">
          Demo mode: no authentication. Use the role switcher to simulate HQ or an Outlet. See README (Auth section).
        </p>
      </div>
    </footer>
  );
}
