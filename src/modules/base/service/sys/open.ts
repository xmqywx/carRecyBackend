import {  Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';


@Provide()
export class BaseOpenService extends BaseService {

    // 返回零件的内容
    async returnPartsInfo(partData: any, carData?: any) {
        let partDataArr = Object.keys(partData).map(key => {
            return { label: key, value: partData[key] };
        });
        let carDataArr: {label: string, value: any}[] = [];
        if(carData) {
            carDataArr = Object.keys(carData).map(key => {
                return { label: key, value: carData[key] };
            });
            let carInfoArr: {label: string, value: any}[] = [];
            // if(carData && carData.carInfo) {
            //     const carInfo = JSON.parse(carData.carInfo);
            //     carInfoArr = Object.keys(carInfo).map(key => {
            //         return { label: key, value: carInfo[key] };
            //     });
            // }
            carDataArr = [...carDataArr, ...carInfoArr];
        }
        return `
        <html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
        <style>
        * {
            margin: 0;
            padding: 0;
        }
        li, ul, dl, dt {
            list-style: none;
        }
        a {
            text-decoration: none;
        }
        .w {
            margin: 0 auto;
            width: 100%;
            max-width: 800px;
            box-sizing: border-box;
            padding: 10px;
        }
        .w h3 {
            // text-align: center;
        }
        .row .label {
            text-align: left;
        }
        .row .value {
            flex: 1;
            white-space: pre-wrap;
            word-break: break-all;
            color: #4165d7;
            border-bottom: 1px solid #000000;
        }
        .imgContainer {
            width: 100%;
        }
        img {
            // margin: auto;
            // display: block;
            width: 200px;
            max-height: 200px;
            object-fit: contain;
        }
        @media (min-width: 500px) {
            /* 在屏幕宽度大于等于 500px 时应用的样式 */
            .row {
                display: flex;
                gap: 20px;
                align-items: center;
            }
            .row .label {
                text-align: right;
                min-width: 200px;
            }
          }
    </style>
    <body>
        <div class="w">
            <h3>Part Info</h3>
            ${
                partDataArr.map(v => {
                    if(!v.value) {
                        return null;
                    }
                    if(['customerID', 'CarWreckedInfo', 'isVFP', 'createTime', 'updateTime'].includes(v.label)) {
                        return null;
                    }
                    if(v.label === 'disassmblingInformation' && partData.disassemblyCategory === 'Catalytic Converter') {
                        const imgArr = JSON.parse(v.value);
                        return `
                        <div class='row'>
                            <div class='label'>${toTitleCase(v.label)}:</div>
                        </div>
                        <div class='row'>
                            ${
                                imgArr.map(i => `<img src="${i}" alt="car">`).join('')
                            }
                        </div>
                        `;
                    }
                    return `<div class='row'>
                        <div class='label'>${toTitleCase(v.label)} :</div>
                        <div class='value'>${v.value}</div>
                    </div>`
                }).join('')
            }
            <h3>Car Info</h3>
            ${
                carDataArr.map(v => {
                    if(!v.value) {
                        return null;
                    }
                    if(['customerID', 'CarWreckedInfo', 'isVFP', 'createTime', 'updateTime', 'departmentId', 'status'].includes(v.label)) {
                        return null;
                    }
                    if(v.label === 'carInfo') {
                        return null;
                    }
                    if(v.label === 'image') {
                        return ` 
                        <div class="imgContainer">
                            <img src="${v.value}" alt="car">
                        </div>
                        `;
                    }
                    return `<div class='row'>
                        <div class='label'>${toTitleCase(v.label)} :</div>
                        <div class='value'>${v.value}</div>
                    </div>`
                }).join('')
            }
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
    let title = words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    if(Object.keys(replaceLabel).includes(title)) {
        title = replaceLabel[title];
    }
    return title;
  }

let replaceLabel = {
    'Disassmbling Information' : 'Part info',
    'Disassembly Category': 'Category',
    'Disassembly Number': 'NO.',
    'Registration Number': "REGO",
    'Car I D': "Car ID",
    'Id': 'ID'
}