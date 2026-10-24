# 账号与学习进度

## 当前状态

已于 2026-10-22 部署并完成正式服务器验证。网址：https://lexiday-english.pages.dev/ 。部署版本：4e9dcf66；D1 数据库 lexiday-accounts（35e42788-f307-4711-b573-6cf25951e586），绑定 DB；AUTH_PEPPER 已设置为仅服务端 Secret。

59 项本地测试通过；正式服务器已验证匿名访问 200、匿名会话 401、注册、安全 Cookie、三个模块保存及跨会话恢复、账号隔离、过期版本写入 409、退出注销。线上保留两个部署检查账号 deploy_check_1792655837264 与 deploy_check_1792655837264_b，均为自动生成凭据的测试账号，不是用户账号或管理员账号。

## 功能

- 用户名/密码注册和登录，用户名大小写归一；密码至少 12 字符。
- 随机盐 + 原生 PBKDF2-SHA256（100,000 次）+ 独立服务端 HMAC pepper；密码不明文保存。pepper 必须通过 Cloudflare Secret 注入，不能放入 dist。
- 256 位随机会话；数据库只存 token 哈希。正式域名 Cookie 为 __Host 前缀、Secure、HttpOnly、SameSite=Lax，7 天过期。
- 账号、IP 分别限流；写接口检查同源 Origin。数据库查询参数化，所有进度查询以服务端会话用户为准，不接受客户端指定用户 ID。
- 随机一次性恢复码只显示一次，数据库存哈希。重置密码会轮换恢复码并注销所有旧会话；修改密码也注销其他会话。没有邮箱/短信找回。
- 单词、语法、雅思三个模块独立存储与版本控制。保存后约 1.2 秒自动同步，失败保留本机待传记录；重新上线会重试。
- 多设备冲突返回 409，不静默覆盖。用户可先导出备份，再选择云端或本机版本。其他标签页改动会锁定当前页面，要求重新载入，避免同机多标签覆盖。
- 访客原始记录独立保留，登录后可主动导入；不会自动把公共设备上另一个人的访客数据传到账号。
- 每个模块云端快照最多 1.8 MB；临时音频/录音不上传。应用不读取或修改其他站点数据。
- 所有学习统计仍源于用户自测；没有管理员评分或防作弊承诺。

## 本地运行

Node.js 24+（本地数据库使用内置 node:sqlite）。

```sh
pnpm install
pnpm dev
```

打开 http://127.0.0.1:4190 。`.local/` 内保存本地测试数据库和随机 pepper，已从 Git 排除。不上传该目录。

```sh
pnpm test
pnpm build
```

`pnpm build` 将 `server/worker.js` 和验证器打包成独立 `dist/_worker.js`。`dist/_routes.json` 只把 `/api/*` 路由交给后端。静态页面依然由 Pages 提供。

官方运行环境本地测试：把 `wrangler.local.jsonc` 复制为 `wrangler.jsonc`，在 `.dev.vars` 配置仅本地使用的 AUTH_PEPPER，然后：

```sh
pnpm exec wrangler d1 execute lexiday-accounts-local --local --file migrations/0001_accounts.sql
pnpm exec wrangler pages dev dist --port 4191
```

## 正式部署到原项目

1. `pnpm exec wrangler login --scopes account:read user:read pages:write d1:write`，在官方页面授权。
2. 创建 D1：`pnpm exec wrangler d1 create lexiday-accounts`，记录返回的数据库 ID。
3. `wrangler.jsonc` 使用项目名 lexiday-english、pages_build_output_dir 为 dist、数据库绑定名称 DB，填写真实 database_id、database_name 为 lexiday-accounts。不要将本地占位 ID 用于生产。
4. 初始化：`pnpm exec wrangler d1 execute lexiday-accounts --remote --file migrations/0001_accounts.sql`。
5. 生成至少 32 字节随机 pepper，将其作为 AUTH_PEPPER Secret 保存到原 Pages 项目。不可复制到聊天、日志或前端。使用 `wrangler pages secret put AUTH_PEPPER --project-name lexiday-english`，通过标准输入传值。
6. `pnpm build`；`pnpm exec wrangler pages deploy dist --project-name lexiday-english --branch main`。
7. 检查 `/api/health` 为 accounts-v1，匿名 `/api/session` 为 401；使用独立测试账号完成注册、跨会话恢复、隔离及退出验证。匿名资源可访问不等于账号数据库验证完成。

Pages dashboard 拖拽上传支持独立 _worker.js，但仍须先配置 DB 绑定和 Secret；只上传 ZIP 不会创建数据库。未配置时 API 返回 503，访客可继续学习。

## 维护

- `migrations/0001_accounts.sql` 只新增表和索引，不删除已有进度。
- 丢失或改变 AUTH_PEPPER 会使已有密码无法验证，需使用恢复码重置；妥善保管服务端 Secret。
- 数据库用户数据不应导入源码仓库。生产备份应使用 D1 的备份能力，并限制有权访问账号数据库的人员。
- 当前为应用账号系统，未提供管理员查看所有用户进度的后台或邮件服务。
- 使用 Cloudflare 现有免费额度，无需为本功能开启付费套餐；额度耗尽时同步可能暂不可用，本机待传记录仍保留。

## 最新更新

2026-10-22：部署 a418a51d。上传词表、逐级提示复习及已熟知标记已接入 words 快照，74 项测试通过，已验证正式 D1 写入与跨会话恢复。数据库表结构保持兼容，详见 REVIEW_AND_VOCABULARY.md。
