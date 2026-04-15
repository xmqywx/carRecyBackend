import { ModuleConfig } from '@cool-midway/core';

/**
 * AI 模块配置
 */
export default () => {
  return {
    name: 'AI 助手',
    description: 'AI booking draft 与自然语言搜索',
    middlewares: [],
    globalMiddlewares: [],
    order: 0,
  } as ModuleConfig;
};
