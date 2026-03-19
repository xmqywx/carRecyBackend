import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * Vehicle Processing — tracks each vehicle through the 4-stage yard pipeline.
 *
 * Stages: arrived → processing → decision → completed
 *
 * One record per car (carID is unique). Created automatically when a
 * completed car first appears in the New Arrivals board.
 */
@EntityModel('vehicle_processing')
export class VehicleProcessingEntity extends BaseEntity {
  @Column({ comment: 'Car ID (references car table)', unique: true })
  carID: number;

  @Column({
    comment: 'Current stage: arrived | processing | decision | completed',
    length: 20,
    default: 'arrived',
  })
  stage: string;

  @Column({ comment: 'Worker assigned to current stage', nullable: true })
  assignedTo: string;

  @Column({
    comment: 'Destination: Parts | Overseas | Sold Complete | Scrap',
    nullable: true,
    length: 30,
  })
  destination: string;

  @Column({ comment: 'When vehicle arrived at yard', nullable: true })
  arrivedAt: Date;

  @Column({ comment: 'When moved to inspect stage', nullable: true })
  inspectStartedAt: Date;

  @Column({ comment: 'When moved to depollute stage', nullable: true })
  depolluteStartedAt: Date;

  @Column({ comment: 'When moved to label stage', nullable: true })
  labelStartedAt: Date;

  @Column({ comment: 'When processing completed', nullable: true })
  completedAt: Date;

  // Label stage estimates
  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Est. parts value', nullable: true })
  estParts: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Est. overseas value', nullable: true })
  estOverseas: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Est. complete sale value', nullable: true })
  estComplete: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Est. scrap value', nullable: true })
  estScrap: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Cat converter value', nullable: true })
  catValue: number;

  @Column({ comment: 'Vehicle weight string e.g. 1940 kg', nullable: true })
  weight: string;

  // Catalytic converter info (set during depollute)
  @Column({ type: 'tinyint', comment: 'Cat converter present', default: 0 })
  catPresent: number;

  @Column({ comment: 'Cat type', nullable: true })
  catType: string;

  @Column({ type: 'int', comment: 'Cat count', nullable: true })
  catCount: number;

  @Column({ comment: 'Cat serial number', nullable: true })
  catSerial: string;

  @Column({ comment: 'Cat status: In Situ | Removed', nullable: true })
  catStatus: string;

  @Column({ type: 'text', comment: 'Cat photos JSON array of URLs (legacy single)', nullable: true })
  catPhotos: string;

  @Column({ type: 'text', comment: 'Cat serials JSON array, one per converter unit', nullable: true })
  catSerialsJson: string;

  @Column({ type: 'text', comment: 'Cat photos JSON array of arrays, one per converter unit', nullable: true })
  catPhotosJson: string;

  @Column({ type: 'int', comment: 'Inspect progress 0-100', default: 0 })
  inspectProgress: number;

  @Column({ type: 'int', comment: 'Depollute progress 0-100', default: 0 })
  depolluteProgress: number;

  @Column({ type: 'text', comment: 'Notes / comments', nullable: true })
  notes: string;

  // Inspect stage — damage assessment fields
  @Column({ type: 'text', comment: 'Damage areas JSON array: Front/Rear/Side/Roof/Chassis', nullable: true })
  damageAreas: string;

  @Column({ type: 'tinyint', comment: 'Structural damage: 0=No, 1=Yes', nullable: true })
  structuralDamage: number;

  @Column({ type: 'tinyint', comment: 'Water damage: 0=No, 1=Yes', nullable: true })
  waterDamage: number;

  @Column({ type: 'tinyint', comment: 'Fire damage: 0=No, 1=Yes', nullable: true })
  fireDamage: number;

  @Column({ type: 'tinyint', comment: 'Flood contamination: 0=No, 1=Yes', nullable: true })
  floodDamage: number;

  @Column({ type: 'text', comment: 'Missing parts JSON array or comma-separated', nullable: true })
  missingParts: string;
}
