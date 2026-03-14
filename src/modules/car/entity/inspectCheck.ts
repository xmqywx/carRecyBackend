import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column, Index } from 'typeorm';

/**
 * Inspect Check — individual checklist items for the Inspect stage.
 *
 * Categories:
 *   photo      — 8 items: front, rear, left, right, engine, interior, odometer, vin
 *   component  — 7 items: Vehicle Complete, Engine, Transmission, Wheels/Mags, Battery, Catalytic Converter, Other
 *   condition  — 2 items: Engine Status, Transmission Status
 *
 * Total: 17 items per vehicle, batch-inserted when vehicle moves to Inspect.
 * Progress = checked items / total items × 100%.
 */
@EntityModel('inspect_check')
export class InspectCheckEntity extends BaseEntity {
  @Index()
  @Column({ comment: 'Car ID' })
  carID: number;

  @Column({ comment: 'Category: photo | component | condition', length: 20 })
  category: string;

  @Column({ comment: 'Item name (e.g. "front", "Engine", "Engine Status")' })
  itemName: string;

  @Column({ type: 'tinyint', comment: '0=unchecked, 1=checked', default: 0 })
  checked: number;

  @Column({ comment: 'Who checked this item', nullable: true })
  checkedBy: string;

  @Column({ comment: 'When this item was checked', nullable: true })
  checkedAt: Date;

  @Column({ type: 'text', comment: 'Photo URL or notes for this item', nullable: true })
  value: string;

  @Column({
    length: 20,
    comment: 'Condition rating: good | fair | poor | missing | na',
    nullable: true,
    default: null,
  })
  condition: string;
}
