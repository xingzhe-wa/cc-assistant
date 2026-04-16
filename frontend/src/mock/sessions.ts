import type { MockSession } from '@/types/mock';

export const mockSessions: MockSession[] = [
  {
    id: 's0',
    title: '实现 SessionService 会话管理',
    fav: true,
    time: '02-15 10:30',
    qc: 3,
    msgs: [
      {
        id: 'm0',
        role: 'user',
        content: '帮我实现 SessionService，支持会话的创建、保存、获取、删除和列表功能。',
        time: '10:30'
      },
      {
        id: 'm1',
        role: 'assistant',
        content: `好的，下面是 \`SessionService\` 的完整实现：

### 数据模型

\`\`\`kotlin
data class ChatSession(
    val id: String = UUID.randomUUID().toString(),
    val sessionId: String? = null,
    var title: String = "",
    val createdAt: Instant = Clock.System.now(),
    var updatedAt: Instant = Clock.System.now(),
    val workingDir: String,
    val messages: MutableList<Message> = mutableListOf(),
    var isFavorite: Boolean = false
)
\`\`\`

### 核心实现

\`\`\`kotlin
class SessionService {
    private val sessionsDir = Path(
        System.getProperty("user.home"), ".claude", "sessions"
    )
    init { sessionsDir.createDirectories() }

    fun createSession(workingDir: String): ChatSession {
        val s = ChatSession(workingDir = workingDir)
        saveSession(s)
        return s
    }

    fun saveSession(session: ChatSession) {
        session.updatedAt = Clock.System.now()
        sessionsDir.resolve("\${session.id}.json")
            .writeText(Json.encodeToString(session))
    }

    fun getSession(id: String): ChatSession? {
        val f = sessionsDir.resolve("$id.json")
        if (!f.exists()) return null
        return Json.decodeFromString(f.readText())
    }

    fun deleteSession(id: String) =
        sessionsDir.resolve("$id.json").deleteIfExists()

    fun listSessions(): List<ChatSession> =
        sessionsDir.listDirectoryEntries()
            .filter { it.extension == "json" }
            .map { Json.decodeFromString<ChatSession>(it.readText()) }
            .sortedByDescending { it.updatedAt }
}
\`\`\`

存储路径 \`~/.claude/sessions/{id}.json\`，每次保存自动更新时间戳。`,
        time: '10:31'
      }
    ]
  },
  {
    id: 's1',
    title: '修复 Tab 栏滚动问题',
    fav: false,
    time: '02-14 16:20',
    qc: 2,
    msgs: [
      {
        id: 'm4',
        role: 'user',
        content: 'Tab 栏超出时没有滚动条，帮我修复',
        time: '16:20'
      },
      {
        id: 'm5',
        role: 'assistant',
        content: `使用 \`SCROLL_TAB_LAYOUT\` 策略即可：

\`\`\`java
JTabbedPane tabs = new JTabbedPane(
    JTabbedPane.TOP,
    JTabbedPane.SCROLL_TAB_LAYOUT
);
\`\`\`

如果需要自定义 Tab 样式，可以用 \`JScrollPane\` 包裹水平容器。`,
        time: '16:22'
      }
    ]
  },
  {
    id: 's2',
    title: '性能优化建议',
    fav: false,
    time: '02-13 09:10',
    qc: 0,
    msgs: []
  }
];

export const getMockSessionById = (id: string): MockSession | undefined => {
  return mockSessions.find(s => s.id === id);
};

export const createMockSession = (title: string): MockSession => {
  return {
    id: `s${Date.now()}`,
    title,
    fav: false,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    qc: 0,
    msgs: []
  };
};
