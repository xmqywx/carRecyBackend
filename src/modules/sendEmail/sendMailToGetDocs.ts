
const nodemailer = require('nodemailer');
// const puppeteer = require('puppeteer-core');
// const fs = require('fs');
const dotenv = require('dotenv');
const envFile = process.env.NODE_ENV === 'prod' ? '.env.production' : '.env.local';
dotenv.config({ path: envFile });

const fromEmail = process.env.NODE_MAIL_USER;


export default async function getDocs({ email, name, token}) {

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
    const mailOptions = {
        from: fromEmail,
        to: toEmail,
        subject: 'Provide some proof materials.',
        text: `Dear ${name}.Please click here to upload some proof documents.`,
        html: `<html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document</title>
          <style>
            a {
              display: inline-block;
              line-height: 50px;
              padding: 0 20px;
              color: #FFF;
              font-weight: 500;
              background-color: chocolate;
              text-decoration: none;
            }
            a:hover {
              opacity: 0.8;
            }
          </style>
        </head>
        <body>
          <div>
            <a href="http://13.54.137.62/customer_provide_files?token=${token}">TO UPLOAD</a>
          </div>
        </body>
        </html>`
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
