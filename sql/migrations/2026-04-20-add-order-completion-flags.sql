-- Booking · Payment panel introduces 3 partial-completion flags.
-- Multi-select: all three are nullable tinyint; pre-existing rows stay NULL.
-- Deploy before the frontend / backend that references these columns.

ALTER TABLE `order`
  ADD COLUMN `isPaidOnly`       TINYINT NULL COMMENT '仅已付款',
  ADD COLUMN `isPickedUpOnly`   TINYINT NULL COMMENT '仅已提车',
  ADD COLUMN `isPaperworkOnly`  TINYINT NULL COMMENT '仅完成文件';
