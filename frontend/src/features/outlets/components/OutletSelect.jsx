import { useEffect, useId } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOutletsQuery } from '../hooks/useOutletsQuery';

/**
 * Outlet dropdown used by HQ pages (Assignments, Inventory). Auto-selects the first outlet.
 * @param {{ selectedOutletId: string, onSelectedOutletIdChange: (outletId: string) => void }} props
 */
export function OutletSelect({ selectedOutletId, onSelectedOutletIdChange }) {
  const outletSelectId = useId();
  const { data: outlets = [], isLoading: isLoadingOutlets } = useOutletsQuery();
  const firstOutletId = outlets[0]?.id;

  useEffect(() => {
    if (!selectedOutletId && firstOutletId) onSelectedOutletIdChange(firstOutletId);
  }, [selectedOutletId, firstOutletId, onSelectedOutletIdChange]);

  const placeholderText = isLoadingOutlets ? 'Loading outlets…' : 'No outlets';

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={outletSelectId} className="text-muted-foreground">
        Outlet
      </Label>
      <Select value={selectedOutletId} onValueChange={onSelectedOutletIdChange} disabled={!outlets.length}>
        <SelectTrigger id={outletSelectId} className="w-56 bg-card">
          <SelectValue placeholder={placeholderText} />
        </SelectTrigger>
        <SelectContent>
          {outlets.map((outlet) => (
            <SelectItem key={outlet.id} value={outlet.id}>
              {outlet.name} ({outlet.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
