/**
 * 简体中文翻译
 */

export const zhCN = {
  // 通用
  common: {
    confirm: '确定',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    copy: '复制',
    copied: '已复制',
    loading: '加载中...',
    search: '搜索',
    clear: '清空',
    retry: '重试',
    close: '关闭',
    back: '返回',
    create: '创建',
    exportJson: '导出 JSON'
  },

  // 页面
  page: {
    chat: '会话',
    history: '历史',
    favorites: '收藏',
    settings: '设置'
  },

  // 会话
  session: {
    newChat: '新对话',
    rename: '重命名',
    delete: '删除',
    favorite: '收藏',
    unfavorite: '取消收藏',
    deleteConfirm: '确定要删除这个会话吗？',
    restore: '恢复',
    searchPlaceholder: '搜索会话...',
    emptyHistory: '暂无历史会话',
    emptyFavorites: '暂无收藏会话',
    exportSession: '导出会话',
    sessionCount: '共 {0} 个会话',
    questionCount: '共 {0} 次提问',
    questionTimes: '次提问',
    latest: '最近：',
    favoriteCount: '共 {0} 个收藏',
    favoriteHint: '在历史会话中点击星标可添加收藏',
    noMessage: '暂无消息'
  },

  // 消息
  message: {
    user: '用户',
    assistant: '助手',
    copy: '复制',
    quote: '引用',
    regenerate: '重新生成',
    rewind: '回退',
    thinking: '思考中...',
    copyCode: '复制代码'
  },

  // 输入
  input: {
    placeholder: '输入消息...',
    send: '发送',
    stop: '停止',
    enhance: '强化提示词',
    context: '上下文占用',
    attachImage: '添加图片',
    attachFile: '添加文件',
    removeAttachment: '移除附件'
  },

  // 提示词增强
  enhance: {
    templates: '预设模板',
    role: '角色',
    format: '输出格式',
    language: '输出语言',
    constraints: '约束条件',
    constraintsPlaceholder: '输入额外约束条件...',
    preview: '预览',
    cancel: '取消',
    apply: '应用'
  },

  // 设置
  settings: {
    title: '设置',
    provider: '供应商',
    model: '模型',
    agent: '代理',
    theme: '主题',
    language: '语言',
    stream: '流式输出',
    think: '显示思考',
    configureNewProvider: '配置新供应商',
    configureNewAgent: '配置新 Agent',
    configureNewSkill: '配置新 Skill'
  },

  // 提示
  toast: {
    copied: '已复制到剪贴板',
    saved: '保存成功',
    deleted: '删除成功',
    error: '操作失败',
    success: '操作成功',
    inputRequired: '请先输入内容',
    promptEnhanced: '提示词已强化',
    sessionLoaded: '已加载会话',
    favoriteAdded: '已添加收藏',
    favoriteRemoved: '已取消收藏',
    renamed: '重命名成功',
    quoteAdded: '已添加到输入框'
  },

  // 错误
  error: {
    network: '网络错误，请检查连接',
    unknown: '未知错误'
  },

  // Diff 查看器
  diff: {
    title: '代码变更',
    collapse: '收起',
    expand: '展开',
    fileCount: '{count} 个文件',
    noChanges: '无变更'
  },

  // 工具调用
  toolCall: {
    title: '工具调用',
    pending: '等待中',
    running: '执行中',
    success: '执行成功',
    failed: '执行失败',
    viewOutput: '查看输出'
  },

  // 供应商管理
  provider: {
    name: '供应商名称',
    url: 'API 地址',
    apiKey: 'API Key',
    models: '模型配置',
    defaultModel: '默认模型',
    opusModel: 'Opus 模型',
    maxModel: 'Max 模型',
    statusOk: '正常',
    statusErr: '异常',
    statusOff: '未启用',
    addProvider: '新增供应商',
    editProvider: '编辑供应商',
    deleteProvider: '删除供应商',
    deleteConfirm: '确定删除供应商 "{0}" 吗？',
    exportJson: '导出 JSON',
    nameRequired: '请输入供应商名称',
    urlRequired: '请输入 API 地址',
    namePlaceholder: '例如：Claude、DeepSeek',
    urlPlaceholder: 'https://api.example.com',
    apiKeyPlaceholder: 'sk-ant-xxxx',
    latestVersion: '已是最新',
    presetClaude: 'Claude',
    presetGlm: 'GLM',
    presetMinimax: 'Minimax',
    presetHint: '已填充 {0} 配置（API Key 需手动填写）',
    jsonConfig: 'JSON 配置',
    jsonConfigDesc: '~/.claude/settings.json 格式，与上方字段实时双向同步',
    fromJsonFill: '从 JSON 填充到上方字段',
    copyJsonBtn: '复制 JSON',
    fillSuccess: '已从 JSON 反向填充到所有字段',
    jsonParseError: 'JSON 格式错误，请检查后再试',
    keySecurityHint: '密钥仅在本地存储，不会上传',
    modelPresetHint: '例如 Claude：default=claude-4.5 / opus=claude-opus-4 / max=claude-max',
    synced: '已同步'
  },

  // Agent 管理
  agent: {
    name: 'Agent 名称',
    description: '描述',
    systemPrompt: '系统提示词',
    addAgent: '新增 Agent',
    editAgent: '编辑 Agent',
    deleteAgent: '删除 Agent',
    deleteConfirm: '确定删除 Agent "{0}" 吗？',
    nameRequired: '请输入 Agent 名称',
    descRequired: '请输入描述',
    promptRequired: '请输入系统提示词',
    namePlaceholder: '例如：代码助手',
    descPlaceholder: '简要描述这个 Agent 的用途',
    promptPlaceholder: '输入系统提示词，定义 Agent 的行为和角色...',
    descHint: '描述会在 Agent 列表中显示',
    promptHint: '系统提示词会作为对话开始时的上下文'
  },

  // Skill 管理
  skill: {
    name: 'Skill 名称',
    description: '描述',
    triggerRule: '触发规则',
    addSkill: '新增 Skill',
    editSkill: '编辑 Skill',
    deleteSkill: '删除 Skill',
    deleteConfirm: '确定删除 Skill "{0}" 吗？',
    nameRequired: '请输入 Skill 名称',
    descRequired: '请输入描述',
    triggerRequired: '请选择触发方式',
    namePlaceholder: '例如：代码审查',
    descPlaceholder: '简要描述这个 Skill 的功能',
    triggerPlaceholder: '请选择触发方式',
    descHint: '描述会在 Skill 列表中显示',
    triggerHint: '定义何时激活此 Skill'
  },

  // 空状态
  emptyState: {
    title: '开始新对话',
    description: '输入消息与 Claude 交流，或选择以下快捷操作',
    optimizeCode: '优化代码',
    explainCode: '解释代码',
    writeTest: '编写测试',
    reviewChanges: '审查变更'
  },

  // 工具栏
  toolbar: {
    newSession: '新建会话',
    history: '历史会话',
    favorites: '收藏会话',
    stream: '流式',
    settings: '设置'
  },

  // 模式
  modes: {
    auto: '自动模式',
    plan: 'Plan 模式',
    agent: 'Agent 模式',
    thinking: '显示思考',
    enhance: '强化提示词',
    stream: '流式输出'
  },

  // 设置页详情
  settingsDetail: {
    cliName: 'Claude Code CLI',
    currentVersion: '当前版本',
    cliVersion: 'CLI 版本',
    latestVersion: '已是最新',
    checkUpdate: '检查更新',
    autoUpdate: '自动更新',
    autoUpdateDesc: '启动 IDE 时自动检测并更新 CLI',
    languageLabel: '界面语言',
    languageDesc: '重启插件后生效',
    themeLabel: '界面主题',
    themeDesc: '跟随 IDEA 主题自动切换',
    themeFollowIdea: '跟随 IDEA',
    themeDark: '深色主题',
    themeLight: '浅色主题',
    themeHighContrast: '高对比度',
    basicSettings: '基础设置',
    providerManage: '供应商管理',
    agentManage: 'Agent',
    skillManage: 'Skill',
    generalGroup: '通用',
    integrationGroup: '集成',
    back: '返回',
    providerList: '供应商列表',
    agentList: 'Agent 列表',
    skillList: 'Skill 列表',
    chatBg: '对话背景',
    chatBgDesc: '消息区域的背景填充方式',
    chatBgDefault: '跟随主题',
    chatBgColor: '颜色填充',
    chatBgImage: '图片填充',
    bubbleColor: '消息气泡背景',
    codeBlockBg: '代码块背景',
    statusLegend: '状态',
    statusOk: '正常',
    statusErr: '异常',
    statusOff: '未检测',
    modelPresetHint: '模型预设决定对话界面「模型」悬浮框的可选范围'
  }
};

export default zhCN;
