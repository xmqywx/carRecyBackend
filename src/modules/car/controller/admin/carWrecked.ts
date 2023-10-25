import {Provide, Post, Inject, Body} from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import {CarWreckedEntity} from "../../entity/carWrecked";
import {CarEntity} from "../../entity/base";
import {Repository} from "typeorm";
import {InjectEntityModel} from "@midwayjs/orm";
import { CarWreckedService } from '../../service/car';

/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CarWreckedEntity,
  pageQueryOp: {
    keyWordLikeFields: ['carID', 'disassemblyNumber', 'disassmblingInformation'],
    select: ['a.*', 'b.model', 'b.year', 'b.brand', 'b.colour', 'b.vinNumber','b.name','b.registrationNumber','b.state','b.series','b.engine','b.bodyStyle', 'b.carInfo'],
    fieldEq: [
      { column: 'a.carID', requestParam: 'carID' },
      { column: 'a.disassemblyCategory', requestParam: 'disassemblyCategory' },
      { column: 'a.disassemblyNumber', requestParam: 'disassemblyNumber' },
      { column: 'b.model', requestParam: 'model' },
      { column: 'b.departmentId', requestParam: 'departmentId' },
      { column: 'b.year', requestParam: 'year' },
      { column: 'b.brand', requestParam: 'brand' }
    ],
    join: [{
      entity: CarEntity,
      alias: 'b',
      condition: 'a.carID = b.id',
      type: 'leftJoin'
    }]
  },
  listQueryOp: {
    keyWordLikeFields: ['carID'],
    select: ['a.*', 'b.model', 'b.year', 'b.brand', 'b.colour', 'b.vinNumber','b.name','b.registrationNumber','b.state','b.series','b.engine','b.bodyStyle', 'b.carInfo'],
    fieldEq: [
      { column: 'a.carID', requestParam: 'carID' },
      { column: 'a.disassemblyCategory', requestParam: 'disassemblyCategory' },
      { column: 'a.disassemblyNumber', requestParam: 'disassemblyNumber' },
      { column: 'a.catalyticConverterNumber', requestParam: 'catalyticConverterNumber' },
      { column: 'b.model', requestParam: 'model' },
      { column: 'b.departmentId', requestParam: 'departmentId' },
      { column: 'b.year', requestParam: 'year' },
      { column: 'b.brand', requestParam: 'brand' },
      { column: 'a.containerID', requestParam: 'containerID' },
      { column: 'a.containerNumber', requestParam: 'containerNumber' },
    ],
    join: [{
      entity: CarEntity,
      alias: 'b',
      condition: 'a.carID = b.id',
      type: 'leftJoin'
    }]
  },
  service: CarWreckedService
})
export class CarWreckedController extends BaseController {
  @InjectEntityModel(CarWreckedEntity)
  vehicleProfileEntity: Repository<CarWreckedEntity>

  @Inject()
  carWreckedService: CarWreckedService;

  @Post("/moveOutFromContainer")
  async moveOutFromContainer(@Body('partId') partId: number, @Body('containerNumber') containerNumber: string,) {
    return await this.carWreckedService.moveOutFromContainer(partId, containerNumber);
  }
}
