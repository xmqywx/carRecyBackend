import { Provide, Inject } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { SoldCompleteEntity } from '../entity/soldComplete';
import { CarEntity } from '../entity/base';
import * as nodemailer from 'nodemailer';
import { SmtpConfigService } from '../../sendEmail/service/smtpConfig';
import { EmailLogService } from '../../emailLog/service/emailLog';

@Provide()
export class SoldCompleteEmailService extends BaseService {
  @InjectEntityModel(SoldCompleteEntity)
  soldCompleteRepo: Repository<SoldCompleteEntity>;

  @InjectEntityModel(CarEntity)
  carRepo: Repository<CarEntity>;

  @Inject()
  smtpConfigService: SmtpConfigService;

  @Inject()
  emailLogService: EmailLogService;

  /**
   * Generate invoice number: SC-INV-YYYY-XXXX
   */
  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.soldCompleteRepo
      .createQueryBuilder('sc')
      .where('sc.invoiceNumber IS NOT NULL')
      .andWhere('sc.invoiceNumber LIKE :prefix', { prefix: `SC-INV-${year}-%` })
      .getCount();
    const seq = String(count + 1).padStart(4, '0');
    return `SC-INV-${year}-${seq}`;
  }

  /**
   * Generate invoice HTML for sold-complete vehicle sale.
   */
  generateInvoiceHtml(record: SoldCompleteEntity, car: CarEntity, stockNumber?: string): string {
    const now = record.invoiceDate ? new Date(record.invoiceDate) : new Date();
    const dateStr = now.toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' });
    const invNo = record.invoiceNumber || '--';

    const priceExGST = Number(record.priceExGST) || 0;
    const gstAmount = Number(record.gstAmount) || 0;
    const totalAmount = Number(record.totalAmount) || 0;
    const depositAmount = Number(record.depositAmount) || 0;
    const balanceDue = totalAmount - depositAmount;
    const gstApplicable = record.gstApplicable === 1;

    const buyerDetailLines = [
      record.buyerCompany,
      record.buyerPhone ? `Phone: ${record.buyerPhone}` : null,
      record.buyerEmail ? `Email: ${record.buyerEmail}` : null,
      record.buyerAddress,
      record.buyerABN ? `ABN: ${record.buyerABN}` : null,
    ].filter(Boolean).join('<br>');

    const vehicleDesc = [car.year, car.brand, car.model].filter(Boolean).join(' ');

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; margin: 0; padding: 0; background: #fff; }
  .invoice { max-width: 800px; margin: 0 auto; background: #fff; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding: 40px 40px 20px; border-bottom: 3px solid #6366f1; }
  .header-left h1 { margin: 0; font-size: 28px; color: #6366f1; letter-spacing: -0.5px; }
  .header-left p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
  .header-right { text-align: right; }
  .header-right .inv-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
  .header-right .inv-number { font-size: 22px; font-weight: 700; color: #1a1a2e; }
  .header-right .inv-date { font-size: 13px; color: #64748b; margin-top: 4px; }
  .body { padding: 30px 40px; }
  .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
  .party { flex: 1; }
  .party-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700; margin-bottom: 6px; }
  .party-name { font-size: 15px; font-weight: 600; color: #1a1a2e; }
  .party-detail { font-size: 12px; color: #475569; line-height: 1.6; }
  .vehicle-box { background: #f1f5f9; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; }
  .vehicle-box h3 { margin: 0 0 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
  .vg-table { width: 100%; border-collapse: collapse; }
  .vg-table td { padding: 4px 12px 4px 0; font-size: 12px; }
  .vg-table .vg-label { color: #94a3b8; text-transform: uppercase; font-size: 10px; font-weight: 600; width: 100px; }
  .vg-table .vg-value { color: #1a1a2e; font-weight: 600; font-size: 13px; }
  table.items { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  table.items thead th { text-align: left; padding: 10px 16px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; border-bottom: 2px solid #e2e8f0; }
  table.items thead th:last-child { text-align: right; }
  table.items tbody td { padding: 12px 16px; font-size: 13px; color: #334155; border-bottom: 1px solid #f1f5f9; }
  table.items tbody td:last-child { text-align: right; font-weight: 600; }
  .totals { display: flex; justify-content: flex-end; margin-bottom: 24px; }
  .totals-box { width: 280px; }
  .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #475569; }
  .totals-row.total { border-top: 2px solid #1a1a2e; padding-top: 10px; margin-top: 4px; font-size: 16px; font-weight: 700; color: #1a1a2e; }
  .totals-row.deposit { color: #16a34a; }
  .totals-row.balance { font-weight: 700; color: #6366f1; font-size: 15px; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 4px; }
  .info-box { border-radius: 8px; padding: 14px 20px; margin-bottom: 16px; }
  .info-box h4 { margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
  .info-box p { margin: 0; font-size: 13px; color: #334155; white-space: pre-line; }
  .info-box.payment { background: #f0fdf4; border: 1px solid #bbf7d0; }
  .info-box.payment h4 { color: #16a34a; }
  .info-box.notes { background: #fffbeb; border: 1px solid #fde68a; }
  .info-box.notes h4 { color: #92400e; }
  .footer { text-align: center; padding: 20px 40px 30px; border-top: 1px solid #e2e8f0; }
  .footer p { margin: 0; font-size: 11px; color: #94a3b8; }
</style></head>
<body>
<div class="invoice">
  <div class="header">
    <div class="header-left">
      <h1>Apexpoint</h1>
      <p>Vehicle Sales Invoice</p>
    </div>
    <div class="header-right">
      <div class="inv-label">Invoice</div>
      <div class="inv-number">${invNo}</div>
      <div class="inv-date">${dateStr}</div>
    </div>
  </div>
  <div class="body">
    <div class="parties">
      <div class="party">
        <div class="party-label">From</div>
        <div class="party-name">Apexpoint Pty Ltd</div>
        <div class="party-detail">Melbourne, VIC, Australia</div>
      </div>
      <div class="party">
        <div class="party-label">Bill To</div>
        <div class="party-name">${record.buyerName || '--'}</div>
        <div class="party-detail">${buyerDetailLines || '--'}</div>
      </div>
    </div>
    <div class="vehicle-box">
      <h3>Vehicle Details</h3>
      <table class="vg-table">
        <tr><td class="vg-label">Stock #</td><td class="vg-value">${stockNumber || '--'}</td><td class="vg-label">Vehicle</td><td class="vg-value">${vehicleDesc || '--'}</td></tr>
        <tr><td class="vg-label">Colour</td><td class="vg-value">${car.colour || '--'}</td><td class="vg-label">Registration</td><td class="vg-value">${car.registrationNumber || '--'}</td></tr>
        <tr><td class="vg-label">VIN</td><td class="vg-value">${car.vinNumber || '--'}</td><td class="vg-label">Engine</td><td class="vg-value">${(car as any).engine || '--'}</td></tr>
      </table>
    </div>
    <table class="items">
      <thead><tr><th>Description</th><th>Amount</th></tr></thead>
      <tbody>
        <tr><td>Vehicle Sale — ${vehicleDesc} (${car.registrationNumber || 'N/A'})</td><td>$${priceExGST.toFixed(2)}</td></tr>
      </tbody>
    </table>
    <div class="totals">
      <div class="totals-box">
        <div class="totals-row"><span>Subtotal (ex GST)</span><span>$${priceExGST.toFixed(2)}</span></div>
        ${gstApplicable ? `<div class="totals-row"><span>GST (10%)</span><span>$${gstAmount.toFixed(2)}</span></div>` : '<div class="totals-row"><span>GST</span><span>N/A</span></div>'}
        <div class="totals-row total"><span>Total</span><span>$${totalAmount.toFixed(2)}</span></div>
        ${depositAmount > 0 ? `<div class="totals-row deposit"><span>Deposit Paid</span><span>-$${depositAmount.toFixed(2)}</span></div>` : ''}
        ${depositAmount > 0 ? `<div class="totals-row balance"><span>Balance Due</span><span>$${balanceDue.toFixed(2)}</span></div>` : ''}
      </div>
    </div>
    ${record.payMethod ? `<div class="info-box payment"><h4>Payment Method</h4><p>${record.payMethod}</p></div>` : ''}
    ${record.notes ? `<div class="info-box notes"><h4>Notes</h4><p>${record.notes}</p></div>` : ''}
  </div>
  <div class="footer">
    <p>Thank you for your business.</p>
    <p>Apexpoint Pty Ltd &bull; Melbourne, VIC &bull; apexpoint.com.au</p>
  </div>
</div>
</body></html>`;
  }

  /**
   * Get invoice HTML preview (without sending).
   */
  async getInvoicePreview(carID: number): Promise<string> {
    const record = await this.soldCompleteRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No sold-complete record for car ${carID}`);

    const car = await this.carRepo.findOne({ where: { id: carID } });
    if (!car) throw new Error(`Car ${carID} not found`);

    const stockResult = await this.nativeQuery(
      'SELECT quoteNumber FROM `order` WHERE carID = ? LIMIT 1', [carID]
    );
    const stockNumber = stockResult?.[0]?.quoteNumber;

    // Auto-generate invoice number for preview if not set
    if (!record.invoiceNumber) {
      record.invoiceNumber = await this.generateInvoiceNumber();
      record.invoiceDate = new Date();
    }

    return this.generateInvoiceHtml(record, car, stockNumber);
  }

  /**
   * Send invoice email to buyer.
   */
  async sendInvoice(carID: number): Promise<{ pdfUrl: string; invoiceNumber: string }> {
    const record = await this.soldCompleteRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No sold-complete record for car ${carID}`);
    if (!record.buyerEmail) throw new Error('Buyer email is required to send invoice');

    const car = await this.carRepo.findOne({ where: { id: carID } });
    if (!car) throw new Error(`Car ${carID} not found`);

    // Get stock number
    const stockResult = await this.nativeQuery(
      'SELECT quoteNumber FROM `order` WHERE carID = ? LIMIT 1', [carID]
    );
    const stockNumber = stockResult?.[0]?.quoteNumber;

    // Auto-generate invoice number if not set
    if (!record.invoiceNumber) {
      record.invoiceNumber = await this.generateInvoiceNumber();
      record.invoiceDate = new Date();
      await this.soldCompleteRepo.update(record.id, {
        invoiceNumber: record.invoiceNumber,
        invoiceDate: record.invoiceDate,
      });
    }

    // Generate invoice HTML
    const invoiceHtml = this.generateInvoiceHtml(record, car, stockNumber);

    // Try to generate PDF
    let pdfBuffer: Buffer | null = null;
    try {
      const puppeteer = require('puppeteer');
      const launchOptions: any = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
        ],
      };
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      }
      const browser = await puppeteer.launch(launchOptions);
      const page = await browser.newPage();
      await page.setContent(invoiceHtml, { waitUntil: 'networkidle0' });
      pdfBuffer = await page.pdf({ format: 'A4' });
      await browser.close();
    } catch (e) {
      console.warn('PDF generation failed:', e.message);
    }

    // Save PDF & build attachment
    let pdfUrl = record.invoicePdfUrl || '';
    let attachment: any = null;

    if (pdfBuffer) {
      // Got a fresh PDF buffer — save it (local or S3) and use as attachment
      try {
        const { savePdf } = require('../../sendEmail/sendMailToGetDocs');
        const saved = await savePdf(pdfBuffer);
        // savePdf returns { filename, path, url, contentType } or { filename, content, contentType }
        pdfUrl = saved.url || saved.path || '';
        attachment = {
          filename: `${record.invoiceNumber}.pdf`,
          ...(saved.content ? { content: saved.content } : { path: saved.path }),
          contentType: 'application/pdf',
        };
        await this.soldCompleteRepo.update(record.id, { invoicePdfUrl: pdfUrl });
      } catch (e) {
        console.warn('PDF save failed, attaching buffer directly:', e.message);
        attachment = {
          filename: `${record.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        };
      }
    } else if (pdfUrl) {
      // No fresh PDF but we have a previously saved URL — use it
      attachment = {
        filename: `${record.invoiceNumber}.pdf`,
        path: pdfUrl,
        contentType: 'application/pdf',
      };
    }

    // Get SMTP config
    const smtpConfig = await this.smtpConfigService.getConfig();
    const emailTemplate = await this.smtpConfigService.getEmailTemplate();

    // Create transport
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: { user: smtpConfig.user, pass: smtpConfig.pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 30000,
      socketTimeout: 30000,
    } as any);

    const vehicleDesc = [car.year, car.brand, car.model].filter(Boolean).join(' ');
    const totalAmount = Number(record.totalAmount) || 0;
    const depositAmount = Number(record.depositAmount) || 0;

    // Build email — if no PDF attachment, send the full invoice as HTML body
    const emailBody = attachment
      ? `<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
          <p>Dear ${record.buyerName || 'Customer'},</p>
          <p>Please find attached your invoice <strong>${record.invoiceNumber}</strong> for the purchase of
          <strong>${vehicleDesc}</strong>
          (Rego: ${car.registrationNumber || 'N/A'}).</p>
          <p><strong>Total Amount: $${totalAmount.toFixed(2)}</strong></p>
          ${depositAmount > 0 ? `<p>Deposit Paid: $${depositAmount.toFixed(2)}<br>Balance Due: $${(totalAmount - depositAmount).toFixed(2)}</p>` : ''}
          <p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
          <br>
          ${emailTemplate?.signatureHtml || ''}
        </div>`
      : `<div style="font-family: Arial, sans-serif; color: #333;">
          <p>Dear ${record.buyerName || 'Customer'},</p>
          <p>Please see your invoice below for the purchase of
          <strong>${vehicleDesc}</strong> (Rego: ${car.registrationNumber || 'N/A'}).</p>
          <br>
          ${invoiceHtml}
          <br>
          ${emailTemplate?.signatureHtml || ''}
        </div>`;

    const mailOptions: any = {
      from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
      to: record.buyerEmail,
      subject: `Invoice ${record.invoiceNumber} — Vehicle Sale`,
      html: emailBody,
    };

    if (attachment) {
      mailOptions.attachments = [attachment];
    }

    // Send
    let emailStatus: 'success' | 'failed' = 'success';
    let errorMessage = '';
    try {
      await transporter.sendMail(mailOptions);
    } catch (e) {
      emailStatus = 'failed';
      errorMessage = e.message;
      throw new Error(`Email send failed: ${e.message}`);
    } finally {
      // Update record
      if (emailStatus === 'success') {
        await this.soldCompleteRepo.update(record.id, {
          emailSent: 1,
          emailSentAt: new Date(),
        });
      }

      // Log
      try {
        await this.emailLogService.saveLog({
          orderId: carID,
          emailType: 'invoice',
          recipients: [record.buyerEmail],
          subject: mailOptions.subject,
          contentData: {
            invoiceNumber: record.invoiceNumber,
            buyer: { name: record.buyerName, email: record.buyerEmail },
            vehicle: { rego: car.registrationNumber, make: car.brand, model: car.model, year: car.year },
            payment: { totalAmount: record.totalAmount, priceExGST: record.priceExGST, gstAmount: record.gstAmount },
          },
          pdfUrl,
          sentBy: 'App',
          operatorName: 'system',
          status: emailStatus,
          errorMessage,
        });
      } catch { /* log failure should not block */ }
    }

    return { pdfUrl, invoiceNumber: record.invoiceNumber };
  }
}
