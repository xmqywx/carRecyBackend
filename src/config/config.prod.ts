import { CoolConfig } from '@cool-midway/core';
import { MidwayConfig } from '@midwayjs/core';

/**
 * 本地开发 npm run dev 读取的配置文件
 */
export default {
  orm: {
    type: 'mysql',
    // host: '127.0.0.1',
    // host: 'database-pickcar.cra4apbybkan.ap-southeast-2.rds.amazonaws.com',
    host: 'database-1.cfzhpcnpmwns.ap-southeast-2.rds.amazonaws.com',
    port: 3306,
    // username: 'root',
    username: 'admin',
    password: 'mysql123456',
    // password: '123456',
    database: 'cool-admin',
    synchronize: false,
    logging: false,
    charset: 'utf8mb4',
  },
  cool: {
    // 是否自动导入数据库
    initDB: false,
  } as CoolConfig,
} as MidwayConfig;
