/**
 * 数据服务 - 前端与后端通信层
 *
 * 从 Java 后端读取真实的 Provider/Skill/Agent 数据
 */

// Provider 类型 (与后端 ClaudeSettings 对齐)
export interface Provider {
  id: string;
  name: string;
  endpoint: string;
  defaultModel: string;
  fastModel: string;
  enabled: boolean;
}

// Model 类型
export interface Model {
  id: string;
  name: string;
  providerId: string;
}

// Skill 类型 (与后端 SkillConfig 对齐)
export interface Skill {
  id: string;
  name: string;
  description?: string;
  trigger?: string;
  command?: string;
  enabled: boolean;
  scope: 'global' | 'project';
}

// Agent 类型 (与后端 AgentConfig 对齐)
export interface Agent {
  id: string;
  name: string;
  description?: string;
  model?: string;
  systemPrompt?: string;
  enabled: boolean;
  scope: 'global' | 'project';
}

// Session 类型 (与后端 ChatSession 对齐)
export interface Session {
  id: string;
  sessionId?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  workingDir: string;
  messages: Message[];
  isFavorite: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  thinking?: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
  status: 'pending' | 'running' | 'success' | 'error';
}

// ========== 数据服务 ==========

class DataService {
  private providers: Provider[] = [];
  private models: Record<string, Model[]> = {};
  private skills: Skill[] = [];
  private agents: Agent[] = [];
  private initialized = false;

  /**
   * 初始化 - 从 Java 后端加载数据
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    // 通过 JCEF 桥接加载数据
    // 数据由 Java 端的 CCProviders.setData() 设置
    this.initialized = true;
  }

  /**
   * 获取 Provider 列表
   */
  getProviders(): Provider[] {
    return this.providers;
  }

  /**
   * 获取指定 Provider 的模型
   */
  getModels(providerId: string): Model[] {
    return this.models[providerId] || [];
  }

  /**
   * 获取所有模型
   */
  getAllModels(): Record<string, Model[]> {
    return this.models;
  }

  /**
   * 获取 Skills
   */
  getSkills(): Skill[] {
    return this.skills;
  }

  /**
   * 获取 Agents
   */
  getAgents(): Agent[] {
    return this.agents;
  }

  /**
   * 设置 Provider 数据 (由 Java 回调)
   */
  setProviders(providers: Provider[]): void {
    this.providers = providers;
  }

  /**
   * 设置模型数据 (由 Java 回调)
   */
  setModels(models: Record<string, Model[]>): void {
    this.models = models;
  }

  /**
   * 设置 Skills (由 Java 回调)
   */
  setSkills(skills: Skill[]): void {
    this.skills = skills;
  }

  /**
   * 设置 Agents (由 Java 回调)
   */
  setAgents(agents: Agent[]): void {
    this.agents = agents;
  }

  /**
   * 切换 Provider
   */
  switchProvider(providerId: string): void {
    // 发送切换请求到 Java 后端
    if (typeof window !== 'undefined' && (window as any).cefQuery) {
      (window as any).cefQuery.inject(`providerChange:${providerId}`);
    }
  }

  /**
   * 创建 Provider
   */
  createProvider(data: Partial<Provider>): void {
    if (typeof window !== 'undefined' && (window as any).cefQuery) {
      (window as any).cefQuery.inject(`providerCreate:${JSON.stringify(data)}`);
    }
  }

  /**
   * 更新 Provider
   */
  updateProvider(data: Partial<Provider>): void {
    if (typeof window !== 'undefined' && (window as any).cefQuery) {
      (window as any).cefQuery.inject(`providerUpdate:${JSON.stringify(data)}`);
    }
  }

  /**
   * 删除 Provider
   */
  deleteProvider(providerId: string): void {
    if (typeof window !== 'undefined' && (window as any).cefQuery) {
      (window as any).cefQuery.inject(`providerDelete:${providerId}`);
    }
  }

  /**
   * 创建 Skill
   */
  createSkill(data: Partial<Skill>): void {
    if (typeof window !== 'undefined' && (window as any).cefQuery) {
      (window as any).cefQuery.inject(`skillCreate:${JSON.stringify(data)}`);
    }
  }

  /**
   * 更新 Skill
   */
  updateSkill(data: Partial<Skill>): void {
    if (typeof window !== 'undefined' && (window as any).cefQuery) {
      (window as any).cefQuery.inject(`skillUpdate:${JSON.stringify(data)}`);
    }
  }

  /**
   * 删除 Skill
   */
  deleteSkill(skillId: string): void {
    if (typeof window !== 'undefined' && (window as any).cefQuery) {
      (window as any).cefQuery.inject(`skillDelete:${skillId}`);
    }
  }

  /**
   * 创建 Agent
   */
  createAgent(data: Partial<Agent>): void {
    if (typeof window !== 'undefined' && (window as any).cefQuery) {
      (window as any).cefQuery.inject(`agentCreate:${JSON.stringify(data)}`);
    }
  }

  /**
   * 更新 Agent
   */
  updateAgent(data: Partial<Agent>): void {
    if (typeof window !== 'undefined' && (window as any).cefQuery) {
      (window as any).cefQuery.inject(`agentUpdate:${JSON.stringify(data)}`);
    }
  }

  /**
   * 删除 Agent
   */
  deleteAgent(agentId: string): void {
    if (typeof window !== 'undefined' && (window as any).cefQuery) {
      (window as any).cefQuery.inject(`agentDelete:${agentId}`);
    }
  }
}

// 单例
export const dataService = new DataService();

// ========== 会话服务 ==========

class SessionService {
  private sessions: Session[] = [];
  private activeSessionId: string | null = null;

  /**
   * 获取会话列表
   */
  getSessions(): Session[] {
    return this.sessions;
  }

  /**
   * 获取活跃会话
   */
  getActiveSession(): Session | null {
    return this.sessions.find(s => s.id === this.activeSessionId) || null;
  }

  /**
   * 设置会话数据 (由 Java 回调)
   */
  setSessions(sessions: Session[]): void {
    this.sessions = sessions;
  }

  /**
   * 添加会话 (由 Java 回调)
   */
  addSession(session: Session): void {
    this.sessions.unshift(session);
  }

  /**
   * 更新会话 (由 Java 回调)
   */
  updateSession(session: Session): void {
    const index = this.sessions.findIndex(s => s.id === session.id);
    if (index >= 0) {
      this.sessions[index] = session;
    }
  }

  /**
   * 删除会话 (由 Java 回调)
   */
  removeSession(sessionId: string): void {
    this.sessions = this.sessions.filter(s => s.id !== sessionId);
  }

  /**
   * 设置活跃会话
   */
  setActiveSession(sessionId: string): void {
    this.activeSessionId = sessionId;
  }

  /**
   * 切换会话
   */
  switchSession(sessionId: string): void {
    if (typeof window !== 'undefined' && (window as any).cefQuery) {
      (window as any).cefQuery.inject(`sessionSwitch:${sessionId}`);
    }
  }

  /**
   * 新建会话
   */
  createSession(): void {
    if (typeof window !== 'undefined' && (window as any).cefQuery) {
      (window as any).cefQuery.inject('sessionCreate:');
    }
  }

  /**
   * 删除会话
   */
  deleteSession(sessionId: string): void {
    if (typeof window !== 'undefined' && (window as any).cefQuery) {
      (window as any).cefQuery.inject(`sessionDelete:${sessionId}`);
    }
  }

  /**
   * 切换收藏
   */
  toggleFavorite(sessionId: string): void {
    if (typeof window !== 'undefined' && (window as any).cefQuery) {
      (window as any).cefQuery.inject(`sessionToggleFavorite:${sessionId}`);
    }
  }

  /**
   * 重命名会话
   */
  renameSession(sessionId: string, title: string): void {
    if (typeof window !== 'undefined' && (window as any).cefQuery) {
      (window as any).cefQuery.inject(`sessionRename:${sessionId}:${title}`);
    }
  }
}

// 单例
export const sessionService = new SessionService();