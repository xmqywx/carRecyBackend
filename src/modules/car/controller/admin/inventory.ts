import { Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { InventoryEntity } from '../../entity/inventory';
import { CarEntity } from '../../entity/base';

/**
 * Unified Inventory Controller
 * Replaces both partsInventory and recyclingInventory controllers.
 *
 * Pass `excludeModule` param to hide parts from the opposite module:
 *   Parts passes excludeModule='recycling' → hides recycling cars' parts
 *   Recycling passes excludeModule='parts' → hides parts cars' parts
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: InventoryEntity,
  pageQueryOp: {
    keyWordLikeFields: ['a.partName', 'a.sku', 'a.category', 'b.registrationNumber', 'b.brand', 'b.model'],
    select: [
      'a.*',
      'b.brand', 'b.model', 'b.year', 'b.registrationNumber', 'b.vinNumber',
      'b.colour', 'b.image', 'b.currentModule',
    ],
    fieldEq: [
      { column: 'a.carID', requestParam: 'carID' },
      { column: 'a.status', requestParam: 'status' },
      { column: 'a.condition', requestParam: 'condition' },
      { column: 'a.category', requestParam: 'category' },
    ],
    where: async (ctx) => {
      const { forModule } = ctx.request.body;
      if (forModule === 'parts') {
        return [["(b.currentModule = 'parts' OR (b.currentModule IN ('sold_complete','scrap') AND b.sourceModule = 'parts'))", {}]];
      }
      if (forModule === 'recycling') {
        return [["(b.currentModule = 'recycling' OR (b.currentModule IN ('sold_complete','scrap') AND b.sourceModule = 'recycling'))", {}]];
      }
      return [];
    },
    join: [
      { entity: CarEntity, alias: 'b', condition: 'a.carID = b.id', type: 'leftJoin' },
    ],
    addOrderBy: () => ({ 'a.createTime': 'DESC' }),
  },
})
export class InventoryController extends BaseController {}
