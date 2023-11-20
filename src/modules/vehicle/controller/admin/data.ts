import {Post, Provide, Inject, Body} from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import {VehicleDataEntity} from "../../entity/data";
import * as excelToJson from 'convert-excel-to-json';
import {Repository} from "typeorm";
import {InjectEntityModel,} from "@midwayjs/orm";
import {Context} from "vm";
import { VehicleDataService } from '../../service/data';

/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: VehicleDataEntity,

  pageQueryOp: {
    keyWordLikeFields: ['name', 'year', 'model', 'make', 'bodyAndDoors'],
    where:  async (ctx: Context) => {
      const { model, make, bodyAndDoors } = ctx.request.body;
      return [
        model ? ['model like :model', {model: `%${model}%`}] : [],
        make ? ['make like :make', {make: `%${make}%`}]:[],
        bodyAndDoors ? ['bodyAndDoors like :bodyAndDoors', {bodyAndDoors: `%${bodyAndDoors}%`}]:[],
      ]
    },
    fieldEq: ['name', 'year']
  },

})
export class VehicleDataController extends BaseController {
  @InjectEntityModel(VehicleDataEntity)
  vehicleDataEntity: Repository<VehicleDataEntity>

  @Inject()
  vehicleDataService: VehicleDataService;

  @Post('/uploadExcel', { summary: '文件上传' })
  async upload() {
    console.log("----解析文件----");
    const result = excelToJson({
      sourceFile: __dirname + '\\Australia-Car-Database-make-model-year-badge-specs-handle.xlsx',
      header:{
        // Is the number of rows that will be skipped and will not be present at our result object. Counting from top to bottom
        rows: 19,
      },
      columnToKey: {
        B: 'name',
        D: 'make',
        E: 'model',
        F: 'year',
        G: 'bulletEngine',
        H: 'bodyAndDoors',
        I: 'engineConfigurationAndSize',
        J: 'badge',
        K: 'series',
        L: 'body',
        M: 'transmission',
        N: 'cylinders',
        O: 'engineCode',
        P: 'fuelType',
        Q: 'tareMass',
      }
    })

    console.log("----数据保存数据库中----");
    for (let item of result['Make-Model-Year-Badge']) {
      await this.vehicleDataEntity.save({
        ...item,
        // tareWeight: Number((item.tareWeight || '0 kg').replace(' kg', '')),
      })
    }
    console.log("----完成----");
    return this.ok({
      msg: 'success'
    });
  }

  @Post('/get_column_select_options', { summary: '获取选项' })
  async getColumnSelectOptions(
    @Body('model') model: string,
    @Body('year') year: string,
    @Body('make') make: string,
    @Body('bodyAndDoors') bodyAndDoors: string,
    @Body('keyWord') keyWord: string,
  ) {
    const options: { [key: string]: string[] } = {
      make: [],
      model: [],
      year: [],
      bodyAndDoors: []
    };
  
    const promiseArr = Object.keys(options).map((column) =>
      this.vehicleDataService.getColumnSelectOptions(column, { filters: {model, year, make,bodyAndDoors, keyWord} }).then((res) => {
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
