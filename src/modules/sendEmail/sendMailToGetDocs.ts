const nodemailer = require('nodemailer');
// const puppeteer = require('puppeteer-core');
// const fs = require('fs');
const dotenv = require('dotenv');
const envFile =
  process.env.NODE_ENV === 'local' ? '.env.local' : '.env.production';
const pdf = require('html-pdf-chrome');
const AWS = require('aws-sdk');
dotenv.config({ path: envFile });

const fromEmail = process.env.EMAIL_FROM || `"We Pick Your Car" <${process.env.NODE_MAIL_USER}>`;
const logoUrl = 'https://apexpoint.com.au/api//public/uploads/20241213/0d016b43-6797-471a-bafc-0d57d5d1efbc_1734063663613.jpg';

// 邮件签名模板
const emailSignature = `
<div style="margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="vertical-align: top; padding-right: 20px;">
        <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
          <strong style="color: #2c5aa0;">Mason</strong><br/>
          <span style="color: #666;">General Manager</span><br/><br/>
          
          <img src="${logoUrl}" alt="We Pick Your Car" style="max-width: 200px; height: auto; margin: 10px 0;"/><br/>
          
          <strong style="color: #2c5aa0;">We Pick Your Car Pty Ltd</strong><br/><br/>
          
          <div style="color: #666; line-height: 1.4;">
            16-18 Tait Street,<br/>
            Smithfield, NSW 2164<br/><br/>
            
            <a href="mailto:Inquiry@wepickyourcar.com.au" style="color: #2c5aa0; text-decoration: none;">Inquiry@wepickyourcar.com.au</a><br/>
            M: <a href="tel:0406007000" style="color: #2c5aa0; text-decoration: none;">0406 007 000</a> | 
            P: <a href="tel:0297572321" style="color: #2c5aa0; text-decoration: none;">(02) 9757 2321</a>
          </div>
        </div>
      </td>
    </tr>
  </table>
</div>
`;
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

export async function saveS3(buffer) {
  // return {
  //   filename: 'Invoice.pdf',
  //   content: buffer, // 传入 PDF 的二进制数据
  //   contentType: 'application/pdf'
  // };
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
      contentType: 'application/pdf',
    };
  } catch (e) {
    attachment = {
      filename: 'Invoice.pdf',
      content: buffer, // 传入 PDF 的二进制数据
      contentType: 'application/pdf',
    };
  }
  return attachment;
}

export default async function getDocs({
  email,
  name,
  token,
  giveUploadBtn,
  attachment,
  sendBy,
  orderID
}) {
  let toEmail = '';
  // 配置 Nodemailer
  const transport = nodemailer.createTransport({
    pool: true,
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.NODE_MAIL_USER,
      pass: process.env.NODE_MAIL_PASS,
    },
    debug: true,
  });
  console.log(process.env.NODE_MAIL_USER, process.env.NODE_MAIL_PASS);
  if (email != null) {
    toEmail = email;
  }
  if (giveUploadBtn) {
    const mailOptions = {
      from: fromEmail,
      to: toEmail,
      subject: 'Proof materails requests from WePickYourCar',
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
        <p>Please click the link below to upload related Proof materails.</p>
        <p>Thank you for choosing our services.</p>
        <p>Please click <a href="https://apexpoint.com.au/customer_provide_files?token=${token}&oi=${orderID}" style="font-weight: bold;">here</a> to upload the documents.</p>
        
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
    subject: 'Invoice from WePickYourCar',
    text: `Invoice from WePickYourCar`,
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
