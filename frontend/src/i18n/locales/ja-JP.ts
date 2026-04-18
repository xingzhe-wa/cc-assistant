/**
 * 日语翻译
 */

export const jaJP = {
  // 通用
  common: {
    confirm: '確認',
    cancel: 'キャンセル',
    save: '保存',
    delete: '削除',
    edit: '編集',
    copy: 'コピー',
    copied: 'コピー済み',
    loading: '読み込み中...',
    search: '検索',
    clear: 'クリア',
    retry: '再試行',
    close: '閉じる',
    back: '戻る',
    create: '作成',
    exportJson: 'JSONエクスポート'
  },

  // ページ
  page: {
    chat: 'チャット',
    history: '履歴',
    favorites: 'お気に入り',
    settings: '設定'
  },

  // セッション
  session: {
    newChat: '新規チャット',
    rename: '名前変更',
    delete: '削除',
    favorite: 'お気に入り',
    unfavorite: 'お気に入り解除',
    deleteConfirm: 'このセッションを削除してもよろしいですか？',
    restore: '復元',
    searchPlaceholder: 'セッションを検索...',
    emptyHistory: '履歴セッションなし',
    emptyFavorites: 'お気に入りセッションなし',
    exportSession: 'セッションをエクスポート',
    sessionCount: '{0} 件のセッション',
    questionCount: '{0} 回の質問',
    questionTimes: '回の質問',
    latest: '最新：',
    favoriteCount: '{0} 件のお気に入り',
    favoriteHint: '履歴セッションの星印をクリックしてお気に入りに追加',
    noMessage: 'メッセージなし'
  },

  // メッセージ
  message: {
    user: 'ユーザー',
    assistant: 'アシスタント',
    copy: 'コピー',
    quote: '引用',
    regenerate: '再生成',
    rewind: '巻き戻し',
    thinking: '思考中...',
    copyCode: 'コードをコピー'
  },

  // 入力
  input: {
    placeholder: 'メッセージを入力...',
    send: '送信',
    stop: '停止',
    enhance: 'プロンプト強化',
    context: 'コンテキスト使用',
    attachImage: '画像を追加',
    attachFile: 'ファイルを追加',
    removeAttachment: '削除'
  },

  // プロンプト強化
  enhance: {
    templates: 'テンプレート',
    role: 'ロール',
    format: '出力形式',
    language: '言語',
    constraints: '制約条件',
    constraintsPlaceholder: '制約条件を入力...',
    preview: 'プレビュー',
    cancel: 'キャンセル',
    apply: '適用'
  },

  // 設定
  settings: {
    title: '設定',
    provider: 'プロバイダー',
    model: 'モデル',
    agent: 'エージェント',
    theme: 'テーマ',
    language: '言語',
    stream: 'ストリーム出力',
    think: '思考を表示',
    configureNewProvider: '新規プロバイダー設定',
    configureNewAgent: '新規エージェント設定',
    configureNewSkill: '新規スキル設定'
  },

  // トースト
  toast: {
    copied: 'クリップボードにコピーしました',
    saved: '保存しました',
    deleted: '削除しました',
    error: '操作失敗',
    success: '操作成功',
    inputRequired: 'まずコンテンツを入力してください',
    promptEnhanced: 'プロンプトが強化されました',
    sessionLoaded: 'セッションを読み込みました',
    favoriteAdded: 'お気に入りに追加しました',
    favoriteRemoved: 'お気に入りから削除しました',
    renamed: '名前を変更しました',
    quoteAdded: '入力ボックスに追加しました'
  },

  // エラー
  error: {
    network: 'ネットワークエラー、接続を確認してください',
    unknown: '不明なエラー'
  },

  // Diff ビューア
  diff: {
    title: 'コード変更',
    collapse: '折りたたむ',
    expand: '展開',
    fileCount: '{count} ファイル',
    noChanges: '変更なし'
  },

  // ツール呼び出し
  toolCall: {
    title: 'ツール呼び出し',
    pending: '保留中',
    running: '実行中',
    success: '成功',
    failed: '失敗',
    viewOutput: '出力を表示'
  },

  // プロバイダー管理
  provider: {
    name: 'プロバイダー名',
    url: 'API URL',
    apiKey: 'API キー',
    models: 'モデル設定',
    defaultModel: 'デフォルトモデル',
    opusModel: 'Opus モデル',
    maxModel: 'Max モデル',
    statusOk: 'OK',
    statusErr: 'エラー',
    statusOff: '無効',
    addProvider: 'プロバイダーを追加',
    editProvider: 'プロバイダーを編集',
    deleteProvider: 'プロバイダーを削除',
    deleteConfirm: 'プロバイダー "{0}" を削除してもよろしいですか？',
    exportJson: 'JSONエクスポート',
    nameRequired: 'プロバイダー名を入力してください',
    urlRequired: 'API URLを入力してください',
    namePlaceholder: '例：Claude、DeepSeek',
    urlPlaceholder: 'https://api.example.com',
    apiKeyPlaceholder: 'sk-ant-xxxx',
    latestVersion: '最新です',
    presetClaude: 'Claude',
    presetGlm: 'GLM',
    presetMinimax: 'Minimax',
    presetHint: '{0} 設定を入力しました（APIキーは手動入力が必要）',
    jsonConfig: 'JSON設定',
    jsonConfigDesc: '~/.claude/settings.json 形式、上記フィールドとリアルタイム双方向同期',
    fromJsonFill: 'JSONから上記フィールドに反映',
    copyJsonBtn: 'JSONをコピー',
    fillSuccess: 'JSONからフィールドに反映しました',
    jsonParseError: 'JSON形式が正しくありません。確認して再試行してください',
    keySecurityHint: 'キーはローカルにのみ保存され、アップロードされません',
    modelPresetHint: '例：Claude: default=claude-4.5 / opus=claude-opus-4 / max=claude-max',
    synced: '同期済み'
  },

  // エージェント管理
  agent: {
    name: 'エージェント名',
    description: '説明',
    systemPrompt: 'システムプロンプト',
    addAgent: 'エージェントを追加',
    editAgent: 'エージェントを編集',
    deleteAgent: 'エージェントを削除',
    deleteConfirm: 'エージェント "{0}" を削除してもよろしいですか？',
    nameRequired: 'エージェント名を入力してください',
    descRequired: '説明を入力してください',
    promptRequired: 'システムプロンプトを入力してください',
    namePlaceholder: '例：コードアシスタント',
    descPlaceholder: 'このエージェントの目的を簡潔に説明',
    promptPlaceholder: 'エージェントの行動を定義するシステムプロンプトを入力...',
    descHint: 'エージェントリストに表示される説明',
    promptHint: '会話開始時のコンテキストとしてシステムプロンプトが使用されます'
  },

  // スキル管理
  skill: {
    name: 'スキル名',
    description: '説明',
    triggerRule: 'トリガールール',
    addSkill: 'スキルを追加',
    editSkill: 'スキルを編集',
    deleteSkill: 'スキルを削除',
    deleteConfirm: 'スキル "{0}" を削除してもよろしいですか？',
    nameRequired: 'スキル名を入力してください',
    descRequired: '説明を入力してください',
    triggerRequired: 'トリガータイプを選択してください',
    namePlaceholder: '例：コードレビュー',
    descPlaceholder: 'このスキルの機能を簡潔に説明',
    triggerPlaceholder: 'トリガータイプを選択',
    descHint: 'スキルリストに表示される説明',
    triggerHint: 'このスキルをいつアクティブにするかを定義'
  },

  // 空状態
  emptyState: {
    title: '新しいチャットを開始',
    description: 'メッセージを入力してClaudeと聊天するか、クイックアクションを選択',
    optimizeCode: 'コードを最適化',
    explainCode: 'コードを説明',
    writeTest: 'テストを書く',
    reviewChanges: '変更をレビュー'
  },

  // モード
  modes: {
    auto: '自動モード',
    plan: 'Plan モード',
    agent: 'Agent モード',
    thinking: '思考を表示',
    enhance: 'プロンプト強化',
    stream: 'ストリーム出力'
  },

  // ツールバー
  toolbar: {
    newSession: '新規チャット',
    history: '履歴',
    favorites: 'お気に入り',
    stream: 'ストリーム',
    settings: '設定'
  },

  // 設定ページ詳細
  settingsDetail: {
    cliName: 'Claude Code CLI',
    currentVersion: '現在のバージョン',
    cliVersion: 'CLI バージョン',
    latestVersion: '最新です',
    checkUpdate: '更新を確認',
    autoUpdate: '自動更新',
    autoUpdateDesc: 'IDE起動時にCLIを自動検出・更新',
    languageLabel: 'インターフェース言語',
    languageDesc: 'プラグイン再起動後に適用',
    themeLabel: 'インターフェーステーマ',
    themeDesc: 'IDEAテーマに従って自動切替',
    themeFollowIdea: 'IDEAに従う',
    themeDark: 'ダークテーマ',
    themeLight: 'ライトテーマ',
    themeHighContrast: '高コントラスト',
    basicSettings: '基本設定',
    providerManage: 'プロバイダー管理',
    agentManage: 'エージェント',
    skillManage: 'スキル',
    generalGroup: '一般',
    integrationGroup: '統合',
    back: '戻る',
    providerList: 'プロバイダーリスト',
    agentList: 'エージェントリスト',
    skillList: 'スキルリスト',
    chatBg: 'チャット背景',
    chatBgDesc: 'メッセージエリアの背景スタイル',
    chatBgDefault: 'テーマに従う',
    chatBgColor: 'カラー塗りつぶし',
    chatBgImage: '画像塗りつぶし',
    bubbleColor: 'メッセージバブル背景',
    codeBlockBg: 'コードブロック背景',
    statusLegend: 'ステータス',
    statusOk: 'OK',
    statusErr: 'エラー',
    statusOff: '未検証',
    modelPresetHint: 'モデルプリセットはチャットのモデルセレクターの選択肢を決定します'
  }
};

export default jaJP;
