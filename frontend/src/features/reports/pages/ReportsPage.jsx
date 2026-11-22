import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { downloadCsv } from '@/lib/downloadCsv';
import { ReportKpiRow } from '../components/ReportKpiRow';
import { ReportToolbar } from '../components/ReportToolbar';
import { RevenueByOutletCard } from '../components/RevenueByOutletCard';
import { TopItemsByOutletSection } from '../components/TopItemsByOutletSection';
import { useReportData } from '../hooks/useReportData';
import { buildRevenueReportCsv, buildRevenueReportFileName } from '../utils/buildRevenueReportCsv';
import {
  DEFAULT_REPORT_RANGE_PRESET_KEY,
  REPORT_RANGE_PRESET_KEYS,
  formatDateRangeLabel,
  getDateRangeForPreset,
  isAllTimeRange,
} from '../utils/reportDateRange';

const ALL_TIME_NO_SALES_MESSAGE = 'No sales yet. Revenue will appear here after the first checkout.';
const PERIOD_NO_SALES_MESSAGE = 'No sales in this period.';

const createInitialDateRangeSelection = () => ({
  presetKey: DEFAULT_REPORT_RANGE_PRESET_KEY,
  dateRange: getDateRangeForPreset(DEFAULT_REPORT_RANGE_PRESET_KEY),
});

export function ReportsPage() {
  const [dateRangeSelection, setDateRangeSelection] = useState(createInitialDateRangeSelection);
  const { presetKey: selectedPresetKey, dateRange: appliedDateRange } = dateRangeSelection;
  const reportData = useReportData(appliedDateRange);
  const isAllTimeSelected = isAllTimeRange(appliedDateRange);

  const handlePresetChange = (nextPresetKey) =>
    setDateRangeSelection((previousSelection) => {
      if (nextPresetKey !== REPORT_RANGE_PRESET_KEYS.CUSTOM) {
        return { presetKey: nextPresetKey, dateRange: getDateRangeForPreset(nextPresetKey) };
      }
      // "Custom" starts from the current range; "All time" has no dates, so seed the inputs with the last 30 days.
      const customStartingRange = isAllTimeRange(previousSelection.dateRange)
        ? getDateRangeForPreset(REPORT_RANGE_PRESET_KEYS.LAST_30_DAYS)
        : previousSelection.dateRange;
      return { presetKey: nextPresetKey, dateRange: customStartingRange };
    });

  const handleApplyCustomDateRange = (customDateRange) =>
    setDateRangeSelection({ presetKey: REPORT_RANGE_PRESET_KEYS.CUSTOM, dateRange: customDateRange });

  const handleExportCsv = () =>
    downloadCsv(
      buildRevenueReportFileName(appliedDateRange),
      buildRevenueReportCsv({
        dateRange: appliedDateRange,
        rankedRevenueRows: reportData.rankedRevenueRows,
        topItemsByOutlet: reportData.topItemsByOutlet,
        outletDetailsById: reportData.outletDetailsById,
      }),
    );

  const rangeDescription = reportData.previousDateRange
    ? `${formatDateRangeLabel(appliedDateRange)} · compared with ${formatDateRangeLabel(reportData.previousDateRange)}`
    : formatDateRangeLabel(appliedDateRange);
  const noSalesMessage = isAllTimeSelected ? ALL_TIME_NO_SALES_MESSAGE : PERIOD_NO_SALES_MESSAGE;

  return (
    <>
      <PageHeader
        title="Reports"
        description={rangeDescription}
        actions={
          <ReportToolbar
            selectedPresetKey={selectedPresetKey}
            appliedDateRange={appliedDateRange}
            onPresetChange={handlePresetChange}
            onApplyCustomDateRange={handleApplyCustomDateRange}
            isRefreshing={reportData.isFetchingAnyReport}
            onRefresh={reportData.refetchAllReports}
            isExportDisabled={!reportData.hasAnySales}
            onExport={handleExportCsv}
          />
        }
      />

      <ReportKpiRow
        currentSummary={reportData.currentSummary}
        previousSummary={reportData.previousSummary}
        hasComparisonPeriod={reportData.hasComparisonPeriod}
        isLoading={reportData.revenueByOutletQuery.isLoading}
        isComparisonLoading={reportData.isComparisonLoading}
      />

      <RevenueByOutletCard
        queryState={reportData.revenueByOutletQuery}
        rankedRevenueRows={reportData.rankedRevenueRows}
        revenueSummary={reportData.currentSummary}
        hasAnySales={reportData.hasAnySales}
        noSalesMessage={noSalesMessage}
      />

      <TopItemsByOutletSection
        queryState={reportData.topItemsQuery}
        topItemsByOutlet={reportData.topItemsByOutlet}
        outletDetailsById={reportData.outletDetailsById}
        noSalesMessage={noSalesMessage}
      />
    </>
  );
}
