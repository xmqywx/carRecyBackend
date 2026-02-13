import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 系统用户
 */
@EntityModel('order')
export class OrderInfoEntity extends BaseEntity {
  @Column({ comment: 'carID', nullable: true })
  carID: number;

  @Column({ comment: 'customer' })
  customerID: string;

  @Column({ comment: 'driverID', nullable: true })
  driverID: string;

  @Column({ comment: 'status', type: 'tinyint' })
  status: number;

  @Column({ comment: 'OverrideEmailAddress', nullable: true })
  overrideEmailAddress: string;

  @Column({ comment: 'pickupAddress', nullable: true })
  pickupAddress: string;

  @Column({ comment: 'pickupAddress state', nullable: true })
  pickupAddressState: string;

  @Column({ comment: 'pickupAddress lat', nullable: true })
  pickupAddressLat: string;

  @Column({ comment: 'pickupAddress lng', nullable: true })
  pickupAddressLng: string;

  @Column({ comment: 'payMethod', nullable: true })
  payMethod: string;

  @Column({ comment: 'overridePhoneNumber', nullable: true })
  overridePhoneNumber: string;

  @Column({
    comment: 'recommendedPrice',
    type: 'decimal',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  recommendedPrice: number;

  @Column({ comment: 'Quote type: Fixed or Negotiable', nullable: true, default: 'Fixed' })
  quoteType: string;

  @Column({ type: 'decimal', comment: 'Quote range from', nullable: true, precision: 12, scale: 2 })
  quoteFrom: number;

  @Column({ type: 'decimal', comment: 'Quote range to', nullable: true, precision: 12, scale: 2 })
  quoteTo: number;

  // 加小数
  @Column({
    type: 'decimal',
    comment: 'ActualPaymentPrice',
    nullable: true,
    precision: 12,
    scale: 2,
  })
  actualPaymentPrice: number;

  @Column({ comment: 'expectedDate', length: 20, nullable: true })
  expectedDate: string;

  @Column({ comment: 'note', nullable: true })
  note: string;

  @Column({ comment: 'yard ID', type: 'bigint' })
  departmentId: number;

  @Column({ type: 'tinyint', nullable: true })
  gotPapers: boolean;

  @Column({ type: 'tinyint', nullable: true })
  gotKey: boolean;

  @Column({ type: 'tinyint', nullable: true })
  gotOwner: boolean;

  @Column({ type: 'tinyint', nullable: true })
  gotRunning: boolean;

  @Column({ type: 'tinyint', nullable: true })
  gotLicense: boolean;

  @Column({ type: 'tinyint', nullable: true })
  gotFlat: boolean;

  @Column({ type: 'tinyint', nullable: true })
  gotEasy: boolean;

  @Column({ type: 'tinyint', nullable: true })
  gotBusy: boolean;

  // 新增 Vehicle Assessment 字段
  @Column({ type: 'tinyint', nullable: true, comment: '发动机可启动' })
  gotEngineStarts: boolean;

  @Column({ type: 'tinyint', nullable: true, comment: '变速箱可移动' })
  gotTransmission: boolean;

  @Column({ type: 'tinyint', nullable: true, comment: '轮子正常' })
  gotWheels: boolean;

  @Column({ type: 'tinyint', nullable: true, comment: '有电池' })
  gotBattery: boolean;

  @Column({ type: 'tinyint', nullable: true, comment: '有催化转化器' })
  gotCatalytic: boolean;

  @Column({ type: 'tinyint', nullable: true, comment: '没有漏气轮胎' })
  gotNoFlat: boolean;

  @Column({ type: 'tinyint', nullable: true, comment: '不在繁忙交通道路上' })
  gotNotBusy: boolean;

  // Vehicle Assessment v2 字段
  @Column({ type: 'tinyint', nullable: true, comment: '车辆可驾驶' })
  isDrivable: boolean;

  @Column({ nullable: true, comment: '不可驾驶原因: engine/transmission/damage/unknown' })
  notDrivableReason: string;

  @Column({ type: 'tinyint', nullable: true, comment: '车辆完整' })
  gotVehicleComplete: boolean;

  @Column({ type: 'tinyint', nullable: true, comment: '事故损伤' })
  gotAccidentDamage: boolean;

  @Column({ type: 'tinyint', nullable: true, comment: '火灾或水灾损伤' })
  gotFireFloodDamage: boolean;

  @Column({ type: 'tinyint', nullable: true, comment: '缺少主要部件' })
  gotMissingComponents: boolean;

  @Column({ comment: 'modelNumber', nullable: true })
  modelNumber: string;

  @Column({ comment: 'carColor', nullable: true })
  carColor: string;

  @Column({ comment: 'imageFileDir', nullable: true, type: 'text' })
  imageFileDir: string;

  @Column({ comment: 'signature', nullable: true })
  signature: string;

  @Column({ comment: 'invoice', nullable: true })
  invoice: string;

  // 0 1 2 3
  @Column({ comment: 'emailStatus', nullable: true })
  emailStatus: number;

  @Column({ comment: 'aboutUs', nullable: true })
  aboutUs: string;

  @Column({ comment: '主要来源: Google/Facebook/Gumtree/Referral/Dealer/Other', nullable: true })
  leadSource: string;

  @Column({ comment: '来源详情', nullable: true })
  leadSourceDetail: string;

  //加小数
  @Column({
    type: 'decimal',
    comment: 'deposit',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  deposit: number;

  @Column({ comment: 'customerName', nullable: true })
  customerName: string;

  @Column({ comment: 'bankingWith 开户行名称', nullable: true })
  bankingWith: string;

  @Column({ comment: 'bankName', nullable: true })
  bankName: string;

  @Column({ comment: 'bsbNo', nullable: true })
  bsbNo: number;

  @Column({ comment: 'accountsNo', nullable: true })
  accountsNo: number;

  // 加小数
  @Column({
    type: 'decimal',
    comment: 'totalAmount',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  totalAmount: number;

  // 加小数
  @Column({
    type: 'decimal',
    comment: 'gstAmount',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  gstAmount: number;

  // 加小数
  @Column({
    type: 'decimal',
    comment: 'deduction',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  deduction: number;

  @Column({ comment: 'comments', nullable: true })
  comments: string;

  @Column({ comment: 'commentText', nullable: true })
  commentText: string;

  @Column({ comment: 'secondary person ID', type: 'bigint', nullable: true })
  secondaryID: number;

  @Column({ comment: 'GST status', nullable: true })
  gstStatus: string;

  @Column({ comment: 'deposit payment', nullable: true })
  depositPayMethod: string;

  // -----------------
  @Column({ comment: 'source', nullable: true })
  source: string;

  // 加小数
  @Column({
    type: 'decimal',
    comment: 'askingPrice',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  askingPrice: number;

  @Column({ comment: 'paymentRemittance', nullable: true, type: 'text' })
  paymentRemittance: string;

  @Column({ comment: 'PayID detail (phone or email)', nullable: true })
  payIdDetail: string;

  @Column({ comment: 'quoteNumber', nullable: true })
  quoteNumber: string;

  // ----
  @Column({ comment: 'registrationDoc', nullable: true, type: 'text' })
  registrationDoc: string;

  @Column({ comment: 'driverLicense', nullable: true, type: 'text' })
  driverLicense: string;

  @Column({ comment: 'vehiclePhoto', nullable: true, type: 'text' })
  vehiclePhoto: string;

  @Column({ comment: 'create by', nullable: true })
  createBy: string;

  @Column({ comment: 'allowUpload', nullable: true, default: false })
  allowUpload: boolean;

  @Column({
    type: 'decimal',
    comment: 'kilometers',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  kilometers: number;

  @Column({
    type: 'decimal',
    comment: 'gst',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  gst: number;

  @Column({
    type: 'decimal',
    comment: 'priceExGST',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  priceExGST: number;

  // is floating
  @Column({ type: 'tinyint', nullable: true })
  floating: boolean;

  // 暂存排班信息（lead 状态下设置，book 时使用）
  @Column({ comment: '暂存司机ID', type: 'bigint', nullable: true })
  tempDriverId: number;

  @Column({ comment: '暂存司机名称', nullable: true })
  tempDriverName: string;

  @Column({ comment: '暂存排班时间', length: 20, nullable: true })
  tempScheduledTime: string;

  @Column({ comment: '暂存时长(小时)', type: 'decimal', precision: 4, scale: 1, nullable: true })
  tempDuration: number;
}
