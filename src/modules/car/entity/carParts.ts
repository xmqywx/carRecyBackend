import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column, ManyToOne, JoinColumn } from 'typeorm';
import { CarEntity } from './base';

/**
 * 汽车零件表格
 */
@EntityModel('car_parts')
export class CarPartsEntity extends BaseEntity {
  @Column({ comment: 'Car ID 汽车id', nullable: false })
  carID: number;

  @Column({
    comment: 'Disassembling information 零件名称',
    nullable: true,
    type: 'text',
  })
  disassmblingInformation: string;

  @Column({ comment: 'Disassembly description 拆解描述', nullable: true })
  disassemblyDescription: string;

  @Column({
    comment: 'Disassembly images 零件图片',
    nullable: true,
    type: 'text',
  })
  disassemblyImages: string;

  @Column({ comment: 'Disassembly number 编号', nullable: true })
  disassemblyNumber: string;


  @Column({ comment: 'Container ID 容器ID', nullable: true })
  containerID: number;

  @Column({ comment: 'Components description 零件描述', nullable: true })
  description: string;

  @Column({ comment: 'part ', nullable: true })
  color: string;

  @ManyToOne(() => CarEntity, (car) => car.parts, { cascade: true })
  @JoinColumn({ name: 'carID' })  // 确保这里的字段名与数据库中的外键列名一致
  car ?: Promise<CarEntity> | CarEntity;
}
