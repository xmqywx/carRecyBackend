import { Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { PartsInventoryEntity } from '../../entity/partsInventory';
import { CarEntity } from '../../entity/base';
import { OrderInfoEntity } from '../../../order/entity/info';

/**
 * Parts Inventory Controller
 *
 * Auto-CRUD for parts_inventory table with car join for display.
 * Custom operations are in PartsVehicleController.
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: PartsInventoryEntity,

  pageQueryOp: {
    keyWordLikeFields: ['a.partName', 'a.sku', 'a.description', 'b.brand', 'b.model', 'b.registrationNumber', 'c.quoteNumber'],
    select: [
      'a.*',
      'b.brand',
      'b.model',
      'b.year',
      'b.colour',
      'b.registrationNumber',
      'b.vinNumber',
      'b.engine',
      'b.transmission',
      'b.state',
      'b.carInfo',
      'c.quoteNumber AS stockNumber',
    ],
    fieldEq: [
      { column: 'a.status', requestParam: 'status' },
      { column: 'a.carID', requestParam: 'carID' },
      { column: 'a.condition', requestParam: 'condition' },
      { column: 'a.containerID', requestParam: 'containerID' },
      { column: 'a.category', requestParam: 'category' },
    ],
    join: [
      {
        entity: CarEntity,
        alias: 'b',
        condition: 'a.carID = b.id',
        type: 'leftJoin',
      },
      {
        entity: OrderInfoEntity,
        alias: 'c',
        condition: 'b.id = c.carID',
        type: 'leftJoin',
      },
    ],
    addOrderBy: () => ({ 'a.createTime': 'DESC' }),
  },
})
export class PartsInventoryController extends BaseController {}
