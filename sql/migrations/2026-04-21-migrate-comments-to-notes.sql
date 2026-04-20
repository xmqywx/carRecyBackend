-- 2026-04-21-migrate-comments-to-notes.sql
-- Migrates legacy `order.commentText` / `order.pickupNotes` blobs
-- into threaded `order_action` rows (type=1, name='Internal'/'Driver').
-- Legacy columns are PRESERVED for 2-3 weeks — carRecyFontend/src/modules/lead
-- /components/form-car.vue:1765 still actively writes commentText; Flutter
-- we_pick_your_car writes commentText too. A follow-up drop-columns migration
-- ships only after those writers are decommissioned.
--
-- MySQL 5.7 compatible. IDEMPOTENT w.r.t. unchanged sources: a rerun inserts
-- zero rows iff the legacy blob text is unchanged since the last run. If a
-- legacy writer (e.g. carRecyFontend, Flutter) has since edited the blob,
-- the new version will be appended as a second note row (intentional — treat
-- as a new edit).
-- Run manually against prod; DB_SYNCHRONIZE=false on apexpoint-front local,
-- so no auto-apply.
--
-- Apply with: mysql -h<host> -u<user> -p<DB name> < 2026-04-21-migrate-comments-to-notes.sql
-- (or first `USE \`<DB name>\`;` — some wrappers drop the shell arg).

-- 0) Ensure composite index (orderID, type) on order_action. §7 adds a
--    correlated COUNT(*) subquery to booking/job page(); without an index,
--    per-row subquery turns the list into an O(N²) scan. MySQL 5.7 lacks
--    `CREATE INDEX IF NOT EXISTS`, so we probe information_schema first.
SET @has_idx := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'order_action'
    AND index_name = 'idx_order_action_order_type'
);
SET @stmt := IF(@has_idx = 0,
  'CREATE INDEX idx_order_action_order_type ON order_action (orderID, type)',
  'SELECT "idx_order_action_order_type already exists" AS info');
PREPARE s FROM @stmt;
EXECUTE s;
DEALLOCATE PREPARE s;

-- 1) Migrate commentText blob -> Internal notes. ActionHistory.vue writes
--    Date.now() (integer ms) into timestamp varchar(50). UNIX_TIMESTAMP
--    against datetime(6) returns DECIMAL with fractional seconds — FLOOR(...)
--    drops them so the stored string stays a clean 13-digit integer like
--    "1774685139000", matching the Date.now() format and keeping lexical
--    ORDER BY stable across migrated and live-written rows.
--    The NOT EXISTS guard makes this file safe to re-run (same content +
--    same orderID + authorID=0 + name='Internal' is considered already migrated).
INSERT INTO order_action
  (orderID, authorID, description, timestamp, type, name, createTime, updateTime)
SELECT oi.id, 0, oi.commentText,
       CAST(FLOOR(UNIX_TIMESTAMP(oi.updateTime) * 1000) AS CHAR),
       1, 'Internal', NOW(), NOW()
FROM `order` oi
WHERE oi.commentText IS NOT NULL AND oi.commentText != ''
  AND NOT EXISTS (
    SELECT 1 FROM order_action oa
    WHERE oa.orderID = oi.id
      AND oa.type = 1
      AND oa.authorID = 0
      AND oa.name = 'Internal'
      AND oa.description = oi.commentText
  );

-- 2) Migrate pickupNotes blob -> Driver notes. Same NOT EXISTS guard.
INSERT INTO order_action
  (orderID, authorID, description, timestamp, type, name, createTime, updateTime)
SELECT oi.id, 0, oi.pickupNotes,
       CAST(FLOOR(UNIX_TIMESTAMP(oi.updateTime) * 1000) AS CHAR),
       1, 'Driver', NOW(), NOW()
FROM `order` oi
WHERE oi.pickupNotes IS NOT NULL AND oi.pickupNotes != ''
  AND NOT EXISTS (
    SELECT 1 FROM order_action oa
    WHERE oa.orderID = oi.id
      AND oa.type = 1
      AND oa.authorID = 0
      AND oa.name = 'Driver'
      AND oa.description = oi.pickupNotes
  );
