import { Provide, Get } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { RecyclingInventoryEntity } from '../../entity/recyclingInventory';
import { CarEntity } from '../../entity/base';
import { OrderInfoEntity } from '../../../order/entity/info';

/**
 * Recycling Inventory Controller
 *
 * Auto-CRUD for recycling_inventory table with car join for display.
 * Mirrors PartsInventoryController structure exactly.
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: RecyclingInventoryEntity,

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
    where: async function (ctx) {
      const conditions: any[] = [];
      const { priceMin, priceMax, dateStart, dateEnd } = ctx.request.body;
      if (priceMin != null) {
        conditions.push([`a.price >= :priceMin`, { priceMin: Number(priceMin) }]);
      }
      if (priceMax != null) {
        conditions.push([`a.price <= :priceMax`, { priceMax: Number(priceMax) }]);
      }
      if (dateStart) {
        conditions.push([`a.createTime >= :dateStart`, { dateStart }]);
      }
      if (dateEnd) {
        conditions.push([`a.createTime <= :dateEnd`, { dateEnd }]);
      }
      return conditions;
    },
    addOrderBy: () => ({ 'a.createTime': 'DESC' }),
  },
})
export class RecyclingInventoryController extends BaseController {
  @InjectEntityModel(RecyclingInventoryEntity)
  recyclingInventoryRepo: Repository<RecyclingInventoryEntity>;

  /**
   * Get count + total price grouped by status.
   * Returns: { inventory: { count, totalPrice }, marketing: { ... }, ... }
   */
  @Get('/statusStats')
  async statusStats() {
    try {
      const rows = await this.recyclingInventoryRepo
        .createQueryBuilder('a')
        .select('a.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(a.price), 0)', 'totalPrice')
        .where("a.status NOT IN ('voided', 'void')")
        .groupBy('a.status')
        .getRawMany();

      const result: Record<string, { count: number; totalPrice: number }> = {};
      for (const row of rows) {
        result[row.status] = {
          count: parseInt(row.count, 10) || 0,
          totalPrice: parseFloat(row.totalPrice) || 0,
        };
      }
      return this.ok(result);
    } catch (e) {
      return this.fail(e);
    }
  }
}
