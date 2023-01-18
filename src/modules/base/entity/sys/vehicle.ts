import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 系统用户
 */
@EntityModel('base_sys_vehicle')
export class BaseSysVehicleEntity extends BaseEntity {
  @Column({ comment: 'Car name', nullable: true, length: 100 })
  name: string;

  @Column({ comment: 'year', nullable: true})
  year: number;

  @Column({ comment: 'brand', length: 25, nullable: true })
  brand: string;

  @Column({ comment: 'model', length: 24, nullable: true })
  model: string;

  @Column({ comment: 'Series', length: 24, nullable: true })
  series: string;

  @Column({ comment: 'body Style', length: 24, nullable: true })
  bodyStyle: string;

  @Column({ comment: 'door number', nullable: true })
  doors: number;

  @Column({ comment: 'Seats number', nullable: true })
  seats: number;

  @Column({ comment: 'fuelType', type: 'tinyint', nullable: true })
  fuelType: number;

  @Column({ comment: 'engineSizeCc', nullable: true })
  engineSizeCc: number;

  @Column({ comment: 'cylinders', nullable: true })
  cylinders: number;

  @Column({ comment: 'Length', nullable: true })
  length: number;

  @Column({ comment: 'Width', nullable: true })
  width: number;

  @Column({ comment: 'Height', nullable: true })
  height: number;

  @Column({ comment: 'TareWeight', nullable: true })
  tareWeight: number;
}
