// import { CoolConfig } from '@cool-midway/core';
// import { MidwayConfig } from '@midwayjs/core';

// /**
//  * 本地开发 npm run dev 读取的配置文件
//  */
// export default {
//   orm: {
//     type: 'mysql',
//     // host: '127.0.0.1',
//     // host: 'database-pickcar.cra4apbybkan.ap-southeast-2.rds.amazonaws.com',
//     host: 'database-2.cfzhpcnpmwns.ap-southeast-2.rds.amazonaws.com',
//     port: 3306,
//     // username: 'root',
//     username: 'admin',
//     password: 'mysql123456',
//     // password: '123456',
//     database: 'cool-admin',
//     synchronize: false,
//     logging: false,
//     charset: 'utf8mb4',
//   },
//   cool: {
//     // 是否自动导入数据库
//     initDB: false,
//   } as CoolConfig,
// } as MidwayConfig;

import { CoolConfig } from '@cool-midway/core';
import { MidwayConfig } from '@midwayjs/core';

/**
 * 本地开发 npm run dev 读取的配置文件
 */
export default {
  orm: {
    type: 'mysql',
    host: 'mycompapp-ccf-prod.ckvc0cqzpckv.ap-southeast-2.rds.amazonaws.com',
    port: 3306,
    username: 'pickcar',
    password: 'showmethemoney$123',
    database: 'pickcar_prod',
    // type: 'mysql',
    // host: 'b2opflmuihzchswhi8re-mysql.services.clever-cloud.com',
    // port: 3306,
    // username: 'uemik8l39ryyxwjz',
    // password: 'TcRzxwBe7668Qtkp9ejM',
    // database: 'b2opflmuihzchswhi8re',
    // 自动建表 注意：线上部署的时候不要使用，有可能导致数据丢失
    synchronize: false,
    // 打印日志
    logging: true,
    // 字符集
    charset: 'utf8mb4',
  },
  cool: {
    // 是否自动导入数据库
    initDB: true,
  } as CoolConfig,
} as MidwayConfig;
