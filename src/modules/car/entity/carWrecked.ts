import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import {Column,} from 'typeorm';

/**
 * 系统用户
 */
@EntityModel('car_wrecked')
export class CarEntity extends BaseEntity {
    @Column({ comment: 'Car ID', nullable: false })
    carID: number;

    
}
