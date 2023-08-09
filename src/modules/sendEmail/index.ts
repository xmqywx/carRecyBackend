const moment = require("moment");
const AWS = require('aws-sdk');
const nodemailer = require('nodemailer');
// const puppeteer = require('puppeteer-core');
// const fs = require('fs');
const dotenv = require('dotenv');
const envFile = process.env.NODE_ENV === 'prod' ? '.env.production' : '.env.local';
const pdf = require('html-pdf-chrome');
dotenv.config({ path: envFile });
// 配置 AWS SDK
AWS.config.update({
  region: process.env.NODE_REGION,
  accessKeyId: process.env.NODE_ACCESS_KEY_ID,
  secretAccessKey: process.env.NODE_SECRET_ACCESSKEY
});

// 创建 S3 实例
const s3 = new AWS.S3();
// 创建ses 实例
// const ses = new AWS.SES();
// 电子邮件发送者和接收者
const fromEmail = process.env.NODE_MAIL_USER;
const logoUrl = "http://13.54.137.62/pickYourCar.png";

export default async function main({name, price, id, email, invoicePdf = null, info}) {
  console.log(invoicePdf);
  let toEmail = '';
  // 配置 Nodemailer
  const transport = nodemailer.createTransport({
    // host: "smtp.gmail.com", // 第三方邮箱的主机地址
    // port: 465,
    // secure: true, // true for 465, false for other ports
    // // service: 'Gmail', // 使用 Gmail 作为示例，您可以更改为其他服务
    // auth: {
    //   user: "laurentliu0918@gmail.com", // 发送方邮箱的账号
    //   pass: "qxtevaozxibvalxj",
    // },
    //     auth: {
    //         user: "laurentliu0918@gmail.com", // 发送方邮箱的账号
    //         pass: "qxtevaozxibvalxj", // 邮箱授权密码
    //     },
    host: "smtp.qq.com",
    pool: true,
    port: 465,
    secure: true,
    auth: {
      user: process.env.NODE_MAIL_USER,
      pass: process.env.NODE_MAIL_PASS,
    },
    debug: true,
  });
  if(email != null) {
    toEmail = email;
  }
  if(invoicePdf !== null) {
    const mailOptions = {
      from: fromEmail,
      to: toEmail,
      subject: 'Your invoice',
      text: 'Please accept your invoice.' + invoicePdf,
      // attachments: [
      //   {
      //     filename: 'invoice.pdf',
      //     path: invoicePdf
      //   }
      // ]
    };
  
    try {
      const info = await transport.sendMail(mailOptions);
      console.log('发票邮件已发送: %s', info.messageId);
      console.log(invoicePdf);
      return {...info, status: 'success'};
    } catch (error) {
      console.error('发送发票邮件时出错: %s', error);
      return {error, status: 'failure'};
    }
    // return;
  }
  const currentTime = moment().format('DD-MM-YYYY');
  const myName = "We pick your car";
  // const qty = 1;
  // const gst = info.gst;
  // let itemTotalPrice = qty * price - gst;
  // let subtotal = itemTotalPrice;
  // let Total = itemTotalPrice;
  // let adjustments = 0;
  let invoiceNumber = id.toString().padStart(6, "0");
  // HTML 发票模板
const invoiceHtml = `
<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>发票</title>
        <style>
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            --custom-color: #820EB9;
            --custom-txt:  #666;
          }
          #invoice {
            margin: 0 auto;
            max-width: 800px;
            padding: 30px;
            border: 1px solid #ccc;
          }
          #invoice h1 {
            font-size: 28px;
            margin-bottom: 15px;
          }
          #invoice .date {
            font-size: 12px;
            /* color: #666; */
          }
          #invoice table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          #invoice table th {
            background-color: #eee;
            padding: 5px;
            text-align: left;
          }
          #invoice table td {
            padding: 5px;
            border: 1px solid #ccc;
          }
          #invoice table tr:nth-child(even) td {
            background-color: #f0f0f0;
          }
          #invoice .total {
            margin-top: 20px;
            text-align: right;
          }
          .sbt {
            display: flex;
            gap: 30px;
          }
          dd {
            margin: 0;
            color: var(--custom-txt);
          }
          .themecolor {
            color: var(--custom-color);
            font-weight: 700;
          }
          .logo {
            width: 200px;
          }
        </style>
      </head>
      <body>
        <div id="invoice">

          <h1>We Pick Your Car Invoice</h1>
          <div class="date themecolor">Issued on: ${currentTime}</div>
          <div class="sbt">
            <img class="logo" src=${logoUrl} alt="">
            <dl>
              <dt>Invoice to</dt>
              <dd>${name}</dd>
              <dd>${email}</dd>
            </dl>
            <dl>
              <dt>Payable to</dt>
              <dd>${myName}</dd>
            </dl>
            <dl>
              <dt>Company name</dt>
              <dd>We Pick Your Car</dd>
            </dl>
            <dl>
              <dt>Invoice #</dt>
              <dd>${invoiceNumber}</dd>
            </dl>
          </div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
                <th>Price (ex GST)</th>
                <th>Gst</th>
                <th>Price (inc GST)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>recovery vehicle</td>
                <td>${info.totalAmount}</td>
                <td>$${info.priceExGST}</td>
                <td>$${info.gst}</td>
                <td>$${info.gstAmount}</td>
              </tr>
              <!-- <tr>
                <td>商品2</td>
                <td>1</td>
                <td>100.00</td>
                <td>100.00</td>
              </tr>
              <tr>
                <td>商品3</td>
                <td>3</td>
                <td>30.00</td>
                <td>90.00</td>
              </tr> -->
            </tbody>
          </table>
          <div class="total">Price (ex GST):  $${info.priceExGST}</div>
          <div class="total">Gst:  $${info.gst}</div>
          <div class="total">Price (inc GST): $${info.gstAmount}</div>
        </div>
      </body>
      </html>
`;
  // // 将 HTML 转换为 PDF
  // const browser = await puppeteer.launch({
  //   executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', // 使用适合你的系统的可执行文件路径
  //   args: ['--no-sandbox', '--disable-setuid-sandbox']
  // });
  // const page = await browser.newPage();
  // await page.setContent(invoiceHtml);
  // const pdfBuffer = await page.pdf({ format: 'A4' });
  // await browser.close();
  // let pdfBuffer;

  // pdf.create(invoiceHtml).toBuffer(function(err, buffer) {
  //   // buffer 即包含生成的 PDF 内容        
  //   pdfBuffer = buffer;
  // })
  // const pdfBuffer = await pdf.create(invoiceHtml).toBuffer();
  // console.log(pdfBuffer);
  const options = {
    landscape: true,
    format: 'A4',
  };
  const htmlPdf = await pdf.create(invoiceHtml, options);
  const pdfBuffer = await htmlPdf.toBuffer();
  // pdf.create(invoiceHtml).toBuffer(async function(err, buffer){
  //   console.log('This is a buffer:', buffer);
  //   console.log(err);
  //   pdfBuffer = buffer;
    
  // });
  
  const s3Params = {
    Bucket: 'pickcar',
    Key: `invoices/invoice-${Date.now()}.pdf`,
    Body: pdfBuffer,
    ContentType: 'application/pdf'
  };
  const s3Upload = await s3.upload(s3Params).promise();
  const pdfUrl = s3Upload.Location;
  console.log(pdfUrl);

  


  // 发送带有 PDF 附件的电子邮件
  const mailOptions = {
    from: fromEmail,
    to: toEmail,
    subject: 'Your invoice',
    text: 'Please see the invoice in the attachment.',
    attachments: [
      {
        filename: 'invoice.pdf',
        path: pdfUrl
      }
    ]
  };

  try {
    const info = await transport.sendMail(mailOptions);
    console.log('发票邮件已发送: %s', info.messageId);
    return {...info, status: 'success', invoicePdf: pdfUrl};
  } catch (error) {
    console.error('发送发票邮件时出错: %s', error);
    return {error, status: 'failure'};
  }
//   // 发送电子邮件
// ses.sendEmail({
//   Source: fromEmail,
//   Destination: {
//     ToAddresses: ['haojiahuo971226@163.com']
//   },
//   Message: {
//     Subject: {
//       Data: 'We pick your car! Invoice'
//     },
//     Body: {
//       Html: {
//         Data: invoiceHtml
//       }
//     }
//   },
//   // Attachments: [
//   //   {
//   //     Filename: 'invoice',
//   //     Content: pdfBuffer,
//   //     ContentType: 'application/pdf'
//   //   }
//   // ]
// }, (err, data) => {
//   if (err) {
//     console.log(err);
//     return err;
//   } else {
//     console.log(data);
//     return data;
//   }
// });


  // 将 PDF 上传到 S3
  
}
