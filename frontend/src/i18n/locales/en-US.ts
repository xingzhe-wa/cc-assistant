/**
 * 英文翻译
 */

export const enUS = {
  // 通用
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    copy: 'Copy',
    copied: 'Copied',
    loading: 'Loading...',
    search: 'Search',
    clear: 'Clear',
    retry: 'Retry',
    close: 'Close',
    back: 'Back',
    create: 'Create',
    exportJson: 'Export JSON'
  },

  // 页面
  page: {
    chat: 'Chat',
    history: 'History',
    favorites: 'Favorites',
    settings: 'Settings'
  },

  // 会话
  session: {
    newChat: 'New Chat',
    rename: 'Rename',
    delete: 'Delete',
    favorite: 'Favorite',
    unfavorite: 'Unfavorite',
    deleteConfirm: 'Are you sure you want to delete this session?',
    restore: 'Restore',
    searchPlaceholder: 'Search sessions...',
    emptyHistory: 'No history sessions',
    emptyFavorites: 'No favorite sessions',
    exportSession: 'Export Session'
  },

  // 消息
  message: {
    user: 'User',
    assistant: 'Assistant',
    copy: 'Copy',
    quote: 'Quote',
    regenerate: 'Regenerate',
    rewind: 'Rewind',
    thinking: 'Thinking...',
    copyCode: 'Copy Code'
  },

  // 输入
  input: {
    placeholder: 'Type a message...',
    send: 'Send',
    stop: 'Stop',
    enhance: 'Enhance Prompt',
    context: 'Context Used',
    attachImage: 'Attach Image',
    attachFile: 'Attach File'
  },

  // 设置
  settings: {
    title: 'Settings',
    provider: 'Provider',
    model: 'Model',
    agent: 'Agent',
    theme: 'Theme',
    language: 'Language',
    stream: 'Stream Output',
    think: 'Show Thinking'
  },

  // 提示
  toast: {
    copied: 'Copied to clipboard',
    saved: 'Saved successfully',
    deleted: 'Deleted successfully',
    error: 'Operation failed',
    success: 'Operation successful',
    inputRequired: 'Please enter content first',
    promptEnhanced: 'Prompt enhanced',
    sessionLoaded: 'Session loaded',
    favoriteAdded: 'Added to favorites',
    favoriteRemoved: 'Removed from favorites',
    quoteAdded: 'Added to input box'
  },

  // 错误
  error: {
    network: 'Network error, please check connection',
    unknown: 'Unknown error'
  },

  // Diff 查看器
  diff: {
    title: 'Code Changes',
    collapse: 'Collapse',
    expand: 'Expand',
    fileCount: '{count} files',
    noChanges: 'No changes'
  },

  // 工具调用
  toolCall: {
    title: 'Tool Calls',
    pending: 'Pending',
    running: 'Running',
    success: 'Success',
    failed: 'Failed',
    viewOutput: 'View Output'
  },

  // 供应商管理
  provider: {
    name: 'Provider Name',
    url: 'API URL',
    apiKey: 'API Key',
    models: 'Model Configuration',
    defaultModel: 'Default Model',
    opusModel: 'Opus Model',
    maxModel: 'Max Model',
    statusOk: 'OK',
    statusErr: 'Error',
    statusOff: 'Disabled',
    addProvider: 'Add Provider',
    editProvider: 'Edit Provider',
    deleteProvider: 'Delete Provider',
    deleteConfirm: 'Are you sure you want to delete provider "{0}"?',
    exportJson: 'Export JSON',
    nameRequired: 'Please enter provider name',
    urlRequired: 'Please enter API URL',
    namePlaceholder: 'e.g. Claude, DeepSeek',
    urlPlaceholder: 'https://api.example.com',
    apiKeyPlaceholder: 'sk-ant-xxxx',
    latestVersion: 'Up to date',
    presetClaude: 'Claude',
    presetGlm: 'GLM',
    presetMinimax: 'Minimax',
    presetHint: 'Filled {0} config (API Key needs manual input)',
    jsonConfig: 'JSON Configuration',
    jsonConfigDesc: '~/.claude/settings.json format, real-time bidirectional sync with fields above',
    fromJsonFill: 'Fill fields from JSON above',
    copyJsonBtn: 'Copy JSON',
    fillSuccess: 'Fields populated from JSON',
    jsonParseError: 'Invalid JSON format, please check and try again',
    keySecurityHint: 'Key is stored locally only, never uploaded',
    modelPresetHint: 'e.g. Claude: default=claude-4.5 / opus=claude-opus-4 / max=claude-max',
    synced: 'Synced'
  },

  // Agent 管理
  agent: {
    name: 'Agent Name',
    description: 'Description',
    systemPrompt: 'System Prompt',
    addAgent: 'Add Agent',
    editAgent: 'Edit Agent',
    deleteAgent: 'Delete Agent',
    deleteConfirm: 'Are you sure you want to delete agent "{0}"?',
    nameRequired: 'Please enter agent name',
    descRequired: 'Please enter description',
    promptRequired: 'Please enter system prompt',
    namePlaceholder: 'e.g. Code Assistant',
    descPlaceholder: "Briefly describe this agent's purpose",
    promptPlaceholder: 'Enter system prompt to define agent behavior...',
    descHint: 'Description shown in agent list',
    promptHint: 'System prompt serves as context at start of conversation'
  },

  // Skill 管理
  skill: {
    name: 'Skill Name',
    description: 'Description',
    triggerRule: 'Trigger Rule',
    addSkill: 'Add Skill',
    editSkill: 'Edit Skill',
    deleteSkill: 'Delete Skill',
    deleteConfirm: 'Are you sure you want to delete skill "{0}"?',
    nameRequired: 'Please enter skill name',
    descRequired: 'Please enter description',
    triggerRequired: 'Please select trigger type',
    namePlaceholder: 'e.g. Code Review',
    descPlaceholder: "Briefly describe this skill's functionality",
    triggerPlaceholder: 'Select trigger type',
    descHint: 'Description shown in skill list',
    triggerHint: 'Define when this skill activates'
  },

  // 空状态
  emptyState: {
    title: 'Start a New Chat',
    description: 'Type a message to chat with Claude, or choose a quick action',
    optimizeCode: 'Optimize Code',
    explainCode: 'Explain Code',
    writeTest: 'Write Tests',
    reviewChanges: 'Review Changes'
  },

  // 模式
  modes: {
    auto: 'Auto Mode',
    plan: 'Plan Mode',
    agent: 'Agent Mode',
    thinking: 'Show Thinking',
    enhance: 'Enhance Prompt',
    stream: 'Stream Output'
  },

  // 设置页详情
  settingsDetail: {
    cliVersion: 'CLI Version',
    latestVersion: 'Up to date',
    checkUpdate: 'Check Update',
    autoUpdate: 'Auto Update',
    autoUpdateDesc: 'Auto-detect and update CLI when IDE starts',
    languageLabel: 'Interface Language',
    languageDesc: 'Takes effect after restarting plugin',
    themeLabel: 'Interface Theme',
    themeDesc: 'Auto-switch following IDEA theme',
    themeFollowIdea: 'Follow IDEA',
    themeDark: 'Dark Theme',
    themeLight: 'Light Theme',
    themeHighContrast: 'High Contrast',
    basicSettings: 'Basic Settings',
    providerManage: 'Provider Management',
    agentManage: 'Agent',
    skillManage: 'Skill',
    generalGroup: 'General',
    integrationGroup: 'Integration',
    back: 'Back',
    providerList: 'Provider List',
    agentList: 'Agent List',
    skillList: 'Skill List',
    chatBg: 'Chat Background',
    chatBgDesc: 'Background fill style for message area',
    chatBgDefault: 'Follow Theme',
    chatBgColor: 'Color Fill',
    chatBgImage: 'Image Fill',
    bubbleColor: 'Message Bubble Background',
    codeBlockBg: 'Code Block Background',
    statusLegend: 'Status',
    statusOk: 'OK',
    statusErr: 'Error',
    statusOff: 'Unchecked',
    modelPresetHint: 'Model presets determine the available options in the chat model selector'
  }
};

export default enUS;
