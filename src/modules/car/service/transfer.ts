import { Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { CarEntity } from '../entity/base';
import { PartsVehicleEntity } from '../entity/partsVehicle';
import { RecyclingRecordEntity } from '../entity/recyclingRecord';
import { SoldCompleteEntity } from '../entity/soldComplete';
import { ScrapRecordEntity } from '../entity/scrapRecord';
import { OverseasVehicleEntity } from '../entity/overseasVehicle';
import { InventoryEntity } from '../entity/inventory';

const VALID_MODULES = ['parts', 'recycling', 'sold_complete', 'scrap', 'overseas'];

@Provide()
export class TransferService extends BaseService {
  @InjectEntityModel(CarEntity)
  carRepo: Repository<CarEntity>;

  @InjectEntityModel(PartsVehicleEntity)
  partsVehicleRepo: Repository<PartsVehicleEntity>;

  @InjectEntityModel(RecyclingRecordEntity)
  recyclingRepo: Repository<RecyclingRecordEntity>;

  @InjectEntityModel(SoldCompleteEntity)
  soldCompleteRepo: Repository<SoldCompleteEntity>;

  @InjectEntityModel(ScrapRecordEntity)
  scrapRepo: Repository<ScrapRecordEntity>;

  @InjectEntityModel(OverseasVehicleEntity)
  overseasRepo: Repository<OverseasVehicleEntity>;

  @InjectEntityModel(InventoryEntity)
  inventoryRepo: Repository<InventoryEntity>;

  /**
   * Transfer a vehicle to a different module.
   * 1. Update car.currentModule
   * 2. Ensure destination module has a record (create if not exists, leave as-is if exists)
   */
  async transfer(carID: number, targetModule: string): Promise<void> {
    if (!VALID_MODULES.includes(targetModule)) {
      throw new Error(`Invalid module: ${targetModule}. Must be one of: ${VALID_MODULES.join(', ')}`);
    }

    const car = await this.carRepo.findOne({ where: { id: carID } });
    if (!car) throw new Error(`Car ${carID} not found`);

    // Track source module: when going to terminal destinations (sold_complete/scrap),
    // remember which work module (parts/recycling) the car came from.
    // When going to a work module (parts/recycling), clear sourceModule.
    const terminalModules = ['sold_complete', 'scrap'];
    const workModules = ['parts', 'recycling'];
    const update: any = { currentModule: targetModule };
    if (terminalModules.includes(targetModule) && workModules.includes(car.currentModule)) {
      update.sourceModule = car.currentModule;
    } else if (workModules.includes(targetModule)) {
      update.sourceModule = null;
    }
    await this.carRepo.update(carID, update);

    // Ensure destination has a record
    await this.ensureModuleRecord(carID, targetModule);

    // Refresh parts counts on the target module record
    await this.refreshModuleCounts(carID, targetModule);
  }

  /**
   * Ensure the target module has a record for this car.
   * If record already exists (from a previous visit), leave it as-is — vehicle resumes where it left off.
   * If no record exists, create with initial/default state.
   */
  private async ensureModuleRecord(carID: number, module: string): Promise<void> {
    switch (module) {
      case 'parts': {
        const existing = await this.partsVehicleRepo.findOne({ where: { carID } });
        if (!existing) {
          await this.partsVehicleRepo.save({ carID, stage: 'inventory', inventoryAt: new Date() });
        }
        break;
      }
      case 'recycling': {
        const existing = await this.recyclingRepo.findOne({ where: { carID } });
        if (!existing) {
          await this.recyclingRepo.save({ carID, stage: 'received', archived: 0, startedAt: new Date() });
        }
        break;
      }
      case 'sold_complete': {
        const existing = await this.soldCompleteRepo.findOne({ where: { carID } });
        if (!existing) {
          await this.soldCompleteRepo.save({ carID, status: 'pending' });
        }
        break;
      }
      case 'scrap': {
        const existing = await this.scrapRepo.findOne({ where: { carID } });
        if (!existing) {
          await this.scrapRepo.save({ carID, source: 'Transfer', status: 'pending' });
        }
        break;
      }
      case 'overseas': {
        const existing = await this.overseasRepo.findOne({ where: { carID } });
        if (!existing) {
          await this.overseasRepo.save({ carID, stage: 'ready', readyAt: new Date() });
        }
        break;
      }
    }
  }

  /**
   * Refresh parts/labels counts on the target module's record.
   * Counts come from the unified inventory table.
   */
  private async refreshModuleCounts(carID: number, module: string): Promise<void> {
    const allParts = await this.inventoryRepo.find({ where: { carID } });
    const partsCount = allParts.filter(p => p.status !== 'void').length;
    const partsSold = allParts.filter(p => p.status === 'sold' || p.status === 'closed').length;
    const partsListed = allParts.filter(p => p.status === 'marketing').length;

    if (module === 'parts') {
      const record = await this.partsVehicleRepo.findOne({ where: { carID } });
      if (record) await this.partsVehicleRepo.update(record.id, { partsCount, partsSold, partsListed });
    } else if (module === 'recycling') {
      const record = await this.recyclingRepo.findOne({ where: { carID } });
      if (record) await this.recyclingRepo.update(record.id, { partsCount, partsSold, partsListed });
    }
  }
}
