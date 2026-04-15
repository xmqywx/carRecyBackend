# carRecyBackend — 项目特定指引

> 业务背景见 `../CLAUDE.md`（Andy 根）。本文件只放后端代码约定。

## 角色
Apexpoint 车场作业系统**后端**，同时服务 `../carRecyFontend`（老）和 `../apexpoint-front`（新）。

## 技术栈
- **MidwayJS 3.2 + cool-admin 5.0**（基于 Egg.js 生态，**不是**纯 Express/Koa/NestJS）
- TypeScript 4.6 + Node.js
- TypeORM 0.2.45 + MySQL 5.7+
- JWT 认证、SocketIO、nodemailer、aws-sdk(S3)、puppeteer/html-pdf-chrome

## 启动
```bash
npm run dev   # http://localhost:8001（HTTP + SocketIO 同端口）
```
默认账户：`admin / 123456`
开发数据库：`127.0.0.1:3306` user `root` pass `123456` db `cool-admin`，**自动 synchronize 建表**。

## 目录约定（cool-admin 模块化）
```
src/modules/<域>/
├── entity/       # TypeORM 实体（继承 BaseEntity）
├── controller/admin/   # @CoolController 装饰器，自动生成 CRUD 路由
└── service/      # @Provide 装饰器，业务逻辑
```
- 加新业务：在 `src/modules/` 下建模块文件夹，遵循 entity/controller/service 三层
- 路由前缀自动是 `/admin/<module>/<resource>/<action>`
- CRUD（add/delete/update/info/list/page）由 `BaseController` 自动提供，**不要手写**

## 必须遵守
1. **响应格式**：成功 `this.ok(data)` → `{ code: 1000, data }`；失败 `this.fail(msg)`。**不要直接 return**
2. **认证**：`/admin/*` 全部经过 `BaseAuthorityMiddleware`（JWT 校验 + 单点登录）；不要绕过
3. **权限点**：通过 `sys_menu` 表配置，前端会自动加载到角色权限里
4. **EPS**：前端老版（cool-admin 风格）依赖 `POST /admin/base/open/eps` 拿 API 元数据，**改了 controller 字段要确保 EPS 输出对齐**
5. **数据库变更**：开发环境靠 `synchronize: true` 自动建表；**生产部署前需手工 SQL/migration**
6. **不要破坏老前端**：carRecyFontend 还在用很多接口，改字段/路由前要全局搜索两个前端

## 核心数据模型（速查）
- `car`、`order`、`order_action`、`customer_profile`
- `inspect_check`（17 项）、`depollute_check`（12 项）
- `vehicle_processing`（4 阶段状态机：arrived→processing→decision→completed）
- `parts_inventory`、`parts_vehicle`、`overseas_vehicle`、`overseas_container`
- `sold_complete`（3 步向导）、`recycling_record`（6 阶段壳体回收）
- 系统：`sys_user/role/menu/department/yard`

详细字段见 `~/.claude/projects/-Users-ying-Documents-Andy/memory/project_carRecyBackend_overview.md`

## 关键文件
| 用途 | 路径 |
|---|---|
| JWT 中间件 | `src/modules/base/middleware/authority.ts` |
| 车辆流程 service | `src/modules/car/service/vehicleProcessing.ts` |
| 整车销售流程 | `src/modules/car/service/soldComplete.ts` |
| SMTP 配置 | `src/modules/sendEmail/service/smtpConfig.ts` |
| 配置文件 | `src/config/config.{default,local,prod}.ts` |
