import { Provide, Inject } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository, In, getConnection } from 'typeorm';
import { VehicleProcessingEntity } from '../entity/vehicleProcessing';
import { InspectCheckEntity } from '../entity/inspectCheck';
import { DepolluteCheckEntity } from '../entity/depolluteCheck';
import { CarEntity } from '../entity/base';
import { OrderInfoEntity } from '../../order/entity/info';
import { ProcessingLogEntity } from '../entity/processingLog';
import { PartsVehicleService } from './partsVehicle';
import { OverseasVehicleService } from './overseasVehicle';
import { SoldCompleteService } from './soldComplete';
import { ScrapRecordService } from './scrapRecord';
import { RecyclingRecordService } from './recyclingRecord';

// Standard checklist items — must match frontend constants
const INSPECT_PHOTOS = ['front', 'rear', 'left', 'right', 'engine', 'interior', 'odometer', 'vin'];
const INSPECT_COMPONENTS = [
  'Vehicle Complete',
  'Engine',
  'Transmission',
  'Wheels/Mags',
  'Battery',
  'Catalytic Converter',
  'Other',
];
const INSPECT_CONDITIONS = [
  'Engine Status',
  'Transmission Status',
];

const DEPOLLUTE_FLUIDS = [
  'Engine Oil',
  'Coolant',
  'Brake Fluid',
  'Power Steering Fluid',
  'Transmission Fluid',
  'Windscreen Washer',
  'Fuel',
];
const DEPOLLUTE_COMPONENTS = [
  'Battery',
  'Catalytic Converter',
  'LPG Tank',
  'Air Conditioning Gas',
  'Airbags',
  'Tyres',
  'Wheels',
];

@Provide()
export class VehicleProcessingService extends BaseService {
  @InjectEntityModel(VehicleProcessingEntity)
  processingRepo: Repository<VehicleProcessingEntity>;

  @InjectEntityModel(InspectCheckEntity)
  inspectRepo: Repository<InspectCheckEntity>;

  @InjectEntityModel(DepolluteCheckEntity)
  depolluteRepo: Repository<DepolluteCheckEntity>;

  @InjectEntityModel(CarEntity)
  carRepo: Repository<CarEntity>;

  @InjectEntityModel(OrderInfoEntity)
  orderRepo: Repository<OrderInfoEntity>;

  @InjectEntityModel(ProcessingLogEntity)
  logRepo: Repository<ProcessingLogEntity>;

  @Inject()
  partsVehicleService: PartsVehicleService;

  @Inject()
  overseasVehicleService: OverseasVehicleService;

  @Inject()
  soldCompleteService: SoldCompleteService;

  @Inject()
  scrapRecordService: ScrapRecordService;

  @Inject()
  recyclingRecordService: RecyclingRecordService;

  /**
   * Get vehicle counts grouped by stage (excludes 'completed').
   */
  /**
   * Log a processing event for workflow history.
   */
  private async logAction(carID: number, action: string, fromStage?: string, toStage?: string, performedBy?: string, details?: any) {
    await this.logRepo.save({
      carID,
      action,
      fromStage: fromStage || null,
      toStage: toStage || null,
      performedBy: performedBy || null,
      details: details ? JSON.stringify(details) : null,
    });
  }

  async getStageCounts(): Promise<Record<string, number>> {
    const rows = await this.processingRepo
      .createQueryBuilder('vp')
      .select(`
        CASE
          WHEN vp.stage IN ('inspect', 'depollute') THEN 'processing'
          ELSE vp.stage
        END`, 'stage')
      .addSelect('COUNT(*)', 'count')
      .where("vp.stage != 'completed'")
      .groupBy(`
        CASE
          WHEN vp.stage IN ('inspect', 'depollute') THEN 'processing'
          ELSE vp.stage
        END`)
      .getRawMany();
    const result: Record<string, number> = {
      arrived: 0,
      processing: 0,
      decision: 0,
      completed: 0,
    };
    for (const row of rows) {
      result[row.stage] = parseInt(row.count, 10);
    }
    return result;
  }

  /**
   * Remove processing record if still in 'arrived' stage (not yet processed).
   * Returns true if deleted, false if not found or already in later stage.
   */
  async removeIfArrived(carID: number): Promise<boolean> {
    const record = await this.processingRepo.findOne({ where: { carID } });
    if (!record) return false;
    if (record.stage !== 'arrived') return false;
    await this.processingRepo.delete(record.id);
    return true;
  }

  /**
   * Ensure a processing record exists for a car. Creates one if missing.
   */
  async ensureRecord(carID: number): Promise<VehicleProcessingEntity> {
    let record = await this.processingRepo.findOne({ where: { carID } });
    if (!record) {
      record = await this.processingRepo.save({
        carID,
        stage: 'arrived',
        arrivedAt: new Date(),
      });
    }
    return record;
  }

  /**
   * Ensure processing records exist for multiple cars. Creates missing ones.
   */
  async ensureRecords(carIDs: number[]): Promise<VehicleProcessingEntity[]> {
    if (carIDs.length === 0) return [];

    const existing = await this.processingRepo.find({
      where: { carID: In(carIDs) },
    });
    const existingIDs = new Set(existing.map(r => r.carID));
    const missing = carIDs.filter(id => !existingIDs.has(id));

    if (missing.length > 0) {
      const newRecords = missing.map(carID => ({
        carID,
        stage: 'arrived',
        arrivedAt: new Date(),
      }));
      const saved = await this.processingRepo.save(newRecords);
      existing.push(...saved);
    }

    return existing;
  }

  /**
   * Get processing record for a car.
   */
  async getByCarID(carID: number): Promise<VehicleProcessingEntity | undefined> {
    return this.processingRepo.findOne({ where: { carID } });
  }

  /**
   * Get processing records for multiple cars (batch).
   */
  async getByCarIDs(carIDs: number[]): Promise<VehicleProcessingEntity[]> {
    if (carIDs.length === 0) return [];
    return this.processingRepo.find({ where: { carID: In(carIDs) } });
  }

  /**
   * Move vehicle to Inspect stage. Batch-inserts 17 inspect check items.
   */
  async moveToInspect(carID: number, assignedTo?: string): Promise<void> {
    const record = await this.ensureRecord(carID);
    const fromStage = record.stage;

    // Update stage
    await this.processingRepo.update(record.id, {
      stage: 'inspect',
      assignedTo: assignedTo || record.assignedTo,
      inspectStartedAt: new Date(),
    });
    await this.logAction(carID, 'stage_change', fromStage, 'inspect', assignedTo || record.assignedTo);

    // Check if inspect checks already exist
    const existingCount = await this.inspectRepo.count({ where: { carID } });
    if (existingCount > 0) return; // Already has checks

    // Batch insert 17 check items
    const checks: Partial<InspectCheckEntity>[] = [];

    for (const name of INSPECT_PHOTOS) {
      checks.push({ carID, category: 'photo', itemName: name, checked: 0 });
    }
    for (const name of INSPECT_COMPONENTS) {
      checks.push({ carID, category: 'component', itemName: name, checked: 0 });
    }
    for (const name of INSPECT_CONDITIONS) {
      checks.push({ carID, category: 'condition', itemName: name, checked: 0 });
    }

    await this.inspectRepo.save(checks);
  }

  /**
   * Move vehicle to Depollute stage. Batch-inserts 12 depollute check items.
   */
  async moveToDepollute(carID: number, assignedTo?: string): Promise<void> {
    const record = await this.ensureRecord(carID);
    const fromStage = record.stage;

    await this.processingRepo.update(record.id, {
      stage: 'depollute',
      assignedTo: assignedTo || record.assignedTo,
      depolluteStartedAt: new Date(),
    });
    await this.logAction(carID, 'stage_change', fromStage, 'depollute', assignedTo || record.assignedTo);

    // Check if depollute checks already exist
    const existingCount = await this.depolluteRepo.count({ where: { carID } });
    if (existingCount > 0) return;

    const checks: Partial<DepolluteCheckEntity>[] = [];

    for (const name of DEPOLLUTE_FLUIDS) {
      checks.push({ carID, category: 'fluid', itemName: name, checked: 0 });
    }
    for (const name of DEPOLLUTE_COMPONENTS) {
      checks.push({ carID, category: 'component', itemName: name, checked: 0 });
    }

    await this.depolluteRepo.save(checks);
  }

  /**
   * Move vehicle to Decision stage.
   */
  async moveToDecision(carID: number): Promise<void> {
    const record = await this.ensureRecord(carID);
    const fromStage = record.stage;
    await this.processingRepo.update(record.id, {
      stage: 'decision',
      labelStartedAt: new Date(),
    });
    await this.logAction(carID, 'stage_change', fromStage, 'decision', record.assignedTo);
  }

  /**
   * @deprecated Use moveToDecision instead
   */
  async moveToLabel(carID: number): Promise<void> {
    return this.moveToDecision(carID);
  }

  /**
   * Generic stage progression: arrived → processing → decision
   * For decision → completed, use complete() which requires a destination.
   */
  async moveNext(carID: number, assignedTo?: string) {
    const record = await this.ensureRecord(carID);

    if (record.stage === 'arrived') {
      // → processing: create all check items + set timestamps
      const update: any = {
        stage: 'processing',
        inspectStartedAt: new Date(),
        depolluteStartedAt: new Date(),
      };
      if (assignedTo) update.assignedTo = assignedTo;
      await this.processingRepo.update(record.id, update);
      await this.logAction(carID, 'stage_change', 'arrived', 'processing', assignedTo || record.assignedTo);

      // Create inspect checks (17 items) if not already present
      const existingInspect = await this.inspectRepo.count({ where: { carID } });
      if (existingInspect === 0) {
        const checks: Partial<InspectCheckEntity>[] = [];
        for (const name of INSPECT_PHOTOS) {
          checks.push({ carID, category: 'photo', itemName: name, checked: 0 });
        }
        for (const name of INSPECT_COMPONENTS) {
          checks.push({ carID, category: 'component', itemName: name, checked: 0 });
        }
        for (const name of INSPECT_CONDITIONS) {
          checks.push({ carID, category: 'condition', itemName: name, checked: 0 });
        }
        await this.inspectRepo.save(checks);
      }

      // Create depollute checks (14 items) if not already present
      const existingDepollute = await this.depolluteRepo.count({ where: { carID } });
      if (existingDepollute === 0) {
        const checks: Partial<DepolluteCheckEntity>[] = [];
        for (const name of DEPOLLUTE_FLUIDS) {
          checks.push({ carID, category: 'fluid', itemName: name, checked: 0 });
        }
        for (const name of DEPOLLUTE_COMPONENTS) {
          checks.push({ carID, category: 'component', itemName: name, checked: 0 });
        }
        await this.depolluteRepo.save(checks);
      }

    } else if (record.stage === 'processing') {
      // → decision
      await this.processingRepo.update(record.id, {
        stage: 'decision',
        labelStartedAt: new Date(),
      });
      await this.logAction(carID, 'stage_change', 'processing', 'decision', record.assignedTo);

    } else {
      throw new Error(`Cannot moveNext from stage "${record.stage}". Use complete() for decision → completed.`);
    }
  }

  /**
   * Complete processing — set destination, mark completed, and auto-create
   * the initial record in the destination module's table.
   */
  async complete(carID: number, destination: string): Promise<void> {
    const record = await this.ensureRecord(carID);

    // Validate destination before making any changes
    const validDestinations = ['Parts', 'Overseas', 'Sold Complete', 'Scrap', 'Recycling'];
    if (!validDestinations.includes(destination)) {
      throw new Error(`Invalid destination: "${destination}". Must be one of: ${validDestinations.join(', ')}`);
    }

    // Use transaction to ensure atomicity — either both the stage update
    // and destination record creation succeed, or neither does.
    const conn = getConnection();
    await conn.transaction(async () => {
      await this.processingRepo.update(record.id, {
        stage: 'completed',
        destination,
        completedAt: new Date(),
      });
      await this.logAction(carID, 'complete', 'decision', 'completed', record.assignedTo, { destination });

      // Auto-create record in destination module
      switch (destination) {
        case 'Parts':
          await this.partsVehicleService.createFromDecision(carID);
          break;
        case 'Overseas':
          await this.overseasVehicleService.createFromDecision(carID);
          break;
        case 'Sold Complete':
          await this.soldCompleteService.createFromDecision(carID);
          break;
        case 'Scrap':
          await this.scrapRecordService.create(carID, 'Decision', record.estScrap);
          break;
        case 'Recycling':
          await this.recyclingRecordService.createFromDecision(carID);
          break;
      }
    });
  }

  /**
   * Move vehicle back to the previous stage.
   * decision → processing, processing → arrived
   * Does NOT delete check items — they are preserved for re-entry.
   */
  async moveBack(carID: number): Promise<string> {
    const record = await this.ensureRecord(carID);
    const PREV_STAGE: Record<string, string> = {
      processing: 'arrived',
      decision: 'processing',
    };
    const prevStage = PREV_STAGE[record.stage];
    if (!prevStage) {
      throw new Error(`Cannot move back from stage "${record.stage}"`);
    }
    await this.processingRepo.update(record.id, { stage: prevStage });
    await this.logAction(carID, 'stage_back', record.stage, prevStage, record.assignedTo);
    return prevStage;
  }

  // Fields belonging to each table — used to split updateRecord data
  private static CAR_FIELDS = new Set([
    'vinNumber', 'registrationNumber', 'state', 'brand', 'model', 'year',
    'colour', 'bodyStyle', 'engine', 'transmission', 'fuel', 'image',
    'engineCode', 'doors', 'seats', 'engineSizeCc', 'cylinders',
    'tareWeight', 'power', 'engineNumber', 'series', 'name',
  ]);
  private static ORDER_FIELDS = new Set([
    'isDrivable', 'notDrivableReason', 'gotKey', 'gotRunning', 'gotPapers',
    'gotVehicleComplete', 'gotAccidentDamage', 'gotFireFloodDamage',
    'gotMissingComponents', 'gotEngineStarts', 'gotLicense', 'gotBattery',
    'gotCatalytic', 'gotWheels', 'gotEasy', 'gotNotBusy', 'gotOwner',
    'gotFlat', 'gotNoFlat', 'gotBusy', 'gotTransmission',
  ]);

  /**
   * Update vehicle data — splits fields across vehicle_processing, car, and order tables.
   */
  async updateRecord(carID: number, data: Record<string, any>): Promise<void> {
    const record = await this.ensureRecord(carID);
    delete data.id;
    delete data.carID;

    const processingData: Record<string, any> = {};
    const carData: Record<string, any> = {};
    const orderData: Record<string, any> = {};

    for (const [key, val] of Object.entries(data)) {
      if (VehicleProcessingService.CAR_FIELDS.has(key)) {
        carData[key] = val;
      } else if (VehicleProcessingService.ORDER_FIELDS.has(key)) {
        orderData[key] = val;
      } else {
        processingData[key] = val;
      }
    }

    const promises: Promise<any>[] = [];

    if (Object.keys(processingData).length > 0) {
      promises.push(this.processingRepo.update(record.id, processingData));
    }
    if (Object.keys(carData).length > 0) {
      promises.push(this.carRepo.update(carID, carData));
    }
    if (Object.keys(orderData).length > 0) {
      promises.push(
        this.orderRepo.update({ carID }, orderData)
      );
    }

    await Promise.all(promises);
  }

  // ===== Inspect checks =====

  /**
   * Get all inspect checks for a car.
   */
  async getInspectChecks(carID: number): Promise<InspectCheckEntity[]> {
    return this.inspectRepo.find({ where: { carID }, order: { id: 'ASC' } });
  }

  /**
   * Get inspect checks for multiple cars (batch).
   */
  async getInspectChecksBatch(carIDs: number[]): Promise<InspectCheckEntity[]> {
    if (carIDs.length === 0) return [];
    return this.inspectRepo.find({ where: { carID: In(carIDs) }, order: { id: 'ASC' } });
  }

  /**
   * Toggle an inspect check item.
   */
  async toggleInspectCheck(
    checkId: number,
    checked: boolean,
    checkedBy?: string
  ): Promise<void> {
    await this.inspectRepo.update(checkId, {
      checked: checked ? 1 : 0,
      checkedBy: checked ? checkedBy : null,
      checkedAt: checked ? new Date() : null,
    });
    await this.refreshInspectProgress(checkId);
  }

  /**
   * Update inspect check value (e.g. photo URL).
   */
  async updateInspectCheckValue(checkId: number, value: string): Promise<void> {
    await this.inspectRepo.update(checkId, { value });
  }

  /**
   * Update inspect check condition rating (good/fair/poor/missing/na).
   * Also auto-marks the item as checked.
   */
  async updateInspectCondition(
    checkId: number,
    condition: string,
    checkedBy?: string
  ): Promise<void> {
    await this.inspectRepo.update(checkId, {
      condition,
      checked: 1,
      checkedBy: checkedBy || null,
      checkedAt: new Date(),
    });
    await this.refreshInspectProgress(checkId);
  }

  /** Recalculate and store inspect progress from a check ID */
  private async refreshInspectProgress(checkId: number): Promise<void> {
    const check = await this.inspectRepo.findOne({ where: { id: checkId } });
    if (!check) return;
    const progress = await this.calcInspectProgress(check.carID);
    await this.processingRepo.update({ carID: check.carID }, { inspectProgress: progress });
  }

  // ===== Depollute checks =====

  /**
   * Get all depollute checks for a car.
   */
  async getDepolluteChecks(carID: number): Promise<DepolluteCheckEntity[]> {
    return this.depolluteRepo.find({ where: { carID }, order: { id: 'ASC' } });
  }

  /**
   * Get depollute checks for multiple cars (batch).
   */
  async getDepolluteChecksBatch(carIDs: number[]): Promise<DepolluteCheckEntity[]> {
    if (carIDs.length === 0) return [];
    return this.depolluteRepo.find({ where: { carID: In(carIDs) }, order: { id: 'ASC' } });
  }

  /**
   * Toggle a depollute check item.
   */
  async toggleDepolluteCheck(
    checkId: number,
    checked: boolean,
    checkedBy?: string
  ): Promise<void> {
    await this.depolluteRepo.update(checkId, {
      checked: checked ? 1 : 0,
      checkedBy: checked ? checkedBy : null,
      checkedAt: checked ? new Date() : null,
    });
    await this.refreshDepolluteProgress(checkId);
  }

  /**
   * Update depollute check status (pending/in_progress/done).
   * Auto-marks checked=1 when status is 'done'.
   */
  async updateDepolluteStatus(
    checkId: number,
    status: string,
    checkedBy?: string
  ): Promise<void> {
    const isDone = status === 'done';
    await this.depolluteRepo.update(checkId, {
      status,
      checked: isDone ? 1 : 0,
      checkedBy: isDone ? (checkedBy || null) : null,
      checkedAt: isDone ? new Date() : null,
    });
    await this.refreshDepolluteProgress(checkId);
  }

  /** Recalculate and store depollute progress from a check ID */
  private async refreshDepolluteProgress(checkId: number): Promise<void> {
    const check = await this.depolluteRepo.findOne({ where: { id: checkId } });
    if (!check) return;
    const progress = await this.calcDepolluteProgress(check.carID);
    await this.processingRepo.update({ carID: check.carID }, { depolluteProgress: progress });
  }

  // ===== Progress calculation =====

  /**
   * Calculate inspect progress: items with condition set or checked / total × 100.
   */
  async calcInspectProgress(carID: number): Promise<number> {
    const checks = await this.inspectRepo.find({ where: { carID } });
    if (checks.length === 0) return 0;
    const done = checks.filter(c => Number(c.checked) === 1 || (c.condition && c.condition !== '')).length;
    console.log(`[inspectProgress] carID=${carID} total=${checks.length} done=${done} items:`, checks.map(c => ({ id: c.id, item: c.itemName, checked: c.checked, condition: c.condition })));
    return Math.round((done / checks.length) * 100);
  }

  /**
   * Calculate depollute progress: items with status 'done' / total × 100.
   */
  async calcDepolluteProgress(carID: number): Promise<number> {
    const checks = await this.depolluteRepo.find({ where: { carID } });
    if (checks.length === 0) return 0;
    const done = checks.filter(c => c.status === 'done').length;
    return Math.round((done / checks.length) * 100);
  }

  // ===== Workflow timeline =====

  /**
   * Build a complete workflow timeline for a vehicle.
   * Combines: processing record timestamps, stage transition logs,
   * inspect checks, and depollute checks.
   */
  async getTimeline(carID: number): Promise<any> {
    const [record, logs, inspectChecks, depolluteChecks, car, order] = await Promise.all([
      this.processingRepo.findOne({ where: { carID } }),
      this.logRepo.find({ where: { carID }, order: { createTime: 'ASC' } }),
      this.inspectRepo.find({ where: { carID }, order: { id: 'ASC' } }),
      this.depolluteRepo.find({ where: { carID }, order: { id: 'ASC' } }),
      this.carRepo.findOne({ where: { id: carID } }),
      this.orderRepo.findOne({ where: { carID } }),
    ]);

    if (!record) return null;

    return {
      processing: record,
      logs,
      inspectChecks,
      depolluteChecks,
      car,
      order,
    };
  }
}
