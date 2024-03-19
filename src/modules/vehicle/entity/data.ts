import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 系统用户
 */
@EntityModel('vehicle_data')
export class VehicleDataEntity extends BaseEntity {
  @Column({ comment: 'Car Name', nullable: true, type: 'text' })
  name: string;

  @Column({ comment: 'Year', nullable: true })
  year: number;

  @Column({ comment: 'Make', nullable: true })
  make: string;

  @Column({ comment: 'Model', nullable: true })
  model: string;

  @Column({ comment: 'Series', nullable: true })
  series: string;

  @Column({ comment: 'Badge', nullable: true })
  badge: string;

  @Column({ comment: 'Fuel Type', nullable: true })
  fuelType: string;

  @Column({ comment: 'Body', nullable: true })
  body: string;

  @Column({ comment: 'Transmission', nullable: true })
  transmission: string;

  @Column({ comment: 'Cylinders', nullable: true })
  cylinders: string;

  @Column({ comment: 'Bullet Engine', nullable: true })
  bulletEngine: string;

  @Column({ comment: 'Body & Doors', nullable: true })
  bodyAndDoors: string;

  @Column({ comment: 'Engine Configuration & Size', nullable: true })
  engineConfigurationAndSize: string;

  @Column({ comment: 'Engine Code', nullable: true })
  engineCode: string;

  @Column({ comment: 'Tare Mass (Kg)', nullable: true })
  tareMass: number;
}
