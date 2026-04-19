## 1. Provider ENV Key 定义与工具方法

- [x] 1.1 在 `ProviderService` 中定义 `PROVIDER_ENV_KEYS` 常量列表，包含所有需要管理的 env key
- [x] 1.2 实现 `needsEnvUpdate(existingEnv: Map<String, String>, targetEnv: Map<String, String>): Boolean` 方法
- [x] 1.3 实现 `getMergedEnv(existingEnv: Map<String, String>, providerEnv: Map<String, String>): Map<String, String>` 方法，只覆盖白名单内的 key

## 2. switchProvider 改造

- [x] 2.1 修改 `switchProvider()` 使用新的 `getMergedEnv()` 方法
- [x] 2.2 在写回前调用 `needsEnvUpdate()` 判断是否需要写回
- [x] 2.3 确保 `ANTHROPIC_AUTH_TOKEN` 不被覆盖（已有逻辑，确认保留）

## 3. 单元测试

- [x] 3.1 编写 `ProviderService.switchProvider()` 的单元测试：用户自定义 key 保留
- [x] 3.2 编写 `needsEnvUpdate()` 测试：相同 env 不触发更新
- [x] 3.3 编写 `needsEnvUpdate()` 测试：有变化时触发更新

## 4. 验证

- [x] 4.1 运行 `./gradlew compileKotlin` 确认编译通过
- [x] 4.2 运行 `./gradlew test` 确认测试通过
- [ ] 4.3 手动测试：使用 settings-kimi.json 数据切换 Provider，验证保留额外字段
