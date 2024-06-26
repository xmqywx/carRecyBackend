import { Post, Provide, Inject, Body } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { VehicleProfileEntity } from '../../entity/profile';
import * as excelToJson from 'convert-excel-to-json';
import { Repository } from 'typeorm';
import { InjectEntityModel } from '@midwayjs/orm';
import { Context } from 'vm';
import { VehicleProfileService } from '../../service/profile';

/**
 * 导入汽车数据
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: VehicleProfileEntity,

  pageQueryOp: {
    keyWordLikeFields: ['name', 'year', 'model'],
    where: async (ctx: Context) => {
      const { model, brand } = ctx.request.body;
      return [
        model ? ['model like :model', { model: `%${model}%` }] : [],
        brand ? ['brand like :brand', { brand: `%${brand}%` }] : [],
      ];
    },
    fieldEq: ['name', 'year'],
  },
})
export class VehicleProfileController extends BaseController {
  @InjectEntityModel(VehicleProfileEntity)
  vehicleProfileEntity: Repository<VehicleProfileEntity>;

  @Inject()
  vehicleProfileService: VehicleProfileService;

  @Post('/uploadExcel', { summary: '文件上传' })
  async upload() {
    const result = excelToJson({
      sourceFile: __dirname + '\\357671bb-5a6e-45c1-b49a-248377405281_car.xlsx',
      header: {
        // Is the number of rows that will be skipped and will not be present at our result object. Counting from top to bottom
        rows: 2,
      },

      columnToKey: {
        A: 'name',
        B: 'year',
        C: 'brand',
        D: 'model',
        E: 'series',
        F: 'bodyStyle',
        CC: 'doors',
        O: 'seats',
        BJ: 'fuelType',
        AT: 'engineSizeCc',
        AX: 'cylinders',
        BR: 'length',
        BS: 'width',
        BT: 'height',
        BU: 'tareWeight',
      },
    });
    for (let item of result.try) {
      await this.vehicleProfileEntity.save({
        ...item,
        fuelType: item.fuelType.indexOf('Petrol') > -1 ? 1 : 0,
        engineSizeCc: Number((item.engineSizeCc || '0 cc').replace(' cc', '')),
        length: Number((item.length || '0 mm').replace(' mm', '')),
        width: Number((item.width || '0 mm').replace(' mm', '')),
        height: Number((item.height || '0 mm').replace(' mm', '')),
        tareWeight: Number((item.tareWeight || '0 kg').replace(' kg', '')),
      });
    }
    return this.ok({
      msg: 'success',
    });
  }

  @Post('/get_column_select_options', { summary: '获取选项' })
  async getColumnSelectOptions(
    @Body('model') model: string,
    @Body('year') year: string,
    @Body('brand') brand: string,
    @Body('keyWord') keyWord: string
  ) {
    const options: { [key: string]: string[] } = {
      brand: [],
      model: [],
      year: [],
    };

    const promiseArr = Object.keys(options).map(column =>
      this.vehicleProfileService
        .getColumnSelectOptions(column, { model, year, brand, keyWord })
        .then(res => {
          options[column] = res;
        })
    );

    try {
      await Promise.all(promiseArr);
      return this.ok({
        msg: 'success',
        data: options,
      });
    } catch (error) {
      return this.fail('failed');
    }
  }
}
