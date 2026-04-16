/**
 * 繁體中文翻譯
 */

export const zhTW = {
  // 通用
  common: {
    confirm: '確定',
    cancel: '取消',
    save: '儲存',
    delete: '刪除',
    edit: '編輯',
    copy: '複製',
    copied: '已複製',
    loading: '載入中...',
    search: '搜尋',
    clear: '清空',
    retry: '重試',
    close: '關閉',
    back: '返回',
    create: '建立',
    exportJson: '匯出 JSON'
  },

  // 頁面
  page: {
    chat: '對話',
    history: '歷史',
    favorites: '收藏',
    settings: '設定'
  },

  // 會話
  session: {
    newChat: '新對話',
    rename: '重新命名',
    delete: '刪除',
    favorite: '收藏',
    unfavorite: '取消收藏',
    deleteConfirm: '確定要刪除這個會話嗎？',
    restore: '復原',
    searchPlaceholder: '搜尋會話...',
    emptyHistory: '暫無歷史會話',
    emptyFavorites: '暫無收藏會話',
    exportSession: '匯出會話',
    sessionCount: '共 {0} 個會話',
    questionCount: '共 {0} 次提問',
    questionTimes: '次提問',
    latest: '最近：',
    favoriteCount: '共 {0} 個收藏',
    favoriteHint: '在歷史會話中點擊星號可新增收藏',
    noMessage: '暫無訊息'
  },

  // 訊息
  message: {
    user: '使用者',
    assistant: '助手',
    copy: '複製',
    quote: '引用',
    regenerate: '重新生成',
    rewind: '回退',
    thinking: '思考中...',
    copyCode: '複製程式碼'
  },

  // 輸入
  input: {
    placeholder: '輸入訊息...',
    send: '傳送',
    stop: '停止',
    enhance: '強化提示詞',
    context: '上下文佔用',
    attachImage: '新增圖片',
    attachFile: '新增檔案',
    removeAttachment: '移除附件'
  },

  // 提示詞增強
  enhance: {
    templates: '預設範本',
    role: '角色',
    format: '輸出格式',
    language: '輸出語言',
    constraints: '約束條件',
    constraintsPlaceholder: '輸入額外約束條件...',
    preview: '預覽',
    cancel: '取消',
    apply: '套用'
  },

  // 設定
  settings: {
    title: '設定',
    provider: '供應商',
    model: '模型',
    agent: '代理',
    theme: '主題',
    language: '語言',
    stream: '串流輸出',
    think: '顯示思考'
  },

  // 提示
  toast: {
    copied: '已複製到剪貼簿',
    saved: '儲存成功',
    deleted: '刪除成功',
    error: '操作失敗',
    success: '操作成功',
    inputRequired: '請先輸入內容',
    promptEnhanced: '提示詞已強化',
    sessionLoaded: '已載入會話',
    favoriteAdded: '已新增收藏',
    favoriteRemoved: '已取消收藏',
    renamed: '重新命名成功',
    quoteAdded: '已加入到輸入框'
  },

  // 錯誤
  error: {
    network: '網路錯誤，請檢查連線',
    unknown: '未知錯誤'
  },

  // Diff 檢視器
  diff: {
    title: '程式碼變更',
    collapse: '收合',
    expand: '展開',
    fileCount: '{count} 個檔案',
    noChanges: '無變更'
  },

  // 工具呼叫
  toolCall: {
    title: '工具呼叫',
    pending: '等待中',
    running: '執行中',
    success: '執行成功',
    failed: '執行失敗',
    viewOutput: '檢視輸出'
  },

  // 供應商管理
  provider: {
    name: '供應商名稱',
    url: 'API 位址',
    apiKey: 'API Key',
    models: '模型設定',
    defaultModel: '預設模型',
    opusModel: 'Opus 模型',
    maxModel: 'Max 模型',
    statusOk: '正常',
    statusErr: '異常',
    statusOff: '未啟用',
    addProvider: '新增供應商',
    editProvider: '編輯供應商',
    deleteProvider: '刪除供應商',
    deleteConfirm: '確定刪除供應商 "{0}" 嗎？',
    exportJson: '匯出 JSON',
    nameRequired: '請輸入供應商名稱',
    urlRequired: '請輸入 API 位址',
    namePlaceholder: '例如：Claude、DeepSeek',
    urlPlaceholder: 'https://api.example.com',
    apiKeyPlaceholder: 'sk-ant-xxxx',
    latestVersion: '已是最新',
    presetClaude: 'Claude',
    presetGlm: 'GLM',
    presetMinimax: 'Minimax',
    presetHint: '已填入 {0} 設定（API Key 需手動填寫）',
    jsonConfig: 'JSON 設定',
    jsonConfigDesc: '~/.claude/settings.json 格式，與上方欄位即時雙向同步',
    fromJsonFill: '從 JSON 填入到上方欄位',
    copyJsonBtn: '複製 JSON',
    fillSuccess: '已從 JSON 反向填入到所有欄位',
    jsonParseError: 'JSON 格式錯誤，請檢查後再試',
    keySecurityHint: '金鑰僅在本機儲存，不會上傳',
    modelPresetHint: '例如 Claude：default=claude-4.5 / opus=claude-opus-4 / max=claude-max',
    synced: '已同步'
  },

  // Agent 管理
  agent: {
    name: 'Agent 名稱',
    description: '描述',
    systemPrompt: '系統提示詞',
    addAgent: '新增 Agent',
    editAgent: '編輯 Agent',
    deleteAgent: '刪除 Agent',
    deleteConfirm: '確定刪除 Agent "{0}" 嗎？',
    nameRequired: '請輸入 Agent 名稱',
    descRequired: '請輸入描述',
    promptRequired: '請輸入系統提示詞',
    namePlaceholder: '例如：程式碼助手',
    descPlaceholder: '簡要描述這個 Agent 的用途',
    promptPlaceholder: '輸入系統提示詞，定義 Agent 的行為和角色...',
    descHint: '描述會在 Agent 清單中顯示',
    promptHint: '系統提示詞會作為對話開始時的上下文'
  },

  // Skill 管理
  skill: {
    name: 'Skill 名稱',
    description: '描述',
    triggerRule: '觸發規則',
    addSkill: '新增 Skill',
    editSkill: '編輯 Skill',
    deleteSkill: '刪除 Skill',
    deleteConfirm: '確定刪除 Skill "{0}" 嗎？',
    nameRequired: '請輸入 Skill 名稱',
    descRequired: '請輸入描述',
    triggerRequired: '請選擇觸發方式',
    namePlaceholder: '例如：程式碼審查',
    descPlaceholder: '簡要描述這個 Skill 的功能',
    triggerPlaceholder: '請選擇觸發方式',
    descHint: '描述會在 Skill 清單中顯示',
    triggerHint: '定義何時啟動此 Skill'
  },

  // 空狀態
  emptyState: {
    title: '開始新對話',
    description: '輸入訊息與 Claude 交流，或選擇以下快捷操作',
    optimizeCode: '優化程式碼',
    explainCode: '解釋程式碼',
    writeTest: '編寫測試',
    reviewChanges: '審查變更'
  },

  // 工具列
  toolbar: {
    newSession: '新建會話',
    history: '歷史會話',
    favorites: '收藏會話',
    stream: '串流',
    settings: '設定'
  },

  // 模式
  modes: {
    auto: '自動模式',
    plan: 'Plan 模式',
    agent: 'Agent 模式',
    thinking: '顯示思考',
    enhance: '強化提示詞',
    stream: '串流輸出'
  },

  // 設定頁詳情
  settingsDetail: {
    cliName: 'Claude Code CLI',
    currentVersion: '目前版本',
    cliVersion: 'CLI 版本',
    latestVersion: '已是最新',
    checkUpdate: '檢查更新',
    autoUpdate: '自動更新',
    autoUpdateDesc: '啟動 IDE 時自動偵測並更新 CLI',
    languageLabel: '介面語言',
    languageDesc: '重新啟動插件後生效',
    themeLabel: '介面主題',
    themeDesc: '跟隨 IDEA 主題自動切換',
    themeFollowIdea: '跟隨 IDEA',
    themeDark: '深色主題',
    themeLight: '淺色主題',
    themeHighContrast: '高對比度',
    basicSettings: '基礎設定',
    providerManage: '供應商管理',
    agentManage: 'Agent',
    skillManage: 'Skill',
    generalGroup: '通用',
    integrationGroup: '整合',
    back: '返回',
    providerList: '供應商清單',
    agentList: 'Agent 清單',
    skillList: 'Skill 清單',
    chatBg: '對話背景',
    chatBgDesc: '訊息區域的背景填充方式',
    chatBgDefault: '跟隨主題',
    chatBgColor: '顏色填充',
    chatBgImage: '圖片填充',
    bubbleColor: '訊息氣泡背景',
    codeBlockBg: '程式碼區塊背景',
    statusLegend: '狀態',
    statusOk: '正常',
    statusErr: '異常',
    statusOff: '未偵測',
    modelPresetHint: '模型預設決定對話介面「模型」懸浮框的選項範圍'
  }
};

export default zhTW;
