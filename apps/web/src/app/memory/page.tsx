'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';


interface Memory {
  id: string;
  title: string;
  content: string;
  type: string;
  tags?: string[];
  createdAt: string;
}

interface KnowledgeNode {
  id: string;
  label: string;
  type: string;
  memoryId?: string;
}

interface KnowledgeEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relation: string;
  weight: number;
}

const MEMORY_TYPES = ['NOTE', 'JOURNAL', 'IDEA', 'BOOKMARK', 'SNIPPET'];
const TYPE_COLORS: Record<string, string> = {
  NOTE: '#6366f1',
  JOURNAL: '#10b981',
  IDEA: '#f59e0b',
  BOOKMARK: '#8b5cf6',
  SNIPPET: '#ec4899',
};

export default function MemoryPage() {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formType, setFormType] = useState('NOTE');
  const [formTags, setFormTags] = useState('');
  const [graphNodes, setGraphNodes] = useState<KnowledgeNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<KnowledgeEdge[]>([]);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeType, setNodeType] = useState('CONCEPT');
  const [showEdgeModal, setShowEdgeModal] = useState(false);
  const [edgeSource, setEdgeSource] = useState('');
  const [edgeTarget, setEdgeTarget] = useState('');
  const [edgeRelation, setEdgeRelation] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [graphPositions, setGraphPositions] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    try {
      const [memData, graphData] = await Promise.all([
        api.memories.list(user!.id),
        api.knowledge.getGraph(user!.id).catch(() => ({ nodes: [], edges: [] })),
      ]);
      setMemories(Array.isArray(memData) ? memData : []);
      setGraphNodes(Array.isArray(graphData?.nodes) ? graphData.nodes : []);
      setGraphEdges(Array.isArray(graphData?.edges) ? graphData.edges : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      loadData();
      return;
    }
    try {
      const results = await api.memories.search(user!.id, searchQuery);
      setMemories(Array.isArray(results) ? results : []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreateMemory() {
    if (!formTitle.trim() || !formContent.trim()) return;
    try {
      const tags = formTags.split(',').map(t => t.trim()).filter(Boolean);
      const memory = await api.memories.create(user!.id, {
        title: formTitle,
        content: formContent,
        type: formType,
        tags: tags.length > 0 ? tags : undefined,
      });
      setMemories(prev => [memory, ...prev]);
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUpdateMemory() {
    if (!editingMemory || !formTitle.trim() || !formContent.trim()) return;
    try {
      const tags = formTags.split(',').map(t => t.trim()).filter(Boolean);
      const updated = await api.memories.update(editingMemory.id, {
        title: formTitle,
        content: formContent,
        type: formType,
        tags: tags.length > 0 ? tags : undefined,
      });
      setMemories(prev => prev.map(m => m.id === editingMemory.id ? updated : m));
      setEditingMemory(null);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteMemory(id: string) {
    try {
      await api.memories.delete(id);
      setMemories(prev => prev.filter(m => m.id !== id));
      if (selectedMemory?.id === id) setSelectedMemory(null);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreateNode() {
    if (!nodeLabel.trim()) return;
    try {
      const node = await api.knowledge.createNode(user!.id, { label: nodeLabel, type: nodeType });
      setGraphNodes(prev => [...prev, node]);
      setShowNodeModal(false);
      setNodeLabel('');
      setNodeType('CONCEPT');
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreateEdge() {
    if (!edgeSource || !edgeTarget || !edgeRelation.trim()) return;
    try {
      const edge = await api.knowledge.createEdge(user!.id, {
        sourceId: edgeSource,
        targetId: edgeTarget,
        relation: edgeRelation,
      });
      setGraphEdges(prev => [...prev, edge]);
      setShowEdgeModal(false);
      setEdgeSource('');
      setEdgeTarget('');
      setEdgeRelation('');
    } catch (err) {
      console.error(err);
    }
  }

  function resetForm() {
    setFormTitle('');
    setFormContent('');
    setFormType('NOTE');
    setFormTags('');
  }

  function openEdit(memory: Memory) {
    setEditingMemory(memory);
    setFormTitle(memory.title);
    setFormContent(memory.content);
    setFormType(memory.type);
    setFormTags(Array.isArray(memory.tags) ? memory.tags.join(', ') : '');
    setShowCreateModal(true);
  }

  const filteredMemories = typeFilter
    ? memories.filter(m => m.type === typeFilter)
    : memories;

  const nodePositionMap = useCallback(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const count = graphNodes.length;
    const cx = 300, cy = 180, radius = 140;
    graphNodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      positions[node.id] = {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
    return positions;
  }, [graphNodes]);

  const positions = nodePositionMap();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Memory & Knowledge</h1>
          <p className="text-muted-foreground mt-1">Store memories and map your knowledge graph.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { resetForm(); setEditingMemory(null); setShowCreateModal(true); }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            + New Memory
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl">
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Search memories..."
              />
              <button
                onClick={handleSearch}
                className="px-3 h-9 bg-secondary rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                Search
              </button>
            </div>
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setTypeFilter('')}
                className={`px-2 py-1 text-xs rounded-full transition-colors ${!typeFilter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                All
              </button>
              {MEMORY_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(typeFilter === t ? '' : t)}
                  className="px-2 py-1 text-xs rounded-full transition-colors"
                  style={{
                    backgroundColor: typeFilter === t ? TYPE_COLORS[t] : `${TYPE_COLORS[t]}20`,
                    color: typeFilter === t ? 'white' : TYPE_COLORS[t],
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
            {filteredMemories.length === 0 && (
              <p className="text-muted-foreground text-center py-8 text-sm">No memories found.</p>
            )}
            {filteredMemories.map(memory => (
              <div
                key={memory.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors
                  ${selectedMemory?.id === memory.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}
                `}
                onClick={() => setSelectedMemory(memory)}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-sm font-semibold line-clamp-1">{memory.title}</h3>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ml-2"
                    style={{ backgroundColor: `${TYPE_COLORS[memory.type] || '#6366f1'}20`, color: TYPE_COLORS[memory.type] || '#6366f1' }}
                  >
                    {memory.type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{memory.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-1 flex-wrap">
                    {Array.isArray(memory.tags) && memory.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(memory.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold">Knowledge Graph</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowNodeModal(true)}
                className="px-3 py-1.5 text-xs bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              >
                + Node
              </button>
              <button
                onClick={() => setShowEdgeModal(true)}
                className="px-3 py-1.5 text-xs bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              >
                + Edge
              </button>
            </div>
          </div>
          <div className="p-4">
            {graphNodes.length === 0 ? (
              <div className="flex items-center justify-center h-[380px] text-muted-foreground text-sm">
                No knowledge nodes yet. Add nodes to build your graph.
              </div>
            ) : (
              <svg width="100%" height="380" viewBox="0 0 600 380" className="border border-border rounded-lg bg-muted/20">
                {graphEdges.map((edge, i) => {
                  const src = positions[edge.sourceId];
                  const tgt = positions[edge.targetId];
                  if (!src || !tgt) return null;
                  return (
                    <g key={i}>
                      <line
                        x1={src.x} y1={src.y}
                        x2={tgt.x} y2={tgt.y}
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth={1.5}
                        strokeOpacity={0.5}
                      />
                      <text
                        x={(src.x + tgt.x) / 2}
                        y={(src.y + tgt.y) / 2 - 5}
                        textAnchor="middle"
                        fontSize="10"
                        fill="hsl(var(--muted-foreground))"
                      >
                        {edge.relation}
                      </text>
                    </g>
                  );
                })}
                {graphNodes.map(node => {
                  const pos = positions[node.id];
                  if (!pos) return null;
                  const colors: Record<string, string> = {
                    CONCEPT: '#6366f1', PERSON: '#ec4899', PROJECT: '#10b981',
                    TAG: '#f59e0b', GOAL: '#8b5cf6', MEMORY: '#06b6d4', RESOURCE: '#84cc16',
                  };
                  const color = colors[node.type] || '#6366f1';
                  return (
                    <g key={node.id}>
                      <circle cx={pos.x} cy={pos.y} r={20} fill={color} opacity={0.9} />
                      <text
                        x={pos.x} y={pos.y + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="8"
                        fill="white"
                        fontWeight="bold"
                      >
                        {node.label.slice(0, 3).toUpperCase()}
                      </text>
                      <text
                        x={pos.x} y={pos.y + 32}
                        textAnchor="middle"
                        fontSize="10"
                        fill="hsl(var(--foreground))"
                        fontWeight="500"
                      >
                        {node.label.length > 20 ? node.label.slice(0, 20) + '...' : node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>
      </div>

      {selectedMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: `${TYPE_COLORS[selectedMemory.type] || '#6366f1'}20`, color: TYPE_COLORS[selectedMemory.type] || '#6366f1' }}
                >
                  {selectedMemory.type}
                </span>
                <h3 className="text-lg font-semibold">{selectedMemory.title}</h3>
              </div>
              <button onClick={() => setSelectedMemory(null)} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Created {new Date(selectedMemory.createdAt).toLocaleString()}
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mb-4 max-h-60 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{selectedMemory.content}</p>
            </div>
            {Array.isArray(selectedMemory.tags) && selectedMemory.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap mb-4">
                {selectedMemory.tags.map((tag, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">{tag}</span>
                ))}
              </div>
            )}
            <div className="flex justify-between">
              <button
                onClick={() => { handleDeleteMemory(selectedMemory.id); setSelectedMemory(null); }}
                className="px-4 py-2 text-sm text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10"
              >
                Delete
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => { openEdit(selectedMemory); setSelectedMemory(null); }}
                  className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setSelectedMemory(null)}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">{editingMemory ? 'Edit Memory' : 'New Memory'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Memory title"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <textarea
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Write your memory..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    {MEMORY_TYPES.map(t => (
                      <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={e => setFormTags(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="tag1, tag2"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowCreateModal(false); setEditingMemory(null); resetForm(); }}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingMemory ? handleUpdateMemory : handleCreateMemory}
                disabled={!formTitle.trim() || !formContent.trim()}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {editingMemory ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Add Knowledge Node</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Label</label>
                <input
                  type="text"
                  value={nodeLabel}
                  onChange={e => setNodeLabel(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Node label"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={nodeType}
                  onChange={e => setNodeType(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {['CONCEPT', 'PERSON', 'PROJECT', 'TAG', 'GOAL', 'MEMORY', 'RESOURCE'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowNodeModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancel</button>
              <button
                onClick={handleCreateNode}
                disabled={!nodeLabel.trim()}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showEdgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Add Knowledge Edge</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Source Node</label>
                <select
                  value={edgeSource}
                  onChange={e => setEdgeSource(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select source</option>
                  {graphNodes.map(n => (
                    <option key={n.id} value={n.id}>{n.label} ({n.type})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Target Node</label>
                <select
                  value={edgeTarget}
                  onChange={e => setEdgeTarget(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select target</option>
                  {graphNodes.map(n => (
                    <option key={n.id} value={n.id}>{n.label} ({n.type})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Relation</label>
                <input
                  type="text"
                  value={edgeRelation}
                  onChange={e => setEdgeRelation(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. relates_to, depends_on"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowEdgeModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancel</button>
              <button
                onClick={handleCreateEdge}
                disabled={!edgeSource || !edgeTarget || !edgeRelation.trim()}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
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
