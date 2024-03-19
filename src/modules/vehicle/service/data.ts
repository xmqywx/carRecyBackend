import { Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { VehicleDataEntity } from '../entity/data';

@Provide()
export class VehicleDataService extends BaseService {
  @InjectEntityModel(VehicleDataEntity)
  vehicleDataEntity: Repository<VehicleDataEntity>;

  //   async add(params) {
  //     return this.crderActionEntity.save(params);
  //   }

  async getColumnSelectOptions(
    column,
    { filters }: { filters?: { [key: string]: any } }
  ) {
    const parameters = [];
    let sql = `SELECT DISTINCT ${column} FROM vehicle_data a WHERE 1=1 `;

    if (filters) {
      Object.keys(filters).forEach((key, index) => {
        const filterValue = filters[key];
        if (filterValue) {
          sql += ` AND ${key} LIKE ?`;
          parameters.push(`%${filterValue}%`);
        }
      });
    }

    const sqlcoptSearch = await this.nativeQuery(sql, parameters);
    console.log(sqlcoptSearch);
    return sqlcoptSearch;
  }
}
