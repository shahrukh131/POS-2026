-- Redundant: the unique index (outlet_id, menu_item_id) already serves lookups by outlet_id
-- (leading column) and the FK on outlet_id.
DROP INDEX IF EXISTS "outlet_menu_items_outlet_id_idx";
