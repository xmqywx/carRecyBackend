const nodemailer = require('nodemailer');
// const puppeteer = require('puppeteer-core');
// const fs = require('fs');
const dotenv = require('dotenv');
const envFile =
  process.env.NODE_ENV === 'local' ? '.env.local' : '.env.production';
const pdf = require('html-pdf-chrome');
const AWS = require('aws-sdk');
dotenv.config({ path: envFile });

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
  signatureHtml: `<p><span style="color: rgb(44, 90, 160);"><strong>Mason</strong></span><br><span style="color: rgb(102, 102, 102);">General Manager</span></p><p><img src="https://apexpoint.com.au/api/public/uploads/20241213/0d016b43-6797-471a-bafc-0d57d5d1efbc_1734063663613.jpg" alt="We Pick Your Car" data-href="" style="width: 150px;height: 78px;"/></p><p><span style="color: rgb(44, 90, 160);"><strong>We Pick Your Car Pty Ltd</strong></span><br><span style="color: rgb(102, 102, 102);">16-18 Tait Street, Smithfield, NSW 2164</span></p><p><a href="mailto:Inquiry@wepickyourcar.com.au" target="">Inquiry@wepickyourcar.com.au</a><br><span style="color: rgb(102, 102, 102);">M: </span><a href="tel:0406007000" target="">0406 007 000</a><span style="color: rgb(102, 102, 102);"> | P: </span><a href="tel:0297572321" target="">(02) 9757 2321</a></p>`,
};

// 前端域名，从环境变量读取，默认为线上地址
const frontendDomain = process.env.FRONTEND_DOMAIN || 'https://apexpoint.com.au';

// 获取邮件签名HTML
function getEmailSignature(template: EmailTemplateConfig): string {
  return template.signatureHtml || '';
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
  const options = {
    landscape: true,
    format: 'A4',
  };
  const htmlPdf = await pdf.create(html, options);
  return await htmlPdf.toBuffer();
}

const fs = require('fs');
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
