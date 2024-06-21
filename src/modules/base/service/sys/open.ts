import { Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import moment = require('moment');

@Provide()
export class BaseOpenService extends BaseService {
  // 返回汽车拆解内容
  async returnWreckedInfo(partData: any, carData?: any, orderData?: any) {
    let partMapData = partData.map((v, index) =>
      Object.keys(partData[index]).map(key => ({
        label: key,
        value: partData[index][key],
      }))
    );
    let carDataArr: { label: string; value: any }[] = [];
    if (carData) {
      carDataArr = Object.keys(carData).map(key => {
        return { label: key, value: carData[key] };
      });
      let carInfoArr: { label: string; value: any }[] = [];
      carDataArr = [...carDataArr, ...carInfoArr];
    }
    let orderDataArr: { label: string; value: any }[] = [];
    if (orderData) {
      orderDataArr = Object.keys(orderData).map(key => {
        return { label: key, value: orderData[key] };
      });
      orderDataArr = [...orderDataArr];
    }
    return `
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>We pick your car</title>
        </head>
                <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                body {
                    background-color: #f9f9f9;
                    color: #4a4a4a;
                    font-size: 16px;
                    line-height: 1.6;
                }
                
                .w {
                    margin: 20px auto;
                    width: 100%;
                    max-width: 960px;
                    background: #fff;
                    padding: 20px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    border-radius: 10px;
                }
                
                h3 {
                    color: #4165d7;
                    margin-bottom: 20px;
                    text-align: center;
                }
                
                .row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px;
                    margin: 5px 0;
                    background: linear-gradient(to right, #f9f9f9, #ffffff);
                    border-radius: 5px;
                }
                
                .label {
                    flex-basis: 30%;
                    color: #555;
                    font-weight: bold;
                }
                
                .value {
                    flex-basis: 70%;
                    text-align: right;
                    color: #000;
                }
                
                .imgContainer {
                    text-align: center;
                    padding: 10px;
                }
                
                img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 5px;
                }
                
                @media (min-width: 768px) {
                    .row {
                        padding: 15px 10px;
                    }
                }
            </style>
            <body>
                <div class="w">
                    <h3>Vehicle</h3>
                    ${carDataArr
                      .map(v => {
                        if (!v.value) {
                          return null;
                        }
                        if (
                          [
                            'customerID',
                            'carWreckedInfo',
                            'isVFP',
                            'createTime',
                            'updateTime',
                            'departmentId',
                            'status',
                            'id',
                          ].includes(v.label)
                        ) {
                          return null;
                        }
                        if (v.label === 'carInfo') {
                          return null;
                        }
                        if (v.label === 'image') {
                          return ` 
                                <div class="imgContainer">
                                    <img src="${v.value}" alt="car">
                                </div>
                                `;
                        }
                        return `<div class='row'>
                                <div class='label'>${toTitleCase(
                                  v.label
                                )} :</div>
                                <div class='value'>${v.value}</div>
                            </div>`;
                      })
                      .join('')}
                      <h3>Order</h3>
                      ${orderDataArr
                        .map(v => {
                          if (!v.value) {
                            return null;
                          }
                          if (
                            ![
                              'createBy',
                              'createTime',
                              'pickupAddress',
                              'expectedDate',
                            ].includes(v.label)
                          ) {
                            return null;
                          }
                          if (v.label === 'carInfo') {
                            return null;
                          }
                          if (v.label === 'createTime') {
                            return `<div class='row'>
                            <div class='label'>DATE :</div>
                            <div class='value'>${moment(v.value).format(
                              'DD/MM/YYYY HH:mm'
                            )}</div>
                        </div>`;
                          }
                          if (v.label === 'expectedDate') {
                            return `<div class='row'>
                            <div class='label'>Preferred Pick Up Time :</div>
                            <div class='value'>${moment(Number(v.value)).format(
                              'DD/MM/YYYY HH:mm'
                            )}</div>
                        </div>`;
                          }
                          return `<div class='row'>
                                  <div class='label'>${toTitleCase(
                                    v.label
                                  )} :</div>
                                  <div class='value'>${v.value}</div>
                              </div>`;
                        })
                        .join('')}
                      <h3>Dismantling info</h3>
                      ${partMapData
                        .map(partDataArr =>
                          partDataArr
                            .map(v => {
                              if (!v.value) {
                                return null;
                              }
                              if (
                                [
                                  'customerID',
                                  'carWreckedInfo',
                                  'isVFP',
                                  'createTime',
                                  'updateTime',
                                  'carID',
                                  'id',
                                  'containerID',
                                ].includes(v.label)
                              ) {
                                return null;
                              }
                              const disassemblyCategory = partDataArr.find(
                                v => v.label === 'disassemblyCategory'
                              ).value;
                              if (
                                v.label === 'disassmblingInformation' &&
                                disassemblyCategory === 'Catalytic Converter'
                              ) {
                                const imgArr = JSON.parse(v.value);
                                return `
                                  <div class='row'>
                                      <div class='label'>${toTitleCase(
                                        v.label
                                      )}:</div>
                                  </div>
                                  <div class='row'>
                                      ${imgArr
                                        .map(i => `<img src="${i}" alt="car">`)
                                        .join('')}
                                  </div>
                                  `;
                              }
                              if (v.label === 'disassemblyImages') {
                                const imgArr = JSON.parse(v.value);
                                return `
                                  <div class='row'>
                                      <div class='label'>${toTitleCase(
                                        v.label
                                      )}:</div>
                                  </div>
                                  <div class='row'>
                                      ${imgArr
                                        .map(i => `<img src="${i}" alt="car">`)
                                        .join('')}
                                  </div>
                                  `;
                              }
                              return `<div class='row'>
                                  <div class='label'>${toTitleCase(
                                    v.label
                                  )} :</div>
                                  <div class='value'>${v.value}</div>
                              </div>`;
                            })
                            .join('')
                        )
                        .join('<br />')}
                </div>
            </body>
            </html>
        `;
  }

  // 返回零件的内容
  async returnPartsInfo(partData: any, carData?: any) {
    let partDataArr = Object.keys(partData).map(key => {
      return { label: key, value: partData[key] };
    });
    let carDataArr: { label: string; value: any }[] = [];
    if (carData) {
      carDataArr = Object.keys(carData).map(key => {
        return { label: key, value: carData[key] };
      });
      let carInfoArr: { label: string; value: any }[] = [];
      carDataArr = [...carDataArr, ...carInfoArr];
    }
    return `
        <html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>We pick your car</title>
</head>
        <style>
        * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; /* 更现代的字体 */
    }
    
    body {
        background-color: #f9f9f9; /* 更柔和的背景色 */
        color: #333; /* 深色文字提高可读性 */
        font-size: 16px;
        line-height: 1.6;
    }
    
    .w {
        margin: 20px auto;
        width: 100%;
        max-width: 960px; /* 适当增加最大宽度 */
        background: #fff;
        padding: 20px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1); /* 添加阴影以增强立体感 */
        border-radius: 8px; /* 圆角边框 */
    }
    
    h3 {
        color: #4165d7; /* 标题颜色 */
        margin-bottom: 20px;
        text-align: center; /* 标题居中 */
    }
    
    .row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px;
        margin-bottom: 10px; /* 增加行间距 */
        background: #f8f8f8; /* 每行使用淡色背景增强对比 */
        border-radius: 5px; /* 行元素添加圆角 */
    }
    
    .label {
        flex-basis: 30%;
        color: #555;
        font-weight: bold; /* 加粗标签文字 */
    }
    
    .value {
        flex-basis: 70%;
        text-align: right;
        color: #000;
    }
    
    .imgContainer {
        display: flex;
        justify-content: start;
        gap: 10px;
        padding: 10px;
    }
    .imgContainer img {
      max-width: 200px;  /* 最大宽度为200px */
      max-height: 200px; /* 最大高度为200px */
      width: auto;       /* 宽度自动，保持原始比例 */
      height: auto;      /* 高度自动，保持原始比例 */
    }
    
    img {
        width: 100%; /* 图片宽度自适应 */
        max-width: 200px; /* 最大宽度限制 */
        height: auto;
        border-radius: 5px; /* 图片添加圆角 */
    }
    
    @media (min-width: 768px) {
        .row {
            padding: 15px 10px;
        }
    }
    </style>
    <body>
        <div class="w">
            <h3>${partData.title}</h3>
            ${partDataArr
              .map(v => {
                if (!v.value) {
                  return null;
                }
                if (
                  [
                    'customerID',
                    'carWreckedInfo',
                    'isVFP',
                    'createTime',
                    'updateTime',
                    'id',
                    'containerID',
                    'carID',
                    'title',
                  ].includes(v.label)
                ) {
                  return null;
                }
                if (v.label === 'Part Images') {
                  const imgArr = JSON.parse(v.value);
                  return `
                        <div class='row'>
                            <div class='label'>${v.label}:</div>
                        </div>
                        <div class='imgContainer'>
                            ${imgArr
                              .map(i => `<img src="${i}" alt="car">`)
                              .join('')}
                        </div>
                        `;
                }
                return `<div class='row'>
                        <div class='label'>${v.label} :</div>
                        <div class='value'>${v.value}</div>
                    </div>`;
              })
              .join('')}
            <h3>Car Info</h3>
            ${carDataArr
              .map(v => {
                if (!v.value) {
                  return null;
                }
                if (
                  [
                    'customerID',
                    'carWreckedInfo',
                    'isVFP',
                    'createTime',
                    'updateTime',
                    'departmentId',
                    'status',
                    'id',
                    'parts',
                  ].includes(v.label)
                ) {
                  return null;
                }
                if (v.label === 'carInfo') {
                  return null;
                }
                if (v.label === 'image') {
                  return ` 
                        <div class="imgContainer">
                            <img src="${v.value}" alt="car">
                        </div>
                        `;
                }
                return `<div class='row'>
                        <div class='label'>${toTitleCase(v.label)} :</div>
                        <div class='value'>${v.value}</div>
                    </div>`;
              })
              .join('')}
        </div>
    </body>
    </html>
        `;
  }
}

function toTitleCase(str) {
  if (!str) {
    return '';
  }
  const words = str.split(/(?=[A-Z])/);
  let title = words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  if (Object.keys(replaceLabel).includes(title)) {
    title = replaceLabel[title];
  }
  return title;
}

let replaceLabel = {
  'Disassmbling Information': 'Part info',
  'Disassembly Category': 'Category',
  'Disassembly Number': 'NO.',
  'Registration Number': 'REGO',
  'Car I D': 'Car ID',
  Id: 'ID',
  'Disassembly Description': 'Part Description',
  'Disassembly Images': 'Part Images',
};
