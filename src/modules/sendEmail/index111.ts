const nodemailer = require("nodemailer");

// const fs = require('fs');
// const pdf = require('html-pdf');
// const smtpTransport = require("nodemailer-smtp-transport");
// 使用async..await 创建执行函数
async function main({ name, price, number, email }) {

  // 创建Nodemailer传输器 SMTP 或者 其他 运输机制
  // let transporter = nodemailer.createTransport(smtpTransport({
  //   host: "smtp.gmail.com",
  //   pool: true,
  //   port: 465,
  // secure: true,
  //   auth: {
  //     user: "laurentliu0918@gmail.com",
  //     pass: "ktfrzraabjpknknl",
  //   },
  //   debug: true,
  // }));
  // console.log("=============================");
  // console.log({ name, price, number });
  // console.log("=============================");

  // // 定义transport对象并发送邮件
  // const receiver = {
  //   from: '"Dooring ????" laurentliu0918@gmail.com', // 发送方邮箱的账号
  //   to: "480946994@qq.com", // 邮箱接受者的账号
  //   subject: "Hello Dooring", // Subject line
  //   text: "H5-Dooring?", // 文本内容
  //   html: `<!DOCTYPE html>
  //     <html>
  //     <head>
  //       <meta charset="UTF-8">
  //       <title>发票</title>
  //       <style>
  //         body {
  //           font-family: Arial, Helvetica, sans-serif;
  //           font-size: 14px;
  //           line-height: 1.5;
  //         }
  //         #invoice {
  //           margin: 0 auto;
  //           max-width: 800px;
  //           padding: 30px;
  //           border: 1px solid #ccc;
  //         }
  //         #invoice h1 {
  //           font-size: 28px;
  //           margin-bottom: 15px;
  //         }
  //         #invoice .date {
  //           font-size: 12px;
  //           color: #666;
  //         }
  //         #invoice table {
  //           width: 100%;
  //           border-collapse: collapse;
  //           margin-top: 20px;
  //         }
  //         #invoice table th {
  //           background-color: #eee;
  //           padding: 5px;
  //           text-align: left;
  //         }
  //         #invoice table td {
  //           padding: 5px;
  //           border: 1px solid #ccc;
  //         }
  //         #invoice table tr:nth-child(even) td {
  //           background-color: #f0f0f0;
  //         }
  //         #invoice .total {
  //           margin-top: 20px;
  //           text-align: right;
  //         }
  //       </style>
  //     </head>
  //     <body>
  //       <div id="invoice">
  //         <h1>发票</h1>
  //         <div class="date">日期: 2023-04-18</div>
  //         <table>
  //           <thead>
  //             <tr>
  //               <th>商品</th>
  //               <th>数量</th>
  //               <th>单价</th>
  //               <th>总价</th>
  //             </tr>
  //           </thead>
  //           <tbody>
  //             <tr>
  //               <td>商品1</td>
  //               <td>2</td>
  //               <td>50.00</td>
  //               <td>100.00</td>
  //             </tr>
  //             <tr>
  //               <td>商品2</td>
  //               <td>1</td>
  //               <td>100.00</td>
  //               <td>100.00</td>
  //             </tr>
  //             <tr>
  //               <td>商品3</td>
  //               <td>3</td>
  //               <td>30.00</td>
  //               <td>90.00</td>
  //             </tr>
  //           </tbody>
  //         </table>
  //         <div class="total">总价: 290.00</div>
  //       </div>
  //     </body>
  //     </html>`, // html 内容, 如果设置了html内容, 将忽略text内容
  // };
  // let info = await transporter.sendMail(receiver, (error, info) => {
  //   if (error) {
  //     return console.log(error);
  //   }
  //   transporter.close()
  //   return console.log(info);
  // });

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.qq.com",
    pool: true,
    port: 465,
    secure: true,
    auth: {
      user: "480946994@qq.com",
      pass: "wjbjgtthskktbhjc",
    },
    debug: true,
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '480946994@qq.com', // sender address
    to: "laurentliu0918@gmail.com", // list of receivers
    subject: "Hello ✔", // Subject line
    text: "Hello world?", // plain text body
    html: "<b>Hello world?</b>", // html body
  });
  return info.messageId;
  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

export default main;
