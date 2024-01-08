import { Provide, Get, Post, Body } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';

import { Repository } from "typeorm";
import { InjectEntityModel } from "@midwayjs/orm";
import { CarCatalyticConverterEntity } from "../../entity/catalyticConverterPrice";

/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CarCatalyticConverterEntity,
  pageQueryOp: {
    keyWordLikeFields: [],
    select: ['a.*'],
    fieldEq: [

    ],

  }

})

export class CarCatalyticConverter extends BaseController {
  @InjectEntityModel(CarCatalyticConverterEntity)
  carCatalyticConverterEntity: Repository<CarCatalyticConverterEntity>

  @Get("/get_today_price")
  async getTodayPrice() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const price = await this.carCatalyticConverterEntity.createQueryBuilder()
      .where("createTime >= :today AND createTime < :tomorrow", { today, tomorrow })
      .getOne();

    return price;
  }

  @Post("/add_or_update_price")
  async addOrUpdatePrice(@Body() priceData: CarCatalyticConverterEntity) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let price = await this.carCatalyticConverterEntity.createQueryBuilder()
      .where("createTime >= :today AND createTime < :tomorrow", { today, tomorrow })
      .getOne();
    
      
      if (price) {
        // Update today's price
        price.platinumPrice = priceData.platinumPrice;
        price.palladiumPrice = priceData.palladiumPrice;
        price.rhodiumPrice = priceData.rhodiumPrice;
        console.log('========================',price,'========================');
      await this.carCatalyticConverterEntity.save(price); // Save the updated price
    } else {
      // Add new price
      price = this.carCatalyticConverterEntity.create(priceData);
      await this.carCatalyticConverterEntity.save(price); // Save the new price
    }

    return this.ok(price);
  }
}
