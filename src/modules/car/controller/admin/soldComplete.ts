import { Provide, Post, Body, Inject } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { SoldCompleteEntity } from '../../entity/soldComplete';
import { SoldCompleteService } from '../../service/soldComplete';
import { SoldCompleteEmailService } from '../../service/soldCompleteEmail';
import { CarEntity } from '../../entity/base';
import { OrderInfoEntity } from '../../../order/entity/info';

/**
 * Sold Complete Controller
 *
 * 3-step whole-vehicle sale wizard.
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: SoldCompleteEntity,

  pageQueryOp: {
    keyWordLikeFields: ['a.buyerName', 'a.invoiceNumber', 'b.brand', 'b.model', 'b.registrationNumber', 'c.quoteNumber'],
    select: [
      'a.*',
      'b.brand',
      'b.model',
      'b.year',
      'b.colour',
      'b.registrationNumber',
      'b.vinNumber',
      'b.image',
      'b.tareWeight',
      'b.engine',
      'c.quoteNumber AS stockNumber',
    ],
    fieldEq: [
      { column: 'a.status', requestParam: 'status' },
      { column: 'a.carID', requestParam: 'carID' },
      { column: 'b.currentModule', requestParam: 'currentModule' },
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
    addOrderBy: () => ({ 'a.createTime': 'DESC' }),
  },
})
export class SoldCompleteController extends BaseController {
  @Inject()
  soldCompleteService: SoldCompleteService;

  @Inject()
  soldCompleteEmailService: SoldCompleteEmailService;

  @InjectEntityModel(CarEntity)
  carRepo: Repository<CarEntity>;

  @Post('/createFromDecision')
  async createFromDecision(@Body('carID') carID: number) {
    try {
      const record = await this.soldCompleteService.createFromDecision(carID);
      return this.ok(record);
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/saveBuyerDetails')
  async saveBuyerDetails(
    @Body('carID') carID: number,
    @Body('data') data: any
  ) {
    try {
      await this.soldCompleteService.saveBuyerDetails(carID, data);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/generateInvoice')
  async generateInvoice(
    @Body('carID') carID: number,
    @Body('invoiceNumber') invoiceNumber: string
  ) {
    try {
      await this.soldCompleteService.generateInvoice(carID, invoiceNumber);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/markEmailSent')
  async markEmailSent(@Body('carID') carID: number) {
    try {
      await this.soldCompleteService.markEmailSent(carID);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/markPaid')
  async markPaid(
    @Body('carID') carID: number,
    @Body('payMethod') payMethod?: string
  ) {
    try {
      await this.soldCompleteService.markPaid(carID, payMethod);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/close')
  async close(@Body('carID') carID: number) {
    try {
      await this.soldCompleteService.close(carID);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/advanceStatus')
  async advanceStatus(@Body('carID') carID: number) {
    try {
      const next = await this.soldCompleteService.advanceStatus(carID);
      return this.ok({ status: next });
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/batchSetStatus')
  async batchSetStatus(
    @Body('carIDs') carIDs: number[],
    @Body('status') status: string
  ) {
    try {
      await this.soldCompleteService.batchSetStatus(carIDs, status);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/archive')
  async archive(@Body('carID') carID: number) {
    try {
      await this.soldCompleteService.archive(carID);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/batchArchive')
  async batchArchive(@Body('carIDs') carIDs: number[]) {
    try {
      await this.soldCompleteService.batchArchive(carIDs);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/previewInvoice')
  async previewInvoice(@Body('carID') carID: number) {
    try {
      // Try the full template from email service first
      try {
        const html = await this.soldCompleteEmailService.getInvoicePreview(carID);
        return this.ok({ html });
      } catch {
        // Fallback to inline template
        const record = await this.soldCompleteService.getByCarID(carID);
        if (!record) return this.fail('Record not found');
        const car = await this.carRepo.findOne({ where: { id: carID } });
        const stockResult = await this.soldCompleteService.nativeQuery(
          'SELECT quoteNumber FROM `order` WHERE carID = ? LIMIT 1', [carID]
        );
        const stockNumber = stockResult?.[0]?.quoteNumber;
        const html = this.buildInvoiceHtml(record, car, stockNumber);
        return this.ok({ html });
      }
    } catch (e) {
      return this.fail(e.message || e);
    }
  }

  @Post('/sendInvoiceEmail')
  async sendInvoiceEmail(@Body('carID') carID: number) {
    try {
      const result = await this.soldCompleteEmailService.sendInvoice(carID);
      return this.ok(result);
    } catch (e) {
      return this.fail(e.message || e);
    }
  }

  /**
   * Generate full invoice HTML.
   */
  private buildInvoiceHtml(record: SoldCompleteEntity, car: CarEntity | null, stockNumber?: string): string {
    const now = record.invoiceDate ? new Date(record.invoiceDate) : new Date();
    const dateStr = now.toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' });
    const invNo = record.invoiceNumber || 'DRAFT';
    const priceExGST = Number(record.priceExGST) || 0;
    const gstAmount = Number(record.gstAmount) || 0;
    const totalAmount = Number(record.totalAmount) || 0;
    const depositAmount = Number(record.depositAmount) || 0;
    const balanceDue = totalAmount - depositAmount;
    const gstApplicable = record.gstApplicable === 1;

    const buyerLines = [
      record.buyerCompany,
      record.buyerPhone ? `Phone: ${record.buyerPhone}` : null,
      record.buyerEmail ? `Email: ${record.buyerEmail}` : null,
      record.buyerAddress,
      record.buyerABN ? `ABN: ${record.buyerABN}` : null,
    ].filter(Boolean).join('<br>');

    const y = car?.year || '';
    const b = car?.brand || '';
    const m = car?.model || '';
    const vehicleDesc = [y, b, m].filter(Boolean).join(' ') || '--';
    const rego = car?.registrationNumber || 'N/A';
    const vin = car?.vinNumber || '--';
    const colour = car?.colour || '--';
    const engine = (car as any)?.engine || '--';

    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#fff}
.inv{max-width:800px;margin:0 auto;background:#fff}
.hdr{display:flex;justify-content:space-between;padding:40px 40px 20px;border-bottom:3px solid #6366f1}
.hdr-l h1{font-size:28px;color:#6366f1;letter-spacing:-.5px}
.hdr-l p{color:#64748b;font-size:13px;margin-top:4px}
.hdr-r{text-align:right}
.hdr-r .il{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px}
.hdr-r .inum{font-size:22px;font-weight:700;color:#1a1a2e}
.hdr-r .idate{font-size:13px;color:#64748b;margin-top:4px}
.bd{padding:30px 40px}
.parties{display:flex;justify-content:space-between;margin-bottom:30px}
.pty{flex:1}
.pty-lbl{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:700;margin-bottom:6px}
.pty-name{font-size:15px;font-weight:600;color:#1a1a2e}
.pty-dtl{font-size:12px;color:#475569;line-height:1.6}
.vbox{background:#f1f5f9;border-radius:8px;padding:16px 20px;margin-bottom:24px}
.vbox h3{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:10px}
.vt{width:100%;border-collapse:collapse}
.vt td{padding:4px 12px 4px 0;font-size:12px}
.vt .vl{color:#94a3b8;text-transform:uppercase;font-size:10px;font-weight:600;width:100px}
.vt .vv{color:#1a1a2e;font-weight:600;font-size:13px}
table.itm{width:100%;border-collapse:collapse;margin-bottom:24px}
table.itm thead th{text-align:left;padding:10px 16px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b;border-bottom:2px solid #e2e8f0}
table.itm thead th:last-child{text-align:right}
table.itm tbody td{padding:12px 16px;font-size:13px;color:#334155;border-bottom:1px solid #f1f5f9}
table.itm tbody td:last-child{text-align:right;font-weight:600}
.tots{display:flex;justify-content:flex-end;margin-bottom:24px}
.tots-b{width:280px}
.tr{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#475569}
.tr.total{border-top:2px solid #1a1a2e;padding-top:10px;margin-top:4px;font-size:16px;font-weight:700;color:#1a1a2e}
.tr.dep{color:#16a34a}
.tr.bal{font-weight:700;color:#6366f1;font-size:15px;border-top:1px solid #e2e8f0;padding-top:8px;margin-top:4px}
.ibox{border-radius:8px;padding:14px 20px;margin-bottom:16px}
.ibox h4{margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px}
.ibox p{margin:0;font-size:13px;color:#334155;white-space:pre-line}
.ibox.pay{background:#f0fdf4;border:1px solid #bbf7d0}
.ibox.pay h4{color:#16a34a}
.ibox.note{background:#fffbeb;border:1px solid #fde68a}
.ibox.note h4{color:#92400e}
.ftr{text-align:center;padding:20px 40px 30px;border-top:1px solid #e2e8f0}
.ftr p{font-size:11px;color:#94a3b8}
</style></head><body>
<div class="inv">
<div class="hdr"><div class="hdr-l"><h1>Apexpoint</h1><p>Vehicle Sales Invoice</p></div><div class="hdr-r"><div class="il">Invoice</div><div class="inum">${invNo}</div><div class="idate">${dateStr}</div></div></div>
<div class="bd">
<div class="parties"><div class="pty"><div class="pty-lbl">From</div><div class="pty-name">Apexpoint Pty Ltd</div><div class="pty-dtl">Melbourne, VIC, Australia</div></div><div class="pty"><div class="pty-lbl">Bill To</div><div class="pty-name">${record.buyerName || '--'}</div><div class="pty-dtl">${buyerLines || '--'}</div></div></div>
<div class="vbox"><h3>Vehicle Details</h3><table class="vt"><tr><td class="vl">Stock #</td><td class="vv">${stockNumber || '--'}</td><td class="vl">Vehicle</td><td class="vv">${vehicleDesc}</td></tr><tr><td class="vl">Colour</td><td class="vv">${colour}</td><td class="vl">Registration</td><td class="vv">${rego}</td></tr><tr><td class="vl">VIN</td><td class="vv">${vin}</td><td class="vl">Engine</td><td class="vv">${engine}</td></tr></table></div>
<table class="itm"><thead><tr><th>Description</th><th>Amount</th></tr></thead><tbody><tr><td>Vehicle Sale — ${vehicleDesc} (${rego})</td><td>$${priceExGST.toFixed(2)}</td></tr></tbody></table>
<div class="tots"><div class="tots-b">
<div class="tr"><span>Subtotal (ex GST)</span><span>$${priceExGST.toFixed(2)}</span></div>
${gstApplicable ? `<div class="tr"><span>GST (10%)</span><span>$${gstAmount.toFixed(2)}</span></div>` : '<div class="tr"><span>GST</span><span>N/A</span></div>'}
<div class="tr total"><span>Total</span><span>$${totalAmount.toFixed(2)}</span></div>
${depositAmount > 0 ? `<div class="tr dep"><span>Deposit Paid</span><span>-$${depositAmount.toFixed(2)}</span></div><div class="tr bal"><span>Balance Due</span><span>$${balanceDue.toFixed(2)}</span></div>` : ''}
</div></div>
${record.payMethod ? `<div class="ibox pay"><h4>Payment Method</h4><p>${record.payMethod}</p></div>` : ''}
${record.notes ? `<div class="ibox note"><h4>Notes</h4><p>${record.notes}</p></div>` : ''}
</div>
<div class="ftr"><p>Thank you for your business.</p><p>Apexpoint Pty Ltd &bull; Melbourne, VIC &bull; apexpoint.com.au</p></div>
</div></body></html>`;
  }

  @Post('/stats')
  async stats() {
    try {
      const data = await this.soldCompleteService.getStats();
      return this.ok(data);
    } catch (e) {
      return this.fail(e);
    }
  }
}
