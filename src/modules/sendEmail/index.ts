const moment = require('moment');
const AWS = require('aws-sdk');
const nodemailer = require('nodemailer');
// const puppeteer = require('puppeteer-core');
// const fs = require('fs');
const dotenv = require('dotenv');
const envFile =
  process.env.NODE_ENV === 'prod' ? '.env.production' : '.env.local';
const pdf = require('html-pdf-chrome');
dotenv.config({ path: envFile });
// 配置 AWS SDK
AWS.config.update({
  region: process.env.NODE_REGION,
  accessKeyId: process.env.NODE_ACCESS_KEY_ID,
  secretAccessKey: process.env.NODE_SECRET_ACCESSKEY,
});

// 创建 S3 实例
const s3 = new AWS.S3();
// 创建ses 实例
// const ses = new AWS.SES();
// 电子邮件发送者和接收者
const fromEmail = process.env.EMAIL_FROM || `"We Pick Your Car" <accounts@wepickyourcar.com.au>`;
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

export default async function main({
  name,
  price,
  id,
  email,
  invoicePdf = null,
  info,
}) {
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
    service: 'gmail',
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
  if (email != null) {
    toEmail = email;
  }
  if (invoicePdf !== null) {
    const mailOptions = {
      from: fromEmail,
      to: toEmail,
      subject: 'Invoice from WePickYourCar',
      text: 'Invoice from WePickYourCar',
      attachments: [
        {
          filename: 'Invoice.pdf',
          path: invoicePdf,
        },
      ],
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

    try {
      const info = await transport.sendMail(mailOptions);
      console.log('发票邮件已发送: %s', info.messageId);
      console.log(invoicePdf);
      return { ...info, status: 'success' };
    } catch (error) {
      console.error('发送发票邮件时出错: %s', error);
      return { error, status: 'failure' };
    }
    // return;
  }
  const currentTime = moment().format('DD-MM-YYYY');
  // const myName = "We pick your car";
  // const qty = 1;
  // const gst = info.gst;
  // let itemTotalPrice = qty * price - gst;
  // let subtotal = itemTotalPrice;
  // let Total = itemTotalPrice;
  // let adjustments = 0;
  let invoiceNumber = id.toString().padStart(6, '0');
  // HTML 发票模板
  const invoiceHtml = `
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
  
      p,
      pre {
        white-space: pre-wrap;
        word-break: break-all;
      }
  
  
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
      <div>
        <div data-v-3a5883f0="" style="width: 800px; margin: auto; border: 1px solid rgb(0, 0, 0); padding: 10px;">
          <h1 data-v-3a5883f0="" style="text-align: start; color: rgb(0, 0, 0);">We Pick Your Car Invoice <button
              class="el-button el-button--primary no-show" aria-disabled="false" type="button" data-v-3a5883f0=""
              style="float: right;"><!--v-if--><span class="">Priview</span></button></h1>
          <div data-v-3a5883f0="" style="display: flex; gap: 10px; margin: 10px 0px; align-items: center;">
            <div data-v-3a5883f0=""><img src=${logoUrl} alt="" data-href="" data-v-3a5883f0=""
                style="width: 200px;"></div>
            <div data-v-3a5883f0="" style="flex: 1 1 0%;">
              <pre class="show value" data-v-3a5883f0="">[ABN]
          [Business Address]
          [Suburb] [State] [Postcode]
          [Business Phone Number]
          [Business Email Address]</pre>
              <div class="el-textarea no-show" data-v-3a5883f0=""><!-- input --><!-- textarea --><textarea
                  class="el-textarea__inner" rows="5" tabindex="0" autocomplete="off"></textarea><!--v-if--></div>
            </div>
          </div>
          <hr data-v-3a5883f0="">
          <hr data-v-3a5883f0="" style="margin-bottom: 10px;">
          <div data-v-3a5883f0="" style="display: flex; justify-content: space-between;">
            <div data-v-3a5883f0="" style="display: flex; gap: 10px; justify-content: space-between;">
              <div data-v-3a5883f0="">
                <div class="el-input no-show" data-v-3a5883f0="" style="width: 100px;">
                  <!-- input --><!-- prepend slot --><!--v-if-->
                  <div class="el-input__wrapper"><!-- prefix slot --><!--v-if--><input class="el-input__inner" type="text"
                      autocomplete="off" tabindex="0"><!-- suffix slot --><!--v-if--></div><!-- append slot --><!--v-if-->
                </div>
                <div class="show key" data-v-3a5883f0="">Invoice to</div>
              </div>
              <div data-v-3a5883f0="">
                <div class="el-textarea no-show" data-v-3a5883f0="" style="width: 200px;">
                  <!-- input --><!-- textarea --><textarea class="el-textarea__inner" rows="4" tabindex="0"
                    autocomplete="off"></textarea><!--v-if-->
                </div>
                <pre class="show" data-v-3a5883f0="" style="width: 200px;">${name}
${email}</pre>
              </div>
            </div>
            <div data-v-3a5883f0="">
              <div data-v-3a5883f0="" style="display: flex; gap: 10px;">
                <div class="el-input no-show" data-v-3a5883f0="" style="width: 190px;">
                  <!-- input --><!-- prepend slot --><!--v-if-->
                  <div class="el-input__wrapper"><!-- prefix slot --><!--v-if--><input class="el-input__inner" type="text"
                      autocomplete="off" tabindex="0"><!-- suffix slot --><!--v-if--></div><!-- append slot --><!--v-if-->
                </div>
                <div class="el-input no-show" data-v-3a5883f0="" style="width: 190px;">
                  <!-- input --><!-- prepend slot --><!--v-if-->
                  <div class="el-input__wrapper"><!-- prefix slot --><!--v-if--><input class="el-input__inner" type="text"
                      readonly="" autocomplete="off" tabindex="0"><!-- suffix slot --><!--v-if--></div>
                  <!-- append slot --><!--v-if-->
                </div>
                <div class="show key" data-v-3a5883f0="" style="width: 150px; text-align: right;">Invoice number</div>
                <div class="show" data-v-3a5883f0="" style="width: 100px; text-align: right;">${invoiceNumber}</div>
              </div>
              <div data-v-3a5883f0="" style="display: flex; gap: 10px;">
                <div class="el-input no-show" data-v-3a5883f0="" style="width: 190px;">
                  <!-- input --><!-- prepend slot --><!--v-if-->
                  <div class="el-input__wrapper"><!-- prefix slot --><!--v-if--><input class="el-input__inner" type="text"
                      autocomplete="off" tabindex="0"><!-- suffix slot --><!--v-if--></div><!-- append slot --><!--v-if-->
                </div>
                <div class="el-input no-show" data-v-3a5883f0="" style="width: 190px;">
                  <!-- input --><!-- prepend slot --><!--v-if-->
                  <div class="el-input__wrapper"><!-- prefix slot --><!--v-if--><input class="el-input__inner" type="text"
                      autocomplete="off" tabindex="0"><!-- suffix slot --><!--v-if--></div><!-- append slot --><!--v-if-->
                </div>
                <div class="show key" data-v-3a5883f0="" style="width: 150px; text-align: right;">Date</div>
                <div class="show" data-v-3a5883f0="" style="width: 100px; text-align: right;">${currentTime}</div>
              </div>
            </div>
          </div>
          <table cell-padding="0" data-v-3a5883f0=""
            style="width: 100%; margin-top: 10px; border-collapse: collapse; border-spacing: 0px;">
            <thead data-v-3a5883f0="">
              <tr data-v-3a5883f0="">
                <th class="key" data-v-3a5883f0=""
                  style="background-color: rgb(221, 221, 221); padding: 5px; text-align: left; width: 200px;">Description
                </th>
                <th class="key" data-v-3a5883f0=""
                  style="background-color: rgb(221, 221, 221); padding: 5px; text-align: left;">Amount</th>
                <th class="key" data-v-3a5883f0=""
                  style="background-color: rgb(221, 221, 221); padding: 5px; text-align: left;">Price</th>
                <th class="key" data-v-3a5883f0=""
                  style="background-color: rgb(221, 221, 221); padding: 5px; text-align: left;">GST</th>
                <th class="key" data-v-3a5883f0=""
                  style="background-color: rgb(221, 221, 221); padding: 5px; text-align: left;">Total</th>
                <th class="key no-show" data-v-3a5883f0=""
                  style="background-color: rgb(221, 221, 221); padding: 5px; text-align: left;">
                  <div class="el-select" data-v-3a5883f0="">
                    <div class="select-trigger el-tooltip__trigger el-tooltip__trigger"><!--v-if-->
                      <div class="el-input el-input--suffix"><!-- input --><!-- prepend slot --><!--v-if-->
                        <div class="el-input__wrapper"><!-- prefix slot --><!--v-if--><input class="el-input__inner"
                            type="text" readonly="" autocomplete="off" tabindex="0"
                            placeholder="Select"><!-- suffix slot --><span class="el-input__suffix"><span
                              class="el-input__suffix-inner"><i class="el-icon el-select__caret el-select__icon"><svg
                                  viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                                  <path fill="currentColor"
                                    d="M831.872 340.864 512 652.672 192.128 340.864a30.592 30.592 0 0 0-42.752 0 29.12 29.12 0 0 0 0 41.6L489.664 714.24a32 32 0 0 0 44.672 0l340.288-331.712a29.12 29.12 0 0 0 0-41.728 30.592 30.592 0 0 0-42.752 0z">
                                  </path>
                                </svg></i><!--v-if--><!--v-if--><!--v-if--><!--v-if--><!--v-if--><!--v-if--></span></span>
                        </div>
                        <!-- append slot --><!--v-if-->
                      </div>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody data-v-3a5883f0="">
              <tr data-v-3a5883f0="">
                <td data-v-3a5883f0="" style="padding: 5px; border: 1px solid rgb(204, 204, 204);">
                  <div class="el-input no-show" data-v-3a5883f0=""><!-- input --><!-- prepend slot --><!--v-if-->
                    <div class="el-input__wrapper"><!-- prefix slot --><!--v-if--><input class="el-input__inner"
                        type="text" autocomplete="off" tabindex="0"><!-- suffix slot --><!--v-if--></div>
                    <!-- append slot --><!--v-if-->
                  </div>
                  <div class="show value" data-v-3a5883f0="">Recovery vehicle</div>
                </td>
                <td data-v-3a5883f0="" style="padding: 5px; border: 1px solid rgb(204, 204, 204);">
                  <div class="el-input no-show" data-v-3a5883f0=""><!-- input --><!-- prepend slot --><!--v-if-->
                    <div class="el-input__wrapper"><!-- prefix slot --><!--v-if--><input class="el-input__inner"
                        type="number" autocomplete="off" tabindex="0"><!-- suffix slot --><!--v-if--></div>
                    <!-- append slot --><!--v-if-->
                  </div>
                  <div class="show value" data-v-3a5883f0="">$${info.totalAmount}</div>
                </td>
                <td data-v-3a5883f0="" style="padding: 5px; border: 1px solid rgb(204, 204, 204);">
                  <div class="el-input no-show" data-v-3a5883f0=""><!-- input --><!-- prepend slot --><!--v-if-->
                    <div class="el-input__wrapper"><!-- prefix slot --><!--v-if--><input class="el-input__inner"
                        type="number" autocomplete="off" tabindex="0"><!-- suffix slot --><!--v-if--></div>
                    <!-- append slot --><!--v-if-->
                  </div>
                  <div class="show value" data-v-3a5883f0="">$${info.priceExGST}</div>
                </td>
                <td data-v-3a5883f0="" style="padding: 5px; border: 1px solid rgb(204, 204, 204);">
                  <div class="el-input no-show" data-v-3a5883f0=""><!-- input --><!-- prepend slot --><!--v-if-->
                    <div class="el-input__wrapper"><!-- prefix slot --><!--v-if--><input class="el-input__inner"
                        type="number" autocomplete="off" tabindex="0"><!-- suffix slot --><!--v-if--></div>
                    <!-- append slot --><!--v-if-->
                  </div>
                  <div class="show value" data-v-3a5883f0="">$${info.gst}</div>
                </td>
                <td data-v-3a5883f0="" style="padding: 5px; border: 1px solid rgb(204, 204, 204);">
                  <div class="el-input no-show" data-v-3a5883f0=""><!-- input --><!-- prepend slot --><!--v-if-->
                    <div class="el-input__wrapper"><!-- prefix slot --><!--v-if--><input class="el-input__inner"
                        type="number" autocomplete="off" tabindex="0"><!-- suffix slot --><!--v-if--></div>
                    <!-- append slot --><!--v-if-->
                  </div>
                  <div class="show value" data-v-3a5883f0="">$${info.gstAmount}</div>
                </td>
                <td class="no-show" data-v-3a5883f0=""
                  style="padding: 5px; border: 1px solid rgb(204, 204, 204); text-align: center;"><button
                    class="el-button el-button--danger is-disabled no-show" aria-disabled="true" disabled="" type="button"
                    data-v-3a5883f0="" style="margin: 10px 0px;"><!--v-if--><span class="">Delete</span></button></td>
              </tr>
            </tbody>
          </table>
          <div data-v-3a5883f0="" style="display: flex; justify-content: space-between;">
            <div data-v-3a5883f0=""><button class="el-button el-button--primary no-show" aria-disabled="false"
                type="button" data-v-3a5883f0="" style="margin: 10px 0px;"><!--v-if--><span class="">Add
                  Line</span></button></div>
            <div data-v-3a5883f0="" style="margin-top: 10px;">
              <div class="key" data-v-3a5883f0="">Price: <span class="value" data-v-3a5883f0="">$${info.priceExGST}</span></div>
              <div class="key" data-v-3a5883f0="">GST: <span class="value" data-v-3a5883f0="">$${info.gst}</span></div>
              <div class="key" data-v-3a5883f0="">Total: <span class="value" data-v-3a5883f0="">$${info.gstAmount}</span></div>
            </div>
          </div>
        </div>
      </div>
    </main>
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
    ContentType: 'application/pdf',
  };
  const s3Upload = await s3.upload(s3Params).promise();
  const pdfUrl = s3Upload.Location;
  console.log(pdfUrl);

  // 发送带有 PDF 附件的电子邮件
  const mailOptions = {
    from: fromEmail,
    to: toEmail,
    subject: 'Invoice from WePickYourCar',
    text: 'Invoice from WePickYourCar',
    attachments: [
      {
        filename: 'Invoice.pdf',
        path: pdfUrl,
      },
    ],
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

  try {
    const info = await transport.sendMail(mailOptions);
    console.log('发票邮件已发送: %s', info.messageId);
    return { ...info, status: 'success', invoicePdf: pdfUrl };
  } catch (error) {
    console.error('发送发票邮件时出错: %s', error);
    return { error, status: 'failure' };
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
