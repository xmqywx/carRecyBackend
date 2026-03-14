import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column, Index } from 'typeorm';

/**
 * Depollute Check — individual checklist items for the Depollute stage.
 *
 * Categories:
 *   fluid      — 7 items: Engine Oil, Coolant, Brake Fluid, etc.
 *   component  — 5 items: Battery, AC Gas, Airbags, Tyres, Wheels
 *
 * Total: 12 items per vehicle, batch-inserted when vehicle moves to Depollute.
 * Progress = checked items / total items × 100%.
 */
@EntityModel('depollute_check')
export class DepolluteCheckEntity extends BaseEntity {
  @Index()
  @Column({ comment: 'Car ID' })
  carID: number;

  @Column({ comment: 'Category: fluid | component', length: 20 })
  category: string;

  @Column({ comment: 'Item name (e.g. "Engine Oil", "Battery")' })
  itemName: string;

  @Column({ type: 'tinyint', comment: '0=unchecked, 1=checked', default: 0 })
  checked: number;

  @Column({ comment: 'Who checked this item', nullable: true })
  checkedBy: string;

  @Column({ comment: 'When this item was checked', nullable: true })
  checkedAt: Date;

  @Column({ type: 'text', comment: 'Notes for this item', nullable: true })
  value: string;

  @Column({
    length: 20,
    comment: 'Status: pending | in_progress | done',
    nullable: true,
    default: 'pending',
  })
  status: string;
}
