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

    @Column({ comment: 'Components description', nullable: true,})
    description: string;

    @Column({  type: 'decimal',comment: 'Component price', nullable: true, precision: 10, scale: 2 })
    price: number;

    @Column({  type: 'decimal',comment: 'cc platinum', nullable: true, precision: 16, scale: 6 })
    platinum: number;

    @Column({  type: 'decimal',comment: 'cc palladium', nullable: true, precision: 16, scale: 6 })
    palladium: number;

    @Column({  type: 'decimal',comment: 'cc rhodium', nullable: true, precision: 16, scale: 6 })
    rhodium: number;

    @Column({ comment: 'content of components', nullable: true,})
    contentOfComponents: string;

    @Column({ comment: 'cc cat type', nullable: true,})
    catType: string;

    @Column({ comment: 'Location of catalytic converter', nullable: true,})
    locationOfCat: string;

    // ---------------------------

    @Column({  type: 'decimal',comment: 'Sold', nullable: true, precision: 10, scale: 2 })
    sold: number;

    @Column({  type: 'decimal',comment: 'Deposit', nullable: true, precision: 10, scale: 2 })
    deposit: number;

    @Column({  type: 'decimal',comment: 'Paid', nullable: true, precision: 10, scale: 2 })
    paid: number;

    @Column({ comment: 'Collected', default: false })
    collected: boolean;
}
