import { ModuleConfig } from '@cool-midway/core';

/**
 * Lead Assistant 模块配置
 */
export default () => {
  return {
    name: 'Lead Assistant',
    description: 'Strict lead creation session and resolution orchestration',
    middlewares: [],
    globalMiddlewares: [],
    order: 0,
  } as ModuleConfig;
};
