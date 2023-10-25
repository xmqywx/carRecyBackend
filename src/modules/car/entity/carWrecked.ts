import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import {Column} from 'typeorm';

/**
 * 系统用户
 */
@EntityModel('car_wrecked')
export class CarWreckedEntity extends BaseEntity {
    @Column({ comment: 'Car ID', nullable: false })
    carID: number;

    @Column({ comment: 'Disassembling information', nullable: true, type: 'text'})
    disassmblingInformation: string;

    @Column({ comment: 'Disassembly description', nullable: true,})
    disassemblyDescription: string;

    @Column({ comment: 'Disassembly images', nullable: true, type: 'text'})
    disassemblyImages: string;

    @Column({ comment: 'Disassembly category', nullable: true,})
    disassemblyCategory: string;

    @Column({ comment: 'Disassembly number', nullable: true,})
    disassemblyNumber: string;

    @Column({ comment: 'Catalytic Converter Name', nullable: true,})
    catalyticConverterName: string;
    
    @Column({ comment: 'Catalytic Converter Number', nullable: true,})
    catalyticConverterNumber: string;

    @Column({ comment: 'Container Number', nullable: true })
    containerNumber: string;
}
