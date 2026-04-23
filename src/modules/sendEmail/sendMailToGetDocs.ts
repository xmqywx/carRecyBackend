const nodemailer = require('nodemailer');
const fs = require('fs');
const dotenv = require('dotenv');
const envFile =
  process.env.NODE_ENV === 'local' ? '.env.local' : '.env.production';
// Full `puppeteer` bundles its own Chromium — no system Chrome needed.
// Previously we used puppeteer-core + a chromePaths fallback list; that
// broke on production (snap chromium + pm2) so we moved to the bundled
// runtime. `PUPPETEER_EXECUTABLE_PATH` env is still honored if set.
const puppeteerCore = require('puppeteer');
const AWS = require('aws-sdk');
dotenv.config({ path: envFile });
import { normalizeSignatureImagesLeftAligned } from './utils/emailSignature';

// SMTP配置接口
export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

// 邮件模板配置接口
export interface EmailTemplateConfig {
  proofRequestSubject: string;
  invoiceSubject: string;
  signatureHtml: string;
}

// 默认配置（用于向后兼容）
const DEFAULT_SMTP_CONFIG: SmtpConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  user: process.env.NODE_MAIL_USER || '',
  pass: process.env.NODE_MAIL_PASS || '',
  fromName: 'We Pick Your Car',
  fromEmail: 'noreply@wepickyourcar.com.au',
};

// 默认邮件模板配置
const DEFAULT_EMAIL_TEMPLATE: EmailTemplateConfig = {
  proofRequestSubject: 'Proof materials request from WePickYourCar',
  invoiceSubject: 'Invoice from WePickYourCar',
  signatureHtml: `<p><span style="color: rgb(44, 90, 160);"><strong>Mason</strong></span><br><span style="color: rgb(102, 102, 102);">General Manager</span></p><p><img src="${process.env.EMAIL_LOGO_URL || 'https://apexpoint.com.au/api/public/pickYourCar.png'}" alt="We Pick Your Car" data-href="" style="width: 200px;height: auto;"/></p><p><span style="color: rgb(44, 90, 160);"><strong>We Pick Your Car Pty Ltd</strong></span><br><span style="color: rgb(102, 102, 102);">16-18 Tait Street, Smithfield, NSW 2164</span></p><p><a href="mailto:Inquiry@wepickyourcar.com.au" target="">Inquiry@wepickyourcar.com.au</a><br><span style="color: rgb(102, 102, 102);">M: </span><a href="tel:0406007000" target="">0406 007 000</a><span style="color: rgb(102, 102, 102);"> | P: </span><a href="tel:0297572321" target="">(02) 9757 2321</a></p>`,
};

// 前端域名，从环境变量读取，默认为线上地址
const frontendDomain = process.env.FRONTEND_DOMAIN || 'https://apexpoint.com.au';

// 获取邮件签名HTML
function getEmailSignature(template: EmailTemplateConfig): string {
  return normalizeSignatureImagesLeftAligned(template.signatureHtml || '');
}
AWS.config.update({
  region: process.env.NODE_REGION,
  accessKeyId: process.env.NODE_ACCESS_KEY_ID,
  secretAccessKey: process.env.NODE_SECRET_ACCESSKEY,
});
const s3 = new AWS.S3();

export async function outPutPdf({ textToSend }) {
  const html = `<html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
      <style>
        * {
          padding: 0;
          margin: 0;
        }
        main {
          margin: auto;
          width: 100%;
        }
        
        .to-upload a {
          /* display: block; */
          float: left;
          line-height: 50px;
          padding: 0px 20px;
          color: #FFF;
          font-weight: 500;
          background-color: chocolate;
          text-decoration: none;
        }
    
        a:hover {
          opacity: 0.8;
        }
    
        p, pre {
          // text-indent: 2em;
          white-space: pre-wrap;
          word-break: break-all;
        }
        pre {
          font-size: 14px;
          color: #000000;
        }
    
        .to-upload {}
        img {
          display: block;
          width: 300px;
          max-height: 300px;
          margin: auto;
        }
        .no-show {
          display: none;
        }
        .show {
          display: block;
        }
        .key {
          font-size: 14px;
          font-weight: bold;
          color: #000000;
        }
        
        .value {
            font-size: 14px;
            color: #000000;
        }
      
      </style>
    </head>
    
    <body>
      <main>
        <div>${textToSend}</div>
      </main>
    </body>
    </html>`;
  // puppeteer bundles Chromium; no system-path fallback needed. Honor
  // PUPPETEER_EXECUTABLE_PATH when explicitly set (e.g. custom container
  // image). Launch args stay aggressive for unprivileged container runs.
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
  const browser = await puppeteerCore.launch(launchOptions);
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4', landscape: true });
  await browser.close();
  return pdfBuffer;
}

const path = require('path');

/**
 * 保存PDF到本地 (dev环境)
 */
export async function saveLocal(buffer) {
  const invoicesDir = path.join(process.cwd(), 'public', 'invoices');
  // 确保目录存在
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
  }
  const filename = `invoice-${Date.now()}.pdf`;
  const filePath = path.join(invoicesDir, filename);
  fs.writeFileSync(filePath, buffer);
  // 返回本地访问URL
  const localUrl = `/public/invoices/${filename}`;
  return {
    filename: 'Invoice.pdf',
    path: filePath,
    url: localUrl,
    contentType: 'application/pdf',
  };
}

/**
 * 保存PDF到S3 (production环境)
 */
export async function saveS3(buffer) {
  let attachment;
  try {
    const s3Params = {
      Bucket: 'pickcar',
      Key: `invoices/invoice-${Date.now()}.pdf`,
      Body: buffer,
      ContentType: 'application/pdf',
    };
    const s3Upload = await s3.upload(s3Params).promise();
    const pdfUrl = s3Upload.Location;
    attachment = {
      filename: 'Invoice.pdf',
      path: pdfUrl,
      url: pdfUrl,
      contentType: 'application/pdf',
    };
  } catch (e) {
    console.error('S3 upload failed, falling back to buffer:', e);
    attachment = {
      filename: 'Invoice.pdf',
      content: buffer,
      contentType: 'application/pdf',
    };
  }
  return attachment;
}

/**
 * 根据环境保存PDF
 * dev环境保存到本地，production环境上传到S3
 */
export async function savePdf(buffer) {
  const isLocal = process.env.NODE_ENV === 'local';
  if (isLocal) {
    return await saveLocal(buffer);
  } else {
    return await saveS3(buffer);
  }
}

// Email kind controls which template body is rendered. When omitted, falls
// back to legacy giveUploadBtn semantics (true → docRequest, false → invoice
// with PDF attachment) for backwards compatibility with any caller that hasn't
// been updated yet.
export type EmailKind = 'quote' | 'docRequest' | 'cancellation' | 'invoice';

// Subset of joined order data the email templates render. Controller is
// responsible for fetching from order + customer + car + job tables.
export interface BookingEmailData {
  vehicleLabel?: string;     // e.g. "Toyota Corolla 2010"
  registrationNumber?: string;
  vinNumber?: string;
  quoteAmount?: number | string;   // number for fixed quote, string label for negotiable range
  quoteType?: string;        // 'Fixed' | 'Negotiable'
  totalAmount?: number;      // for invoice
  payMethod?: string;        // for invoice
  pickupAddress?: string;
}

export default async function getDocs({
  email,
  name,
  token,
  giveUploadBtn,
  attachment,
  sendBy,
  orderID,
  smtpConfig,
  emailTemplate,
  emailKind,
  bookingData,
}: {
  email: string;
  name: string;
  token: string;
  giveUploadBtn: boolean;
  attachment?: any;
  sendBy: string;
  orderID: number;
  smtpConfig?: SmtpConfig;
  emailTemplate?: EmailTemplateConfig;
  emailKind?: EmailKind;
  bookingData?: BookingEmailData;
}) {
  // 使用传入的配置或默认配置
  const config = smtpConfig || DEFAULT_SMTP_CONFIG;
  const template = emailTemplate || DEFAULT_EMAIL_TEMPLATE;
  // 使用登录用户名作为发件地址（大多数SMTP服务器会强制使用登录账号）
  const fromEmail = `"${config.fromName}" <${config.user}>`;
  const emailSignature = getEmailSignature(template);

  let toEmail = '';
  // 配置 Nodemailer
  const transport = nodemailer.createTransport({
    pool: true,
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 30000,
    socketTimeout: 30000,
    debug: true,
  });
  console.log('SMTP Config:', config.host, config.port, config.user);
  if (email != null) {
    toEmail = email;
  }

  // Status-based dispatch (added 2026-04-23). When emailKind is provided, take
  // the explicit template path. The legacy giveUploadBtn branches below remain
  // for any caller that hasn't been migrated yet.
  if (emailKind === 'quote') {
    return sendEmail(transport, {
      from: fromEmail,
      to: toEmail,
      subject: `Quote from We Pick Your Car${bookingData?.vehicleLabel ? ' — ' + bookingData.vehicleLabel : ''}`,
      html: buildQuoteEmailHtml(name, bookingData, emailSignature),
    }, {});
  }
  if (emailKind === 'cancellation') {
    return sendEmail(transport, {
      from: fromEmail,
      to: toEmail,
      subject: `Update on your booking with We Pick Your Car${bookingData?.vehicleLabel ? ' — ' + bookingData.vehicleLabel : ''}`,
      html: buildCancellationEmailHtml(name, bookingData, emailSignature),
    }, {});
  }
  if (emailKind === 'invoice') {
    const mailOpts: any = {
      from: fromEmail,
      to: toEmail,
      subject: `Invoice from We Pick Your Car${bookingData?.vehicleLabel ? ' — ' + bookingData.vehicleLabel : ''}`,
      html: buildInvoiceEmailHtml(name, bookingData, emailSignature),
    };
    if (attachment && (attachment.path || attachment.content)) mailOpts.attachments = [attachment];
    return sendEmail(transport, mailOpts, attachment || {});
  }
  if (emailKind === 'docRequest') {
    // Same template as the legacy giveUploadBtn=true branch — kept inline so
    // the new explicit path doesn't depend on the legacy flag.
    return sendEmail(transport, {
      from: fromEmail,
      to: toEmail,
      subject: template.proofRequestSubject,
      html: buildDocRequestEmailHtml(name, frontendDomain, token, orderID, emailSignature),
    }, {});
  }

  if (giveUploadBtn) {
    const mailOptions = {
      from: fromEmail,
      to: toEmail,
      subject: template.proofRequestSubject,
      html: `
        <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
      <style>
        main {
          margin: auto;
          width: 100%;
        }
    
        .to-upload a {
          /* display: block; */
          float: left;
          line-height: 50px;
          padding: 0px 20px;
          color: #FFF;
          font-weight: 500;
          background-color: chocolate;
          text-decoration: none;
        }
    
        a:hover {
          opacity: 0.8;
        }
    
        p, pre {
          // text-indent: 2em;
          white-space: pre-wrap;
          word-break: break-all;
        }
    
        .to-upload {}
        img {
          display: block;
          width: 300px;
          max-height: 300px;
          margin: auto;
        }
        .no-show {
          display: none;
        }
        .show {
          display: block;
        }
      </style>
    </head>
    
    <body>
      <main>
        <p>Dear ${name},</p>
        <br />
        <p>Please click the link below to upload related Proof materials.</p>
        <p>Thank you for choosing our services.</p>
        <p>Please click <a href="${frontendDomain}/customer_provide_files?token=${token}&oi=${orderID}" style="font-weight: bold;">here</a> to upload the documents.</p>
        
        ${emailSignature}
      </main>
    </body>
    </html>
        `,
    };

    return sendEmail(transport, mailOptions, {});
  }

  const mailOptions = {
    from: fromEmail,
    to: toEmail,
    subject: template.invoiceSubject,
    text: template.invoiceSubject,
    attachments: [attachment],
    html: `
        <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
      <style>
        main {
          margin: auto;
          width: 100%;
        }
    
        .to-upload a {
          /* display: block; */
          float: left;
          line-height: 50px;
          padding: 0px 20px;
          color: #FFF;
          font-weight: 500;
          background-color: chocolate;
          text-decoration: none;
        }
    
        a:hover {
          opacity: 0.8;
        }
    
        p, pre {
          // text-indent: 2em;
          white-space: pre-wrap;
          word-break: break-all;
        }
    
        .to-upload {}
        img {
          display: block;
          width: 300px;
          max-height: 300px;
          margin: auto;
        }
        .no-show {
          display: none;
        }
        .show {
          display: block;
        }
      </style>
    </head>
    
    <body>
      <main>
      <p>Dear ${name},</p>
      <br />
      <p>Please see attached invoice for your car.</p>
      <p>Thank you for choosing our services.</p>
      
      ${emailSignature}
      </main>
    </body>
    </html>
        `,
  };

  return sendEmail(transport, mailOptions, attachment);
}

async function sendEmail(transport, mailOptions, otherData) {
  try {
    const info = await transport.sendMail(mailOptions);
    console.log('邮件已发送: %s', info.messageId);
    return { ...info, ...otherData, status: 'success' };
  } catch (error) {
    console.error('发送发票邮件时出错: %s', error);
    return { error, status: 'failure' };
  }
}

// ────────── Email body templates (status-based dispatch) ──────────

const baseEmailStyle = `
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #1a1a2e; }
    main { max-width: 640px; margin: auto; padding: 16px; }
    p { line-height: 1.5; }
    .veh-box { margin: 12px 0; padding: 10px 14px; background: #fdf6e3; border-left: 3px solid #f59e0b; }
    .quote-amount { font-size: 22px; font-weight: 700; color: #16a34a; margin: 6px 0 0; }
    .totals { margin: 12px 0; padding: 10px 14px; background: #f1f5f9; border-radius: 6px; }
    .totals .row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 14px; }
    .totals .row.total { border-top: 1px solid #cbd5e1; margin-top: 6px; padding-top: 6px; font-weight: 700; font-size: 16px; }
  </style>
`;

function fmtMoney(v: any): string {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return `$${n.toFixed(2)}`;
}

function vehicleBlock(b?: BookingEmailData): string {
  if (!b) return '';
  const lines: string[] = [];
  if (b.vehicleLabel) lines.push(`<strong>${b.vehicleLabel}</strong>`);
  if (b.registrationNumber) lines.push(`Rego: ${b.registrationNumber}`);
  if (b.vinNumber) lines.push(`VIN: ${b.vinNumber}`);
  if (!lines.length) return '';
  return `<div class="veh-box">${lines.join('<br/>')}</div>`;
}

function buildQuoteEmailHtml(name: string, b: BookingEmailData | undefined, signature: string): string {
  const isFixed = (b?.quoteType || 'Fixed') !== 'Negotiable';
  const amountLabel = isFixed
    ? fmtMoney(b?.quoteAmount)
    : (typeof b?.quoteAmount === 'string' ? b.quoteAmount : 'Negotiable');
  return `<html><head><meta charset="UTF-8">${baseEmailStyle}</head><body><main>
    <p>Dear ${name || 'Customer'},</p>
    <p>Thank you for getting in touch with We Pick Your Car. Below is our quote for your vehicle:</p>
    ${vehicleBlock(b)}
    <p>Our offer:</p>
    <p class="quote-amount">${amountLabel}</p>
    <p>Please reply to this email to confirm or let us know if you'd like to discuss further. Once confirmed we'll arrange a suitable pickup time.</p>
    ${signature}
  </main></body></html>`;
}

function buildCancellationEmailHtml(name: string, b: BookingEmailData | undefined, signature: string): string {
  return `<html><head><meta charset="UTF-8">${baseEmailStyle}</head><body><main>
    <p>Dear ${name || 'Customer'},</p>
    <p>Thank you for considering We Pick Your Car. Unfortunately we won't be able to proceed with the booking for the vehicle below at this time:</p>
    ${vehicleBlock(b)}
    <p>If your circumstances change, or if you'd like a fresh quote on the same or another vehicle, we'd be happy to hear from you again.</p>
    <p>Thank you for getting in touch.</p>
    ${signature}
  </main></body></html>`;
}

function buildInvoiceEmailHtml(name: string, b: BookingEmailData | undefined, signature: string): string {
  const total = fmtMoney(b?.totalAmount);
  return `<html><head><meta charset="UTF-8">${baseEmailStyle}</head><body><main>
    <p>Dear ${name || 'Customer'},</p>
    <p>Please find your invoice for the vehicle pickup below.</p>
    ${vehicleBlock(b)}
    <div class="totals">
      <div class="row total"><span>Total Paid</span><span>${total}</span></div>
      ${b?.payMethod ? `<div class="row"><span>Payment Method</span><span>${b.payMethod}</span></div>` : ''}
    </div>
    <p>Thank you for choosing We Pick Your Car.</p>
    ${signature}
  </main></body></html>`;
}

function buildDocRequestEmailHtml(name: string, frontendDomain: string, token: string, orderID: number, signature: string): string {
  return `<html><head><meta charset="UTF-8">${baseEmailStyle}</head><body><main>
    <p>Dear ${name || 'Customer'},</p>
    <p>Please click the link below to upload related Proof materials.</p>
    <p>Thank you for choosing our services.</p>
    <p>Please click <a href="${frontendDomain}/customer_provide_files?token=${token}&oi=${orderID}" style="font-weight: bold;">here</a> to upload the documents.</p>
    ${signature}
  </main></body></html>`;
}
