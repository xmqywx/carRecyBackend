import { CoolConfig } from '@cool-midway/core';
import { MODETYPE } from '@cool-midway/file';
import { MidwayConfig } from '@midwayjs/core';
// import * as redisStore from 'cache-manager-ioredis';
import * as fsStore from 'cache-manager-fs-hash';

export default {
  // 修改成你自己独有的key
  keys: 'cool-admin for node',
  koa: {
    port: 8001,
    // HTTP 超时配置（毫秒）
    serverTimeout: 120000, // 2 分钟
    // Keep-Alive 超时
    keepAliveTimeout: 30000, // 30 秒
  },
  // Socket.IO 配置（不指定port，自动共享Koa的HTTP服务器）
  socketIO: {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  },
  // 文件上传
  upload: {
    fileSize: '200mb',
    whitelist: null,
  },
  // 模板渲染
  view: {
    mapping: {
      '.html': 'ejs',
    },
  },
  // 本地缓存
  cache: {
    store: fsStore,
    options: {
      path: 'cache',
      ttl: -1,
    },
  },
  // redis缓存
  //   cache: {
  //     store: redisStore,
  //     options: {
  //       host: '127.0.0.1',
  //       port: 6379,
  //       password: '',
  //       db: 1,
  //       ttl: null,
  //     },
  //   },
  // cool配置
  cool: {
    // redis: {
    //   host: '127.0.0.1',
    //   port: 6379,
    //   db: 0,
    // },
    // 是否自动导入数据库
    file: {
      // 上传模式 本地上传或云存储
      mode: MODETYPE.LOCAL,
      // 本地上传 文件地址前缀，当且仅当mode为LOCAL时生效
      // 生产环境使用此域名，本地开发会在 config.local.ts 中覆盖
      domain: 'https://apexpoint.com.au/api/',
    },
  } as CoolConfig,
} as
  | MidwayConfig
  | {
      cache: any;
    };
