'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';


interface Agent {
  id: string;
  name: string;
  description?: string;
  type: string;
  active: boolean;
  createdAt: string;
}

interface AgentRun {
  id: string;
  agentId: string;
  status: string;
  input?: any;
  output?: any;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

interface Briefing {
  date: string;
  topPriorities: Array<{ id: string; title: string; reason: string }>;
  habitReminder: Array<{ id: string; name: string; streak: number }>;
  goalProgress: Array<{ id: string; title: string; progress: number; taskCount: number; completedCount: number }>;
  suggestions: string[];
}

const AGENT_TYPES = ['ASSISTANT', 'SCHEDULER', 'ANALYZER', 'SUGGESTER'];
const AGENT_TYPE_DESC: Record<string, string> = {
  ASSISTANT: 'General AI assistant for any question or task',
  SCHEDULER: 'Analyzes tasks and suggests optimal schedules',
  ANALYZER: 'Provides analytics and insights on your productivity',
  SUGGESTER: 'Suggests what to focus on next based on goals',
};

export default function AgentsPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formType, setFormType] = useState('ASSISTANT');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [runningAgent, setRunningAgent] = useState<string | null>(null);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [autoScheduleDate, setAutoScheduleDate] = useState('');
  const [autoScheduleLoading, setAutoScheduleLoading] = useState(false);

  useEffect(() => {
    setAutoScheduleDate(new Date().toISOString().split('T')[0]);
  }, []);
  const [autoScheduleResult, setAutoScheduleResult] = useState<any>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    try {
      const data = await api.agents.list(user!.id);
      setAgents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAgent() {
    if (!formName.trim()) return;
    try {
      const agent = await api.agents.create(user!.id, {
        name: formName,
        description: formDesc || undefined,
        type: formType,
      });
      setAgents(prev => [...prev, agent]);
      setShowCreateModal(false);
      setFormName('');
      setFormDesc('');
      setFormType('ASSISTANT');
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteAgent(id: string) {
    try {
      await api.agents.delete(id);
      setAgents(prev => prev.filter(a => a.id !== id));
      if (selectedAgent?.id === id) {
        setSelectedAgent(null);
        setAgentRuns([]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRunAgent(agent: Agent) {
    setRunningAgent(agent.id);
    try {
      await api.agents.run(agent.id);
      if (selectedAgent?.id === agent.id) {
        loadRuns(agent.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRunningAgent(null);
    }
  }

  async function loadRuns(agentId: string) {
    setRunsLoading(true);
    try {
      const runs = await api.agents.runs(agentId, 20);
      setAgentRuns(Array.isArray(runs) ? runs : []);
    } catch (err) {
      console.error(err);
    } finally {
      setRunsLoading(false);
    }
  }

  function selectAgent(agent: Agent) {
    setSelectedAgent(agent);
    loadRuns(agent.id);
  }

  async function handleGenerateBriefing() {
    setBriefingLoading(true);
    try {
      const data = await api.briefing.generate();
      setBriefing(data);
    } catch (err) {
      console.error(err);
    } finally {
      setBriefingLoading(false);
    }
  }

  async function handleAutoSchedule() {
    setAutoScheduleLoading(true);
    try {
      const data = await api.autoSchedule.generate({
        date: autoScheduleDate,
        availableHours: { start: '09:00', end: '17:00' },
      });
      setAutoScheduleResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAutoScheduleLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
          <p className="text-muted-foreground mt-1">Create and manage AI-powered assistants.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + Create Agent
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 bg-card border border-border rounded-xl">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Daily Briefing</h3>
            <p className="text-xs text-muted-foreground mt-1">Get a summary of your day.</p>
          </div>
          <div className="p-4">
            <button
              onClick={handleGenerateBriefing}
              disabled={briefingLoading}
              className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {briefingLoading ? 'Generating...' : 'Generate Daily Briefing'}
            </button>
            {briefing && (
              <div className="mt-4 space-y-3">
                {briefing.topPriorities.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Top Priorities</p>
                    {briefing.topPriorities.map(p => (
                      <div key={p.id} className="text-sm p-2 bg-muted/50 rounded-lg mb-1">
                        <span className="font-medium">{p.title}</span>
                        {p.reason && <span className="text-xs text-muted-foreground ml-1">({p.reason})</span>}
                      </div>
                    ))}
                  </div>
                )}
                {briefing.habitReminder.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Habit Streaks</p>
                    {briefing.habitReminder.map(h => (
                      <div key={h.id} className="text-sm p-2 bg-muted/50 rounded-lg mb-1 flex justify-between">
                        <span>{h.name}</span>
                        <span className="text-primary font-medium">{h.streak} days</span>
                      </div>
                    ))}
                  </div>
                )}
                {briefing.suggestions.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Suggestions</p>
                    {briefing.suggestions.map((s, i) => (
                      <div key={i} className="text-sm p-2 bg-primary/5 border border-primary/20 rounded-lg mb-1">
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 bg-card border border-border rounded-xl">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Auto-Schedule</h3>
            <p className="text-xs text-muted-foreground mt-1">AI-powered daily schedule.</p>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Date</label>
              <input
                type="date"
                value={autoScheduleDate}
                onChange={e => setAutoScheduleDate(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
              />
            </div>
            <button
              onClick={handleAutoSchedule}
              disabled={autoScheduleLoading}
              className="w-full py-2.5 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {autoScheduleLoading ? 'Scheduling...' : 'Auto-Schedule Day'}
            </button>
            {autoScheduleResult?.timeBlocks && (
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {autoScheduleResult.timeBlocks.map((block: any, i: number) => (
                  <div key={i} className="text-sm p-2 bg-muted/50 rounded-lg flex justify-between">
                    <span>{block.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(block.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(block.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 bg-card border border-border rounded-xl">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Agent Overview</h3>
            <p className="text-xs text-muted-foreground mt-1">{agents.length} agents configured</p>
          </div>
          <div className="p-4 space-y-2">
            {AGENT_TYPES.map(type => {
              const count = agents.filter(a => a.type === type).length;
              return (
                <div key={type} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${count > 0 ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                    <span className="text-sm">{type}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Your Agents</h3>
          </div>
          <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
            {agents.length === 0 && (
              <p className="text-muted-foreground text-center py-8 text-sm">No agents yet. Create one to get started.</p>
            )}
            {agents.map(agent => (
              <div
                key={agent.id}
                onClick={() => selectAgent(agent)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors
                  ${selectedAgent?.id === agent.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium">{agent.name}</h4>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium
                    ${agent.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}
                  `}>
                    {agent.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{agent.type}</p>
                {agent.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{agent.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-card border border-border rounded-xl">
          {selectedAgent ? (
            <>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h3 className="font-semibold">{selectedAgent.name}</h3>
                  <p className="text-xs text-muted-foreground">{AGENT_TYPE_DESC[selectedAgent.type] || selectedAgent.type}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRunAgent(selectedAgent)}
                    disabled={runningAgent === selectedAgent.id}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    {runningAgent === selectedAgent.id ? 'Running...' : 'Run Agent'}
                  </button>
                  <button
                    onClick={() => handleDeleteAgent(selectedAgent.id)}
                    className="px-3 py-1.5 text-destructive border border-destructive/30 rounded-lg text-sm hover:bg-destructive/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h4 className="text-sm font-medium mb-3">Run History</h4>
                {runsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : agentRuns.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 text-sm">No runs yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {agentRuns.map(run => (
                      <div key={run.id} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                            ${run.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                              run.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                              run.status === 'RUNNING' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'}
                          `}>
                            {run.status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(run.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {run.output && (
                          <div className="text-xs bg-background rounded p-2 mt-2 overflow-x-auto">
                            <pre className="whitespace-pre-wrap">{JSON.stringify(run.output, null, 2)}</pre>
                          </div>
                        )}
                        {run.error && (
                          <p className="text-xs text-destructive mt-1">{run.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              Select an agent to view details and run history.
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Create Agent</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="My Assistant"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={formType}
                  onChange={e => setFormType(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {AGENT_TYPES.map(t => (
                    <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()} - {AGENT_TYPE_DESC[t]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowCreateModal(false); setFormName(''); setFormDesc(''); setFormType('ASSISTANT'); }}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAgent}
                disabled={!formName.trim()}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
