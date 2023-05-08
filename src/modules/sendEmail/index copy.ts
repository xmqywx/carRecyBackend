const nodemailer = require("nodemailer");

const fs = require('fs');
const pdf = require('html-pdf');
const handlebars = require('handlebars');
// 使用async..await 创建执行函数
async function main() {

    const template = await fs.readFileSync('./invoice.html', 'utf8');
    const data = {
        customerName: 'John Doe',
        invoiceNumber: '1234',
        invoiceDate: '2023-04-18',
        items: [
            { name: 'Item 1', quantity: 2, price: 10, total: 20 },
            { name: 'Item 2', quantity: 3, price: 15, total: 45 },
            { name: 'Item 3', quantity: 1, price: 5, total: 5 }
        ]
    };
    const options = {
        format: 'A4',
        orientation: 'portrait',
        border: {
            top: '1in',
            right: '1in',
            bottom: '1in',
            left: '1in'
        }
    };

    const renderedHtml = await handlebars.compile(template)(data);

    await pdf.create(renderedHtml, options).toFile('invoice.pdf', (err, res) => {
        if (err) return console.log(err);
        console.log(res);
    });


    // 如果你没有一个真实邮箱的话可以使用该方法创建一个测试邮箱

    // 创建Nodemailer传输器 SMTP 或者 其他 运输机制
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com", // 第三方邮箱的主机地址
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: "laurentliu0918@gmail.com", // 发送方邮箱的账号
            pass: "qxtevaozxibvalxj", // 邮箱授权密码
        },
    });
    // 定义transport对象并发送邮件
    const receiver = {
        from: '"Dooring ????" laurentliu0918@gmail.com', // 发送方邮箱的账号
        to: "480946994@qq.com", // 邮箱接受者的账号
        subject: "Hello Dooring", // Subject line
        text: "H5-Dooring?", // 文本内容
        html: `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>发票</title>
        <style>
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 14px;
            line-height: 1.5;
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
            color: #666;
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
        </style>
      </head>
      <body>
        <div id="invoice">
          <h1>发票</h1>
          <div class="date">日期: 2023-04-18</div>
          <table>
            <thead>
              <tr>
                <th>商品</th>
                <th>数量</th>
                <th>单价</th>
                <th>总价</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>商品1</td>
                <td>2</td>
                <td>50.00</td>
                <td>100.00</td>
              </tr>
              <tr>
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
              </tr>
            </tbody>
          </table>
          <div class="total">总价: 290.00</div>
        </div>
      </body>
      </html>`, // html 内容, 如果设置了html内容, 将忽略text内容
    };
    await transporter.sendMail(receiver, (error, info) => {
        if (error) {
            return console.log('发送失败:', error);
        }
        transporter.close()
        console.log('发送成功:', info.response)
    });
}

// module.exports.main;
export default main;
// const fs = require('fs');
// const path = require('path');
// const pdf = require('html-pdf');
// const handlebars = require('handlebars');
// const nodemailer = require('nodemailer');

// function main () {

//     const template = `<!DOCTYPE html>
// <html>
//   <head>
//     <meta charset="utf-8">
//     <title>Invoice</title>
//   </head>
//   <body>
//     <h1>Invoice for {{customerName}}</h1>
//     <p>Invoice number: {{invoiceNumber}}</p>
//     <p>Invoice date: {{invoiceDate}}</p>
//     <table>
//       <thead>
//         <tr>
//           <th>Item</th>
//           <th>Quantity</th>
//           <th>Price</th>
//           <th>Total</th>
//         </tr>
//       </thead>
//       <tbody>
//         {{#each items}}
//         <tr>
//           <td>{{name}}</td>
//           <td>{{quantity}}</td>
//           <td>{{price}}</td>
//           <td>{{total}}</td>
//         </tr>
//         {{/each}}
//       </tbody>
//     </table>
//   </body>
// </html>`;
//     const data = {
//   customerName: 'John Doe',
//   invoiceNumber: '1234',
//   invoiceDate: '2023-04-18',
//   items: [
//     { name: 'Item 1', quantity: 2, price: 10, total: 20 },
//     { name: 'Item 2', quantity: 3, price: 15, total: 45 },
//     { name: 'Item 3', quantity: 1, price: 5, total: 5 }
//   ]
// };

//     const options = {
//   format: 'A4',
//   orientation: 'portrait',
//   border: {
//     top: '1in',
//     right: '1in',
//     bottom: '1in',
//     left: '1in'
//   },
//   phantomPath: require('phantomjs-prebuilt').path
// };
// console.log(4);

// const renderedHtml = handlebars.compile(template)(data);
// console.log(5);
// pdf.create(renderedHtml, options).toFile('invoice.pdf', (err, res) => {
//   if (err) return console.log(err);
//   const filePath = path.join(__dirname, 'invoice.pdf');

//   const transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com", // 第三方邮箱的主机地址
//     port: 465,
//     secure: true, // true for 465, false for other ports
//     auth: {
//       user: "laurentliu0918@gmail.com", // 发送方邮箱的账号
//       pass: "qxtevaozxibvalxj", // 邮箱授权密码
//     },
//     tls: {
//         rejectUnauthorized: false
//     },
//     connectionTimeout: 60000, // 设置连接超时时间为60秒
//     greetingTimeout: 60000, // 设置 greeting 超时时间为60秒
//     socketTimeout: 60000 // 设置 socket 超时时间为60秒
//     // proxy: "http://192.168.0.102:9000/lead"
//   });

//   const mailOptions = {
//     from: 'laurentliu0918@gmail.com',
//     to: '480946994@qq.com',
//     subject: 'Invoice',
//     text: 'Please find attached invoice',
//     attachments: null,
//     html: renderedHtml
//   };

//   const attachment = {
//     filename: 'invoice.pdf',
//     path: filePath
//   };
//   console.log(attachment);
//   mailOptions.attachments = [attachment];

//   transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//       console.log("======================================================");
//       console.log(error);
//       console.log("======================================================");
//       transporter.close();
//     } else {
//       console.log('Email sent: ' + info.response);
//     }

//   });
// });
// // const mailOptions = {
// //     from: 'laurentliu0918@gmail.com',
// //     to: '480946994@qq.com',
// //     subject: 'Invoice',
// //     text: 'Please find attached invoice',
// //     attachments: null,
// //     html: template
// //   };

//   // const attachment = {
//   //   filename: 'invoice.pdf',
//   //   path: filePath
//   // };
//   // console.log(attachment);
//   // mailOptions.attachments = [attachment];

//   // transporter.sendMail(mailOptions, (error, info) => {
//   //   if (error) {
//   //     console.log("======================================================");
//   //     console.log(error);
//   //     console.log("======================================================");
//   //     transporter.close();
//   //     main();
//   //   } else {
//   //     console.log('Email sent: ' + info.response);
//   //   }

//   // });
// }

// export default main;
