
const nodemailer = require('nodemailer');
// const puppeteer = require('puppeteer-core');
// const fs = require('fs');
const dotenv = require('dotenv');
const envFile = process.env.NODE_ENV === 'prod' ? '.env.production' : '.env.local';
const pdf = require('html-pdf-chrome');

dotenv.config({ path: envFile });

const fromEmail = process.env.NODE_MAIL_USER;


export default async function getDocs({ email, name, token, textToSend, giveUploadBtn}) {

    let toEmail = '';
    // 配置 Nodemailer
    const transport = nodemailer.createTransport({
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
    if (email != null) {
        toEmail = email;
    }
    const html = `<html lang="en">
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
        <h3>Dear ${name}.</h3>
        <div>${textToSend}</div>
        ${
          giveUploadBtn ? `<p>Please click here to upload some proof documents.</p>
          <div class="to-upload">
            <a href="http://13.54.137.62/customer_provide_files?token=${token}">TO UPLOAD</a>
          </div>` : ''
        }
      </main>
    </body>
    </html>`;
    const options = {
      landscape: true,
      format: 'A4',
    };
    const htmlPdf = await pdf.create(html, options);
    const pdfBuffer = await htmlPdf.toBuffer();
    const mailOptions = {
        from: fromEmail,
        to: toEmail,
        subject: 'Please provide some proof materials.',
        text: `Dear ${name}.Please click here to upload some proof documents.`,
        attachments: [
          {
            filename: 'document.pdf',
            content: pdfBuffer, // 传入 PDF 的二进制数据
            contentType: 'application/pdf'
          }
        ],
        // html: `<html lang="en">

        // <head>
        //   <meta charset="UTF-8">
        //   <meta name="viewport" content="width=device-width, initial-scale=1.0">
        //   <title>Document</title>
        //   <style>
        //     main {
        //       width: 500px;
        //       margin: auto;
        //     }
        
        //     .to-upload a {
        //       /* display: block; */
        //       float: left;
        //       line-height: 50px;
        //       padding: 0px 20px;
        //       color: #FFF;
        //       font-weight: 500;
        //       background-color: chocolate;
        //       text-decoration: none;
        //     }
        
        //     a:hover {
        //       opacity: 0.8;
        //     }
        
        //     p {
        //       text-indent: 2em;
        //     }
        
        //     .to-upload {}
        //   </style>
        // </head>
        
        // <body>
        //   <main>
        //     <h3>Dear ${name}.</h3>
        //     <div>${textToSend}</div>
        //     ${
        //       giveUploadBtn ? `<p>Please click here to upload some proof documents.</p>
        //       <div class="to-upload">
        //         <a href="http://13.54.137.62/customer_provide_files?token=${token}">TO UPLOAD</a>
        //       </div>` : ''
        //     }
        //   </main>
        // </body>
        
        // </html>`
    };
    try {
        const info = await transport.sendMail(mailOptions);
        console.log('邮件已发送: %s', info.messageId);
        return { ...info, status: 'success' };
    } catch (error) {
        console.error('发送发票邮件时出错: %s', error);
        return { error, status: 'failure' };
    }

}
