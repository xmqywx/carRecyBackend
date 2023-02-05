import { CoolConfig } from '@cool-midway/core';
import { MidwayConfig } from '@midwayjs/core';

/**
 * 本地开发 npm run dev 读取的配置文件
 */
export default {
  orm: {
    type: 'mysql',
    host: 'b2opflmuihzchswhi8re-mysql.services.clever-cloud.com',
    port: 3306,
    username: 'uemik8l39ryyxwjz',
    password: 'TcRzxwBe7668Qtkp9ejM',
    database: 'b2opflmuihzchswhi8re',
    // 自动建表 注意：线上部署的时候不要使用，有可能导致数据丢失
    synchronize: false,
    // 打印日志
    logging: false,
    // 字符集
    charset: 'utf8mb4',
  },
  cool: {
    // 是否自动导入数据库
    initDB: false,
  } as CoolConfig,
} as MidwayConfig;
