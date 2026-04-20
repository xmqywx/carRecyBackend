-- 2026-04-21-add-callback-and-inspection-flags.sql
-- Adds two cross-cutting flags discussed in the 2026-04-21 系统界面功能改进会:
--   1) order.callbackTime    — scheduled callback time (BIGINT ms). Orthogonal to status.
--   2) job.isInspection      — marks the job as "inspection only, no tow". Sibling of
--                              tow jobs; reuses driver-assignment flow + schedule timeline.
--
-- MySQL 5.7 compatible. Idempotent via information_schema probes.
-- Apply with: mysql -h<host> -u<user> -p<DB name> < 2026-04-21-add-callback-and-inspection-flags.sql
-- (or USE `<DB name>`; first if piping)
--
-- Rollback:
--   ALTER TABLE `order` DROP COLUMN callbackTime;
--   DROP INDEX idx_order_callback_time ON `order`;
--   ALTER TABLE job DROP COLUMN isInspection;

-- 1) order.callbackTime ---------------------------------------------------
SET @has_col := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'order'
    AND column_name = 'callbackTime'
);
SET @stmt := IF(@has_col = 0,
  'ALTER TABLE `order` ADD COLUMN callbackTime BIGINT NULL COMMENT ''scheduled callback time (ms timestamp); orthogonal to status''',
  'SELECT "order.callbackTime already exists" AS info');
PREPARE s FROM @stmt;
EXECUTE s;
DEALLOCATE PREPARE s;

-- 2) index on callbackTime for the Callback tab query
--    (WHERE callbackTime IS NOT NULL ORDER BY callbackTime ASC)
SET @has_idx := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'order'
    AND index_name = 'idx_order_callback_time'
);
SET @stmt := IF(@has_idx = 0,
  'CREATE INDEX idx_order_callback_time ON `order` (callbackTime)',
  'SELECT "idx_order_callback_time already exists" AS info');
PREPARE s FROM @stmt;
EXECUTE s;
DEALLOCATE PREPARE s;

-- 3) job.isInspection -----------------------------------------------------
SET @has_col := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'job'
    AND column_name = 'isInspection'
);
SET @stmt := IF(@has_col = 0,
  'ALTER TABLE job ADD COLUMN isInspection TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''1 = inspection-only job (no tow); 0 = tow job''',
  'SELECT "job.isInspection already exists" AS info');
PREPARE s FROM @stmt;
EXECUTE s;
DEALLOCATE PREPARE s;
