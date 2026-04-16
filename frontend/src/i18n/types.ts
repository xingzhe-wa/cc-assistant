/**
 * i18n 国际化类型定义
 */

/** 支持的语言 */
export type Locale = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR';

/** 翻译消息结构 */
export interface LocaleMessages {
  // 通用
  common: {
    confirm: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    copy: string;
    copied: string;
    loading: string;
    search: string;
    clear: string;
    retry: string;
    close: string;
    back: string;
    create: string;
    exportJson: string;
  };

  // 页面
  page: {
    chat: string;
    history: string;
    favorites: string;
    settings: string;
  };

  // 会话
  session: {
    newChat: string;
    rename: string;
    delete: string;
    favorite: string;
    unfavorite: string;
    deleteConfirm: string;
    restore: string;
    searchPlaceholder: string;
    emptyHistory: string;
    emptyFavorites: string;
    exportSession: string;
  };

  // 消息
  message: {
    user: string;
    assistant: string;
    copy: string;
    quote: string;
    regenerate: string;
    rewind: string;
    thinking: string;
    copyCode: string;
  };

  // 输入
  input: {
    placeholder: string;
    send: string;
    stop: string;
    enhance: string;
    context: string;
    attachImage: string;
    attachFile: string;
    removeAttachment: string;
  };

  // 提示词增强
  enhance: {
    templates: string;
    role: string;
    format: string;
    language: string;
    constraints: string;
    constraintsPlaceholder: string;
    preview: string;
    cancel: string;
    apply: string;
  };

  // 设置
  settings: {
    title: string;
    provider: string;
    model: string;
    agent: string;
    theme: string;
    language: string;
    stream: string;
    think: string;
  };

  // 提示
  toast: {
    copied: string;
    saved: string;
    deleted: string;
    error: string;
    success: string;
    inputRequired: string;
    promptEnhanced: string;
    sessionLoaded: string;
    favoriteAdded: string;
    favoriteRemoved: string;
  };

  // 错误
  error: {
    network: string;
    unknown: string;
  };

  // Diff 查看器
  diff: {
    title: string;
    collapse: string;
    expand: string;
    fileCount: string;
    noChanges: string;
  };

  // 工具调用
  toolCall: {
    title: string;
    pending: string;
    running: string;
    success: string;
    failed: string;
    viewOutput: string;
  };

  // 供应商管理
  provider: {
    name: string;
    url: string;
    apiKey: string;
    models: string;
    defaultModel: string;
    opusModel: string;
    maxModel: string;
    statusOk: string;
    statusErr: string;
    statusOff: string;
    addProvider: string;
    editProvider: string;
    deleteProvider: string;
    deleteConfirm: string;
    exportJson: string;
    nameRequired: string;
    urlRequired: string;
    namePlaceholder: string;
    urlPlaceholder: string;
    apiKeyPlaceholder: string;
    latestVersion: string;
    presetClaude: string;
    presetGlm: string;
    presetMinimax: string;
    presetHint: string;
    jsonConfig: string;
    jsonConfigDesc: string;
    fromJsonFill: string;
    copyJsonBtn: string;
    fillSuccess: string;
    jsonParseError: string;
    keySecurityHint: string;
    modelPresetHint: string;
    synced: string;
  };

  // Agent 管理
  agent: {
    name: string;
    description: string;
    systemPrompt: string;
    addAgent: string;
    editAgent: string;
    deleteAgent: string;
    deleteConfirm: string;
    nameRequired: string;
    descRequired: string;
    promptRequired: string;
    namePlaceholder: string;
    descPlaceholder: string;
    promptPlaceholder: string;
    descHint: string;
    promptHint: string;
  };

  // Skill 管理
  skill: {
    name: string;
    description: string;
    triggerRule: string;
    addSkill: string;
    editSkill: string;
    deleteSkill: string;
    deleteConfirm: string;
    nameRequired: string;
    descRequired: string;
    triggerRequired: string;
    namePlaceholder: string;
    descPlaceholder: string;
    triggerPlaceholder: string;
    descHint: string;
    triggerHint: string;
  };

  // 空状态
  emptyState: {
    title: string;
    description: string;
    optimizeCode: string;
    explainCode: string;
    writeTest: string;
    reviewChanges: string;
  };

  // 模式
  modes: {
    auto: string;
    plan: string;
    agent: string;
    thinking: string;
    enhance: string;
    stream: string;
  };

  // 设置页详情
  settingsDetail: {
    cliVersion: string;
    latestVersion: string;
    checkUpdate: string;
    autoUpdate: string;
    autoUpdateDesc: string;
    languageLabel: string;
    languageDesc: string;
    themeLabel: string;
    themeDesc: string;
    themeFollowIdea: string;
    themeDark: string;
    themeLight: string;
    themeHighContrast: string;
    basicSettings: string;
    providerManage: string;
    agentManage: string;
    skillManage: string;
    generalGroup: string;
    integrationGroup: string;
    back: string;
    providerList: string;
    agentList: string;
    skillList: string;
    chatBg: string;
    chatBgDesc: string;
    chatBgDefault: string;
    chatBgColor: string;
    chatBgImage: string;
    bubbleColor: string;
    codeBlockBg: string;
    statusLegend: string;
    statusOk: string;
    statusErr: string;
    statusOff: string;
    modelPresetHint: string;
  };
}

/** i18n 配置 */
export interface I18nConfig {
  /** 当前语言 */
  locale: Locale;
  /** 回退语言 */
  fallbackLocale: Locale;
  /** 翻译消息 */
  messages: Record<Locale, LocaleMessages>;
}
