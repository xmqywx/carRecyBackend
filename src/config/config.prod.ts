import { CoolConfig } from '@cool-midway/core';
import { MidwayConfig } from '@midwayjs/core';

/**
 * 本地开发 npm run dev 读取的配置文件
 */
export default {
  orm: {
    type: 'mysql',
    host: '127.0.0.1',
    port: 3306,
    username: 'root',
    password: '123456',
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
