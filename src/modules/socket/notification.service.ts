import { Provide, App } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { OrderInfoEntity } from '../order/entity/info';
import { CarEntity } from '../car/entity/base';
import { Application } from '@midwayjs/socketio';
import { getSocketIdsByUserId } from './gateway';

export interface JobNotificationData {
  jobId: number;
  orderId: number;
  action: string;
  fromStatus?: number;
  toStatus?: number;
  driverId?: number;
  schedulerStart?: string;
  schedulerEnd?: string;
}

@Provide()
export class SocketNotificationService {
  @App('socketIO')
  socketApp: Application;

  @InjectEntityModel(OrderInfoEntity)
  orderInfoEntity: Repository<OrderInfoEntity>;

  @InjectEntityModel(CarEntity)
  carEntity: Repository<CarEntity>;

  /**
   * Notify a driver about a job change
   */
  async notifyDriver(driverId: number, data: JobNotificationData) {
    if (!driverId) return;

    const socketIds = getSocketIdsByUserId(driverId);
    if (!socketIds || socketIds.size === 0) {
      console.log(`[Notification] Driver ${driverId} not online, skipping`);
      return;
    }

    let quoteNumber = '';
    let pickupAddress = '';
    let carName = '';

    try {
      const order = await this.orderInfoEntity.findOne({ id: data.orderId });
      if (order) {
        quoteNumber = order.quoteNumber || '';
        pickupAddress = order.pickupAddress || '';
        if (order.carID) {
          const car = await this.carEntity.findOne({ id: order.carID });
          if (car) {
            carName = [car.year, car.brand, car.name]
              .filter(Boolean)
              .join(' ');
          }
        }
      }
    } catch (e) {
      console.log('[Notification] Error fetching order info:', e.message);
    }

    const message = this.buildMessage(
      data.action,
      quoteNumber,
      pickupAddress,
      carName,
      data.schedulerStart
    );

    const payload = {
      jobId: data.jobId,
      orderId: data.orderId,
      quoteNumber,
      action: data.action,
      fromStatus: data.fromStatus,
      toStatus: data.toStatus,
      schedulerStart: data.schedulerStart,
      schedulerEnd: data.schedulerEnd,
      pickupAddress,
      carName,
      message,
    };

    for (const socketId of socketIds) {
      this.socketApp.of('/').to(socketId).emit('job:updated', payload);
    }

    console.log(
      `[Notification] Sent "${data.action}" to driver ${driverId}, job ${data.jobId}`
    );
  }

  /**
   * Notify old driver that job was taken away
   */
  async notifyDriverRemoved(
    oldDriverId: number,
    data: JobNotificationData
  ) {
    await this.notifyDriver(oldDriverId, {
      ...data,
      action: data.action === 'reassigned' ? 'reassigned' : 'unassigned',
    });
  }

  private buildMessage(
    action: string,
    quoteNumber: string,
    pickupAddress: string,
    carName: string,
    schedulerStart?: string
  ): string {
    const stockLabel = quoteNumber ? `#${quoteNumber}` : 'Job';

    switch (action) {
      case 'assigned':
        return `New job assigned: ${stockLabel} - ${pickupAddress || carName}`;
      case 'unassigned':
        return `Job ${stockLabel} has been unassigned`;
      case 'reassigned':
        return `Job ${stockLabel} has been removed from your task list`;
      case 'time_changed':
        if (schedulerStart) {
          const ts = Number(schedulerStart);
          if (!isNaN(ts)) {
            const date = new Date(ts);
            const formatted = date.toLocaleDateString('en-AU', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            });
            return `Job ${stockLabel} rescheduled to ${formatted}`;
          }
        }
        return `Job ${stockLabel} time has been changed`;
      case 'status_changed':
        return `Job ${stockLabel} status updated`;
      case 'cancelled':
        return `Job ${stockLabel} has been cancelled`;
      case 'returned':
        return `Job ${stockLabel} has been returned to leads`;
      default:
        return `Job ${stockLabel} has been updated`;
    }
  }
}
