-- Migration: add `pickupNotes` column to `order` table
-- Date: 2026-04-17
-- Purpose: Independent pickup instructions for the driver (distinct from
--          customer-facing `note` column used by the old frontend).
-- Apply to: dev / staging / prod — in each environment explicitly.
-- Rollback: ALTER TABLE `order` DROP COLUMN `pickupNotes`;

ALTER TABLE `order`
  ADD COLUMN `pickupNotes` TEXT NULL
  COMMENT 'pickup notes — driver handout instructions';
