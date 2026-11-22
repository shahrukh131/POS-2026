import { STATUS_BADGE_TONES, StatusBadge } from '@/components/common/StatusBadge';
import { LOW_STOCK_THRESHOLD } from '@/config/inventoryRules';

export function StockLevelBadge({ stockQuantity }) {
  if (stockQuantity <= 0) return <StatusBadge tone={STATUS_BADGE_TONES.DANGER}>Out of stock</StatusBadge>;
  if (stockQuantity <= LOW_STOCK_THRESHOLD) return <StatusBadge tone={STATUS_BADGE_TONES.WARNING}>Low</StatusBadge>;
  return <StatusBadge tone={STATUS_BADGE_TONES.SUCCESS}>OK</StatusBadge>;
}
