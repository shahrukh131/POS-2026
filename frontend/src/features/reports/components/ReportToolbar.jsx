import { useState } from 'react';
import { CalendarDays, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  REPORT_RANGE_PRESETS,
  REPORT_RANGE_PRESET_KEYS,
  isValidReportDateRange,
} from '../utils/reportDateRange';

/**
 * Filters and actions in one row: range preset (applies instantly), custom dates, refresh, export.
 *
 * @param {{
 *   selectedPresetKey: string,
 *   appliedDateRange: import('../api/reportsApi').ReportDateRange,
 *   onPresetChange: (presetKey: string) => void,
 *   onApplyCustomDateRange: (dateRange: import('../api/reportsApi').ReportDateRange) => void,
 *   isRefreshing: boolean,
 *   onRefresh: () => void,
 *   isExportDisabled: boolean,
 *   onExport: () => void,
 * }} props
 */
export function ReportToolbar({
  selectedPresetKey,
  appliedDateRange,
  onPresetChange,
  onApplyCustomDateRange,
  isRefreshing,
  onRefresh,
  isExportDisabled,
  onExport,
}) {
  const isCustomRangeSelected = selectedPresetKey === REPORT_RANGE_PRESET_KEYS.CUSTOM;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={selectedPresetKey} onValueChange={onPresetChange}>
        <SelectTrigger className="w-44 bg-card" aria-label="Date range">
          <CalendarDays className="text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {REPORT_RANGE_PRESETS.map((rangePreset) => (
            <SelectItem key={rangePreset.key} value={rangePreset.key}>
              {rangePreset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isCustomRangeSelected && (
        <CustomDateRangeForm appliedDateRange={appliedDateRange} onApplyCustomDateRange={onApplyCustomDateRange} />
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" className="bg-card" aria-label="Refresh" onClick={onRefresh}>
            <RefreshCw className={cn(isRefreshing && 'animate-spin')} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Refresh</TooltipContent>
      </Tooltip>

      <Button variant="outline" className="bg-card" disabled={isExportDisabled} onClick={onExport}>
        <Download /> Export CSV
      </Button>
    </div>
  );
}

function CustomDateRangeForm({ appliedDateRange, onApplyCustomDateRange }) {
  const [draftDateRange, setDraftDateRange] = useState(appliedDateRange);
  const isDraftDateRangeValid = isValidReportDateRange(draftDateRange);

  const handleSubmit = (submitEvent) => {
    submitEvent.preventDefault();
    if (isDraftDateRangeValid) onApplyCustomDateRange(draftDateRange);
  };

  const updateDraftDate = (dateField) => (changeEvent) =>
    setDraftDateRange((previousRange) => ({ ...previousRange, [dateField]: changeEvent.target.value }));

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <Input
        type="date"
        aria-label="From date"
        className="w-40 bg-card"
        value={draftDateRange.fromDate}
        max={draftDateRange.toDate}
        onChange={updateDraftDate('fromDate')}
      />
      <span className="text-sm text-muted-foreground">to</span>
      <Input
        type="date"
        aria-label="To date"
        className="w-40 bg-card"
        value={draftDateRange.toDate}
        min={draftDateRange.fromDate}
        onChange={updateDraftDate('toDate')}
      />
      <Button type="submit" disabled={!isDraftDateRangeValid}>
        Apply
      </Button>
    </form>
  );
}
