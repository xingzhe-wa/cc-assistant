/**
 * 模拟数据 - 用于无后端连接时
 * 后续替换为实际数据加载
 */

import type { MockSession, MockDiffFile } from '@/types/mock';

// ========== 会话数据 ==========

export const mockSessions: MockSession[] = [
  {
    id: 'demo-session',
    title: '演示对话',
    fav: false,
    time: new Date().toLocaleTimeString(),
    qc: 0,
    hasFirstMessage: false,
    msgs: []
  }
];

export function createMockSession(title: string): MockSession {
  return {
    id: `session-${Date.now()}`,
    title,
    fav: false,
    time: new Date().toLocaleTimeString(),
    qc: 0,
    hasFirstMessage: false,
    msgs: []
  };
}

// ========== Diff 文件数据 ==========

export const mockDiffFiles: MockDiffFile[] = [
  { file: 'src/main/kotlin/.../model/Provider.kt', add: 45, del: 12 },
  { file: 'src/main/kotlin/.../bridge/CliBridgeService.kt', add: 23, del: 5 },
  { file: 'src/main/kotlin/.../services/ConfigService.kt', add: 8, del: 2 }
];

