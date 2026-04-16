/**
 * 韩语翻译
 */

export const koKR = {
  // 通用
  common: {
    confirm: '확인',
    cancel: '취소',
    save: '저장',
    delete: '삭제',
    edit: '편집',
    copy: '복사',
    copied: '복사됨',
    loading: '로딩 중...',
    search: '검색',
    clear: '지우기',
    retry: '재시도',
    close: '닫기',
    back: '뒤로',
    create: '만들기',
    exportJson: 'JSON 내보내기'
  },

  // 页面
  page: {
    chat: '채팅',
    history: '기록',
    favorites: '즐겨찾기',
    settings: '설정'
  },

  // 会话
  session: {
    newChat: '새 채팅',
    rename: '이름 바꾸기',
    delete: '삭제',
    favorite: '즐겨찾기',
    unfavorite: '즐겨찾기 해제',
    deleteConfirm: '이 세션을 삭제하시겠습니까?',
    restore: '복원',
    searchPlaceholder: '세션 검색...',
    emptyHistory: '기록 세션 없음',
    emptyFavorites: '즐겨찾기 세션 없음',
    exportSession: '세션 내보내기'
  },

  // 消息
  message: {
    user: '사용자',
    assistant: '어시스턴트',
    copy: '복사',
    quote: '인용',
    regenerate: '재생성',
    rewind: '되감기',
    thinking: '생각 중...',
    copyCode: '코드 복사'
  },

  // 输入
  input: {
    placeholder: '메시지 입력...',
    send: '보내기',
    stop: '중지',
    enhance: '프롬프트 강화',
    context: '컨텍스트 사용',
    attachImage: '이미지 첨부',
    attachFile: '파일 첨부'
  },

  // 设置
  settings: {
    title: '설정',
    provider: '공급자',
    model: '모델',
    agent: '에이전트',
    theme: '테마',
    language: '언어',
    stream: '스트림 출력',
    think: '생각 표시'
  },

  // 提示
  toast: {
    copied: '클립보드에 복사됨',
    saved: '저장됨',
    deleted: '삭제됨',
    error: '작업 실패',
    success: '작업 성공',
    inputRequired: '먼저 내용을 입력하세요',
    promptEnhanced: '프롬프트가 강화됨',
    sessionLoaded: '세션이 로드됨',
    favoriteAdded: '즐겨찾기에 추가됨',
    favoriteRemoved: '즐겨찾기에서 제거됨',
    quoteAdded: '입력 상자에 추가됨'
  },

  // 错误
  error: {
    network: '네트워크 오류, 연결을 확인하세요',
    unknown: '알 수 없는 오류'
  },

  // Diff 查看器
  diff: {
    title: '코드 변경',
    collapse: '접기',
    expand: '펼치기',
    fileCount: '{count}개 파일',
    noChanges: '변경 없음'
  },

  // 工具调用
  toolCall: {
    title: '도구 호출',
    pending: '대기 중',
    running: '실행 중',
    success: '성공',
    failed: '실패',
    viewOutput: '출력 보기'
  },

  // 提供者管理
  provider: {
    name: '공급자 이름',
    url: 'API URL',
    apiKey: 'API 키',
    models: '모델 설정',
    defaultModel: '기본 모델',
    opusModel: 'Opus 모델',
    maxModel: 'Max 모델',
    statusOk: '정상',
    statusErr: '오류',
    statusOff: '비활성화',
    addProvider: '공급자 추가',
    editProvider: '공급자 편집',
    deleteProvider: '공급자 삭제',
    deleteConfirm: '공급자 "{0}"을(를) 삭제하시겠습니까?',
    exportJson: 'JSON 내보내기',
    nameRequired: '공급자 이름을 입력하세요',
    urlRequired: 'API URL을 입력하세요',
    namePlaceholder: '예: Claude, DeepSeek',
    urlPlaceholder: 'https://api.example.com',
    apiKeyPlaceholder: 'sk-ant-xxxx',
    latestVersion: '최신 버전',
    presetClaude: 'Claude',
    presetGlm: 'GLM',
    presetMinimax: 'Minimax',
    presetHint: '{0} 설정이 입력되었습니다 (API 키는 수동 입력 필요)',
    jsonConfig: 'JSON 설정',
    jsonConfigDesc: '~/.claude/settings.json 형식, 위 필드와 실시간 양방향 동기화',
    fromJsonFill: 'JSON에서 위 필드로 채우기',
    copyJsonBtn: 'JSON 복사',
    fillSuccess: 'JSON에서 필드로 반영했습니다',
    jsonParseError: 'JSON 형식이 올바르지 않습니다. 확인 후 다시 시도하세요',
    keySecurityHint: '키는 로컬에만 저장되며 업로드되지 않습니다',
    modelPresetHint: '예: Claude: default=claude-4.5 / opus=claude-opus-4 / max=claude-max',
    synced: '동기화됨'
  },

  // 에이전트 관리
  agent: {
    name: '에이전트 이름',
    description: '설명',
    systemPrompt: '시스템 프롬프트',
    addAgent: '에이전트 추가',
    editAgent: '에이전트 편집',
    deleteAgent: '에이전트 삭제',
    deleteConfirm: '에이전트 "{0}"을(를) 삭제하시겠습니까?',
    nameRequired: '에이전트 이름을 입력하세요',
    descRequired: '설명을 입력하세요',
    promptRequired: '시스템 프롬프트를 입력하세요',
    namePlaceholder: '예: 코드 어시스턴트',
    descPlaceholder: '이 에이전트의 목적을简要 설명',
    promptPlaceholder: '에이전트 행동을 정의하는 시스템 프롬프트를 입력...',
    descHint: '에이전트 목록에 표시되는 설명',
    promptHint: '대화 시작 시 컨텍스트로 사용되는 시스템 프롬프트'
  },

  // 스킬 관리
  skill: {
    name: '스킬 이름',
    description: '설명',
    triggerRule: '트리거 규칙',
    addSkill: '스킬 추가',
    editSkill: '스킬 편집',
    deleteSkill: '스킬 삭제',
    deleteConfirm: '스킬 "{0}"을(를) 삭제하시겠습니까?',
    nameRequired: '스킬 이름을 입력하세요',
    descRequired: '설명을 입력하세요',
    triggerRequired: '트리거 유형을 선택하세요',
    namePlaceholder: '예: 코드 리뷰',
    descPlaceholder: '이 스킬의 기능을简要 설명',
    triggerPlaceholder: '트리거 유형 선택',
    descHint: '스킬 목록에 표시되는 설명',
    triggerHint: '이 스킬이 활성화되는 시점을 정의'
  },

  // 空状态
  emptyState: {
    title: '새 채팅 시작',
    description: '메시지를 입력하여 Claude와 채팅하거나 빠른 작업을 선택하세요',
    optimizeCode: '코드 최적화',
    explainCode: '코드 설명',
    writeTest: '테스트 작성',
    reviewChanges: '변경 사항 검토'
  },

  // 模式
  modes: {
    auto: '자동 모드',
    plan: 'Plan 모드',
    agent: 'Agent 모드',
    thinking: '생각 표시',
    enhance: '프롬프트 강화',
    stream: '스트림 출력'
  },

  // 设置页详情
  settingsDetail: {
    cliVersion: 'CLI 버전',
    latestVersion: '최신 버전',
    checkUpdate: '업데이트 확인',
    autoUpdate: '자동 업데이트',
    autoUpdateDesc: 'IDE 시작 시 CLI 자동 감지 및 업데이트',
    languageLabel: '인터페이스 언어',
    languageDesc: '플러그인 재시작 후 적용',
    themeLabel: '인터페이스 테마',
    themeDesc: 'IDEA 테마 따라 자동 전환',
    themeFollowIdea: 'IDEA 따르기',
    themeDark: '다크 테마',
    themeLight: '라이트 테마',
    themeHighContrast: '고대비',
    basicSettings: '기본 설정',
    providerManage: '공급자 관리',
    agentManage: '에이전트',
    skillManage: '스킬',
    generalGroup: '일반',
    integrationGroup: '통합',
    back: '뒤로',
    providerList: '공급자 목록',
    agentList: '에이전트 목록',
    skillList: '스킬 목록',
    chatBg: '채팅 배경',
    chatBgDesc: '메시지 영역의 배경 스타일',
    chatBgDefault: '테마 따르기',
    chatBgColor: '색상 채우기',
    chatBgImage: '이미지 채우기',
    bubbleColor: '메시지 버블 배경',
    codeBlockBg: '코드 블록 배경',
    statusLegend: '상태',
    statusOk: '정상',
    statusErr: '오류',
    statusOff: '미확인',
    modelPresetHint: '모델 프리셋은 채팅 모델 선택기의 선택 옵션을 결정합니다'
  }
};

export default koKR;
