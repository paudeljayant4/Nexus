import { prisma } from './client';
import {
  Goal, CreateGoal, UpdateGoal,
  Task, CreateTask, UpdateTask, TaskRanking, TaskComment, CreateTaskComment,
  Tag, CreateTag,
  DailyPlan, CreateDailyPlan, TimeBlock, CreateTimeBlock, UpdateTimeBlock,
  Habit, CreateHabit, UpdateHabit, HabitLog, LogHabit,
  Memory, CreateMemory, UpdateMemory,
  KnowledgeNode, CreateKnowledgeNode, KnowledgeEdge, CreateKnowledgeEdge,
  Agent, CreateAgent, AgentRun,
  Insight,
  UserSetting, UpdateUserSetting,
  User,
} from '@nexus/types';
import { Prisma } from '@prisma/client';

type TaskEventType = 'CREATED' | 'UPDATED' | 'STATUS_CHANGED' | 'COMPLETED' | 'SKIPPED' | 'RANKED' | 'AI_SUGGESTED';

function toGoal(g: any): Goal {
  return {
    ...g,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
    targetDate: g.targetDate?.toISOString() ?? undefined,
  };
}

function toTask(t: any): Task {
  return {
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    dueDate: t.dueDate?.toISOString() ?? undefined,
    scheduledDate: t.scheduledDate?.toISOString() ?? undefined,
    completedAt: t.completedAt?.toISOString() ?? undefined,
  };
}

function toComment(c: any): TaskComment {
  return {
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function toTimeBlock(tb: any): TimeBlock {
  return {
    ...tb,
    startTime: tb.startTime.toISOString(),
    endTime: tb.endTime.toISOString(),
    createdAt: tb.createdAt.toISOString(),
  };
}

function toHabit(h: any): Habit {
  return {
    ...h,
    createdAt: h.createdAt.toISOString(),
    updatedAt: h.updatedAt.toISOString(),
  };
}

function toHabitLog(hl: any): HabitLog {
  return {
    ...hl,
    date: hl.date.toISOString(),
    createdAt: hl.createdAt.toISOString(),
  };
}

function toMemory(m: any): Memory {
  return {
    ...m,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

function toKnowledgeNode(n: any): KnowledgeNode {
  return {
    ...n,
    createdAt: n.createdAt.toISOString(),
  };
}

function toKnowledgeEdge(e: any): KnowledgeEdge {
  return {
    ...e,
    createdAt: e.createdAt.toISOString(),
  };
}

function toAgent(a: any): Agent {
  return {
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

function toAgentRun(r: any): AgentRun {
  return {
    ...r,
    startedAt: r.startedAt?.toISOString() ?? null,
    completedAt: r.completedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

function toInsight(i: any): Insight {
  return {
    ...i,
    createdAt: i.createdAt.toISOString(),
  };
}

function toUserSetting(s: any): UserSetting {
  return {
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

// ─── Goal Repository ──────────────────────────────────────────────

export const goalRepository = {
  async findByUserId(userId: string): Promise<Goal[]> {
    const goals = await prisma.goal.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: { priority: 'desc' },
    });
    return goals.map(toGoal);
  },

  async findAllByUserId(userId: string): Promise<Goal[]> {
    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { priority: 'desc' },
    });
    return goals.map(toGoal);
  },

  async findById(id: string): Promise<Goal | null> {
    const goal = await prisma.goal.findUnique({ where: { id } });
    return goal ? toGoal(goal) : null;
  },

  async create(data: CreateGoal): Promise<Goal> {
    const goal = await prisma.goal.create({ data });
    return toGoal(goal);
  },

  async update(id: string, data: UpdateGoal): Promise<Goal> {
    const goal = await prisma.goal.update({ where: { id }, data });
    return toGoal(goal);
  },

  async delete(id: string): Promise<void> {
    await prisma.goal.delete({ where: { id } });
  },

  async countTasks(goalId: string): Promise<number> {
    return prisma.task.count({ where: { goalId } });
  },

  async countCompletedTasks(goalId: string): Promise<number> {
    return prisma.task.count({ where: { goalId, status: 'DONE' } });
  },
};

// ─── Task Repository ──────────────────────────────────────────────

export const taskRepository = {
  async findByUserId(userId: string, statuses?: string[]): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        parentId: null,
        status: statuses ? { in: statuses as any } : { not: 'DONE' },
      },
      orderBy: [{ sortOrder: 'asc' }, { priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'asc' }],
    });
    return tasks.map(toTask);
  },

  async findById(id: string): Promise<Task | null> {
    const task = await prisma.task.findUnique({ where: { id } });
    return task ? toTask(task) : null;
  },

  async findByGoalId(goalId: string): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: { goalId },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });
    return tasks.map(toTask);
  },

  async findSubtasks(parentId: string): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: { parentId },
      orderBy: [{ sortOrder: 'asc' }, { priority: 'desc' }],
    });
    return tasks.map(toTask);
  },

  async findByDate(userId: string, date: Date): Promise<Task[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        scheduledDate: { gte: start, lte: end },
      },
      orderBy: [{ scheduledTime: 'asc' }, { priority: 'desc' }],
    });
    return tasks.map(toTask);
  },

  async findScheduled(userId: string, startDate: Date, endDate: Date): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        scheduledDate: { gte: startDate, lte: endDate },
      },
      orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }],
    });
    return tasks.map(toTask);
  },

  async create(data: CreateTask): Promise<Task> {
    const task = await prisma.task.create({ data: data as any });
    return toTask(task);
  },

  async update(id: string, data: UpdateTask): Promise<Task> {
    const task = await prisma.task.update({ where: { id }, data: data as any });
    return toTask(task);
  },

  async delete(id: string): Promise<void> {
    await prisma.task.delete({ where: { id } });
  },

  async updateStatus(id: string, status: Task['status'], actualMinutes?: number): Promise<Task> {
    const data: any = { status };
    if (status === 'DONE') {
      data.completedAt = new Date();
      if (actualMinutes) data.actualMinutes = actualMinutes;
    }
    const task = await prisma.task.update({ where: { id }, data });
    return toTask(task);
  },

  async reorder(taskIds: string[]): Promise<void> {
    await prisma.$transaction(
      taskIds.map((id, index) =>
        prisma.task.update({ where: { id }, data: { sortOrder: index } })
      )
    );
  },

  async findOverdue(userId: string): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        dueDate: { lt: new Date() },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      orderBy: { dueDate: 'asc' },
    });
    return tasks.map(toTask);
  },

  async countByStatus(userId: string): Promise<Record<string, number>> {
    const results = await prisma.task.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    });
    const counts: Record<string, number> = {};
    for (const r of results) {
      counts[r.status] = r._count;
    }
    return counts;
  },

  async countCompletedInRange(userId: string, start: Date, end: Date): Promise<number> {
    return prisma.task.count({
      where: {
        userId,
        status: 'DONE',
        completedAt: { gte: start, lte: end },
      },
    });
  },

  async countCreatedInRange(userId: string, start: Date, end: Date): Promise<number> {
    return prisma.task.count({
      where: {
        userId,
        createdAt: { gte: start, lte: end },
      },
    });
  },
};

// ─── Task Event Repository ────────────────────────────────────────

export const taskEventRepository = {
  async create(data: {
    taskId: string;
    userId: string;
    type: TaskEventType;
    metadata?: Prisma.InputJsonValue;
  }): Promise<void> {
    await prisma.taskEvent.create({ data });
  },

  async findByTaskId(taskId: string): Promise<any[]> {
    return prisma.taskEvent.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findByUserId(userId: string, limit = 100): Promise<any[]> {
    return prisma.taskEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};

// ─── Task Comment Repository ──────────────────────────────────────

export const taskCommentRepository = {
  async findByTaskId(taskId: string): Promise<TaskComment[]> {
    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
    });
    return comments.map(toComment);
  },

  async create(data: { taskId: string; userId: string; content: string }): Promise<TaskComment> {
    const comment = await prisma.taskComment.create({ data });
    return toComment(comment);
  },

  async update(id: string, content: string): Promise<TaskComment> {
    const comment = await prisma.taskComment.update({ where: { id }, data: { content } });
    return toComment(comment);
  },

  async delete(id: string): Promise<void> {
    await prisma.taskComment.delete({ where: { id } });
  },
};

// ─── Tag Repository ───────────────────────────────────────────────

export const tagRepository = {
  async findByUserId(userId: string): Promise<Tag[]> {
    return prisma.tag.findMany({ where: { userId }, orderBy: { name: 'asc' } });
  },

  async create(userId: string, data: CreateTag): Promise<Tag> {
    return prisma.tag.create({ data: { ...data, userId } });
  },

  async delete(id: string): Promise<void> {
    await prisma.tag.delete({ where: { id } });
  },

  async addToTask(taskId: string, tagId: string): Promise<void> {
    await prisma.taskTag.create({ data: { taskId, tagId } });
  },

  async removeFromTask(taskId: string, tagId: string): Promise<void> {
    await prisma.taskTag.delete({ where: { taskId_tagId: { taskId, tagId } } });
  },

  async findByTaskId(taskId: string): Promise<Tag[]> {
    const taskTags = await prisma.taskTag.findMany({
      where: { taskId },
      include: { tag: true },
    });
    return taskTags.map((tt) => tt.tag);
  },
};

// ─── Daily Plan Repository ────────────────────────────────────────

export const dailyPlanRepository = {
  async findByUserId(userId: string, date: Date): Promise<DailyPlan | null> {
    const plan = await prisma.dailyPlan.findUnique({
      where: { userId_date: { userId, date } },
    });
    if (!plan) return null;
    return { ...plan, date: plan.date.toISOString(), createdAt: plan.createdAt.toISOString(), updatedAt: plan.updatedAt.toISOString(), notes: plan.notes ?? undefined };
  },

  async findInRange(userId: string, start: Date, end: Date): Promise<DailyPlan[]> {
    const plans = await prisma.dailyPlan.findMany({
      where: { userId, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
    });
    return plans.map((p) => ({ ...p, date: p.date.toISOString(), createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString(), notes: p.notes ?? undefined }));
  },

  async createOrUpdate(userId: string, data: CreateDailyPlan): Promise<DailyPlan> {
    const plan = await prisma.dailyPlan.upsert({
      where: { userId_date: { userId, date: new Date(data.date) } },
      create: { userId, date: new Date(data.date), notes: data.notes },
      update: { notes: data.notes },
    });
    return { ...plan, date: plan.date.toISOString(), createdAt: plan.createdAt.toISOString(), updatedAt: plan.updatedAt.toISOString(), notes: plan.notes ?? undefined };
  },
};

// ─── Time Block Repository ────────────────────────────────────────

export const timeBlockRepository = {
  async findByUserId(userId: string, start: Date, end: Date): Promise<TimeBlock[]> {
    const blocks = await prisma.timeBlock.findMany({
      where: {
        userId,
        startTime: { gte: start },
        endTime: { lte: end },
      },
      orderBy: { startTime: 'asc' },
    });
    return blocks.map(toTimeBlock);
  },

  async create(userId: string, data: CreateTimeBlock): Promise<TimeBlock> {
    const block = await prisma.timeBlock.create({
      data: { ...data, userId, startTime: new Date(data.startTime), endTime: new Date(data.endTime) } as any,
    });
    return toTimeBlock(block);
  },

  async update(id: string, data: UpdateTimeBlock): Promise<TimeBlock> {
    const updateData: any = { ...data };
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);
    const block = await prisma.timeBlock.update({ where: { id }, data: updateData });
    return toTimeBlock(block);
  },

  async delete(id: string): Promise<void> {
    await prisma.timeBlock.delete({ where: { id } });
  },
};

// ─── Habit Repository ─────────────────────────────────────────────

export const habitRepository = {
  async findByUserId(userId: string, active = true): Promise<Habit[]> {
    const habits = await prisma.habit.findMany({
      where: active ? { userId, active: true } : { userId },
      orderBy: { createdAt: 'desc' },
    });
    return habits.map(toHabit);
  },

  async findById(id: string): Promise<Habit | null> {
    const habit = await prisma.habit.findUnique({ where: { id } });
    return habit ? toHabit(habit) : null;
  },

  async create(userId: string, data: CreateHabit): Promise<Habit> {
    const habit = await prisma.habit.create({ data: { ...data, userId } });
    return toHabit(habit);
  },

  async update(id: string, data: UpdateHabit): Promise<Habit> {
    const habit = await prisma.habit.update({ where: { id }, data });
    return toHabit(habit);
  },

  async delete(id: string): Promise<void> {
    await prisma.habit.delete({ where: { id } });
  },

  async logCompletion(userId: string, habitId: string, data: LogHabit): Promise<HabitLog> {
    const log = await prisma.habitLog.upsert({
      where: { habitId_date: { habitId, date: new Date(data.date) } },
      create: { habitId, userId, date: new Date(data.date), count: data.count ?? 1, notes: data.notes },
      update: { count: { increment: data.count ?? 1 }, notes: data.notes },
    });
    return toHabitLog(log);
  },

  async getLogs(habitId: string, startDate?: Date, endDate?: Date): Promise<HabitLog[]> {
    const where: any = { habitId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }
    const logs = await prisma.habitLog.findMany({ where, orderBy: { date: 'desc' } });
    return logs.map(toHabitLog);
  },

  async getStats(habitId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    totalCompletions: number;
    completionRate: number;
    lastLoggedDate?: string;
  }> {
    const logs = await prisma.habitLog.findMany({
      where: { habitId },
      orderBy: { date: 'desc' },
    });

    if (logs.length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalCompletions: 0, completionRate: 0 };
    }

    const totalCompletions = logs.reduce((sum, l) => sum + l.count, 0);
    const lastLoggedDate = logs[0].date.toISOString();

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateSet = new Set(logs.map((l) => l.date.toISOString().split('T')[0]));

    // Check current streak
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      if (dateSet.has(dateStr)) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    const sortedDates = Array.from(dateSet).sort();
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Completion rate (last 30 days)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentLogs = logs.filter((l) => l.date >= thirtyDaysAgo);
    const completionRate = recentLogs.length > 0 ? Math.min(recentLogs.length / 30, 1) : 0;

    return { currentStreak, longestStreak, totalCompletions, completionRate, lastLoggedDate };
  },
};

// ─── Memory Repository ────────────────────────────────────────────

export const memoryRepository = {
  async findByUserId(userId: string, type?: string): Promise<Memory[]> {
    const memories = await prisma.memory.findMany({
      where: type ? { userId, type: type as any } : { userId },
      orderBy: { createdAt: 'desc' },
    });
    return memories.map(toMemory);
  },

  async findById(id: string): Promise<Memory | null> {
    const memory = await prisma.memory.findUnique({ where: { id } });
    return memory ? toMemory(memory) : null;
  },

  async search(userId: string, query: string, limit = 20): Promise<Memory[]> {
    const memories = await prisma.memory.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return memories.map(toMemory);
  },

  async create(userId: string, data: CreateMemory): Promise<Memory> {
    const memory = await prisma.memory.create({
      data: { ...data, userId, tags: data.tags ?? [] },
    });
    return toMemory(memory);
  },

  async update(id: string, data: UpdateMemory): Promise<Memory> {
    const memory = await prisma.memory.update({ where: { id }, data: data as any });
    return toMemory(memory);
  },

  async delete(id: string): Promise<void> {
    await prisma.memory.delete({ where: { id } });
  },
};

// ─── Knowledge Graph Repository ───────────────────────────────────

export const knowledgeRepository = {
  async getGraph(userId: string): Promise<{ nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }> {
    const [nodes, edges] = await Promise.all([
      prisma.knowledgeNode.findMany({ where: { userId } }),
      prisma.knowledgeEdge.findMany({
        where: { source: { userId } },
      }),
    ]);
    return { nodes: nodes.map(toKnowledgeNode), edges: edges.map(toKnowledgeEdge) };
  },

  async createNode(userId: string, data: CreateKnowledgeNode): Promise<KnowledgeNode> {
    const node = await prisma.knowledgeNode.create({
      data: { ...data, userId } as any,
    });
    return toKnowledgeNode(node);
  },

  async createEdge(data: CreateKnowledgeEdge): Promise<KnowledgeEdge> {
    const edge = await prisma.knowledgeEdge.create({ data: data as any });
    return toKnowledgeEdge(edge);
  },

  async deleteNode(id: string): Promise<void> {
    await prisma.knowledgeNode.delete({ where: { id } });
  },

  async deleteEdge(id: string): Promise<void> {
    await prisma.knowledgeEdge.delete({ where: { id } });
  },

  async findConnected(nodeId: string): Promise<KnowledgeNode[]> {
    const edges = await prisma.knowledgeEdge.findMany({
      where: {
        OR: [{ sourceId: nodeId }, { targetId: nodeId }],
      },
      include: { source: true, target: true },
    });
    const nodeIds = new Set<string>();
    for (const edge of edges) {
      if (edge.sourceId !== nodeId) nodeIds.add(edge.sourceId);
      if (edge.targetId !== nodeId) nodeIds.add(edge.targetId);
    }
    const nodes = await prisma.knowledgeNode.findMany({
      where: { id: { in: Array.from(nodeIds) } },
    });
    return nodes.map(toKnowledgeNode);
  },
};

// ─── Agent Repository ─────────────────────────────────────────────

export const agentRepository = {
  async findByUserId(userId: string): Promise<Agent[]> {
    const agents = await prisma.agent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return agents.map(toAgent);
  },

  async findById(id: string): Promise<Agent | null> {
    const agent = await prisma.agent.findUnique({ where: { id } });
    return agent ? toAgent(agent) : null;
  },

  async create(userId: string, data: CreateAgent): Promise<Agent> {
    const agent = await prisma.agent.create({
      data: { ...data, userId, config: (data.config ?? {}) as any },
    });
    return toAgent(agent);
  },

  async update(id: string, data: Partial<CreateAgent>): Promise<Agent> {
    const updateData: any = { ...data };
    if (updateData.config) updateData.config = updateData.config as any;
    const agent = await prisma.agent.update({ where: { id }, data: updateData });
    return toAgent(agent);
  },

  async delete(id: string): Promise<void> {
    await prisma.agent.delete({ where: { id } });
  },

  async createRun(data: { agentId: string; userId: string; input?: any }): Promise<AgentRun> {
    const run = await prisma.agentRun.create({
      data: { ...data, input: (data.input ?? undefined) as any, status: 'RUNNING', startedAt: new Date() },
    });
    return toAgentRun(run);
  },

  async completeRun(id: string, output: any): Promise<AgentRun> {
    const run = await prisma.agentRun.update({
      where: { id },
      data: { status: 'COMPLETED', output: (output ?? undefined) as any, completedAt: new Date() },
    });
    return toAgentRun(run);
  },

  async failRun(id: string, error: string): Promise<AgentRun> {
    const run = await prisma.agentRun.update({
      where: { id },
      data: { status: 'FAILED', error, completedAt: new Date() },
    });
    return toAgentRun(run);
  },

  async getRuns(agentId: string, limit = 20): Promise<AgentRun[]> {
    const runs = await prisma.agentRun.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return runs.map(toAgentRun);
  },
};

// ─── Insight Repository ───────────────────────────────────────────

export const insightRepository = {
  async findByUserId(userId: string, unreadOnly = false): Promise<Insight[]> {
    const insights = await prisma.insight.findMany({
      where: unreadOnly ? { userId, read: false } : { userId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    return insights.map(toInsight);
  },

  async create(data: { userId: string; type: string; title: string; content: string; data?: any; priority?: number }): Promise<Insight> {
    const insight = await prisma.insight.create({ data: data as any });
    return toInsight(insight);
  },

  async markRead(id: string): Promise<void> {
    await prisma.insight.update({ where: { id }, data: { read: true } });
  },

  async delete(id: string): Promise<void> {
    await prisma.insight.delete({ where: { id } });
  },
};

// ─── User Setting Repository ──────────────────────────────────────

export const userSettingRepository = {
  async findByUserId(userId: string): Promise<UserSetting | null> {
    const setting = await prisma.userSetting.findUnique({ where: { userId } });
    return setting ? toUserSetting(setting) : null;
  },

  async createOrUpdate(userId: string, data: UpdateUserSetting): Promise<UserSetting> {
    const setting = await prisma.userSetting.upsert({
      where: { userId },
      create: { userId, ...data } as any,
      update: data,
    });
    return toUserSetting(setting);
  },
};
