# 青龙脚本项目

Node.js 脚本集合，运行在青龙面板。

## 结构

- `utils.js` — 共享工具：`App` 类、`getEnv`、`delay` 等
- `bilibili.js` — B站每日任务（登录/分享/漫画签到/大会员/银瓜子换硬币）
- `tieba.js` — 百度贴吧批量签到
- `jc.js` / `v2ex.js` — 其他平台任务
- 依赖：`axios`、`safe-stable-stringify`

## 规范

每个脚本顶部必须有头注释，声明 Env 名称、cron 表达式、ck 名称和格式：

```js
/**
 * new Env("任务名称")
 * cron: 5 8 * * *
 *
 * ck名称: xxx
 * ck格式: cookie;;;
 */
```

- 格式化：Prettier，`singleQuote: true`
- 延时用 `delay()`，不用 `sleep()`
- 环境变量通过 `getEnv(envName)` 读取
