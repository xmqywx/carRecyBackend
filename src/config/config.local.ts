import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { CoolConfig } from '@cool-midway/core';
import { MODETYPE } from '@cool-midway/file';
import { MidwayConfig } from '@midwayjs/core';

const toBoolean = (value: string | undefined, fallback: boolean) => {
  if (value == null) return fallback;
  return value === 'true';
};

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * 本地开发 npm run dev 读取的配置文件
 */
export default {
  orm: {
    type: 'mysql',
    host: process.env.DB_HOST || '127.0.0.1',
    port: toNumber(process.env.DB_PORT, 3306),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'cool-admin',
    // 自动建表 注意：线上部署的时候不要使用，有可能导致数据丢失
    synchronize: toBoolean(process.env.DB_SYNCHRONIZE, true),
    // 打印日志
    logging: toBoolean(process.env.DB_LOGGING, true),
    // 字符集
    charset: 'utf8mb4',
  },
  cool: {
    // 是否自动导入数据库
    initDB: toBoolean(process.env.COOL_INIT_DB, true),
    // 本地开发文件上传配置 - 覆盖 config.default.ts 中的配置
    file: {
      mode: MODETYPE.LOCAL,
      domain: process.env.NODE_FILE_DOMAIN || 'http://localhost:8001',
    },
  } as CoolConfig,
} as MidwayConfig;
