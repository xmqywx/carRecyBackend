import { Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { VehicleProfileEntity } from '../entity/profile';

@Provide()
export class VehicleProfileService extends BaseService {
  @InjectEntityModel(VehicleProfileEntity)
  vehicleProfileEntity: Repository<VehicleProfileEntity>;

  //   async add(params) {
  //     return this.crderActionEntity.save(params);
  //   }

  async getColumnSelectOptions(
    column,
    {
      model,
      brand,
      year,
      keyWord,
    }: { model?: string; brand?: string; year?: any; keyWord?: string }
  ) {
    // const sql = `SELECT DISTINCT ${column} FROM \`vehicle_profile\``;
    // const sqlSearch = await this.nativeQuery(sql);
    const sqlcopt = `SELECT DISTINCT ${column} FROM vehicle_profile a WHERE model LIKE ? AND brand LIKE ? AND year LIKE ? AND (name LIKE ? OR year LIKE ? OR model LIKE ?)`;
    const parameters = [
      `%${model || ''}%`,
      `%${brand || ''}%`,
      `%${year || ''}%`,
      `%${keyWord || ''}%`,
      `%${keyWord || ''}%`,
      `%${keyWord || ''}%`,
    ];
    const sqlcoptSearch = await this.nativeQuery(sqlcopt, parameters);
    console.log(sqlcoptSearch);
    return sqlcoptSearch;
  }
}
