ALTER TABLE inventory ADD CONSTRAINT chk_inventory_qty_nonneg CHECK (quantity >= 0);
ALTER TABLE menu_items ADD CONSTRAINT chk_base_price_nonneg CHECK (base_price >= 0);
ALTER TABLE outlet_menu_items ADD CONSTRAINT chk_price_override_nonneg CHECK (price_override IS NULL OR price_override >= 0);
ALTER TABLE sale_items ADD CONSTRAINT chk_sale_qty_pos CHECK (quantity > 0);
ALTER TABLE sales ADD CONSTRAINT chk_total_nonneg CHECK (total_amount >= 0);
ALTER TABLE outlet_receipt_counters ADD CONSTRAINT chk_last_number_nonneg CHECK (last_number >= 0);