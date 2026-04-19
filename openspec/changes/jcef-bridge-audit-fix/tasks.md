## 1. JCEF Bridge Audit & Fix

- [x] 1.1 审计 `dataService.ts` 中所有 `cefQuery.inject()` 调用，确认消息格式
- [x] 1.2 审计 `jcef.ts` 中 `jcefBridge.send()` 的实现，确认是否被使用
- [x] 1.3 修复 `JcefChatPanel.injectJavaBridge()` 中 `$queryRef.inject` → `cefQuery()`
- [x] 1.4 修复前端所有 `cefQuery.inject()` → `cefQuery()` 调用

## 2. Provider Switch 链路验证

- [x] 2.1 修复 `dataService.switchProvider()` 消息格式
- [x] 2.2 `handleJSMessage` 日志已存在
- [x] 2.3 `onProviderChange` 回调链路已存在
- [x] 2.4 `ProviderService.switchProvider()` 已实现智能合并
- [x] 2.5 清理 mock 数据：`chatStoreExtensions` providers/agents/skills 初始化为空

## 3. Provider CRUD 链路验证

- [x] 3.1 `providerCreate` action 修复
- [x] 3.2 `providerUpdate` action 修复
- [x] 3.3 `providerDelete` action 修复

## 4. Agent CRUD 链路验证

- [x] 4.1 `agentCreate` action 修复
- [x] 4.2 `agentUpdate` action 修复
- [x] 4.3 `agentDelete` action 修复

## 5. Skill CRUD 链路验证

- [x] 5.1 `skillCreate` action 修复
- [x] 5.2 `skillUpdate` action 修复
- [x] 5.3 `skillDelete` action 修复

## 6. ENV 智能合并验证

- [x] 6.1 `PROVIDER_ENV_KEYS` 白名单已定义
- [x] 6.2 `ANTHROPIC_AUTH_TOKEN` 不在白名单中，天然保留
- [x] 6.3 `getMergedEnv()` 只覆盖白名单 key
- [x] 6.4 `needsEnvUpdate()` 已实现

## 7. 编译与测试

- [x] 7.1 `./gradlew compileKotlin` 通过
- [x] 7.2 `./gradlew test` 通过
- [x] 7.3 前端 `npm run build` 通过
