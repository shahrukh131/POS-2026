import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { STATUS_BADGE_TONES, StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatCurrency, toMoneyString } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useSaveAssignmentMutation } from '../hooks/useSaveAssignmentMutation';

/**
 * Inline-editable row: price override + availability for one menu item at one outlet.
 * @param {{ outletId: string } & import('../hooks/useOutletAssignmentRows').AssignmentRowData} props
 */
export function AssignmentRow({ outletId, menuItem, assignment }) {
  const isAlreadyAssigned = Boolean(assignment);
  const saveAssignmentMutation = useSaveAssignmentMutation(outletId);
  const [priceOverrideInput, setPriceOverrideInput] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  // Re-sync the inputs whenever fresh assignment data arrives from the server.
  useEffect(() => {
    setPriceOverrideInput(assignment?.priceOverride != null ? String(assignment.priceOverride) : '');
    setIsAvailable(assignment?.isAvailable ?? true);
  }, [assignment]);

  const handleSaveAssignment = () => {
    const assignmentPayload = {
      priceOverride: priceOverrideInput === '' ? null : toMoneyString(priceOverrideInput),
      isAvailable,
    };
    saveAssignmentMutation.mutate(
      { menuItemId: menuItem.id, isAlreadyAssigned, assignmentPayload },
      {
        onSuccess: () => toast.success(`${menuItem.name} ${isAlreadyAssigned ? 'updated' : 'assigned'}`),
        onError: (saveAssignmentError) => toast.error(saveAssignmentError.message),
      },
    );
  };

  const saveButtonLabel = saveAssignmentMutation.isPending
    ? 'Saving…'
    : isAlreadyAssigned
      ? 'Save'
      : 'Assign';

  return (
    <TableRow className={cn(!menuItem.isActive && 'opacity-60')}>
      <TableCell className="font-medium">
        {menuItem.name}
        {!menuItem.isActive && <span className="text-xs font-normal text-muted-foreground"> (inactive)</span>}
      </TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(menuItem.basePrice)}</TableCell>
      <TableCell>
        {isAlreadyAssigned ? (
          <StatusBadge tone={STATUS_BADGE_TONES.SUCCESS}>Assigned</StatusBadge>
        ) : (
          <StatusBadge>Not assigned</StatusBadge>
        )}
      </TableCell>
      <TableCell>
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="Use base"
          aria-label={`Price override for ${menuItem.name}`}
          className="h-8 w-32"
          value={priceOverrideInput}
          onChange={(changeEvent) => setPriceOverrideInput(changeEvent.target.value)}
        />
      </TableCell>
      <TableCell>
        <Switch
          checked={isAvailable}
          onCheckedChange={setIsAvailable}
          aria-label={`${menuItem.name} available`}
        />
      </TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          variant={isAlreadyAssigned ? 'outline' : 'default'}
          disabled={saveAssignmentMutation.isPending}
          onClick={handleSaveAssignment}
        >
          {saveButtonLabel}
        </Button>
      </TableCell>
    </TableRow>
  );
}
