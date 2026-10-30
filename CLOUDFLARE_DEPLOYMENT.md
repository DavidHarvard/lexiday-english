# 词序 Cloudflare Pages 部署

- 正式网址：https://lexiday-english.pages.dev/
- 语法课堂：https://lexiday-english.pages.dev/#grammar
- 项目名称：lexiday-english
- 托管：Cloudflare Pages，直接上传静态文件，使用平台免费 pages.dev 子域名；本次未开通付费服务。
- 部署日期：2026-10-22（Asia/Shanghai）
- 发布源码版本：b25049512a5f43ec38066014d60cd597821af7ae
- 发布目录：dist/。不要上传整个仓库，也不需要上传 .openai 配置或学习备份。

## 验证

Cloudflare 控制台返回 Success / deployed。无 Cookie、无 Authorization 的 HTTPS 请求访问首页返回 HTTP 200、零重定向，首页与本地文件逐字节一致。其余 13 个公开样式/脚本同样匿名读取并与本地文件比对。浏览器标签标题显示雅思半年计划；浏览器自动化后续连接超时，因此未完成迁移后的逐项交互复测。该部署与原先通过 45 项规则测试的静态代码一致。

## 后续更新

在 Cloudflare → Workers & Pages → lexiday-english → Create a new deployment，选择 Production，上传 dist/ 内容打包成的 ZIP（index.html 在压缩包根目录），然后 Save and Deploy。当前使用 Direct Upload，不会随 Git 提交自动发布。

## 学习进度迁移

浏览器本地存储按域名隔离。先在旧网站分别导出单词、雅思、语法备份，再在新域名对应模块导入。不会自动复制旧网址的数据，也没有跨设备云同步。旧 Sites 地址仍保留，便于导出进度。

## 已发布：雅思 GT 扩词版（2026-10-22）

**状态：已上线并完成匿名资源验证。** 用户手动上传后，使用不带 Cookie 或 Authorization 的 HTTPS 请求检查首页与全部 14 个公开脚本/样式，15 个文件均返回 HTTP 200、零重定向，SHA-256 与本地通过 50 项测试的上传包完全一致，包含新增 ielts-vocabulary.js。线上浏览器工具仍连接超时，因此本次未额外完成线上交互复测；本地交互检查记录保留。

- 200 个新词、210 个新词义、630 条双语例句；全站 220 词、235 词义。
- 自动测试：50/50 通过。本地浏览器验证词表搜索、展开释义、新词自测进入详解、刷新恢复。
- 生成上传包：`python3 scripts/package-pages.py`。默认生成 `/private/tmp/lexiday-cloudflare-pages-vocabulary.zip` 以及同名 `.manifest.json` 校验清单。
- 上传包包含 dist 下的 16 个文件，index.html 在根目录，无用户学习备份、凭据或开发文件。
- 上传目标：原有 `lexiday-english` 项目的 Production deployment。已以无 Cookie 的请求逐个比对公开文件和清单，确认新词库在公开域名生效。

匿名验证记录：`/private/tmp/lexiday-vocabulary-live-check.json`。正式词书入口：https://lexiday-english.pages.dev/#courses 。


## 账号系统上线（2026-10-22）

- 正式地址：https://lexiday-english.pages.dev/
- 部署地址：https://4e9dcf66.lexiday-english.pages.dev
- Pages Worker + D1 已启用，服务端密钥已配置；不需要 ChatGPT 登录即可访问和注册。
- 本地 59 项测试通过；生产注册、三模块保存/恢复、账号隔离、冲突拒绝与退出验证通过。
- 账号操作与维护说明见 ACCOUNT_DEPLOYMENT.md。

## 语法新题重练更新（2026-10-22）

部署 c5380386 已发布到 https://lexiday-english.pages.dev/#grammar 。语法题库从 48 题扩充到 144 题，三套轮换。62 项测试通过。正式域名三个修改资源与本地一致，已验证第二轮的新题、已提交答案、历史通过状态保存及重新登录恢复。自动检查账号 grammar_check_1792656586819 仅含合成测试数据。

## 上传词表与逐级复习上线（2026-10-22）

- 正式网址：https://lexiday-english.pages.dev/
- 部署版本：https://a418a51d.lexiday-english.pages.dev
- 导入 3610 个去重词条，新增 3451 词；雅思基础 3632 词条，全站 3671 词。
- 新增近义/形近/同词族分类与排序、四级提示复习、动态间隔、早已熟知排除及恢复；缺素材词采用明确标注的降级流程。
- 74 项测试通过。浏览器验证盲听不显示拼写、播放完成才允许听懂、四级提示、评级刷新恢复、词表搜索与分类卡片。
- 7 个改动的线上资源与本地逐字一致。生产 API 验证提示步骤跨会话恢复、grade=3/weight=.75/interval=13 保存、排除标记同步、上传词恢复复习及旧版本写入 409。
- 合成检查账号 review_check_1792665044526，不是用户或管理员账号。未读取其他用户学习快照。
- 已只读核实远程 D1 包含 users、sessions、progress、rate_limits 四张应用表；本次无需结构迁移。
- 当前材料缺口和算法参数见 REVIEW_AND_VOCABULARY.md。

### 2026-10-23 · Unit 1 课堂

隔离测试环境验证后同步主项目并发布，部署 ID `1e85e128`。81 项测试通过，正式域名资源一致性及生产 D1 Unit 1 进度同步检查通过。详情见 `UNIT1_TEST_ENVIRONMENT.md`。数据库结构与既有用户进度保持兼容。

## 单词学习与全雅思例句更新（2026-10-30）

发布目标为现有 lexiday-english Pages 项目与 GitHub main。新增自动朗读、听音中文输入验证、同日换例句、完全记住免复习、笔记去重及全雅思词库结构化义项。112 项测试通过；内容统计、旧进度兼容及校正来源见 [WORD_LEARNING.md](WORD_LEARNING.md)。D1 表结构与 AUTH_PEPPER 不变。

## 连贯阅读与听力交互（2026-10-30）

现有 Pages 项目加入 Workers AI binding，生成有统一主题和连贯段落的每日文章；提供四篇完整双语备用故事。听力题自动播放语音问题，作答后展示原文并重播。D1 表结构与账号密钥保持不变，继续使用既有进度同步。实现与验证见 [READING_AND_QUIZ.md](READING_AND_QUIZ.md)。


## 完整 PDF 教材与首听笔记（2026-10-30）

语法模块新增 294 页教材、115 单元及 35 组附加练习，489 题组共 3,373 项（2,970 自动检查、403 参考对照）。PDF 拆成 17 个分册按需载入，阅读页码和练习同步现有账号进度。Cambridge 听力答题框重新打开清空，首听笔记持久保存并自动显示。127 项规则测试、隔离数据库真实浏览器流程、阅读/语音调度回归通过。保留原 D1、AUTH_PEPPER 与 AI binding，不需要数据库迁移。详见 [GRAMMAR_READER.md](GRAMMAR_READER.md)。
