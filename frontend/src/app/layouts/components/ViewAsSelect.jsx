import { useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOutletsQuery } from '@/features/outlets/hooks/useOutletsQuery';
import { useViewAs } from '@/features/view-as/hooks/useViewAs';
import { HQ_HOME_PATH, OUTLET_HOME_PATH } from '../../router/routePaths';

// Radix Select needs string values, so outlets are encoded as "outlet:<id>".
const HQ_OPTION_VALUE = 'hq';
const OUTLET_OPTION_PREFIX = 'outlet:';
const toOutletOptionValue = (outletId) => `${OUTLET_OPTION_PREFIX}${outletId}`;

/** "No auth" switcher: lets the user act as HQ admin or as any outlet's cashier. */
export function ViewAsSelect() {
  const viewAsSelectId = useId();
  const navigate = useNavigate();
  const { viewAs, isHqView, switchToHqView, switchToOutletView } = useViewAs();
  const { data: outlets = [] } = useOutletsQuery();

  const selectedOptionValue = isHqView ? HQ_OPTION_VALUE : toOutletOptionValue(viewAs.outletId);
  // Keep the saved outlet selectable even if it is missing from the list (e.g. the list failed to load).
  const isSavedOutletMissingFromList =
    !isHqView && !outlets.some((outlet) => outlet.id === viewAs.outletId);

  const hasOutletOptions = outlets.length > 0 || isSavedOutletMissingFromList;

  const handleViewAsChange = (optionValue) => {
    if (optionValue === HQ_OPTION_VALUE) {
      switchToHqView();
      navigate(HQ_HOME_PATH);
      return;
    }
    const selectedOutletId = optionValue.slice(OUTLET_OPTION_PREFIX.length);
    const selectedOutlet = outlets.find((outlet) => outlet.id === selectedOutletId);
    if (!selectedOutlet) return;
    switchToOutletView(selectedOutlet);
    navigate(OUTLET_HOME_PATH);
  };

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={viewAsSelectId} className="hidden text-muted-foreground sm:block">
        View as
      </Label>
      <Select value={selectedOptionValue} onValueChange={handleViewAsChange}>
        <SelectTrigger id={viewAsSelectId} className="w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value={HQ_OPTION_VALUE}>HQ Admin</SelectItem>
          {hasOutletOptions && (
            <>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Outlets</SelectLabel>
                {outlets.map((outlet) => (
                  <SelectItem key={outlet.id} value={toOutletOptionValue(outlet.id)}>
                    {outlet.name} ({outlet.code})
                  </SelectItem>
                ))}
                {isSavedOutletMissingFromList && (
                  <SelectItem value={toOutletOptionValue(viewAs.outletId)}>
                    {viewAs.outletName} ({viewAs.outletCode})
                  </SelectItem>
                )}
              </SelectGroup>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
